import { QueryJson, Datasource, Operation } from "@budibase/types"
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
    if (operation === Operation.READ) {
      parameters = {
        ...parameters,
        filters: json.filters,
      }
      //TODO - nested for loop for all filter keys
      //Remove numbering from filters
      for (let filter of Object.entries(json.filters?.equal || {})) {
        if (hasKeyNumbering(filter[0])) {
          parameters.filters.equal[removeKeyNumbering(filter[0])] = filter[1]
          delete parameters.filters.equal[filter[0]]
        }
      }
    } else if (operation !== Operation.CREATE) {
      parameters = {
        ...parameters,
        ...json.filters?.equal,
      }
    }
    let ctx = {
      request: {
        body: {
          parameters,
        },
      },
      body: {
        data: {},
      },
      params: {},
    }
    await executeV2(ctx, query, {
      isAutomation: true,
    })
    if (operation === Operation.CREATE) {
      //Return the input for CREATE to make sure the _id is assigned
      return [json.body]
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
