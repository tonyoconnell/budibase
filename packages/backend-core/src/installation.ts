import { newid } from "./utils"
import * as events from "./events"
import { getDB, StaticDatabases } from "./db"
import { doWithDB } from "./db"
import { Installation, IdentityType } from "@budibase/types"
import * as context from "./context"
import semver from "semver"
import { bustCache, withCache, TTL, CacheKey } from "./cache/generic"

const pkg = require("../package.json")

export const getInstall = async (): Promise<Installation> => {
  return withCache(CacheKey.INSTALLATION, TTL.ONE_DAY, getOrCreateInstall, {
    useTenancy: false,
  })
}

export async function removeInstall() {
  const install = await getInstallFromDB()
  if (install) {
    const db = getDB(StaticDatabases.PLATFORM_INFO.name)
    await db.remove(install._id, install._rev)
  }
}

export async function getInstallFromDB(): Promise<Installation | undefined> {
  try {
    const db = getDB(StaticDatabases.PLATFORM_INFO.name)
    // await for error checking
    const install = await db.get(StaticDatabases.PLATFORM_INFO.docs.install)
    return install
  } catch (e: any) {
    if (e.status === 404) {
      return
    }
    throw e
  }
}

const getOrCreateInstall = async (): Promise<Installation> => {
  return doWithDB(
    StaticDatabases.PLATFORM_INFO.name,
    async (platformDb: any) => {
      let install = await getInstallFromDB()
      if (!install) {
        install = {
          _id: StaticDatabases.PLATFORM_INFO.docs.install,
          installId: newid(),
          version: pkg.version,
        }
        try {
          const resp = await platformDb.put(install)
          install._rev = resp.rev
          return install
        } catch (e: any) {
          if (e.status === 409) {
            // already populated
            // do nothing
            return install
          }
          throw e
        }
      }
    }
  )
}

const updateVersion = async (version: string): Promise<boolean> => {
  try {
    await doWithDB(
      StaticDatabases.PLATFORM_INFO.name,
      async (platformDb: any) => {
        const install = await getInstall()
        install.version = version
        await platformDb.put(install)
        await bustCache(CacheKey.INSTALLATION)
      }
    )
  } catch (e: any) {
    if (e.status === 409) {
      // do nothing - version has already been updated
      // likely in clustered environment
      return false
    }
    throw e
  }
  return true
}

export const checkInstallVersion = async (): Promise<void> => {
  const install = await getInstall()

  const currentVersion = install.version
  const newVersion = pkg.version

  if (currentVersion !== newVersion) {
    const isUpgrade = semver.gt(newVersion, currentVersion)
    const isDowngrade = semver.lt(newVersion, currentVersion)

    const success = await updateVersion(newVersion)

    if (success) {
      await context.doInIdentityContext(
        {
          _id: install.installId,
          type: IdentityType.INSTALLATION,
        },
        async () => {
          if (isUpgrade) {
            await events.installation.upgraded(currentVersion, newVersion)
          } else if (isDowngrade) {
            await events.installation.downgraded(currentVersion, newVersion)
          }
        }
      )
      await events.identification.identifyInstallationGroup(install.installId)
    }
  }
}
