const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

// Get all training load data for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM training_load WHERE user_id = $1 ORDER BY week_start_date DESC LIMIT 52",
      [req.user.id]
    );
    res.json({ trainingLoad: rows });
  } catch (error) {
    console.error("Error fetching training load:", error);
    res.status(500).json({ error: "Failed to fetch training load" });
  }
});

// Get training load for specific week
router.get("/week/:date", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM training_load WHERE user_id = $1 AND week_start_date = $2",
      [req.user.id, req.params.date]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Training load not found for this week" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching training load:", error);
    res.status(500).json({ error: "Failed to fetch training load" });
  }
});

// Create or update training load
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      week_start_date,
      weekly_training_load,
      acute_chronic_ratio,
      cumulative_fatigue_score,
      recovery_score,
      overtraining_risk,
      avg_hrv,
      resting_hr,
      energy_expenditure,
      avg_sleep_hours,
      sleep_quality_score,
      hydration_level,
      stress_level,
      recommendations,
    } = req.body;

    // Check if record exists for this week
    const existing = await pool.query(
      "SELECT id FROM training_load WHERE user_id = $1 AND week_start_date = $2",
      [req.user.id, week_start_date]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      const { rows } = await pool.query(
        `UPDATE training_load SET 
          weekly_training_load = $1, acute_chronic_ratio = $2, cumulative_fatigue_score = $3,
          recovery_score = $4, overtraining_risk = $5, avg_hrv = $6, resting_hr = $7,
          energy_expenditure = $8, avg_sleep_hours = $9, sleep_quality_score = $10,
          hydration_level = $11, stress_level = $12, recommendations = $13
        WHERE user_id = $14 AND week_start_date = $15
        RETURNING *`,
        [
          weekly_training_load,
          acute_chronic_ratio,
          cumulative_fatigue_score,
          recovery_score,
          overtraining_risk,
          avg_hrv,
          resting_hr,
          energy_expenditure,
          avg_sleep_hours,
          sleep_quality_score,
          hydration_level,
          stress_level,
          JSON.stringify(recommendations),
          req.user.id,
          week_start_date,
        ]
      );
      result = rows[0];
    } else {
      // Create new
      const { rows } = await pool.query(
        `INSERT INTO training_load (
          user_id, week_start_date, weekly_training_load, acute_chronic_ratio,
          cumulative_fatigue_score, recovery_score, overtraining_risk, avg_hrv,
          resting_hr, energy_expenditure, avg_sleep_hours, sleep_quality_score,
          hydration_level, stress_level, recommendations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          req.user.id,
          week_start_date,
          weekly_training_load,
          acute_chronic_ratio,
          cumulative_fatigue_score,
          recovery_score,
          overtraining_risk,
          avg_hrv,
          resting_hr,
          energy_expenditure,
          avg_sleep_hours,
          sleep_quality_score,
          hydration_level,
          stress_level,
          JSON.stringify(recommendations),
        ]
      );
      result = rows[0];
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error saving training load:", error);
    res.status(500).json({ error: "Failed to save training load" });
  }
});

module.exports = router;
