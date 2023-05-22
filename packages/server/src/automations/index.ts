import { automationQueue } from "./bullboard"
import { rebootTrigger } from "./triggers"
import { Queue, Worker } from "bullmq"
import path from "path"
import { redis } from "@budibase/backend-core"

export { automationQueue } from "./bullboard"
export { shutdown } from "./bullboard"
export { TRIGGER_DEFINITIONS } from "./triggers"
export { BUILTIN_ACTION_DEFINITIONS, getActionDefinitions } from "./actions"

const processorFile = path.join(__dirname, './utils.js');

/**
 * This module is built purely to kick off the worker farm and manage the inputs/outputs
 */
export async function init() {
  // this promise will not complete
  new Worker(automationQueue.name, processorFile, {
    connection: redis.utils.getRedisOptions().opts,
    concurrency: 5
  })
  // on init we need to trigger any reboot automations
  await rebootTrigger()
}

export function getQueues(): Queue[] {
  return [automationQueue]
}
