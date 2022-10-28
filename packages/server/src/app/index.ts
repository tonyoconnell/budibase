// enable APM if configured
import Sentry from "@sentry/node"

if (process.env.ELASTIC_APM_ENABLED) {
  const apm = require("elastic-apm-node").start({
    serviceName: process.env.SERVICE,
    environment: process.env.BUDIBASE_ENVIRONMENT,
  })
}

import { bootstrap } from "global-agent"
const fixPath = require("fix-path")

import env from "../environment"
import { checkDevelopmentEnvironment } from "../utilities/fileSystem"
import { events, logging, queues } from "@budibase/backend-core"
import APIServer from "./APIServer"
import Jobs from "./jobs"
import redis from "../utilities/redis"
import { Thread } from "../threads"
import db from "../db"
import * as fileSystem from "../utilities/fileSystem"
import { watch } from "../watch"
import fs from "fs"
import * as automation from "../threads/automation"

process.on("uncaughtException", async err => {
  // @ts-ignore
  // don't worry about this error, comes from zlib isn't important
  if (err && err["code"] === "ERR_INVALID_CHAR") {
    return
  }
  logging.logAlert("Uncaught exception.", err)
  await shutdown(-1)
})

process.on("SIGTERM", async () => {
  await shutdown()
})

process.on("SIGINT", async () => {
  await shutdown()
})

const watchPlugins = () => {
  // monitor plugin directory if required
  if (
    env.SELF_HOSTED &&
    !env.MULTI_TENANCY &&
    env.PLUGINS_DIR &&
    fs.existsSync(env.PLUGINS_DIR)
  ) {
    watch()
  }
}

/**
 * Common init function for APIServer and Jobs.
 */
const init = async () => {
  // this will shutdown the system if development environment not ready
  // will print an error explaining what to do
  checkDevelopmentEnvironment()
  fixPath()

  // this will setup http and https proxies form env variables
  process.env.GLOBAL_AGENT_FORCE_GLOBAL_AGENT = "false"
  bootstrap()

  // production build specific setup
  if (env.isProd()) {
    env._set("NODE_ENV", "production")
    Sentry.init()
  }

  // init service modules
  fileSystem.init()
  db.init()
  await redis.init()
  queues.initAutomationQueue(automation.removeStalled)
  queues.initBackupQueue()
  watchPlugins()
}

/**
 * Common shutdown functions for APIServer and Jobs.
 */
let shuttingDown = false
const shutdown = async (errCode: number = 0) => {
  // already in process
  if (shuttingDown) {
    return
  }
  shuttingDown = true

  if (apiServer) {
    await apiServer.stop()
  }

  if (jobs) {
    await jobs.stop()
  }

  await redis.shutdown()
  await events.shutdown()
  await Thread.shutdown()

  if (!env.isTest()) {
    process.exit(errCode)
  }
}

let apiServer: APIServer | undefined
let jobs: Jobs | undefined

export const start = async () => {
  await init()
  if (!env.DISABLE_HTTP_API) {
    try {
      apiServer = new APIServer()
      await apiServer.start()
    } catch (e) {
      await shutdown(1)
    }
  }

  if (!env.DISABLE_JOB_PROCESSING) {
    try {
      jobs = new Jobs()
      await jobs.start()
    } catch (e) {
      await shutdown(1)
    }
  }
}
