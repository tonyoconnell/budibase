import "../../tests"
import * as installation from "../installation"

describe("installation", () => {
  beforeEach(async () => {
    await installation.removeInstall()
  })

  describe("getInstallFromDB", () => {
    it("returns installation when it exists", async () => {
      // populate the install first time
      await installation.getInstall()

      const exists = await installation.getInstallFromDB()
      expect(exists).toBeDefined()
    })

    it("returns undefined when it doesn't exists", async () => {
      const exists = await installation.getInstallFromDB()
      expect(exists).toBeUndefined()
    })
  })

  describe("getInstall", () => {
    it("populates the install when it doesn't exist", async () => {
      const install = await installation.getInstall()
      expect(install._id).toBe("install")
      expect(install.installId).toBeDefined()
      expect(install.version).toBeDefined()
    })

    it("populates the install when it doesn't exist", async () => {
      const installFromRedis = await installation.getInstall()
      const installFromDB = await installation.getInstallFromDB()
      expect(installFromDB).toEqual(installFromRedis)
    })

    it("populates the install (thread safe)", async () => {
      const promises = []
      promises.push(installation.getInstall())
      promises.push(installation.getInstall())
      promises.push(installation.getInstall())

      await Promise.all(promises)

      // no errors thrown
    })
  })
})
