const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../config/database");

// Get all athletes (admin, coach, medic, nutritionist can view)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, subscription_tier, image_url, created_at
       FROM users 
       WHERE role = 'athlete'
       ORDER BY created_at DESC`
    );
    res.json({ athletes: result.rows });
  } catch (error) {
    console.error("Error fetching athletes:", error);
    res.status(500).json({ error: "Failed to fetch athletes" });
  }
});

// Get athlete by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, subscription_tier, image_url, created_at
       FROM users 
       WHERE id = $1 AND role = 'athlete'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Athlete not found" });
    }

    res.json({ athlete: result.rows[0] });
  } catch (error) {
    console.error("Error fetching athlete:", error);
    res.status(500).json({ error: "Failed to fetch athlete" });
  }
});

module.exports = router;
