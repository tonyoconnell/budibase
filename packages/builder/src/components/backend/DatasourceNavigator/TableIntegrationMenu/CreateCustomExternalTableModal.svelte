<script>
  import {
    ModalContent,
    Body,
    Input,
    notifications,
    Select,
  } from "@budibase/bbui"
  import { tables, datasources } from "stores/backend"
  import { goto } from "@roxi/routify"

  export let datasource
  export let queryList = []

  $: console.log("Queries ", queryList)

  let name = ""
  let readQuery, idFieldName
  let submitted = false
  $: valid =
    name &&
    name.length > 0 &&
    !datasource?.entities?.[name] &&
    readQuery &&
    idFieldName
  $: error =
    !submitted && name && datasource?.entities?.[name]
      ? "Table name already in use."
      : null
  $: readQueryOptions = queryList
    .filter(query => query.readable)
    .map(query => ({
      label: query.name,
      value: query,
    }))

  function buildDefaultTable(tableName, datasourceId) {
    return {
      name: tableName,
      type: "external",
      primary: ["id"],
      sourceId: datasourceId,
      schema: {
        id: {
          autocolumn: true,
          type: "number",
        },
      },
    }
  }

  async function saveTable() {
    try {
      submitted = true
      const table = await tables.save(buildDefaultTable(name, datasource._id))
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
  <Body>Provide the details for your new table.</Body>
  <Input label="Table Name" bind:error bind:value={name} />
  <Select
    bind:value={readQuery}
    secondary
    extraThin
    label="READ Query"
    options={readQueryOptions}
  />
  <Select
    bind:value={idFieldName}
    disabled={!readQuery}
    secondary
    extraThin
    label="ID Field"
    options={Object.keys(readQuery?.schema ?? {})}
  />
</ModalContent>
