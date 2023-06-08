import { writable } from "svelte/store"
import { API } from "api"

export function createChangesStore() {
  const store = writable({
    changed: false,
    docIds: [],
  })

  const fetch = async () => {
    const changes = await API.appChanges()
    store.update(() => {
      return {
        changed: changes.changed,
        docIds: changes.docIds,
      }
    })
  }

  return {
    subscribe: store.subscribe,
    fetch,
    init: fetch,
  }
}

export const appChanges = createChangesStore()
