import { PostgresConstraint } from "./types"
import { FieldSchema, FieldType, Table } from "@budibase/types"
import { SqlClient } from "../utils"
import sdk from "../../sdk"
import { RelationshipTypes } from "../../constants"
import { isEqual } from "lodash"
import { utils } from "@budibase/backend-core"

interface GenericConstraint {
  foreignKey: string
  inTableName: string
  relatedToTableName: string
  onPrimaryKey: string
}

interface FindManyResponse {
  remaining: GenericConstraint[]
  manyToMany: {
    main: GenericConstraint
    related: GenericConstraint
  }[]
}

function convertPostgresConstraints(
  constraints: PostgresConstraint[]
): GenericConstraint[] {
  let genericConstraints: GenericConstraint[] = []
  for (let constraint of constraints) {
    genericConstraints.push({
      foreignKey: constraint.foreign_key,
      inTableName: constraint.table_name,
      relatedToTableName: constraint.foreign_table_name,
      onPrimaryKey: constraint.foreign_column_name,
    })
  }
  return genericConstraints
}

/* to find many-to-many relationships we try two rules:
 * 1. Does the table name contain both of the related table names (convention)
 * 2. Is the table primary key a composite of the two foreign keys and the table
 * contains no other foreign keys.
 */
function findManyToManyConstraints(
  constraints: GenericConstraint[],
  tables: Table[]
): FindManyResponse {
  const manyToMany = []
  const remaining = []
  const used: GenericConstraint[] = []
  for (let constraint of constraints) {
    if (used.find(alreadyUsed => isEqual(alreadyUsed, constraint))) {
      continue
    }
    const tableName = constraint.inTableName
    const sameTable = constraints.filter(
      related =>
        related.inTableName === tableName && !isEqual(constraint, related)
    )
    let found = false
    for (let otherConstraint of sameTable) {
      const possibleJunctionTable = tables.find(
        table => table.name === constraint.relatedToTableName
      )
      if (
        tableName.includes(otherConstraint.relatedToTableName) &&
        tableName.includes(constraint.relatedToTableName)
      ) {
        found = true
      }
      const possiblePrimary = possibleJunctionTable?.primary
      if (
        Array.isArray(possiblePrimary) &&
        possiblePrimary.includes(constraint.foreignKey) &&
        possiblePrimary.includes(otherConstraint.foreignKey)
      ) {
        found = true
      }
      if (found) {
        manyToMany.push({
          main: constraint,
          related: otherConstraint,
        })
        used.push(constraint)
        used.push(otherConstraint)
        break
      }
    }
    if (!found) {
      remaining.push(constraint)
    }
  }
  return { remaining, manyToMany }
}

function findName(table: Table, name: string) {
  let number = 1
  let currentName = name
  while (table.schema[currentName] != null) {
    number++
    currentName = `${name}_${number}`
  }
  return currentName
}

function linkColumnBase() {
  return {
    type: FieldType.LINK,
    _id: utils.newid(),
    main: true,
  }
}

// this will be expanded to cover all different tables constraints
export function constraintsToRelationships(
  sqlType: SqlClient,
  constraints: PostgresConstraint[],
  tables: Record<string, Table>
) {
  let genericConstraints: GenericConstraint[]
  switch (sqlType) {
    case SqlClient.POSTGRES:
      genericConstraints = convertPostgresConstraints(constraints)
      break
    default:
      throw new Error("Unknown SQL type.")
  }

  const tableArray = Object.values(tables)
  const { remaining: normalConstraints, manyToMany } =
    findManyToManyConstraints(genericConstraints, tableArray)

  for (let table of tableArray) {
    // first many-to-one (joining up with one-to-many)
    for (let constraint of normalConstraints) {
      const relatedTable = tableArray.find(
        table => table.name === constraint.relatedToTableName
      )
      if (constraint.inTableName !== table.name || !relatedTable) {
        continue
      }
      let bbColName = findName(table, relatedTable.name),
        bbRelatedColName = findName(relatedTable, table.name)
      const relationshipColumn: FieldSchema = {
        ...linkColumnBase(),
        name: bbColName,
        foreignKey: constraint.foreignKey,
        fieldName: constraint.onPrimaryKey,
        tableId: relatedTable._id,
        relationshipType: RelationshipTypes.MANY_TO_ONE,
      }
      table.schema[bbColName] = relationshipColumn
      sdk.tables.generateRelatedSchema(
        relationshipColumn,
        relatedTable,
        table,
        bbRelatedColName
      )
      delete relatedTable.schema[bbRelatedColName].main
    }
    // now many-to-many
    for (let constraintCombo of manyToMany) {
      const constraint = constraintCombo.main,
        relatedConstraint = constraintCombo.related
      // same for combo
      const throughTable = tableArray.find(
        table => table.name === constraint.inTableName
      )
      // get the other table
      const relatedTable = tableArray.find(
        table => table.name === relatedConstraint.relatedToTableName
      )
      if (
        table.name !== constraint.relatedToTableName ||
        !throughTable ||
        !relatedTable
      ) {
        continue
      }
      const bbColName = findName(table, relatedTable.name),
        bbRelatedColName = findName(relatedTable, table.name)
      const relationshipColumn: FieldSchema = {
        ...linkColumnBase(),
        tableId: relatedTable._id,
        name: bbColName,
        relationshipType: RelationshipTypes.MANY_TO_MANY,
        fieldName: relatedConstraint.onPrimaryKey,
        through: throughTable._id,
        throughFrom: relatedConstraint.foreignKey,
        throughTo: constraint.foreignKey,
      }
      table.schema[bbColName] = relationshipColumn
      sdk.tables.generateRelatedSchema(
        relationshipColumn,
        relatedTable,
        table,
        bbRelatedColName
      )
      relatedTable.schema[bbRelatedColName].fieldName = constraint.onPrimaryKey
      delete relatedTable.schema[bbRelatedColName].main
    }
  }

  return tables
}
