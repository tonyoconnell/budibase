import { BBContext } from "@budibase/types"
import { deprovisioning } from "@budibase/backend-core"
import { quotas } from "@budibase/pro"

const _delete = async (ctx: BBContext) => {
  const tenantId = ctx.params.tenantId

  try {
    await quotas.bustCache()
    await deprovisioning.deleteTenant(tenantId)
    ctx.status = 204
  } catch (err) {
    ctx.log.error(err)
    throw err
  }
}

export { _delete as delete }
