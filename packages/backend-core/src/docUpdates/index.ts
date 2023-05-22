import { asyncEventQueue, init as initQueue } from "../events/asyncEvents"
import {
  ProcessorMap,
  default as DocumentUpdateProcessor,
} from "../events/processors/async/DocumentUpdateProcessor"
import { Worker } from "bullmq"
import * as redis from "../redis"

let processingPromise: Promise<void>
let documentProcessor: DocumentUpdateProcessor

export function init(processors: ProcessorMap) {
  if (!asyncEventQueue) {
    initQueue()
  }
  if (!documentProcessor) {
    documentProcessor = new DocumentUpdateProcessor(processors)
  }
  // if not processing in this instance, kick it off
  if (!processingPromise) {
    const worker = new Worker(asyncEventQueue.name, async job => {
      const { event, identity, properties, timestamp } = job.data
      await documentProcessor.processEvent(
        event,
        identity,
        properties,
        timestamp
      )
    }, {
      connection: redis.utils.getRedisOptions().opts
    })
  }
}
