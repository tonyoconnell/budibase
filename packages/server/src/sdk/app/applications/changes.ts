import { db as dbCore } from "@budibase/backend-core"
import { AllDocsResponse, RowResponse } from "@budibase/types"

const NOT_PUBLISHED_ERR = "Not published"

async function getDocInfoFromApp(
  appId: string,
  opts?: { production?: boolean }
) {
  // currently leaving out data - would be messy to monitor this
  let db
  const prodAppId = dbCore.getProdAppID(appId)
  const devAppId = dbCore.getDevAppID(appId)
  if (opts?.production && !(await dbCore.dbExists(prodAppId))) {
    throw new Error(NOT_PUBLISHED_ERR)
  } else if (opts?.production) {
    db = dbCore.getDB(prodAppId)
  } else {
    db = dbCore.getDB(devAppId)
  }
  let promises = []
  for (let documentType of dbCore.AppComponentDocuments) {
    const docStartsWith = `${documentType}${dbCore.SEPARATOR}`
    promises.push(
      await db.allDocs({
        include_docs: false,
        startkey: docStartsWith,
        endkey: `${docStartsWith}${dbCore.UNICODE_MAX}`,
      })
    )
  }
  const appComponentInfos: AllDocsResponse<any>[] = await Promise.all(promises)
  let appInfo: RowResponse<{ rev: string }>[] = []
  for (let info of appComponentInfos) {
    appInfo = appInfo.concat(info.rows)
  }
  return appInfo.map(row => ({ _id: row.id, _rev: row.value.rev }))
}

export async function hasDevAppChanged(
  appId: string
): Promise<{ changed: boolean; docIds: string[] }> {
  try {
    const [devDocInfo, prodDocInfo] = await Promise.all([
      getDocInfoFromApp(appId, { production: false }),
      getDocInfoFromApp(appId, { production: true }),
    ])
    const docIds = []
    for (let docInfo of devDocInfo) {
      if (
        !prodDocInfo.find(
          info => info._id === docInfo._id && info._rev === docInfo._rev
        )
      ) {
        docIds.push(docInfo._id)
      }
    }
    return { changed: docIds.length !== 0, docIds }
  } catch (err: any) {
    if (err.message === NOT_PUBLISHED_ERR) {
      return { changed: true, docIds: [] }
    } else {
      throw err
    }
  }
}
