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
  if (datasource.plusWrapper && json.endpoint.operation === Operation.READ) {
    const query = json.meta?.table?.queries?.find(
      query => query.queryVerb === json.endpoint.operation.toLowerCase()
    )
    let ctx = {
      request: {
        body: {},
      },
      body: {
        data: {},
      },
      params: {},
    }
    await executeV2(ctx, query, {
      isAutomation: true,
    })
    return ctx.body.data
  } else if (Integration.prototype.query) {
    const integration = new Integration(datasource.config)
    return integration.query(json)
  } else {
    throw "Datasource does not support query."
  }
}
