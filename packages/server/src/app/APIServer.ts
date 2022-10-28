// api libs
import { ExtendableContext } from "koa"
import Koa from "koa"
import destroyable from "server-destroy"
const koaBody = require("koa-body")
const pino = require("koa-pino-logger")
import http from "http"
import { Server } from "http"
import { AddressInfo } from "net"
import Sentry from "@sentry/node"
// bb
import * as env from "../environment"
import * as bullboard from "../automations/bullboard"
import * as migrations from "../migrations"
import * as websocket from "../websocket"
import * as api from "../api"
import * as worker from "../utilities/workerRequests"
import eventEmitter from "../events"
import {
  installation,
  pinoSettings,
  tenancy,
  logging,
  queues,
} from "@budibase/backend-core"
import { Service } from "./Service"

class APIServer implements Service {
  koa: Koa
  server: Server

  constructor() {
    this.koa = this.initKoa()
    this.server = this.initServer()
  }

  initKoa = () => {
    const koa = new Koa()

    // set up top level koa middleware
    koa.use(
      koaBody({
        multipart: true,
        formLimit: "10mb",
        jsonLimit: "10mb",
        textLimit: "10mb",
        enableTypes: ["json", "form", "text"],
        parsedMethods: ["POST", "PUT", "PATCH", "DELETE"],
      })
    )

    koa.use(pino(pinoSettings()))

    if (!env.isTest()) {
      const plugin = bullboard.init()
      koa.use(plugin)
    }

    koa.context.eventEmitter = eventEmitter
    koa.context.auth = {}

    // api routes
    koa.use(api.router.routes())

    this.errorHandling()

    return koa
  }

  errorHandling = () => {
    if (env.isProd()) {
      this.koa.on("error", (err: any, ctx: ExtendableContext) => {
        Sentry.withScope(function (scope: any) {
          scope.addEventProcessor(function (event: any) {
            return Sentry.Handlers.parseRequest(event, ctx.request)
          })
          Sentry.captureException(err)
        })
      })
    }
  }

  initServer = () => {
    const server = http.createServer(this.koa.callback())
    destroyable(server)
    websocket.initialise(server)
    return server
  }

  createAdmin = async () => {
    // check and create admin user if required
    if (
      env.SELF_HOSTED &&
      !env.MULTI_TENANCY &&
      env.BB_ADMIN_USER_EMAIL &&
      env.BB_ADMIN_USER_PASSWORD
    ) {
      const checklist = await worker.getChecklist()
      if (!checklist?.adminUser?.checked) {
        try {
          const tenantId = tenancy.getTenantId()
          const user = await worker.createAdminUser(
            env.BB_ADMIN_USER_EMAIL,
            env.BB_ADMIN_USER_PASSWORD,
            tenantId
          )
          // Need to set up an API key for automated integration tests
          if (env.isTest()) {
            await worker.generateApiKey(user._id)
          }

          console.log(
            "Admin account automatically created for",
            env.BB_ADMIN_USER_EMAIL
          )
        } catch (e) {
          logging.logAlert("Error creating initial admin user. Exiting.", e)
          throw e
        }
      }
    }
  }

  checkMigrations = async () => {
    // run migrations on startup if not done via http
    // not recommended in a clustered environment
    if (!env.HTTP_MIGRATIONS && !env.isTest()) {
      try {
        await migrations.migrate()
      } catch (e) {
        logging.logAlert("Error performing migrations. Exiting.", e)
        throw e
      }
    }
  }

  start = () => {
    return new Promise((resolve, reject) => {
      this.server.listen(env.PORT || 0, async () => {
        try {
          const address = this.server.address() as AddressInfo
          console.log(`Budibase running on ${JSON.stringify(address)}`)
          env._set("PORT", address.port)
          eventEmitter.emitPort(env.PORT)

          await this.checkMigrations()
          await this.createAdmin()
          // check for version updates
          await installation.checkInstallVersion()
          resolve(true)
        } catch (e) {
          logging.logAlert("Error starting server", e)
          reject(e)
        }
      })
    })
  }

  stopInternal = async () => {
    api.shutdown()
    // Just close the redis connection - don't wait for jobs to complete
    // NOTE: When running server with embedded jobs, this is the default behaviour.
    // To enable graceful job shutdown, run server and jobs independently.
    await queues.shutdown({ doNotWaitJobs: true })
  }

  stop = () => {
    return new Promise((resolve, reject) => {
      try {
        this.server.destroy(async (err: any) => {
          try {
            await this.stopInternal()
            resolve(err)
          } catch (e) {
            reject(e)
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  }
}

export default APIServer
