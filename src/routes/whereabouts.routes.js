const express = require("express")
const router = express.Router()
const whereaboutsController = require("../controllers/whereabouts.controller")
const { authenticateToken } = require("../middleware/auth")

router.use(authenticateToken)

router.get("/", whereaboutsController.getWhereabouts)
router.post("/submissions", whereaboutsController.submitWhereabout)
router.put("/:id", whereaboutsController.updateWhereabout)
router.delete("/:id", whereaboutsController.deleteWhereabout)
router.post("/:id/verify", whereaboutsController.verifyWhereabout)

module.exports = router
