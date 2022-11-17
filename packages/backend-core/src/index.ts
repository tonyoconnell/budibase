import * as db from "./db"
export const init = (opts: any = {}) => {
  db.init(opts.db)
}
export * as db from "./db"
export { PouchLike } from "./db"
export * from "./db/constants"
export * from "./constants"
export * as constants from "./constants"
export * as events from "./events"
export * as sessions from "./security/sessions"
export * as deprovisioning from "./context/deprovision"
export * as installation from "./installation"
export * as objectStore from "./pkg/objectStore"
export * as utils from "./pkg/utils"
export * as users from "./users"
export * as migrations from "./migrations"
export * as accounts from "./cloud/accounts"
export * as logging from "./logging"
export * as roles from "./security/roles"
export * as queue from "./queue"

import _permissions from "./security/permissions"
export const permissions = _permissions

// RE-EXPORTS

import _redis from "./pkg/redis"
export const redis = _redis
export const locks = _redis.redlock

import _cache from "./pkg/cache"
export const cache = _cache

import _auth from "./auth"
export const auth = _auth

import _env from "./environment"
export const env = _env

import _tenancy from "./tenancy"
export const tenancy = _tenancy

import _context from "./pkg/context"
export const context = _context

import _featureFlags from "./featureFlags"
export const featureFlags = _featureFlags

import _errors from "./errors"
export const errors = _errors
export { UsageLimitError, FeatureDisabledError } from "./errors/licensing"
export { HTTPError } from "./errors/http"

import _plugins from "./plugin"
export const plugins = _plugins

export { pinoSettings } from "./pino"

import _middleware from "./middleware"
export const middleware = _middleware

import _encryption from "./security/encryption"
export const encryption = _encryption
