import { Response } from "node-fetch"
import { View } from "@budibase/types"
import InternalAPIClient from "./InternalAPIClient"

export default class ViewsApi {
  api: InternalAPIClient
  constructor(apiClient: InternalAPIClient) {
    this.api = apiClient
  }

  async get(viewName: string): Promise<[Response, View[]]> {
    const response = await this.api.get(`/views/${viewName}/`)
    const json = await response.json()
    expect(response).toHaveStatusCode(200)
    return [response, json]
  }
  async create(viewName: string, tableId: string): Promise<Response> {
    const body = {
      name: viewName,
      tableId: tableId,
    }
    const response = await this.api.post(`/views`, { body })
    expect(response).toHaveStatusCode(200)
    return response
  }

  async update(body: any): Promise<Response> {
    const response = await this.api.post(`/views`, { body })
    expect(response).toHaveStatusCode(200)
    return response
  }

  async delete(viewName: string): Promise<Response> {
    const response = await this.api.del(`/views/${viewName}`)
    const json = await response.json()
    expect(response).toHaveStatusCode(200)
    return response
  }
}
