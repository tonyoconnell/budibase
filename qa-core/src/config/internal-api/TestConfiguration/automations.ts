import { Automation } from "@budibase/types"
import { Response } from "node-fetch"
import InternalAPIClient from "./InternalAPIClient"
import { AutomationsDelResponse, AutomationsResponse } from "../fixtures/types/automations"

export default class AutomationsAPI {
    api: InternalAPIClient

    constructor(apiClient: InternalAPIClient) {
        this.api = apiClient
    }

    async create(body: any): Promise<[Response, AutomationsResponse]> {
        const response = await this.api.post(`/automations`, { body })
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.message).toEqual("Automation created successfully")
        expect(json.automation._id).toBeDefined()
        return [response, json]
    }

    async update(body: Partial<Automation>): Promise<[Response, AutomationsResponse]> {
        const response = await this.api.put(`/automations`, { body })
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        expect(json.message).toEqual(`Automation ${body._id} updated successfully.`)
        expect(json.automation._id).toBeDefined()
        return [response, json]
    }

    async delete(automationId: string, rev: string): Promise<[Response, AutomationsDelResponse]> {
        const response = await this.api.del(`/automations/${automationId}/${rev}`)
        const json = await response.json()
        expect(response).toHaveStatusCode(200)
        return [response, json]
    }
}
