export const buildMediaEndpoints = API => ({
  /**
   * Gets a list of media the current tenant.
   */
  loadMedia: async () => {
    return await API.get({
      url: `/api/global/media/search`,
      //body: buildOpts(opts),
    })
  },
})
