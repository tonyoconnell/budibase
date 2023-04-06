<script>
  import "@spectrum-css/pagination/dist/index-vars.css"
  import "@spectrum-css/actionbutton/dist/index-vars.css"
  import "@spectrum-css/typography/dist/index-vars.css"

  export let page
  export let total
  export let goToPrevPage
  export let goToNextPage
  export let hasPrevPage = true
  export let hasNextPage = true
</script>

{#if total != undefined}
  <div class="pagination-total">Total: {total}</div>
{/if}
<nav class="spectrum-Pagination spectrum-Pagination--explicit">
  <div
    href="#"
    class="spectrum-ActionButton spectrum-ActionButton--sizeM spectrum-ActionButton--quiet spectrum-Pagination-prevButton"
    on:click={hasPrevPage ? goToPrevPage : null}
    class:is-disabled={!hasPrevPage}
  >
    <svg
      class="spectrum-Icon spectrum-UIIcon-ChevronLeft100"
      focusable="false"
      aria-hidden="true"
      aria-label="ChevronLeft"
    >
      <use xlink:href="#spectrum-css-icon-Chevron100" />
    </svg>
  </div>
  <span class="spectrum-Body--secondary spectrum-Pagination-counter">
    Page {page}
  </span>
  <div
    href="#"
    class="spectrum-ActionButton spectrum-ActionButton--sizeM spectrum-ActionButton--quiet spectrum-Pagination-nextButton"
    on:click={hasNextPage ? goToNextPage : null}
    class:is-disabled={!hasNextPage}
  >
    <svg
      class="spectrum-Icon spectrum-UIIcon-ChevronRight100"
      focusable="false"
      aria-hidden="true"
      aria-label="ChevronLeft"
    >
      <use xlink:href="#spectrum-css-icon-Chevron100" />
    </svg>
  </div>
</nav>

<style>
  .spectrum-Pagination-counter {
    margin-left: 0;
    user-select: none;
  }
  .is-disabled:hover {
    cursor: initial;
  }

  .pagination-total {
    display: flex;
    align-self: center;
    flex-grow: 1;
  }
</style>
