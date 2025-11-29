const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

// Get all biomechanics data for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM biomechanics_data WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 50",
      [req.user.id]
    );
    res.json({ biomechanics: rows });
  } catch (error) {
    console.error("Error fetching biomechanics data:", error);
    res.status(500).json({ error: "Failed to fetch biomechanics data" });
  }
});

// Get single biomechanics record
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM biomechanics_data WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Biomechanics record not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching biomechanics record:", error);
    res.status(500).json({ error: "Failed to fetch biomechanics record" });
  }
});

// Create biomechanics data
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      gait_cycle_duration,
      foot_strike_pattern,
      pronation_type,
      impact_force,
      ground_contact_time,
      vertical_oscillation,
      stride_length,
      cadence,
      asymmetry_percentage,
      foot_pressure_distribution,
      ankle_load,
      knee_load,
      hip_load,
      form_quality_score,
      fatigue_indicators,
      activity_type,
      duration_minutes,
      distance_km,
      notes,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO biomechanics_data (
        user_id, gait_cycle_duration, foot_strike_pattern, pronation_type,
        impact_force, ground_contact_time, vertical_oscillation,
        stride_length, cadence, asymmetry_percentage, foot_pressure_distribution,
        ankle_load, knee_load, hip_load, form_quality_score, fatigue_indicators,
        activity_type, duration_minutes, distance_km, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        req.user.id,
        gait_cycle_duration,
        foot_strike_pattern,
        pronation_type,
        impact_force,
        ground_contact_time,
        vertical_oscillation,
        stride_length,
        cadence,
        asymmetry_percentage,
        JSON.stringify(foot_pressure_distribution),
        ankle_load,
        knee_load,
        hip_load,
        form_quality_score,
        JSON.stringify(fatigue_indicators),
        activity_type,
        duration_minutes,
        distance_km,
        notes,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating biomechanics data:", error);
    res.status(500).json({ error: "Failed to create biomechanics data" });
  }
});

module.exports = router;
