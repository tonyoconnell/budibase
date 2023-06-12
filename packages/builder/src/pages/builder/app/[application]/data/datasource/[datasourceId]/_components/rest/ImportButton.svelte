<script>
  import {
    Button,
    Modal,
  } from "@budibase/bbui"
  import ImportQueriesModal from "./ImportQueriesModal.svelte"

  let importQueriesModal
</script>

<Modal bind:this={importQueriesModal}>
  <ImportQueriesModal
    createDatasource={false}
    datasourceId={'todo'}
  />
</Modal>

<Button secondary on:click={() => importQueriesModal.show()}>
  Import
</Button>
