<script>
  import { getContext, onDestroy } from "svelte"
  import { generate } from "shortid"
  import { builderStore } from "../stores/builder.js"
  import Component from "components/Component.svelte"

  export let type
  export let props
  export let styles
  export let context
  export let name
  export let order = 0
  export let containsSlot = false

  // ID is only exposed as a prop so that it can be bound to from parent
  // block components
  export let id

  const component = getContext("component")
  const block = getContext("block")
  const rand = generate()

  // Create a fake component instance so that we can use the core Component
  // to render this part of the block, taking advantage of binding enrichment
  $: id = `${block.id}-${context ?? rand}`
  $: parentId = $component?.id
  $: inBuilder = $builderStore.inBuilder
  $: instance = {
    _component: `@budibase/standard-components/${type}`,
    _id: id,
    _instanceName: name || type[0].toUpperCase() + type.slice(1),
    _styles: {
      ...styles,
      normal: styles?.normal || {},
    },
    _containsSlot: containsSlot,
    ...props,
  }

  // Register this block component if we're inside the builder so it can be
  // ejected later
  $: {
    if (inBuilder) {
      block.registerComponent(id, parentId, order ?? 0, instance)
    }
  }

  onDestroy(() => {
    if (inBuilder) {
      block.unregisterComponent(id, parentId)
    }
  })
</script>

<Component {instance} isBlock>
  <slot />
</Component>
