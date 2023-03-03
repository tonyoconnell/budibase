import { tenancy } from "@budibase/backend-core"

export const allMedia = async () => {
  const db = tenancy.getMediaDB()
  const response = await db.allDocs({ include_docs: true })
  return response.rows.map((row: any) => row.doc)
}

/*
  {
    @budibase/worker:     Key: 'app_47855dd7022f4732b8b3ed60d3065940/attachments/8e938c85-918e-497f-b048-69f16406e4ba.jpeg',
    @budibase/worker:     LastModified: 2023-03-02T09:41:49.996Z,
    @budibase/worker:     ETag: '"f025345a00d65987a9a2f813c54c0611"',
    @budibase/worker:     Size: 5631,
    @budibase/worker:     StorageClass: 'STANDARD',
    @budibase/worker:     Owner: {
    @budibase/worker:       DisplayName: 'minio',
    @budibase/worker:       ID: '02d6176db174dc93cb1b899f7c6078f08654445fe8cf1b6ce98d8855f66bdbf4'
    @budibase/worker:     }
    @budibase/worker:   
  },
*/
export const getMediaDoc = (conf: any) => {
  return {
    appId: conf.appId,
    name: conf.Key,
    size: conf.Size,
    sync: new Date().toISOString(),
    updated: conf.LastModified,
  }
}

export const generateDocs = (records: any) => {
  return records.map((record: any) => {
    return getMediaDoc(record)
  })
}

export const syncDocs = async (docs: any) => {
  const db = tenancy.getMediaDB()
  await db.bulkDocs([...docs])
}
