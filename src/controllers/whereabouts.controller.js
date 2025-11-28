const pool = require("../config/database")

exports.getWhereabouts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM whereabouts 
       WHERE user_id = $1 
       ORDER BY date DESC, time_slot DESC 
       LIMIT 100`,
      [req.user.id],
    )

    res.json({ whereabouts: result.rows })
  } catch (error) {
    console.error("Get whereabouts error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.submitWhereabout = async (req, res) => {
  try {
    const { date, time_slot, location, address, city, country, activity_type, notes, latitude, longitude } = req.body

    const result = await pool.query(
      `INSERT INTO whereabouts 
       (user_id, date, time_slot, location, address, city, country, activity_type, notes, latitude, longitude, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        req.user.id,
        date,
        time_slot,
        location,
        address,
        city,
        country,
        activity_type,
        notes,
        latitude,
        longitude,
        "pending",
      ],
    )

    res.status(201).json({ whereabout: result.rows[0] })
  } catch (error) {
    console.error("Submit whereabout error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.updateWhereabout = async (req, res) => {
  try {
    const { id } = req.params
    const { date, time_slot, location, address, city, country, activity_type, notes, latitude, longitude } = req.body

    const result = await pool.query(
      `UPDATE whereabouts 
       SET date = $1, time_slot = $2, location = $3, address = $4, city = $5, 
           country = $6, activity_type = $7, notes = $8, latitude = $9, longitude = $10 
       WHERE id = $11 AND user_id = $12 
       RETURNING *`,
      [date, time_slot, location, address, city, country, activity_type, notes, latitude, longitude, id, req.user.id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Whereabout not found" })
    }

    res.json({ whereabout: result.rows[0] })
  } catch (error) {
    console.error("Update whereabout error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.deleteWhereabout = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM whereabouts WHERE id = $1 AND user_id = $2 RETURNING id", [
      id,
      req.user.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Whereabout not found" })
    }

    res.json({ message: "Whereabout deleted successfully" })
  } catch (error) {
    console.error("Delete whereabout error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.verifyWhereabout = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `UPDATE whereabouts 
       SET status = 'verified', verified_at = NOW(), verified = true 
       WHERE id = $1 
       RETURNING *`,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Whereabout not found" })
    }

    res.json({ whereabout: result.rows[0] })
  } catch (error) {
    console.error("Verify whereabout error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
