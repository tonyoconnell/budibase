import {
  Integration,
  DatasourceFieldType,
  QueryType,
  CustomDatasourcePlus,
  SearchParams,
} from "@budibase/types"

const Airtable = require("airtable")

interface AirtableConfig {
  apiKey: string
  base: string
}

const SCHEMA: Integration = {
  docs: "https://airtable.com/api",
  description:
    "Airtable is a spreadsheet-database hybrid, with the features of a database but applied to a spreadsheet.",
  friendlyName: "Airtable",
  type: "Spreadsheet",
  customPlus: true,
  relationships: false,
  datasource: {
    apiKey: {
      type: DatasourceFieldType.PASSWORD,
      default: "enter api key",
      required: true,
    },
    base: {
      type: DatasourceFieldType.STRING,
      default: "mybase",
      required: true,
    },
  },
  query: {
    create: {
      type: QueryType.FIELDS,
      customisable: true,
      fields: {
        table: {
          type: DatasourceFieldType.STRING,
          required: true,
        },
      },
    },
    read: {
      type: QueryType.FIELDS,
      fields: {
        table: {
          type: DatasourceFieldType.STRING,
          required: true,
        },
        view: {
          type: DatasourceFieldType.STRING,
          required: true,
        },
        numRecords: {
          type: DatasourceFieldType.NUMBER,
          default: 10,
        },
      },
    },
    update: {
      type: QueryType.FIELDS,
      customisable: true,
      fields: {
        id: {
          display: "Record ID",
          type: DatasourceFieldType.STRING,
          required: true,
        },
        table: {
          type: DatasourceFieldType.STRING,
          required: true,
        },
      },
    },
    delete: {
      type: QueryType.FIELDS,
      fields: {
        id: {
          display: "Record ID",
          type: DatasourceFieldType.STRING,
          required: true,
        },
        table: {
          type: DatasourceFieldType.STRING,
          required: true,
        },
      },
    },
  },
}

class AirtableIntegration implements CustomDatasourcePlus {
  private config: AirtableConfig
  private client: any

  constructor(config: AirtableConfig) {
    this.config = config
    this.client = new Airtable(config).base(config.base)
  }

  async create(query: { table: any; json: any }) {
    const { table, json } = query

    try {
      return await this.client(table).create([
        {
          fields: json,
        },
      ])
    } catch (err) {
      console.error("Error writing to airtable", err)
      throw err
    }
  }

  async read(query: {
    table: any
    numRecords: any
    view: any
    sort: Array<object>
    filterByFormula: string
  }) {
    try {
      const records = await this.client(query.table)
        .select({
          maxRecords: query.numRecords || 100,
          view: query.view,
          sort: query.sort || [],
          filterByFormula: query.filterByFormula || "",
        })
        .firstPage()
      // @ts-ignore
      return records.map(({ fields }) => fields)
    } catch (err) {
      console.error("Error writing to airtable", err)
      return []
    }
  }

  async update(query: { table: any; id: any; json: any }) {
    const { table, id, json } = query

    try {
      return await this.client(table).update([
        {
          id,
          fields: json,
        },
      ])
    } catch (err) {
      console.error("Error writing to airtable", err)
      throw err
    }
  }

  async delete(query: { table: any; id: any }) {
    try {
      return await this.client(query.table).destroy(query.id)
    } catch (err) {
      console.error("Error writing to airtable", err)
      throw err
    }
  }

  async search(originalQuery: any, params: SearchParams): Promise<any> {
    let sortOrder = params?.pagination?.sort?.order
      ?.toLowerCase()
      .replace("ending", "")
    let sortColumn = params?.pagination?.sort?.column
    if (sortOrder && sortColumn) {
      originalQuery = {
        ...originalQuery,
        sort: [{ field: sortColumn, direction: sortOrder }],
      }
    }

    let filterByFormula = ""
    for (let [key, value] of Object.entries(params.filters?.equal || {})) {
      filterByFormula += `${key}='${value}',`
    }
    if (filterByFormula.length > 0) {
      //remove trailing comma
      filterByFormula = filterByFormula.substring(0, filterByFormula.length - 1)

      if (Object.entries(params.filters?.equal || {}).length > 1) {
        //wrap in AND statement
        filterByFormula = `AND(${filterByFormula})`
      }
      originalQuery = {
        ...originalQuery,
        filterByFormula,
      }
    }

    return await this.read(originalQuery)
  }
}

export default {
  schema: SCHEMA,
  integration: AirtableIntegration,
}
