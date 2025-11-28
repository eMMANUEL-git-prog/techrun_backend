const { generateAIContent } = require("../config/gemini")
const pool = require("../config/database")

exports.chat = async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: "Message is required" })
    }

    const prompt = `You are an expert athletics assistant helping athletes with training, nutrition, and compliance. 
    User message: ${message}
    Provide a helpful, concise response (max 3 paragraphs).`

    const response = await generateAIContent(prompt)

    res.json({ response })
  } catch (error) {
    console.error("AI chat error:", error)
    res.status(500).json({ error: "AI service temporarily unavailable" })
  }
}

exports.calculateNutrition = async (req, res) => {
  try {
    const { age, weight, height, gender, activityLevel } = req.body

    // Harris-Benedict BMR calculation
    let bmr
    if (gender === "male") {
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
    } else {
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    }

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.55)

    // Generate AI recommendations
    const prompt = `For an athlete: Age ${age}, Weight ${weight}kg, Height ${height}cm, Gender ${gender}, Activity Level ${activityLevel}.
    BMR: ${Math.round(bmr)}, TDEE: ${Math.round(tdee)}.
    Provide 5 specific nutrition recommendations in bullet points.`

    const aiRecommendations = await generateAIContent(prompt)

    res.json({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      protein: Math.round((tdee * 0.25) / 4),
      carbs: Math.round((tdee * 0.55) / 4),
      fat: Math.round((tdee * 0.2) / 9),
      recommendations: aiRecommendations,
    })
  } catch (error) {
    console.error("Calculate nutrition error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.predictPerformance = async (req, res) => {
  try {
    const { currentMetrics, trainingHistory } = req.body

    const prompt = `Analyze athlete performance data and predict future trends.
    Current Metrics: ${JSON.stringify(currentMetrics)}
    Training History: ${JSON.stringify(trainingHistory)}
    Provide: 1) Performance trend 2) Next week prediction 3) 3 actionable recommendations`

    const aiPrediction = await generateAIContent(prompt)

    res.json({
      prediction: aiPrediction,
      trend: "improving",
      confidence: 0.85,
    })
  } catch (error) {
    console.error("Predict performance error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.checkMedication = async (req, res) => {
  try {
    const { medications } = req.body

    const prompt = `Check for drug interactions and doping compliance for these medications: ${medications.join(", ")}.
    Provide: 1) Safety status 2) Any interactions 3) WADA compliance notes`

    const aiResponse = await generateAIContent(prompt)

    res.json({
      analysis: aiResponse,
      medications,
    })
  } catch (error) {
    console.error("Check medication error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.generateAlerts = async (req, res) => {
  try {
    const user = req.user

    // Get user's recent activity
    const whereabouts = await pool.query(
      "SELECT COUNT(*) as count FROM whereabouts WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'",
      [user.id],
    )

    const alerts = []

    if (whereabouts.rows[0].count < 3) {
      alerts.push({
        type: "location",
        severity: "high",
        message: "Whereabouts submissions below required threshold",
      })
    }

    // Generate AI-based alerts
    const prompt = `Generate 2 personalized alerts for a ${user.role} in athletics management. 
    Make them relevant, actionable, and professional. Return as JSON array with type, severity, and message.`

    try {
      const aiAlerts = await generateAIContent(prompt)
      const parsed = JSON.parse(aiAlerts)
      alerts.push(...parsed)
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
    }

    res.json({ alerts })
  } catch (error) {
    console.error("Generate alerts error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
