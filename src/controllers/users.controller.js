const pool = require("../config/database")
const bcrypt = require("bcryptjs")

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, subscription_tier, image_url, created_at 
       FROM users 
       ORDER BY created_at DESC`,
    )

    res.json({ users: result.rows })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      "SELECT id, email, first_name, last_name, role, subscription_tier, image_url, created_at FROM users WHERE id = $1",
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error("Get user by ID error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { first_name, last_name, image_url } = req.body

    // Only allow users to update their own profile (unless admin)
    if (req.user.id !== Number.parseInt(id) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name), 
           last_name = COALESCE($2, last_name), 
           image_url = COALESCE($3, image_url) 
       WHERE id = $4 
       RETURNING id, email, first_name, last_name, role, subscription_tier, image_url`,
      [first_name, last_name, image_url, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params
    const { subscription_tier } = req.body

    const result = await pool.query(
      "UPDATE users SET subscription_tier = $1 WHERE id = $2 RETURNING id, email, subscription_tier",
      [subscription_tier, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error("Update subscription error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
