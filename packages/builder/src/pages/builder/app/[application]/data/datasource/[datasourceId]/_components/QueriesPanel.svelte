<script>
  import { goto } from "@roxi/routify"
  import {
    Button,
    Table,
  } from "@budibase/bbui"
  import { queries } from "stores/backend"
  import CapitaliseRenderer from "components/common/renderers/CapitaliseRenderer.svelte"
  import RestImportButton from './rest/ImportButton.svelte'

  export let datasource

  $: queryList = $queries.list.filter(
    query => query.datasourceId === datasource._id
  )

  const querySchema = {
    name: {},
    queryVerb: { displayName: "Method" },
  }
</script>

<div class="header">
<Button
  cta
  on:click={() => $goto(`../../query/new/${datasource._id}`)}
>
  Create new query
</Button>
{#if datasource.source === "REST"}
  <RestImportButton datasourceId={datasource._id} />
{/if}
</div>
<Table
  on:click={({ detail }) => $goto(`../../query/${detail._id}`)}
  schema={{
    name: {},
    queryVerb: { displayName: "Method" },
  }}
  data={queryList}
  allowEditColumns={false}
  allowEditRows={false}
  allowSelectRows={false}
  customRenderers={[
    { column: "queryVerb", component: CapitaliseRenderer },
  ]}
/>

<style>
  .header {
    display: flex;
  }
</style>
