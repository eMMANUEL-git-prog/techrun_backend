const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

// Get all performance data for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM performance_data WHERE user_id = $1 ORDER BY analysis_date DESC LIMIT 50",
      [req.user.id]
    );
    res.json({ performance: rows });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    res.status(500).json({ error: "Failed to fetch performance data" });
  }
});

// Get latest performance analysis
router.get("/latest", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM performance_data WHERE user_id = $1 ORDER BY analysis_date DESC LIMIT 1",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No performance analysis found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching performance analysis:", error);
    res.status(500).json({ error: "Failed to fetch performance analysis" });
  }
});

// Create performance analysis
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      performance_score,
      efficiency_score,
      technique_score,
      predicted_race_time,
      improvement_potential_percentage,
      performance_trend,
      energy_efficiency_score,
      optimal_pace_strategy,
      strength_training_recommendations,
      conditioning_recommendations,
      technique_corrections,
      recovery_plan,
      race_distance,
      target_time,
      confidence_level,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO performance_data (
        user_id, performance_score, efficiency_score, technique_score,
        predicted_race_time, improvement_potential_percentage, performance_trend,
        energy_efficiency_score, optimal_pace_strategy, strength_training_recommendations,
        conditioning_recommendations, technique_corrections, recovery_plan,
        race_distance, target_time, confidence_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        req.user.id,
        performance_score,
        efficiency_score,
        technique_score,
        JSON.stringify(predicted_race_time),
        improvement_potential_percentage,
        performance_trend,
        energy_efficiency_score,
        JSON.stringify(optimal_pace_strategy),
        JSON.stringify(strength_training_recommendations),
        JSON.stringify(conditioning_recommendations),
        JSON.stringify(technique_corrections),
        JSON.stringify(recovery_plan),
        race_distance,
        target_time,
        confidence_level,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating performance analysis:", error);
    res.status(500).json({ error: "Failed to create performance analysis" });
  }
});

module.exports = router;
