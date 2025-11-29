const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

// Get all equipment for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM equipment WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ equipment: rows });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    res.status(500).json({ error: "Failed to fetch equipment" });
  }
});

// Get active equipment
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM equipment WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ equipment: rows });
  } catch (error) {
    console.error("Error fetching active equipment:", error);
    res.status(500).json({ error: "Failed to fetch active equipment" });
  }
});

// Create equipment
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      equipment_type,
      brand,
      model,
      purchase_date,
      first_use_date,
      activity_types,
      terrain_types,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO equipment (
        user_id, equipment_type, brand, model, purchase_date, first_use_date,
        activity_types, terrain_types
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.user.id,
        equipment_type,
        brand,
        model,
        purchase_date,
        first_use_date,
        JSON.stringify(activity_types),
        JSON.stringify(terrain_types),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating equipment:", error);
    res.status(500).json({ error: "Failed to create equipment" });
  }
});

// Update equipment usage
router.put("/:id/usage", authenticateToken, async (req, res) => {
  try {
    const { distance_km, uses_increment } = req.body;

    const { rows } = await pool.query(
      `UPDATE equipment SET 
        total_mileage = COALESCE(total_mileage, 0) + $1,
        total_uses = COALESCE(total_uses, 0) + $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING *`,
      [distance_km || 0, uses_increment || 1, req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating equipment usage:", error);
    res.status(500).json({ error: "Failed to update equipment usage" });
  }
});

// Update equipment condition
router.put("/:id/condition", authenticateToken, async (req, res) => {
  try {
    const {
      cushioning_score,
      wear_level,
      pressure_distribution_score,
      replacement_recommendations,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE equipment SET 
        cushioning_score = $1, wear_level = $2, pressure_distribution_score = $3,
        replacement_recommendations = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND user_id = $6
      RETURNING *`,
      [
        cushioning_score,
        wear_level,
        pressure_distribution_score,
        JSON.stringify(replacement_recommendations),
        req.params.id,
        req.user.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating equipment condition:", error);
    res.status(500).json({ error: "Failed to update equipment condition" });
  }
});

// Retire equipment
router.put("/:id/retire", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE equipment SET 
        status = 'retired', retired_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error retiring equipment:", error);
    res.status(500).json({ error: "Failed to retire equipment" });
  }
});

// Delete equipment
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM equipment WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    res.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    res.status(500).json({ error: "Failed to delete equipment" });
  }
});

module.exports = router;
