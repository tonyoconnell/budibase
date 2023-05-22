import env from "../environment"
import { getRedisOptions } from "../redis/utils"
import { JobQueue } from "./constants"
import InMemoryQueue from "./inMemoryQueue"
import { Queue, QueueOptions } from "bullmq"
import { addListeners, StalledFn } from "./listeners"
import * as timers from "../timers"

const CLEANUP_PERIOD_MS = 60 * 1000
let QUEUES: Queue[] | InMemoryQueue[] = []
let cleanupInterval: NodeJS.Timeout

async function cleanup() {
  for (let queue of QUEUES) {
    await queue.clean(
      CLEANUP_PERIOD_MS, // // 1 minute
      1000, // max number of jobs to clean
      "completed"
    )
  }
}

export function createQueue<T>(
  jobQueue: JobQueue,
  opts: { removeStalledCb?: StalledFn } = {}
): Queue<T> {
  const { opts: redisOpts, redisProtocolUrl } = getRedisOptions()
  // const queueConfig: QueueOptions = redisProtocolUrl || { redis: redisOpts }
  const queueConfig: QueueOptions = {
    connection: redisOpts
  }

  let queue: any
  if (!env.isTest()) {
    queue = new Queue(jobQueue, queueConfig)
  } else {
    queue = new InMemoryQueue(jobQueue)
  }
  addListeners(queue, jobQueue, opts?.removeStalledCb)
  QUEUES.push(queue)
  if (!cleanupInterval && !env.isTest()) {
    cleanupInterval = timers.set(cleanup, CLEANUP_PERIOD_MS)
    // fire off an initial cleanup
    cleanup().catch(err => {
      console.error(`Unable to cleanup automation queue initially - ${err}`)
    })
  }
  return queue
}

export async function shutdown() {
  if (cleanupInterval) {
    timers.clear(cleanupInterval)
  }
  if (QUEUES.length) {
    for (let queue of QUEUES) {
      await queue.close()
    }
    QUEUES = []
  }
  console.log("Queues shutdown")
}
