import { QueryJson, Datasource, Operation } from "@budibase/types"
import { getIntegration } from "../index"
import sdk from "../../sdk"
import { executeV2 } from "src/api/controllers/query"

export async function makeExternalQuery(
  datasource: Datasource,
  json: QueryJson
) {
  datasource = await sdk.datasources.enrich(datasource)
  const Integration = await getIntegration(datasource.source)
  if (datasource.plusWrapper) {
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
    let ctx = {
      request: {
        body: {
          parameters: json.body,
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
    if (operation !== Operation.READ) {
      //Return the input for CREATE to make sure the _id is assigned
      return [json.body]
    }
    return ctx.body.data
  } else if (Integration.prototype.query) {
    const integration = new Integration(datasource.config)
    return integration.query(json)
  } else {
    throw "Datasource does not support query."
  }
}
