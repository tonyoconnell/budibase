import env from "../environment"
import { getRedisOptions } from "../redis/utils"
import { JobQueue } from "./constants"
import InMemoryQueue from "./inMemoryQueue"
import { addListeners, StalledFn } from "./listeners"
import { AppBackupQueueData } from "@budibase/types"
import Bull from "bull"

const { opts: redisOpts, redisProtocolUrl } = getRedisOptions()
const CLEANUP_PERIOD_MS = 60 * 1000
let QUEUES: Bull.Queue[] | InMemoryQueue[] = []
let cleanupInterval: NodeJS.Timeout

async function cleanup() {
  for (let queue of QUEUES) {
    await queue.clean(CLEANUP_PERIOD_MS, "completed")
  }
}

function createQueue<T>(
  jobQueue: JobQueue,
  opts: { removeStalledCb?: StalledFn } = {}
): Bull.Queue<T> {
  const queueConfig: any = redisProtocolUrl || { redis: redisOpts }
  let queue: any
  if (!env.isTest()) {
    queue = new Bull(jobQueue, queueConfig)
  } else {
    queue = new InMemoryQueue(jobQueue, queueConfig)
  }
  addListeners(queue, jobQueue, opts?.removeStalledCb)
  QUEUES.push(queue)
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanup, CLEANUP_PERIOD_MS)
    // fire off an initial cleanup
    cleanup().catch(err => {
      console.error(`Unable to cleanup automation queue initially - ${err}`)
    })
  }
  return queue
}

let shutdownStarted = false

export const shutdown = async (opts: { doNotWaitJobs: boolean }) => {
  if (shutdownStarted) {
    return
  }
  shutdownStarted = true
  if (QUEUES.length) {
    clearInterval(cleanupInterval)
    for (let queue of QUEUES) {
      await queue.close(opts.doNotWaitJobs)
    }
    QUEUES = []
  }
  console.log("Queues shutdown")
}

// BACKUP

let backupQueue: Bull.Queue<AppBackupQueueData>

export function initBackupQueue() {
  backupQueue = createQueue<AppBackupQueueData>(JobQueue.APP_BACKUP)
}

export function getBackupQueue() {
  return backupQueue
}

// AUTOMATION

let automationQueue: Bull.Queue

export const initAutomationQueue = (removeStalledCb: StalledFn) => {
  automationQueue = createQueue(JobQueue.AUTOMATION, { removeStalledCb })
}

export const getAutomationQueue = () => {
  return automationQueue
}

export const getQueues = () => {
  return QUEUES
}
