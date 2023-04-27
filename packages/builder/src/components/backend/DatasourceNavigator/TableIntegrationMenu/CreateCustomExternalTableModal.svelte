<script>
  import {
    ModalContent,
    Body,
    Input,
    notifications,
    Select,
    Divider,
  } from "@budibase/bbui"
  import { tables, datasources } from "stores/backend"
  import { goto } from "@roxi/routify"

  export let datasource
  export let queryList = []
  let queries = {}

  let name = ""
  let idField
  let submitted = false
  $: valid =
    name &&
    name.length > 0 &&
    !datasource?.entities?.[name] &&
    queries.read &&
    idField
  $: error =
    !submitted && name && datasource?.entities?.[name]
      ? "Table name already in use."
      : null

  $: createQueryOptions = queryList
    .filter(query => query.queryVerb === "create")
    .map(query => ({
      label: query.name,
      value: query,
    }))
  $: readQueryOptions = queryList
    .filter(query => query.readable || query.queryVerb === "read")
    .map(query => ({
      label: query.name,
      value: query,
    }))
  $: updateQueryOptions = queryList
    .filter(query => query.queryVerb === "update")
    .map(query => ({
      label: query.name,
      value: query,
    }))
  $: deleteQueryOptions = queryList
    .filter(query => query.queryVerb === "delete")
    .map(query => ({
      label: query.name,
      value: query,
    }))

  function buildTable(tableName, datasourceId) {
    return {
      name: tableName,
      type: "external",
      primary: [`${idField}`],
      sourceId: datasourceId,
      schema: queries.read.schema,
      queries,
    }
  }

  async function saveTable() {
    try {
      submitted = true
      const table = await tables.save(buildTable(name, datasource._id))
      await datasources.fetch()
      $goto(`../../table/${table._id}`)
    } catch (error) {
      notifications.error(
        `Error saving table - ${error?.message || "unknown error"}`
      )
    }
  }
</script>

<ModalContent
  title="Create new custom table"
  confirmText="Create"
  onConfirm={saveTable}
  disabled={!valid}
>
  <Body>Select the queries for your new table.</Body>
  <Input label="Table Name *" bind:error bind:value={name} />
  <Select
    bind:value={queries.read}
    secondary
    extraThin
    label="READ Query *"
    options={readQueryOptions}
  />
  <Select
    bind:value={idField}
    disabled={!queries.read}
    secondary
    extraThin
    label="ID Field *"
    options={Object.keys(queries.read?.schema ?? {})}
  />
  <Divider noGrid={true} />
  <Select
    bind:value={queries.create}
    disabled={!queries.read || !idField}
    secondary
    extraThin
    label="CREATE Query"
    options={createQueryOptions}
  />
  <Select
    bind:value={queries.update}
    disabled={!queries.read || !idField}
    secondary
    extraThin
    label="UPDATE Query"
    options={updateQueryOptions}
  />
  <Select
    bind:value={queries.delete}
    disabled={!queries.read || !idField}
    secondary
    extraThin
    label="DELETE Query"
    options={deleteQueryOptions}
  />
</ModalContent>
