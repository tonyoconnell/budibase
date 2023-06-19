<script>
  import { Body, Layout, ModalContent } from "@budibase/bbui"
  import DatasourceConfigForm from "components/backend/Datasources/DatasourceConfigForm.svelte"

  export let isLoading
  export let integration
  export let fields
  export let onComplete

  let isValid
</script>

<ModalContent
  title={`Connect to ${integration.friendlyName}`}
  onConfirm={onComplete}
  confirmText={integration.plus ? "Connect" : "Save and continue to query"}
  cancelText="Back"
  size="L"
  disabled={!isValid || isLoading}
>
  <Layout noPadding>
    <Body size="XS">
      Connect your database to Budibase using the config below.
    </Body>
  </Layout>
  <DatasourceConfigForm
    {integration}
    bind:config={fields}
    creating={true}
    on:valid={e => (isValid = e.detail)}
  />
</ModalContent>
