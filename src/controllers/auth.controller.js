const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const pool = require("../config/database")
require("dotenv").config()

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })

  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  })

  return { accessToken, refreshToken }
}

exports.signup = async (req, res) => {
  try {
    const { email, password, full_name, role = "athlete" } = req.body

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "All fields are required" })
    }

    // Check if user exists
    const userExists = await pool.query("SELECT id FROM users WHERE email = $1", [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Split full_name into first and last
    const nameParts = full_name.trim().split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || ""

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, subscription_tier) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role, subscription_tier, image_url`,
      [email, hashedPassword, firstName, lastName, role, "free"],
    )

    const user = result.rows[0]
    const tokens = generateTokens(user)

    res.status(201).json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        subscription: user.subscription_tier,
        imageUrl: user.image_url,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password, first_name, last_name, role, subscription_tier, image_url FROM users WHERE email = $1",
      [email],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = result.rows[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const tokens = generateTokens(user)

    res.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        subscription: user.subscription_tier,
        imageUrl: user.image_url,
      },
    })
  } catch (error) {
    console.error("Signin error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, first_name, last_name, role, subscription_tier, image_url FROM users WHERE id = $1",
      [req.user.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        subscription: user.subscription_tier,
        imageUrl: user.image_url,
      },
    })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token required" })
    }

    jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid refresh token" })
      }

      const result = await pool.query("SELECT id, email, role FROM users WHERE id = $1", [decoded.id])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" })
      }

      const user = result.rows[0]
      const tokens = generateTokens(user)

      res.json({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })
    })
  } catch (error) {
    console.error("Refresh token error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
