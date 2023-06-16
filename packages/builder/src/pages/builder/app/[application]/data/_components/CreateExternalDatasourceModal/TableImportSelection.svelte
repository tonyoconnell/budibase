<script>
  import {
    Body,
    FancyCheckboxGroup,
    InlineAlert,
    Layout,
    ModalContent,
  } from "@budibase/bbui"
  import { IntegrationTypes } from "constants/backend"

  export let isLoading
  export let integration
  export let tableNames
  export let selectedTableNames
  export let onComplete
  export let error

  $: tableType =
    integration.name === IntegrationTypes.GOOGLE_SHEETS ? "sheets" : "tables"
  $: title = `Choose your ${tableType}`
  $: confirmText =
    selectedTableNames.length > 0
      ? `Fetch ${tableType}`
      : "Continue without fetching"
  $: description =
    integration.name === IntegrationTypes.GOOGLE_SHEETS
      ? "Select which spreadsheets you want to connect."
      : "Choose what tables you want to sync with Budibase"
  $: selectAllText =
    integration.name === IntegrationTypes.GOOGLE_SHEETS
      ? "Select all sheets"
      : "Select all"
</script>

<ModalContent
  {title}
  cancelText="Cancel"
  size="L"
  {confirmText}
  onConfirm={onComplete}
  disabled={isLoading}
>
  <Layout noPadding no>
    <Body size="S">{description}</Body>

    <FancyCheckboxGroup
      options={tableNames}
      bind:selected={selectedTableNames}
      {selectAllText}
    />
    {#if error}
      <InlineAlert
        type="error"
        header={error.title}
        message={error.description}
      />
    {/if}
  </Layout>
</ModalContent>
