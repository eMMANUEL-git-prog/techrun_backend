const express = require("express")
const router = express.Router()
const authController = require("../controllers/auth.controller")
const { authenticateToken } = require("../middleware/auth")

router.post("/signup", authController.signup)
router.post("/signin", authController.signin)
router.get("/me", authenticateToken, authController.getCurrentUser)
router.post("/refresh", authController.refreshToken)

module.exports = router
