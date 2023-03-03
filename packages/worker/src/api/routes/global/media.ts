import Router from "@koa/router"
import * as controller from "../../controllers/global/media"
import { auth } from "@budibase/backend-core"

const router: Router = new Router()

router.get("/api/global/media/search", auth.builderOrAdmin, controller.fetch)
router.get("/api/global/media/sync", auth.builderOrAdmin, controller.sync)

export default router
