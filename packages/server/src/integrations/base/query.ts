import { QueryJson, Datasource, Operation, Row } from "@budibase/types"
import { getIntegration } from "../index"
import sdk from "../../sdk"
import { executeV2 } from "src/api/controllers/query"
import {
  hasKeyNumbering,
  removeKeyNumbering,
} from "@budibase/backend-core/src/db"

export async function makeExternalQuery(
  datasource: Datasource,
  json: QueryJson
) {
  datasource = await sdk.datasources.enrich(datasource)
  const Integration = await getIntegration(datasource.source)
  if (datasource.customPlus) {
    const operation = json.endpoint.operation
    switch (operation) {
      case Operation.CREATE_TABLE:
      case Operation.UPDATE_TABLE:
      case Operation.DELETE_TABLE:
        return
    }
    const query = json.meta?.table?.queries?.[operation.toLowerCase()]
    if (!query) {
      throw `Custom datasource does not support ${operation.toLowerCase()}.`
    }
    let parameters = json.body
    switch (operation) {
      case Operation.READ:
        parameters = {
          ...parameters,
          filters: json.filters,
          pagination: {
            limit: json.paginate?.limit,
            bookmark: json.paginate?.page,
            sort: {
              column: Object.entries(json.sort ?? {})[0]?.[0],
              order: Object.entries(json.sort ?? {})[0]?.[1]?.direction,
              type: Object.entries(json.sort ?? {})[0]?.[1]?.type,
            },
          },
        }
        //Remove numbering from filters
        for (let [key, filter] of Object.entries(json.filters || {})) {
          for (let [field, value] of Object.entries(filter || {})) {
            if (hasKeyNumbering(field)) {
              parameters.filters[key][removeKeyNumbering(field)] = value
              delete parameters.filters[key][field]
            }
          }
        }

        break
      case Operation.UPDATE:
      case Operation.DELETE:
        parameters = {
          ...parameters,
          ...json.filters?.equal,
        }
        break
      default:
        break
    }
    let ctx = {
      request: {
        body: {
          parameters,
        },
      },
      body: {
        data: [],
      },
      params: {},
    }
    await executeV2(ctx, query, {
      isAutomation: true,
    })
    if (operation === Operation.CREATE) {
      //Return the input for CREATE to make sure the _id is assigned
      let body = json.body as Row
      let idField = json.meta?.table?.primary?.[0] || "_id"
      if (!body?.["_id"]) {
        body["_id"] = ctx.body.data[0]?.[idField]
        body[`${idField}`] = ctx.body.data[0]?.[idField]
      }
      return [body]
    } else if (operation === Operation.DELETE) {
      return []
    }
    return ctx.body.data
  } else if (Integration.prototype.query) {
    const integration = new Integration(datasource.config)
    return integration.query(json)
  } else {
    throw "Datasource does not support query."
  }
}
