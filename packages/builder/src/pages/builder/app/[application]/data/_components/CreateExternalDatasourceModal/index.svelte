<script>
  import { Modal } from "@budibase/bbui"
  import { goto } from "@roxi/routify"
  import { IntegrationTypes } from "constants/backend"
  import GoogleAuthPrompt from "./GoogleAuthPrompt.svelte"
  import { fieldsFromIntegration } from "stores/selectors"

  import TableImportSelection from "./TableImportSelection.svelte"
  import DatasourceFieldsEditor from "./DatasourceFieldsEditor.svelte"
  import { createOnGoogleAuthStore } from "./stores/onGoogleAuth.js"
  import { createDatasourceCreationStore } from "./stores/datasourceCreation.js"

  export let loading = false
  const store = createDatasourceCreationStore()
  const onGoogleAuth = createOnGoogleAuthStore()
  let modal

  const handleStoreChanges = (store, modal, goto) => {
    store.stage === null ? modal?.hide() : modal?.show()

    // Only set the parent loading state whenever the modal is hidden (like during REST datasource creation),
    // the interactable elements of the parent will be unclickable when the modal is visible.
    loading = store.isLoading && store.stage === null

    if (store.isFinished) {
      goto(`./datasource/${store.datasource._id}`)
    }
  }

  $: handleStoreChanges($store, modal, $goto)

  export function show(integration) {
    if (integration.name === IntegrationTypes.REST) {
      // A REST integration is created immediately, we don't need to display a config modal.
      store.setData({ integration, fields: fieldsFromIntegration(integration) })
      store.createDatasource()
    } else if (integration.name === IntegrationTypes.GOOGLE_SHEETS) {
      // This prompt redirects users to the Google OAuth flow, they'll be returned to this modal afterwards
      // with query params populated that trigger the `onGoogleAuth` store.
      store.googleAuthStage()
    } else {
      // All other integrations can generate fields from data in the integration object.
      store.setData({ integration, fields: fieldsFromIntegration(integration) })
      store.editFieldsStage()
    }
  }

  // Triggers opening the fields editor whenever Google OAuth returns the user to the page
  $: $onGoogleAuth((integration, fields) => {
    store.setData({ integration, fields })
    store.editFieldsStage()
  })
</script>

<Modal on:hide={store.cancel} bind:this={modal}>
  {#if $store.stage === "googleAuth"}
    <GoogleAuthPrompt />
  {:else if $store.stage === "editFields"}
    <DatasourceFieldsEditor
      isLoading={$store.isLoading}
      integration={$store.integration}
      bind:fields={$store.fields}
      onComplete={store.createDatasource}
    />
  {:else if $store.stage === "selectTables"}
    <TableImportSelection
      error={$store.tableImportError}
      isLoading={$store.isLoading}
      integration={$store.integration}
      datasource={$store.datasource}
      tableNames={$store.tableNames}
      bind:selectedTableNames={$store.selectedTableNames}
      onComplete={store.importSelectedTables}
    />
  {/if}
</Modal>
