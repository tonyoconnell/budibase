import { Job, Queue, QueueEvents } from "bullmq"
import { JobQueue } from "./constants"
import * as context from "../context"
import * as redis from "../redis"

export type StalledFn = (job: Job) => Promise<void>

export function addListeners(
  queue: Queue,
  jobQueue: JobQueue,
  removeStalledCb?: StalledFn
) {
  logging(queue, jobQueue)
  if (removeStalledCb) {
    handleStalled(queue, removeStalledCb)
  }
}

function handleStalled(queue: Queue, removeStalledCb?: StalledFn) {
  // queue.on("stalled", async (job: Job) => {
  //   if (removeStalledCb) {
  //     await removeStalledCb(job)
  //   } else if (job.opts.repeat) {
  //     const jobId = job.id
  //     const repeatJobs = await queue.getRepeatableJobs()
  //     for (let repeatJob of repeatJobs) {
  //       if (repeatJob.id === jobId) {
  //         await queue.removeRepeatableByKey(repeatJob.key)
  //       }
  //     }
  //     console.log(`jobId=${jobId} disabled`)
  //   }
  // })
}

function getLogParams(
  eventType: QueueEventType,
  event: BullEvent,
  opts: {
    job?: Job
    jobId?: string
    error?: Error
  } = {},
  extra: any = {}
) {
  const message = `[BULL] ${eventType}=${event}`
  const err = opts.error

  const bullLog = {
    _logKey: "bull",
    eventType,
    event,
    job: opts.job,
    jobId: opts.jobId || opts.job?.id,
    ...extra,
  }

  let automationLog
  if (opts.job?.data?.automation) {
    automationLog = {
      _logKey: "automation",
      trigger: opts.job
        ? opts.job.data.automation.definition.trigger.event
        : undefined,
    }
  }

  return [message, err, bullLog, automationLog]
}

enum BullEvent {
  ERROR = "error",
  WAITING = "waiting",
  ACTIVE = "active",
  STALLED = "stalled",
  PROGRESS = "progress",
  COMPLETED = "completed",
  FAILED = "failed",
  PAUSED = "paused",
  RESUMED = "resumed",
  CLEANED = "cleaned",
  DRAINED = "drained",
  REMOVED = "removed",
}

enum QueueEventType {
  AUTOMATION_EVENT = "automation-event",
  APP_BACKUP_EVENT = "app-backup-event",
  AUDIT_LOG_EVENT = "audit-log-event",
  SYSTEM_EVENT = "system-event",
}

const EventTypeMap: { [key in JobQueue]: QueueEventType } = {
  [JobQueue.AUTOMATION]: QueueEventType.AUTOMATION_EVENT,
  [JobQueue.APP_BACKUP]: QueueEventType.APP_BACKUP_EVENT,
  [JobQueue.AUDIT_LOG]: QueueEventType.AUDIT_LOG_EVENT,
  [JobQueue.SYSTEM_EVENT_QUEUE]: QueueEventType.SYSTEM_EVENT,
}


function logging(queue: Queue, jobQueue: JobQueue) {
  const eventType = EventTypeMap[jobQueue]

  function doInJobContext(job: Job, task: any) {
    // if this is an automation job try to get the app id
    const appId = job.data.event?.appId
    if (appId) {
      return context.doInContext(appId, task)
    } else {
      task()
    }
  }

  const queueEvents = new QueueEvents(queue.name, {
    connection: redis.utils.getRedisOptions().opts
  });

  queueEvents
    .on(BullEvent.STALLED, async ({ jobId }) => {
      // A job has been marked as stalled. This is useful for debugging job
      // workers that crash or pause the event loop.
      // await doInJobContext(job, () => {
        console.error(...getLogParams(eventType, BullEvent.STALLED, { jobId }))
      // })
    })
    .on(BullEvent.ERROR, (error: any) => {
      // An error occurred.
      console.error(...getLogParams(eventType, BullEvent.ERROR, { error }))
    })

  if (process.env.NODE_DEBUG?.includes("bull")) {
    queueEvents
      .on(BullEvent.WAITING, ({ jobId, prev }) => {
        // A Job is waiting to be processed as soon as a worker is idling.
        console.info(...getLogParams(eventType, BullEvent.WAITING, { jobId }))
      })
      .on(BullEvent.ACTIVE, async ({ jobId }) => {
        // A job has started. You can use `jobPromise.cancel()`` to abort it.
        // await doInJobContext(job, () => {
          console.info(...getLogParams(eventType, BullEvent.ACTIVE, { jobId }))
        // })
      })
      .on(BullEvent.PROGRESS, async ({ jobId, data }) => {
        // A job's progress was updated
        // await doInJobContext(job, () => {
          console.info(
            ...getLogParams(
              eventType,
              BullEvent.PROGRESS,
              { jobId },
              { data }
            )
          )
        // })
      })
      .on(BullEvent.COMPLETED, async ({ jobId, returnvalue, prev }) => {
        // A job successfully completed with a `result`.
        // await doInJobContext(job, () => {
          console.info(
            ...getLogParams(eventType, BullEvent.COMPLETED, { jobId }, { returnvalue, prev })
          )
        // })
      })
      .on(BullEvent.FAILED, async ({ jobId, failedReason, prev }) => {
        // A job failed with reason `err`!
        // await doInJobContext(job, () => {
          console.error(
            ...getLogParams(eventType, BullEvent.FAILED, { jobId }, { failedReason, prev })
          )
        // })
      })
      .on(BullEvent.PAUSED, () => {
        // The queue has been paused.
        console.info(...getLogParams(eventType, BullEvent.PAUSED))
      })
      .on(BullEvent.RESUMED, () => {
        // The queue has been resumed.
        console.info(...getLogParams(eventType, BullEvent.RESUMED))
      })
      .on(BullEvent.CLEANED, ({ count }) => {
        // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
        // jobs, and `type` is the type of jobs cleaned.
        console.info(
          ...getLogParams(
            eventType,
            BullEvent.CLEANED,
            {},
            { length: count }
          )
        )
      })
      .on(BullEvent.DRAINED, () => {
        // Emitted every time the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)
        console.info(...getLogParams(eventType, BullEvent.DRAINED))
      })
      .on(BullEvent.REMOVED, ({ jobId, prev }) => {
        // A job successfully removed.
        console.info(...getLogParams(eventType, BullEvent.REMOVED, { jobId }, { prev }))
      })
  }
}
