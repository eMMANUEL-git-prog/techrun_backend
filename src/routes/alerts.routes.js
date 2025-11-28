const express = require("express")
const router = express.Router()
const alertsController = require("../controllers/alerts.controller")
const { authenticateToken } = require("../middleware/auth")

router.use(authenticateToken)

router.get("/", alertsController.getAlerts)
router.post("/", alertsController.createAlert)
router.patch("/:id/read", alertsController.markAsRead)
router.delete("/:id", alertsController.deleteAlert)

module.exports = router
