<script>
  import { Button, Table, notifications } from "@budibase/bbui"
  import CreateEditRelationshipModal from "components/backend/Datasources/CreateEditRelationshipModal.svelte"
  import {
    tables as tablesStore,
    integrations as integrationsStore,
    datasources as datasourcesStore,
  } from "stores/backend"
  import { DatasourceFeature } from "@budibase/types"
  import { API } from "api"
  import Panel from "./Panel.svelte"
  import Tooltip from "./Tooltip.svelte"

  export let datasource

  let modal

  $: tables = Object.values(datasource.entities)
  $: relationships = getRelationships(tables)

  function getRelationships(tables) {
    const relatedColumns = {}

    tables.forEach(({ name: tableName, schema }) => {
      Object.values(schema).forEach(column => {
        if (column.type !== "link") return

        relatedColumns[column._id] ??= {}
        relatedColumns[column._id].through =
          relatedColumns[column._id].through || column.through

        relatedColumns[column._id][column.main ? "from" : "to"] = {
          ...column,
          tableName,
        }
      })
    })

    return Object.values(relatedColumns).map(({ from, to, through }) => {
      return {
        tables: `${from.tableName} ${through ? "↔" : "→"} ${to.tableName}`,
        columns: `${from.name} to ${to.name}`,
        from,
        to,
      }
    })
  }

  const handleRowClick = ({ detail }) => {
    modal.show({ fromRelationship: detail.from, toRelationship: detail.to })
  }

  const beforeSave = async ({ datasource }) => {
    const integration = $integrationsStore[datasource.source]
    if (!integration.features[DatasourceFeature.CONNECTION_CHECKING]) return

    const { connected } = await API.validateDatasource(datasource)

    if (!connected) {
      throw "Invalid connection"
    }
  }

  const afterSave = async ({ action }) => {
    await tablesStore.fetch()
    await datasourcesStore.fetch()
    notifications.success(`Relationship ${action} successfully`)
  }

  const onError = async ({ action, err }) => {
    let notificationVerb = "creating"

    if (action === "updated") {
      notificationVerb = "updating"
    } else if (action === "deleted") {
      notificationVerb = "deleting"
    }
    notifications.error(`Error ${notificationVerb} datasource: ${err}`)
  }
</script>

<CreateEditRelationshipModal
  bind:this={modal}
  {datasource}
  {beforeSave}
  {afterSave}
  {onError}
  {tables}
/>

<Panel>
  <Button slot="controls" cta on:click={modal.show}>
    Define relationships
  </Button>
  <Tooltip
    slot="tooltip"
    title="Relationships"
    href="https://docs.budibase.com/docs/relationships"
  />
  <Table
    on:click={handleRowClick}
    schema={{ tables: {}, columns: {} }}
    data={relationships}
    allowEditColumns={false}
    allowEditRows={false}
    allowSelectRows={false}
  />
</Panel>
