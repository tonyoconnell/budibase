<script>
  import {
    Modal,
  } from "@budibase/bbui"
  import CreateEditRelationship from './CreateEditRelationship.svelte'
  import { datasources } from "stores/backend"

  export let datasource
  export let tables
  export let beforeSave = async () => {}
  export let afterSave = async () => {}
  export let onError = async () => {}

  let relationshipModal
  let fromRelationship = {}
  let toRelationship = {}
  let fromTable = null

  export function show({
    fromRelationship: selectedFromRelationship = {}, 
    toRelationship: selectedToRelationship = {},
    fromTable: selectedFromTable = null
  }) {
    fromRelationship = selectedFromRelationship
    toRelationship = selectedToRelationship
    fromTable = selectedFromTable

    relationshipModal.show()
  }

  export function hide() {
    relationshipModal.hide()
  }

  // action is one of 'created', 'updated' or 'deleted'
  async function saveRelationship(action) {
    try {
      await beforeSave({ action, datasource })
      await datasources.save(datasource)
      await afterSave({ datasource, action })
    } catch (err) {
      await onError({ err, datasource, action })
    }
  }

</script>

<Modal bind:this={relationshipModal}>
  <CreateEditRelationship
    save={saveRelationship}
    close={relationshipModal.hide}
    selectedFromTable={fromTable}
    {datasource}
    plusTables={tables}
    {fromRelationship}
    {toRelationship}
  />
</Modal>

<style>
</style>
