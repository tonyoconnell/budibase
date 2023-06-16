import { get, writable } from "svelte/store"
import { datasources, ImportTableError } from "stores/backend"
import { shouldIntegrationFetchTableNames } from "stores/selectors"
import { notifications } from "@budibase/bbui"

export const defaultStore = {
  isLoading: false,
  isFinished: false,
  stage: null,
  integration: null,
  fields: null,
  datasource: null,
  tableNames: [],
  selectedTableNames: [],
  tableImportError: null,
}

export const createDatasourceCreationStore = () => {
  const store = writable(defaultStore)

  store.setTableImportError = tableImportError => {
    store.update($store => ({ ...$store, tableImportError }))
  }

  store.setLoading = isLoading => {
    store.update($store => ({ ...$store, isLoading }))
  }

  store.cancel = () => {
    const $store = get(store)
    // If the datasource has already been created, mark the store as finished.
    if ($store.datasource) {
      store.markAsFinished()
    } else {
      store.set(defaultStore)
    }
  }

  // Used only by Google Sheets
  store.googleAuthStage = () => {
    store.update($store => ({
      ...$store,
      stage: "googleAuth",
    }))
  }

  store.setData = ({ integration, fields }) => {
    store.update($store => ({
      ...$store,
      integration,
      fields,
    }))
  }

  // Used for every flow but REST
  store.editFieldsStage = () => {
    store.update($store => ({
      ...$store,
      stage: "editFields",
    }))
  }

  store.createDatasource = async () => {
    store.setLoading(true)

    try {
      const $store = get(store)
      const datasource = await datasources.create({
        integration: $store.integration,
        fields: $store.fields,
      })

      if (shouldIntegrationFetchTableNames($store.integration)) {
        const tableNames = await datasources.getTableNames(datasource)
        store.update($store => ({ ...$store, datasource, tableNames }))
        store.selectTablesStage()
      } else {
        store.update($store => ({ ...$store, datasource }))
        store.markAsFinished()
      }

      notifications.success(`Datasource created successfully.`)
    } catch (err) {
      notifications.error("Error creating datasource.")
    }

    store.setLoading(false)

    // prevent the modal from closing
    return false
  }

  // Only used for datasource plus
  store.selectTablesStage = () => {
    store.update($store => ({
      ...$store,
      stage: "selectTables",
    }))
  }

  // Only used for datasource plus
  store.importSelectedTables = async () => {
    store.setLoading(true)
    store.setTableImportError(null)

    try {
      const $store = get(store)
      await datasources.updateSchema(
        $store.datasource,
        $store.selectedTableNames
      )

      notifications.success(`Tables fetched successfully.`)
      store.markAsFinished()
    } catch (err) {
      if (err instanceof ImportTableError) {
        store.setTableImportError(err)
      } else {
        notifications.error("Error fetching tables.")
      }
    }

    store.setLoading(false)

    // prevent the modal from closing
    return false
  }

  store.markAsFinished = () => {
    store.update($store => ({
      ...$store,
      isFinished: true,
    }))
  }

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: store.update,
    cancel: store.cancel,
    googleAuthStage: store.googleAuthStage,
    setData: store.setData,
    editFieldsStage: store.editFieldsStage,
    createDatasource: store.createDatasource,
    importSelectedTables: store.importSelectedTables,
  }
}
