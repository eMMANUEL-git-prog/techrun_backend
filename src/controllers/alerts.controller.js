const pool = require("../config/database")
const { generateAIContent } = require("../config/gemini")

exports.getAlerts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, type, severity, message, details, created_at, read 
       FROM alerts 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id],
    )

    res.json({ alerts: result.rows })
  } catch (error) {
    console.error("Get alerts error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.createAlert = async (req, res) => {
  try {
    const { type, severity, message, details } = req.body

    const result = await pool.query(
      `INSERT INTO alerts (user_id, type, severity, message, details) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [req.user.id, type, severity, message, details],
    )

    res.status(201).json({ alert: result.rows[0] })
  } catch (error) {
    console.error("Create alert error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("UPDATE alerts SET read = true WHERE id = $1 AND user_id = $2 RETURNING *", [
      id,
      req.user.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" })
    }

    res.json({ alert: result.rows[0] })
  } catch (error) {
    console.error("Mark alert as read error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM alerts WHERE id = $1 AND user_id = $2 RETURNING id", [id, req.user.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" })
    }

    res.json({ message: "Alert deleted successfully" })
  } catch (error) {
    console.error("Delete alert error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
