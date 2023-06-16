import { it, expect, describe, beforeEach, vi } from "vitest"
import {
  defaultStore,
  createDatasourceCreationStore,
} from "./datasourceCreation"
import { get } from "svelte/store"
import { notifications } from "@budibase/bbui"
// eslint-disable-next-line no-unused-vars
import { datasources, ImportTableError } from "stores/backend"
import { shouldIntegrationFetchTableNames } from "stores/selectors"

vi.mock("stores/backend", () => ({
  ImportTableError: vi.fn(),
  datasources: {
    create: vi.fn(),
    getTableNames: vi.fn(),
    updateSchema: vi.fn(),
  },
}))

vi.mock("stores/selectors", () => ({
  shouldIntegrationFetchTableNames: vi.fn(),
}))

vi.mock("@budibase/bbui", () => ({
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

class ImportTableErrorMock extends Error {}

describe("datasource creation store", () => {
  beforeEach(ctx => {
    vi.clearAllMocks()
    // eslint-disable-next-line no-import-assign
    ImportTableError = ImportTableErrorMock
    ctx.store = createDatasourceCreationStore()

    ctx.integration = { data: "integration" }
    ctx.fields = { data: "fields" }
    ctx.datasource = { data: "datasource" }
    ctx.tableNames = ["one", "two"]
    ctx.selectedTableNames = ["one"]
  })

  describe("store creation", () => {
    it("returns the default values", ctx => {
      expect(get(ctx.store)).toEqual(defaultStore)
    })
  })

  describe("cancel", () => {
    describe("when a datasource has already been created", () => {
      beforeEach(ctx => {
        ctx.store.update($store => ({ ...$store, datasource: ctx.datasource }))
        ctx.store.cancel()
      })

      it("marks the store as finished", ctx => {
        expect(get(ctx.store)).toEqual({
          ...defaultStore,
          isFinished: true,
          datasource: ctx.datasource,
        })
      })
    })

    describe("when a datasource hasn't been created yet", () => {
      beforeEach(ctx => {
        ctx.store.cancel()
      })

      it("resets to the default values", ctx => {
        expect(get(ctx.store)).toEqual(defaultStore)
      })
    })
  })

  describe("googleAuthStage", () => {
    beforeEach(ctx => {
      ctx.store.googleAuthStage()
    })

    it("marks the store as finished", ctx => {
      expect(get(ctx.store)).toEqual({ ...defaultStore, stage: "googleAuth" })
    })
  })

  describe("setData", () => {
    beforeEach(ctx => {
      ctx.store.setData({ integration: ctx.integration, fields: ctx.fields })
    })

    it("marks the store as finished", ctx => {
      expect(get(ctx.store)).toEqual({
        ...defaultStore,
        integration: ctx.integration,
        fields: ctx.fields,
      })
    })
  })

  describe("editFieldsStage", () => {
    beforeEach(ctx => {
      ctx.store.editFieldsStage()
    })

    it("marks the store as finished", ctx => {
      expect(get(ctx.store)).toEqual({ ...defaultStore, stage: "editFields" })
    })
  })

  describe("createDatasource", () => {
    beforeEach(ctx => {
      ctx.store.update($store => ({
        ...$store,
        integration: ctx.integration,
        fields: ctx.fields,
      }))

      ctx.resolveDatasourceCreateMock = null
      ctx.rejectDatasourceCreateMock = null

      datasources.create.mockReturnValue(
        new Promise((resolve, reject) => {
          ctx.resolveDatasourceCreateMock = () => resolve(ctx.datasource)
          ctx.rejectDatasourceCreateMock = () => reject()
        })
      )

      datasources.getTableNames.mockResolvedValue(ctx.tableNames)
      ctx.returnedPromise = ctx.store.createDatasource()
    })

    describe("integration that fetches tables", () => {
      beforeEach(() => {
        shouldIntegrationFetchTableNames.mockReturnValue(true)
      })

      it("handles loading states and sets the stage to selectTables", async ctx => {
        expect(get(ctx.store).isLoading).toEqual(true)

        ctx.resolveDatasourceCreateMock()

        expect(await ctx.returnedPromise).toBe(false)
        expect(notifications.success).toHaveBeenCalledTimes(1)
        expect(get(ctx.store)).toEqual({
          ...defaultStore,
          integration: ctx.integration,
          fields: ctx.fields,
          datasource: ctx.datasource,
          tableNames: ctx.tableNames,
          stage: "selectTables",
        })
      })
    })

    describe("integration that doesn't fetch tables", () => {
      beforeEach(() => {
        shouldIntegrationFetchTableNames.mockReturnValue(false)
      })

      it("handles loading states and marks the store as finished", async ctx => {
        expect(get(ctx.store).isLoading).toEqual(true)

        ctx.resolveDatasourceCreateMock()

        expect(await ctx.returnedPromise).toBe(false)
        expect(notifications.success).toHaveBeenCalledTimes(1)
        expect(get(ctx.store)).toEqual({
          ...defaultStore,
          integration: ctx.integration,
          fields: ctx.fields,
          datasource: ctx.datasource,
          isFinished: true,
        })
      })
    })

    describe("error", () => {
      it("handles loading states and displays an error message", async ctx => {
        expect(get(ctx.store).isLoading).toEqual(true)

        ctx.rejectDatasourceCreateMock()

        expect(await ctx.returnedPromise).toBe(false)
        expect(notifications.error).toHaveBeenCalledTimes(1)
        expect(get(ctx.store)).toEqual({
          ...defaultStore,
          integration: ctx.integration,
          fields: ctx.fields,
        })
      })
    })
  })

  describe("importSelectedTables", () => {
    beforeEach(ctx => {
      ctx.store.update($store => ({
        ...$store,
        datasource: ctx.datasource,
        selectedTableNames: ctx.selectedTableNames,
      }))

      ctx.resolveUpdateSchemaMock = null
      ctx.rejectUpdateSchemaMock = null
      ctx.tableImportError = new ImportTableErrorMock("error")

      datasources.updateSchema.mockReturnValue(
        new Promise((resolve, reject) => {
          ctx.resolveUpdateSchemaMock = () => resolve()
          ctx.rejectUpdateSchemaMock = () => reject(ctx.tableImportError)
        })
      )

      ctx.returnedPromise = ctx.store.importSelectedTables()
    })

    describe("success", () => {
      it("handles loading states and marks the store as finished", async ctx => {
        expect(get(ctx.store).isLoading).toEqual(true)
        expect(get(ctx.store).tableImportError).toEqual(null)

        ctx.resolveUpdateSchemaMock()

        expect(await ctx.returnedPromise).toBe(false)
        expect(notifications.success).toHaveBeenCalledTimes(1)
        expect(get(ctx.store)).toEqual({
          ...defaultStore,
          datasource: ctx.datasource,
          selectedTableNames: ctx.selectedTableNames,
          isFinished: true,
        })
      })
    })

    describe("error", () => {
      it("handles loading states and sets an error", async ctx => {
        expect(get(ctx.store).isLoading).toEqual(true)
        expect(get(ctx.store).tableImportError).toEqual(null)

        ctx.rejectUpdateSchemaMock()

        expect(await ctx.returnedPromise).toBe(false)
        expect(get(ctx.store)).toEqual({
          ...defaultStore,
          datasource: ctx.datasource,
          selectedTableNames: ctx.selectedTableNames,
          tableImportError: ctx.tableImportError,
        })
      })
    })
  })
})
