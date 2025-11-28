const axios = require("axios")
const pool = require("../config/database")
require("dotenv").config()

// M-Pesa OAuth Token
const getMpesaToken = async () => {
  try {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString(
      "base64",
    )

    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    )

    return response.data.access_token
  } catch (error) {
    console.error("M-Pesa token error:", error.response?.data || error.message)
    throw new Error("Failed to get M-Pesa token")
  }
}

exports.initiateMpesaPayment = async (req, res) => {
  try {
    const { phone_number, amount, package_type } = req.body

    if (!phone_number || !amount) {
      return res.status(400).json({ error: "Phone number and amount are required" })
    }

    // Get M-Pesa token
    const token = await getMpesaToken()

    // Generate timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14)

    // Generate password
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString(
      "base64",
    )

    // STK Push request
    const stkPushResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone_number,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone_number,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `SUB_${req.user.id}`,
        TransactionDesc: `Subscription payment for ${package_type || "Pro"}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    // Save transaction to database
    await pool.query(
      `INSERT INTO transactions (user_id, amount, phone_number, checkout_request_id, merchant_request_id, status, package_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        amount,
        phone_number,
        stkPushResponse.data.CheckoutRequestID,
        stkPushResponse.data.MerchantRequestID,
        "pending",
        package_type,
      ],
    )

    res.json({
      message: "STK push sent successfully",
      checkout_request_id: stkPushResponse.data.CheckoutRequestID,
      merchant_request_id: stkPushResponse.data.MerchantRequestID,
    })
  } catch (error) {
    console.error("M-Pesa STK Push error:", error.response?.data || error.message)
    res.status(500).json({ error: "Payment initiation failed" })
  }
}

exports.mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body

    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ error: "Invalid callback data" })
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = Body.stkCallback

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata.Item
      const amount = metadata.find((item) => item.Name === "Amount")?.Value
      const mpesaReceiptNumber = metadata.find((item) => item.Name === "MpesaReceiptNumber")?.Value
      const phoneNumber = metadata.find((item) => item.Name === "PhoneNumber")?.Value

      // Update transaction
      const transaction = await pool.query(
        `UPDATE transactions 
         SET status = 'completed', mpesa_receipt_number = $1, completed_at = NOW() 
         WHERE checkout_request_id = $2 
         RETURNING user_id, package_type`,
        [mpesaReceiptNumber, CheckoutRequestID],
      )

      if (transaction.rows.length > 0) {
        const { user_id, package_type } = transaction.rows[0]

        // Update user subscription
        await pool.query("UPDATE users SET subscription_tier = $1 WHERE id = $2", [package_type || "pro", user_id])
      }
    } else {
      // Payment failed
      await pool.query(
        `UPDATE transactions 
         SET status = 'failed', error_message = $1 
         WHERE checkout_request_id = $2`,
        [ResultDesc, CheckoutRequestID],
      )
    }

    res.json({ ResultCode: 0, ResultDesc: "Success" })
  } catch (error) {
    console.error("M-Pesa callback error:", error)
    res.status(500).json({ error: "Callback processing failed" })
  }
}

exports.getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, amount, phone_number, status, package_type, mpesa_receipt_number, created_at, completed_at 
       FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id],
    )

    res.json({ transactions: result.rows })
  } catch (error) {
    console.error("Get transactions error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
