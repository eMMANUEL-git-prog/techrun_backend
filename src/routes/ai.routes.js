const express = require("express")
const router = express.Router()
const aiController = require("../controllers/ai.controller")
const { authenticateToken } = require("../middleware/auth")

router.use(authenticateToken)

router.post("/chat", aiController.chat)
router.post("/nutrition/calculate", aiController.calculateNutrition)
router.post("/performance/predict", aiController.predictPerformance)
router.post("/medication/check", aiController.checkMedication)
router.post("/alerts/generate", aiController.generateAlerts)

module.exports = router
