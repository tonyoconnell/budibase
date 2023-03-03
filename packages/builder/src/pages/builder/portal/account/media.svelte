<script>
  import { Body, Divider, Heading, Layout, Table } from "@budibase/bbui"
  import { onMount } from "svelte"
  import { API } from "api"

  let loaded = false
  let media

  let schema = {
    appId: {
      name: "App",
      type: "string",
    },
    name: {
      name: "File Name",
      type: "string",
    },
    size: {
      name: "File Size",
      type: "number",
    },
    sync: {
      name: "Synced",
      type: "datetime",
    },
    updated: {
      name: "Updated",
      type: "datetime",
    },
  }

  onMount(async () => {
    media = await API.loadMedia()
    loaded = true
    console.log(media)
  })
</script>

{#if loaded}
  <Layout noPadding>
    <Layout noPadding gap="XS">
      <Heading>Storage</Heading>
      <Body>
        <div>Manage Media</div>
      </Body>
    </Layout>
    <Divider />

    <Table
      on:click={({ detail }) => {
        alert(JSON.stringify(detail))
      }}
      {schema}
      data={media}
      allowEditColumns={false}
      allowEditRows={false}
      allowSelectRows={false}
    />
    <!-- <Body>To upgrade your plan and usage limits visit your</Body> -->
  </Layout>
{/if}

<style>
</style>
