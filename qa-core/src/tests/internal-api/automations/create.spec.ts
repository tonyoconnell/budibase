import TestConfiguration from "../../../config/internal-api/TestConfiguration"
import { Application } from "@budibase/server/api/controllers/public/mapping/types"
import InternalAPIClient from "../../../config/internal-api/TestConfiguration/InternalAPIClient"
import AccountsAPIClient from "../../../config/internal-api/TestConfiguration/accountsAPIClient"
import { generateApp } from "../../../config/internal-api/fixtures/applications"
import { generateAutomation } from "../../../config/internal-api/fixtures/automations"

describe("Internal API - Create Automations", () => {
    const api = new InternalAPIClient()
    const accountsAPI = new AccountsAPIClient()
    const config = new TestConfiguration<Application>(api, accountsAPI)

    beforeAll(async () => {
        await config.setupAccountAndTenant()
    })

    afterAll(async () => {
        await config.afterAll()
    })

    it("Get application details", async () => {
        const app = await config.applications.create({
            ...generateApp(),
            useTemplate: false,
        })
        config.applications.api.appId = app.appId

        const automation = generateAutomation()
        const [automationResponse, automationJson] = await config.automations.create(automation)

    })



})
