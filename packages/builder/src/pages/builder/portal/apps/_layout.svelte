<script>
  import { notifications } from "@budibase/bbui"
  import { admin, apps, templates, licensing, groups } from "stores/portal"
  import { onMount } from "svelte"
  import { redirect } from "@roxi/routify"

  // Don't block loading if we've already hydrated state
  let loaded = $apps.length > 0

  onMount(async () => {
    try {
      const promises = [licensing.init()]

      if (!$admin.offlineMode) {
        promises.push(templates.load())
      }

      promises.push(groups.actions.init())

      // Always load latest
      await Promise.all(promises)

      if (!$admin.offlineMode && $templates?.length === 0) {
        notifications.error("There was a problem loading quick start templates")
      }

      // Go to new app page if no apps exists
      if (!$apps.length) {
        $redirect("./onboarding")
      }
    } catch (error) {
      notifications.error("Error loading apps and templates")
    }
    loaded = true
  })
</script>

{#if loaded}
  <slot />
{/if}
