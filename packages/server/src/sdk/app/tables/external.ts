import { Datasource, FieldSchema, Table } from "@budibase/types"
import { FieldTypes, RelationshipTypes } from "../../../constants"
import { buildExternalTableId } from "../../../integrations/utils"
import { cloneDeep } from "lodash/fp"

export function generateForeignKey(column: any, relatedTable: any) {
  return `fk_${relatedTable.name}_${column.fieldName}`
}

export function generateJunctionTableName(
  column: any,
  table: any,
  relatedTable: any
) {
  return `jt_${table.name}_${relatedTable.name}_${column.name}_${column.fieldName}`
}

export function foreignKeyStructure(keyName: any, meta?: any) {
  const structure: any = {
    type: FieldTypes.NUMBER,
    constraints: {},
    name: keyName,
  }
  if (meta) {
    structure.meta = meta
  }
  return structure
}

export function cleanupRelationships(
  table: Table,
  tables: Record<string, Table>,
  oldTable?: Table
) {
  const tableToIterate = oldTable ? oldTable : table
  // clean up relationships in couch table schemas
  for (let [key, schema] of Object.entries(tableToIterate.schema)) {
    if (
      schema.type === FieldTypes.LINK &&
      (!oldTable || table.schema[key] == null)
    ) {
      const relatedTable = Object.values(tables).find(
        table => table._id === schema.tableId
      )
      const foreignKey = schema.foreignKey
      if (!relatedTable || !foreignKey) {
        continue
      }
      for (let [relatedKey, relatedSchema] of Object.entries(
        relatedTable.schema
      )) {
        if (
          relatedSchema.type === FieldTypes.LINK &&
          relatedSchema.fieldName === foreignKey
        ) {
          delete relatedTable.schema[relatedKey]
        }
      }
    }
  }
}

function otherRelationshipType(type?: string) {
  if (type === RelationshipTypes.MANY_TO_MANY) {
    return RelationshipTypes.MANY_TO_MANY
  }
  return type === RelationshipTypes.ONE_TO_MANY
    ? RelationshipTypes.MANY_TO_ONE
    : RelationshipTypes.ONE_TO_MANY
}

export function generateManyLinkSchema(
  datasource: Datasource,
  column: FieldSchema,
  table: Table,
  relatedTable: Table
): Table {
  if (!table.primary || !relatedTable.primary) {
    throw new Error("Unable to generate many link schema, no primary keys")
  }
  const primary = table.name + table.primary[0]
  const relatedPrimary = relatedTable.name + relatedTable.primary[0]
  const jcTblName = generateJunctionTableName(column, table, relatedTable)
  // first create the new table
  const junctionTable = {
    _id: buildExternalTableId(datasource._id!, jcTblName),
    name: jcTblName,
    primary: [primary, relatedPrimary],
    constrained: [primary, relatedPrimary],
    schema: {
      [primary]: foreignKeyStructure(primary, {
        toTable: table.name,
        toKey: table.primary[0],
      }),
      [relatedPrimary]: foreignKeyStructure(relatedPrimary, {
        toTable: relatedTable.name,
        toKey: relatedTable.primary[0],
      }),
    },
  }
  column.through = junctionTable._id
  column.throughFrom = relatedPrimary
  column.throughTo = primary
  column.fieldName = relatedPrimary
  return junctionTable
}

export function generateLinkSchema(
  column: FieldSchema,
  table: Table,
  relatedTable: Table,
  type: RelationshipTypes
) {
  if (!table.primary || !relatedTable.primary) {
    throw new Error("Unable to generate link schema, no primary keys")
  }
  const isOneSide = type === RelationshipTypes.ONE_TO_MANY
  const primary = isOneSide ? relatedTable.primary[0] : table.primary[0]
  // generate a foreign key
  const foreignKey = generateForeignKey(column, relatedTable)
  column.relationshipType = type
  column.foreignKey = isOneSide ? foreignKey : primary
  column.fieldName = isOneSide ? primary : foreignKey
  return foreignKey
}

export function generateRelatedSchema(
  linkColumn: FieldSchema,
  table: Table,
  relatedTable: Table,
  columnName: string
) {
  // generate column for other table
  const relatedSchema = cloneDeep(linkColumn)
  // swap them from the main link
  if (linkColumn.foreignKey) {
    relatedSchema.fieldName = linkColumn.foreignKey
    relatedSchema.foreignKey = linkColumn.fieldName
  }
  // is many to many
  else {
    // don't need to copy through, already got it
    relatedSchema.fieldName = linkColumn.throughTo
    relatedSchema.throughTo = linkColumn.throughFrom
    relatedSchema.throughFrom = linkColumn.throughTo
  }
  relatedSchema.relationshipType = otherRelationshipType(
    linkColumn.relationshipType
  )
  relatedSchema.tableId = relatedTable._id
  relatedSchema.name = columnName
  table.schema[columnName] = relatedSchema
}
