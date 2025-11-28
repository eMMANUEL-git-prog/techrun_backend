const express = require("express")
const router = express.Router()
const paymentsController = require("../controllers/payments.controller")
const { authenticateToken } = require("../middleware/auth")

router.use(authenticateToken)

router.post("/mpesa/stk-push", paymentsController.initiateMpesaPayment)
router.post("/mpesa/callback", paymentsController.mpesaCallback)
router.get("/transactions", paymentsController.getTransactions)

module.exports = router
