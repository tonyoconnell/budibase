import TestConfiguration from "../../../config/internal-api/TestConfiguration"
import { Application } from "@budibase/server/api/controllers/public/mapping/types"
import InternalAPIClient from "../../../config/internal-api/TestConfiguration/InternalAPIClient"
import AccountsAPIClient from "../../../config/internal-api/TestConfiguration/accountsAPIClient"
import generator from "../../../config/generator"
import {
  generateTable,
  generateNewColumnForTable,
} from "../../../config/internal-api/fixtures/table"
import generateViewName from "../../../config/internal-api/fixtures/views"

describe("Internal API - Table Operations", () => {
  const api = new InternalAPIClient()
  const accountsAPI = new AccountsAPIClient()
  const config = new TestConfiguration<Application>(api, accountsAPI)

  beforeAll(async () => {
    await config.setupAccountAndTenant()
  })

  afterAll(async () => {
    await config.afterAll()
  })

  async function createAppFromTemplate() {
    return config.applications.create({
      name: generator.word(),
      url: `/${generator.word()}`,
      useTemplate: "true",
      templateName: "Near Miss Register",
      templateKey: "app/near-miss-register",
      templateFile: undefined,
    })
  }

  it("Create and delete table, columns and rows", async () => {
    // create the app
    const appName = generator.word()
    const app = await createAppFromTemplate()
    config.applications.api.appId = app.appId

    // Get current tables: expect 2 in this template
    await config.tables.getAll(2)

    // Add new table
    const [createdTableResponse, createdTableData] = await config.tables.save(
      generateTable()
    )

    //Table was added
    await config.tables.getAll(3)

    //Get information about the table
    await config.tables.getTableById(<string>createdTableData._id)

    //Add Column to table
    const newColumn = generateNewColumnForTable(createdTableData)
    const [addColumnResponse, addColumnData] = await config.tables.save(
      newColumn,
      true
    )

    //Add view to table
    const viewName = generateViewName()
    const viewCreateResponse = config.views.create(
      <string>viewName,
      <string>createdTableData._id
    )

    //Delete view from table
    const viewDeleteResponse = config.views.delete(<string>viewName)
  })
})
