import { writable, get } from "svelte/store"
import { store as frontendStore } from "builderStore"
import { API } from "api"

export function createChangesStore() {
  const store = writable({
    changed: false,
    docIds: [],
  })

  const fetch = async () => {
    const appId = get(frontendStore).appId
    const changes = await API.appChanges(appId)
    store.update(() => {
      return {
        changed: changes.changed,
        docIds: changes.docIds,
      }
    })
  }

  const setChanged = state => {
    store.update(current => {
      return {
        ...current,
        changed: state,
      }
    })
  }

  return {
    subscribe: store.subscribe,
    fetch,
    init: fetch,
    setChanged,
  }
}

export const appChanges = createChangesStore()
