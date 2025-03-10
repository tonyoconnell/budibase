<script>
  import { datasources, tables, integrations } from "stores/backend"
  import EditRolesButton from "./buttons/EditRolesButton.svelte"
  import { TableNames } from "constants"
  import { Grid } from "@budibase/frontend-core"
  import { API } from "api"
  import GridAddColumnModal from "components/backend/DataTable/modals/grid/GridCreateColumnModal.svelte"
  import GridCreateEditRowModal from "components/backend/DataTable/modals/grid/GridCreateEditRowModal.svelte"
  import GridEditUserModal from "components/backend/DataTable/modals/grid/GridEditUserModal.svelte"
  import GridCreateViewButton from "components/backend/DataTable/buttons/grid/GridCreateViewButton.svelte"
  import GridImportButton from "components/backend/DataTable/buttons/grid/GridImportButton.svelte"
  import GridExportButton from "components/backend/DataTable/buttons/grid/GridExportButton.svelte"
  import GridFilterButton from "components/backend/DataTable/buttons/grid/GridFilterButton.svelte"
  import GridManageAccessButton from "components/backend/DataTable/buttons/grid/GridManageAccessButton.svelte"
  import GridRelationshipButton from "components/backend/DataTable/buttons/grid/GridRelationshipButton.svelte"
  import GridEditColumnModal from "components/backend/DataTable/modals/grid/GridEditColumnModal.svelte"

  const userSchemaOverrides = {
    firstName: { displayName: "First name", disabled: true },
    lastName: { displayName: "Last name", disabled: true },
    email: { displayName: "Email", disabled: true },
    roleId: { displayName: "Role", disabled: true },
    status: { displayName: "Status", disabled: true },
  }

  $: id = $tables.selected?._id
  $: isUsersTable = id === TableNames.USERS
  $: isInternal = $tables.selected?.type !== "external"

  $: datasource = $datasources.list.find(datasource => {
    return datasource._id === $tables.selected?.sourceId
  })

  $: relationshipsEnabled = relationshipSupport(datasource)

  const relationshipSupport = datasource => {
    const integration = $integrations[datasource?.source]
    return !isInternal && integration?.relationships !== false
  }

  const handleGridTableUpdate = async e => {
    tables.replaceTable(id, e.detail)

    // We need to refresh datasources when an external table changes.
    // Type "external" may exist - sometimes type is "table" and sometimes it
    // is "external" - it has different meanings in different endpoints.
    // If we check both these then we hopefully catch all external tables.
    if (e.detail?.type === "external" || e.detail?.sql) {
      await datasources.fetch()
    }
  }
</script>

<div class="wrapper">
  <Grid
    {API}
    tableId={id}
    allowAddRows={!isUsersTable}
    allowDeleteRows={!isUsersTable}
    schemaOverrides={isUsersTable ? userSchemaOverrides : null}
    showAvatars={false}
    on:updatetable={handleGridTableUpdate}
  >
    <svelte:fragment slot="filter">
      <GridFilterButton />
    </svelte:fragment>
    <svelte:fragment slot="controls">
      {#if isInternal}
        <GridCreateViewButton />
      {/if}
      <GridManageAccessButton />
      {#if relationshipsEnabled}
        <GridRelationshipButton />
      {/if}
      {#if isUsersTable}
        <EditRolesButton />
      {:else}
        <GridImportButton />
      {/if}
      <GridExportButton />
      <GridAddColumnModal />
      <GridEditColumnModal />
      {#if isUsersTable}
        <GridEditUserModal />
      {:else}
        <GridCreateEditRowModal />
      {/if}
    </svelte:fragment>
  </Grid>
</div>

<style>
  .wrapper {
    flex: 1 1 auto;
    margin: -28px -40px -40px -40px;
    display: flex;
    flex-direction: column;
    background: var(--background);
    overflow: hidden;
  }
</style>
