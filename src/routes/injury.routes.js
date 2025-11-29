const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

// Get all injury assessments for user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM injury_data WHERE user_id = $1 ORDER BY assessed_at DESC LIMIT 50",
      [req.user.id]
    );
    res.json({ injuries: rows });
  } catch (error) {
    console.error("Error fetching injury data:", error);
    res.status(500).json({ error: "Failed to fetch injury data" });
  }
});

// Get latest injury assessment
router.get("/latest", authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM injury_data WHERE user_id = $1 ORDER BY assessed_at DESC LIMIT 1",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No injury assessment found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching injury assessment:", error);
    res.status(500).json({ error: "Failed to fetch injury assessment" });
  }
});

// Create injury assessment
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      overall_injury_risk,
      risk_score,
      stress_fracture_risk,
      tendon_overload_risk,
      achilles_risk,
      patella_risk,
      hamstring_risk,
      knee_valgus_risk,
      plantar_fasciitis_risk,
      shin_splints_risk,
      high_risk_patterns,
      previous_injuries,
      reinjury_probability,
      prevention_recommendations,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO injury_data (
        user_id, overall_injury_risk, risk_score, stress_fracture_risk,
        tendon_overload_risk, achilles_risk, patella_risk, hamstring_risk,
        knee_valgus_risk, plantar_fasciitis_risk, shin_splints_risk,
        high_risk_patterns, previous_injuries, reinjury_probability,
        prevention_recommendations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.user.id,
        overall_injury_risk,
        risk_score,
        stress_fracture_risk,
        tendon_overload_risk,
        achilles_risk,
        patella_risk,
        hamstring_risk,
        knee_valgus_risk,
        plantar_fasciitis_risk,
        shin_splints_risk,
        JSON.stringify(high_risk_patterns),
        JSON.stringify(previous_injuries),
        reinjury_probability,
        JSON.stringify(prevention_recommendations),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating injury assessment:", error);
    res.status(500).json({ error: "Failed to create injury assessment" });
  }
});

// Update injury assessment (for medics)
router.put("/:id/review", authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE injury_data SET 
        status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *`,
      [status, req.user.id, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Injury assessment not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating injury assessment:", error);
    res.status(500).json({ error: "Failed to update injury assessment" });
  }
});

module.exports = router;
