<script>
  import {
    Heading,
    Body,
    Divider,
    InlineAlert,
    Button,
    notifications,
    Modal,
    Table,
    Toggle,
  } from "@budibase/bbui"
  import { datasources, integrations, tables } from "stores/backend"
  import CreateEditRelationship from "components/backend/Datasources/CreateEditRelationship.svelte"
  import CreateExternalTableModal from "./CreateExternalTableModal.svelte"
  import ArrayRenderer from "components/common/renderers/ArrayRenderer.svelte"
  import ConfirmDialog from "components/common/ConfirmDialog.svelte"
  import { goto } from "@roxi/routify"
  import ValuesList from "components/common/ValuesList.svelte"

  export let datasource
  export let save

  let tableSchema = {
    name: {},
    primary: { displayName: "Primary Key" },
  }
  let relationshipSchema = {
    tables: {},
    columns: {},
  }
  let createExternalTableModal
  let selectedFromRelationship, selectedToRelationship
  let confirmDialog
  let specificTables = null
  let requireSpecificTables = false

  async function updateDatasourceSchema() {
    try {
      await datasources.updateSchema(datasource, specificTables)
      notifications.success(`Datasource ${name} tables updated successfully.`)
      await tables.fetch()
    } catch (error) {
      notifications.error(
        `Error updating datasource schema ${
          error?.message ? `: ${error.message}` : ""
        }`
      )
    }
  }

  function openRelationshipModal(fromRelationship, toRelationship) {
    selectedFromRelationship = fromRelationship || {}
    selectedToRelationship = toRelationship || {}
    relationshipModal.show()
  }

  function createNewTable() {
    createExternalTableModal.show()
  }
</script>

<Modal bind:this={createExternalTableModal}>
  <CreateExternalTableModal {datasource} />
</Modal>

<ConfirmDialog
  bind:this={confirmDialog}
  okText="Fetch tables"
  onOk={updateDatasourceSchema}
  onCancel={() => confirmDialog.hide()}
  warning={false}
  title="Confirm table fetch"
>
  <Toggle
    bind:value={requireSpecificTables}
    on:change={e => {
      requireSpecificTables = e.detail
      specificTables = null
    }}
    thin
    text="Fetch listed tables only (one per line)"
  />
  {#if requireSpecificTables}
    <ValuesList label="" bind:values={specificTables} />
  {/if}
  <br />
  <Body>
    If you have fetched tables from this database before, this action may
    overwrite any changes you made after your initial fetch.
  </Body>
</ConfirmDialog>

<Button secondary on:click={confirmDialog.show}>
  Fetch tables
</Button>
<Button cta icon="Add" on:click={createExternalTableModal.show}>New table</Button>

<style>
  .query-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 0 0 var(--spacing-s) 0;
  }

  .table-buttons {
    display: flex;
    gap: var(--spacing-m);
  }
</style>
