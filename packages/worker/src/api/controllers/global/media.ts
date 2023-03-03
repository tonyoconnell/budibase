import * as sdk from "../../../sdk/media"
import { objectStore, db as dbCore } from "@budibase/backend-core"
import { App } from "@budibase/types"

export const fetch = async (ctx: any) => {
  const all = await sdk.allMedia()
  ctx.body = all
}

export const sync = async (ctx: any) => {
  const apps = (await dbCore.getAllApps({ dev: false, all: true })) as App[]

  const appIds = apps
    .filter((app: any) => app.status === "development")
    .map((app: any) => app.appId)

  try {
    if (appIds?.length) {
      for (let i = 0; i < appIds.length; i++) {
        let objects = await objectStore.listAllObjects(
          "prod-budi-app-assets",
          `${appIds[i]}/attachments`
        )
        let enriched = objects.map(obj => {
          return { ...obj, appId: appIds[i] }
        })
        const fileDocs = sdk.generateDocs(enriched)
        await sdk.syncDocs(fileDocs)
      }
    }
    ctx.body = { message: "done" }
  } catch (e) {
    console.log("Sync Failed")
    ctx.body = { message: "failed" }
  }
}
