import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { KoaAdapter } from "@bull-board/koa"
import { queue } from "@budibase/backend-core"
import * as automation from "./automation"
import { backups } from "@budibase/pro"
import { createBullBoard } from "@bull-board/api"
import { Queue } from "bullmq"

export const automationQueue: Queue = queue.createQueue(
  queue.JobQueue.AUTOMATION,
  { removeStalledCb: automation.removeStalled }
)

const PATH_PREFIX = "/bulladmin"

export async function init() {
  // Set up queues for bull board admin
  const backupQueue = await backups.getBackupQueue()
  const queues = [automationQueue]
  if (backupQueue) {
    queues.push(backupQueue)
  }
  const adapters = []
  const serverAdapter: any = new KoaAdapter()
  for (let queue of queues) {
    adapters.push(new BullMQAdapter(queue))
  }
  createBullBoard({
    queues: adapters,
    serverAdapter,
  })
  serverAdapter.setBasePath(PATH_PREFIX)
  return serverAdapter.registerPlugin()
}

export async function shutdown() {
  await queue.shutdown()
}
