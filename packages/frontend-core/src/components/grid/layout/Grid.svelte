<script>
  import { setContext, onMount } from "svelte"
  import { fade } from "svelte/transition"
  import { clickOutside, ProgressCircle } from "@budibase/bbui"
  import { createEventManagers } from "../lib/events"
  import { createAPIClient } from "../../../api"
  import { attachStores } from "../stores"
  import BulkDeleteHandler from "../controls/BulkDeleteHandler.svelte"
  import GridBody from "./GridBody.svelte"
  import ResizeOverlay from "../overlays/ResizeOverlay.svelte"
  import ReorderOverlay from "../overlays/ReorderOverlay.svelte"
  import HeaderRow from "./HeaderRow.svelte"
  import ScrollOverlay from "../overlays/ScrollOverlay.svelte"
  import MenuOverlay from "../overlays/MenuOverlay.svelte"
  import StickyColumn from "./StickyColumn.svelte"
  import UserAvatars from "./UserAvatars.svelte"
  import KeyboardManager from "../overlays/KeyboardManager.svelte"
  import SortButton from "../controls/SortButton.svelte"
  import HideColumnsButton from "../controls/HideColumnsButton.svelte"
  import SizeButton from "../controls/SizeButton.svelte"
  import NewRow from "./NewRow.svelte"
  import { createGridWebsocket } from "../lib/websocket"
  import {
    MaxCellRenderHeight,
    MaxCellRenderWidthOverflow,
    GutterWidth,
    DefaultRowHeight,
  } from "../lib/constants"

  export let API = null
  export let tableId = null
  export let schemaOverrides = null
  export let columnWhitelist = null
  export let allowAddRows = true
  export let allowExpandRows = true
  export let allowEditRows = true
  export let allowDeleteRows = true
  export let allowSchemaChanges = true
  export let stripeRows = false
  export let collaboration = true
  export let showAvatars = true
  export let showControls = true
  export let initialFilter = null
  export let initialSortColumn = null
  export let initialSortOrder = null
  export let fixedRowHeight = null
  export let notifySuccess = null
  export let notifyError = null

  // Unique identifier for DOM nodes inside this instance
  const rand = Math.random()

  // Build up context
  let context = {
    API: API || createAPIClient(),
    rand,
    props: $$props,
  }
  context = { ...context, ...createEventManagers() }
  context = attachStores(context)

  // Reference some stores for local use
  const {
    config,
    isResizing,
    isReordering,
    ui,
    loaded,
    loading,
    rowHeight,
    contentLines,
    gridFocused,
    error,
    canAddRows,
  } = context

  // Keep config store up to date with props
  $: config.set({
    tableId,
    schemaOverrides,
    columnWhitelist,
    allowAddRows,
    allowExpandRows,
    allowEditRows,
    allowDeleteRows,
    allowSchemaChanges,
    stripeRows,
    collaboration,
    showAvatars,
    showControls,
    initialFilter,
    initialSortColumn,
    initialSortOrder,
    fixedRowHeight,
    notifySuccess,
    notifyError,
  })

  // Set context for children to consume
  setContext("grid", context)

  // Expose ability to retrieve context externally for external control
  export const getContext = () => context

  // Initialise websocket for multi-user
  onMount(() => {
    if (collaboration) {
      return createGridWebsocket(context)
    }
  })
</script>

<div
  class="grid"
  id="grid-{rand}"
  class:is-resizing={$isResizing}
  class:is-reordering={$isReordering}
  class:stripe={stripeRows}
  on:mouseenter={() => gridFocused.set(true)}
  on:mouseleave={() => gridFocused.set(false)}
  style="--row-height:{$rowHeight}px; --default-row-height:{DefaultRowHeight}px; --gutter-width:{GutterWidth}px; --max-cell-render-height:{MaxCellRenderHeight}px; --max-cell-render-width-overflow:{MaxCellRenderWidthOverflow}px; --content-lines:{$contentLines};"
>
  {#if showControls}
    <div class="controls">
      <div class="controls-left">
        <slot name="filter" />
        <SortButton />
        <HideColumnsButton />
        <SizeButton />
        <slot name="controls" />
      </div>
      <div class="controls-right">
        {#if showAvatars}
          <UserAvatars />
        {/if}
      </div>
    </div>
  {/if}
  {#if $loaded}
    <div class="grid-data-outer" use:clickOutside={ui.actions.blur}>
      <div class="grid-data-inner">
        <StickyColumn />
        <div class="grid-data-content">
          <HeaderRow />
          <GridBody />
        </div>
        {#if $canAddRows}
          <NewRow />
        {/if}
        <div class="overlays">
          <ResizeOverlay />
          <ReorderOverlay />
          <ScrollOverlay />
          <MenuOverlay />
        </div>
      </div>
    </div>
  {:else if $error}
    <div class="grid-error">
      <div class="grid-error-title">There was a problem loading your grid</div>
      <div class="grid-error-subtitle">
        {$error}
      </div>
    </div>
  {/if}
  {#if $loading && !$error}
    <div in:fade|local={{ duration: 130 }} class="grid-loading">
      <ProgressCircle />
    </div>
  {/if}
  {#if allowDeleteRows}
    <BulkDeleteHandler />
  {/if}
  <KeyboardManager />
</div>

<style>
  /* Core grid */
  .grid {
    /* Variables */
    --accent-color: var(--primaryColor, var(--spectrum-global-color-blue-400));
    --grid-background: var(--spectrum-global-color-gray-50);
    --grid-background-alt: var(--spectrum-global-color-gray-100);
    --cell-background: var(--grid-background);
    --cell-background-hover: var(--grid-background-alt);
    --cell-background-alt: var(--cell-background);
    --cell-padding: 8px;
    --cell-spacing: 4px;
    --cell-border: 1px solid var(--spectrum-global-color-gray-200);
    --cell-font-size: 14px;
    --controls-height: 50px;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    position: relative;
    overflow: hidden;
    background: var(--grid-background);
  }
  .grid,
  .grid :global(*) {
    box-sizing: border-box;
  }
  .grid.is-resizing :global(*) {
    cursor: col-resize !important;
  }
  .grid.is-reordering :global(*) {
    cursor: grabbing !important;
  }
  .grid.stripe {
    --cell-background-alt: var(--spectrum-global-color-gray-75);
  }

  /* Data layers */
  .grid-data-outer,
  .grid-data-inner {
    flex: 1 1 auto;
    display: flex;
    justify-items: flex-start;
    align-items: stretch;
    overflow: hidden;
  }
  .grid-data-outer {
    height: 0;
    flex-direction: column;
  }
  .grid-data-inner {
    flex-direction: row;
    position: relative;
  }
  .grid-data-content {
    flex: 1 1 auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Controls */
  .controls {
    height: var(--controls-height);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid var(--spectrum-global-color-gray-200);
    padding: var(--cell-padding);
    gap: var(--cell-spacing);
    background: var(--grid-background-alt);
    z-index: 2;
  }
  .controls-left,
  .controls-right {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: var(--cell-spacing);
  }
  .controls-right {
    gap: 12px;
  }

  /* Overlays */
  .overlays {
    z-index: 10;
  }

  /* Loading */
  .grid-loading {
    position: absolute;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    z-index: 100;
  }
  .grid-loading:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--grid-background-alt);
    opacity: 0.6;
  }

  /* Error */
  .grid-error {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }
  .grid-error-title {
    font-size: 18px;
    font-weight: 600;
  }
  .grid-error-subtitle {
    font-size: 16px;
  }

  /* Disable checkbox animation anywhere in the grid data */
  .grid-data-outer :global(.spectrum-Checkbox-box:before),
  .grid-data-outer :global(.spectrum-Checkbox-box:after),
  .grid-data-outer :global(.spectrum-Checkbox-checkmark),
  .grid-data-outer :global(.spectrum-Checkbox-partialCheckmark) {
    transition: none;
  }
</style>
