const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

// Get all behavioral insights for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM behavioral_insights WHERE user_id = $1 ORDER BY assessment_date DESC LIMIT 50",
      [req.user.id]
    );
    res.json({ insights: rows });
  } catch (error) {
    console.error("Error fetching behavioral insights:", error);
    res.status(500).json({ error: "Failed to fetch behavioral insights" });
  }
});

// Get latest behavioral insight
router.get("/latest", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM behavioral_insights WHERE user_id = $1 ORDER BY assessment_date DESC LIMIT 1",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No behavioral insight found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching behavioral insight:", error);
    res.status(500).json({ error: "Failed to fetch behavioral insight" });
  }
});

// Create behavioral insight
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      period_start,
      period_end,
      motivation_score,
      training_consistency_percentage,
      missed_sessions_count,
      risky_behaviors,
      positive_patterns,
      stress_level,
      competition_anxiety_score,
      burnout_risk,
      goal_adherence_percentage,
      communication_frequency,
      psychological_support_recommendations,
      behavioral_interventions,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO behavioral_insights (
        user_id, period_start, period_end, motivation_score,
        training_consistency_percentage, missed_sessions_count, risky_behaviors,
        positive_patterns, stress_level, competition_anxiety_score, burnout_risk,
        goal_adherence_percentage, communication_frequency,
        psychological_support_recommendations, behavioral_interventions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.user.id,
        period_start,
        period_end,
        motivation_score,
        training_consistency_percentage,
        missed_sessions_count,
        JSON.stringify(risky_behaviors),
        JSON.stringify(positive_patterns),
        stress_level,
        competition_anxiety_score,
        burnout_risk,
        goal_adherence_percentage,
        communication_frequency,
        JSON.stringify(psychological_support_recommendations),
        JSON.stringify(behavioral_interventions),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating behavioral insight:", error);
    res.status(500).json({ error: "Failed to create behavioral insight" });
  }
});

module.exports = router;
