const { processEvent } = require("./utils")
import { rebootTrigger } from "./triggers"
import { Job } from "bull"
import { queues } from "@budibase/backend-core"

/**
 * This module is built purely to kick off the worker farm and manage the inputs/outputs
 */
export const init = async function () {
  // this promise will not complete
  const promise = queues.getAutomationQueue().process(async (job: Job) => {
    await processEvent(job)
  })
  // on init we need to trigger any reboot automations
  await rebootTrigger()
  return promise
}
