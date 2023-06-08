import TestConfig from "../../../../tests/utilities/TestConfiguration"
import { hasDevAppChanged } from "../changes"
import { App } from "@budibase/types"

const config = new TestConfig()
let app: App

async function basicApp() {
  await config.createScreen()
  await config.createTable()
  await config.createAutomation()
}

beforeAll(async () => {
  app = await config.init()
  // we setup a single app for the testing here as rebuilding
  // constantly makes the test case very slow
  await basicApp()
})

describe("test differences in some apps", () => {
  it("should detect a change has occurred if app isn't published", async () => {
    await config.unpublish()
    const changes = await hasDevAppChanged(app.appId)
    expect(changes.changed).toBe(true)
    expect(changes.docIds.length).toBe(0)
  })

  it("should detect no difference between dev and published when the same", async () => {
    await config.publish()
    const changes = await hasDevAppChanged(app.appId)
    expect(changes.changed).toBe(false)
    expect(changes.docIds).toStrictEqual([])
  })

  it("should create a basic development and published app to compare", async () => {
    await config.publish()
    const screen = await config.createScreen()
    const changes = await hasDevAppChanged(app.appId)
    expect(changes.changed).toBe(true)
    expect(changes.docIds).toStrictEqual([screen._id])
  })

  it("should include some rows to make sure they are excluded from calculation", async () => {
    await config.publish()
    await config.createRow()
    await config.createRow()
    await config.createRow()
    const changes = await hasDevAppChanged(app.appId)
    expect(changes.changed).toBe(false)
    expect(changes.docIds).toStrictEqual([])
  })
})
