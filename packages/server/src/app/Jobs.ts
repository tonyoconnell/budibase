import { Service } from "./Service"
import sdk from "../sdk"
import * as pro from "@budibase/pro"
import * as automations from "../automations"
import { queues } from "@budibase/backend-core"

class Jobs implements Service {
  constructor() {}

  start = async () => {
    console.log("Starting job processing")
    // these will never complete
    let promises = []

    // automations
    promises.push(automations.processing.init())

    // backups
    promises.push(
      pro.processing.initBackupProcessing({
        exportAppFn: sdk.backups.exportApp,
        importAppFn: sdk.backups.importApp,
        statsFn: sdk.backups.calculateBackupStats,
      })
    )

    await Promise.all(promises)
  }

  stop = async () => {
    // wait for jobs to finish
    await queues.shutdown({ doNotWaitJobs: false })
  }
}

export default Jobs
