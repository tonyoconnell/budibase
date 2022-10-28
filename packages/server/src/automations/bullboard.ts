const { createBullBoard } = require("@bull-board/api")
const { BullAdapter } = require("@bull-board/api/bullAdapter")
const { KoaAdapter } = require("@bull-board/koa")
import { queues } from "@budibase/backend-core"
const PATH_PREFIX = "/bulladmin"

export const init = () => {
  // Set up queues for bull board admin
  const adapters = []
  const serverAdapter = new KoaAdapter()
  for (let queue of queues.getQueues()) {
    adapters.push(new BullAdapter(queue))
  }
  createBullBoard({
    queues: adapters,
    serverAdapter,
  })
  serverAdapter.setBasePath(PATH_PREFIX)
  return serverAdapter.registerPlugin()
}
