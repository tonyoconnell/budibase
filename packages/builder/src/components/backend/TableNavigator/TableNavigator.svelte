<script>
  import { tables, views, database } from "stores/backend"
  import { TableNames } from "constants"
  import EditTablePopover from "./popovers/EditTablePopover.svelte"
  import EditViewPopover from "./popovers/EditViewPopover.svelte"
  import NavItem from "components/common/NavItem.svelte"
  import { goto, isActive } from "@roxi/routify"
  import { userSelectedResourceMap } from "builderStore"

  const alphabetical = (a, b) =>
    a.name?.toLowerCase() > b.name?.toLowerCase() ? 1 : -1

  export let sourceId
  export let selectTable

  $: sortedTables = $tables.list
    .filter(
      table => table.sourceId === sourceId && table._id !== TableNames.USERS
    )
    .sort(alphabetical)
</script>

{#if $database?._id}
  <div class="hierarchy-items-container">
    {#each sortedTables as table, idx}
      <NavItem
        indentLevel={1}
        border={idx > 0}
        icon={table._id === TableNames.USERS ? "UserGroup" : "Table"}
        text={table.name}
        selected={$isActive("./table/:tableId") &&
          $tables.selected?._id === table._id}
        on:click={() => selectTable(table._id)}
        selectedBy={$userSelectedResourceMap[table._id]}
      >
        {#if table._id !== TableNames.USERS}
          <EditTablePopover {table} />
        {/if}
      </NavItem>
      {#each [...Object.keys(table.views || {})].sort() as viewName, idx (idx)}
        <NavItem
          indentLevel={2}
          icon="Remove"
          text={viewName}
          selected={$isActive("./view") && $views.selected?.name === viewName}
          on:click={() => $goto(`./view/${encodeURIComponent(viewName)}`)}
          selectedBy={$userSelectedResourceMap[viewName]}
        >
          <EditViewPopover
            view={{ name: viewName, ...table.views[viewName] }}
          />
        </NavItem>
      {/each}
    {/each}
  </div>
{/if}
