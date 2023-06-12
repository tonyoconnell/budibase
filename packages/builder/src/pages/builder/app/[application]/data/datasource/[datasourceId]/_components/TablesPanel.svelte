<script>
  import { goto } from "@roxi/routify"
  import {
    Button,
    Table,
  } from "@budibase/bbui"
  import { queries } from "stores/backend"
  import CapitaliseRenderer from "components/common/renderers/CapitaliseRenderer.svelte"
  import ArrayRenderer from "components/common/renderers/ArrayRenderer.svelte"
  import PlusQueriesButtons from './PlusQueriesButtons.svelte'

  export let datasource

  let tableSchema = {
    name: {},
    primary: { displayName: "Primary Key" },
  }

</script>

<div class="header">
  <PlusQueriesButtons {datasource} />
</div>
  <Table
    on:click={({ detail: table }) => $goto(`../../table/${table._id}`)}
    schema={tableSchema}
    data={Object.values(datasource.entities)}
    allowEditColumns={false}
    allowEditRows={false}
    allowSelectRows={false}
    customRenderers={[{ column: "primary", component: ArrayRenderer }]}
  />

<style>
  .header {
    display: flex;
  }
</style>
