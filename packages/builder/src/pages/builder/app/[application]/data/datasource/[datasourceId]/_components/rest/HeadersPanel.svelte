<script>
  import {
    Divider,
    Heading,
    ActionButton,
    Badge,
    Body,
    Layout,
  } from "@budibase/bbui"
  import KeyValueBuilder from "components/integration/KeyValueBuilder.svelte"
  import RestAuthenticationBuilder from "./auth/RestAuthenticationBuilder.svelte"
  import ViewDynamicVariables from "./variables/ViewDynamicVariables.svelte"
  import {
    getRestBindings,
    getEnvironmentBindings,
    readableToRuntimeBinding,
    runtimeToReadableMap,
  } from "builderStore/dataBinding"
  import { cloneDeep } from "lodash/fp"
  import { datasources } from "stores/backend"
  import { findDatasource } from "stores/selectors"

  export let datasourceId
  let restBindings = getRestBindings()
  $: datasource = findDatasource($datasources, datasourceId)

  $: {
    console.log('foo')
    console.log(datasource)
  }

  let addHeader

  $: parsedHeaders = runtimeToReadableMap(restBindings, datasource?.config?.defaultHeaders))

  const onDefaultHeaderUpdate = headers => {
    const flatHeaders = cloneDeep(headers).reduce((acc, entry) => {
      acc[entry.name] = readableToRuntimeBinding(restBindings, entry.value)
      return acc
    }, {})

    datasource.config.defaultHeaders = flatHeaders
  }
</script>

<KeyValueBuilder
  bind:this={addHeader}
  bind:object={parsedHeaders}
  on:change={evt => onDefaultHeaderUpdate(evt.detail)}
  noAddButton
  bindings={restBindings}
/>
<div>
  <ActionButton icon="Add" on:click={() => addHeader.addEntry()}>
    Add header
  </ActionButton>
</div>

<style>
  .section-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .badge {
    display: flex;
    gap: var(--spacing-m);
  }
</style>
