const { generateAIContent } = require("../config/gemini");
const pool = require("../config/database");

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const prompt = `You are an expert athletics assistant helping athletes with training, nutrition, and compliance. 
    User message: ${message}
    Provide a helpful, concise response (max 3 paragraphs).`;

    const response = await generateAIContent(prompt);

    res.json({ response });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: "AI service temporarily unavailable" });
  }
};

exports.calculateNutrition = async (req, res) => {
  try {
    const { age, weight, height, gender, activityLevel } = req.body;

    // Harris-Benedict BMR calculation
    let bmr;
    if (gender === "male") {
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

    // Generate AI recommendations
    const prompt = `For an athlete: Age ${age}, Weight ${weight}kg, Height ${height}cm, Gender ${gender}, Activity Level ${activityLevel}.
    BMR: ${Math.round(bmr)}, TDEE: ${Math.round(tdee)}.
    Provide 5 specific nutrition recommendations in bullet points.`;

    const aiRecommendations = await generateAIContent(prompt);

    res.json({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      protein: Math.round((tdee * 0.25) / 4),
      carbs: Math.round((tdee * 0.55) / 4),
      fat: Math.round((tdee * 0.2) / 9),
      recommendations: aiRecommendations,
    });
  } catch (error) {
    console.error("Calculate nutrition error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.predictPerformance = async (req, res) => {
  try {
    const { currentMetrics, trainingHistory } = req.body;

    const prompt = `Analyze athlete performance data and predict future trends.
    Current Metrics: ${JSON.stringify(currentMetrics)}
    Training History: ${JSON.stringify(trainingHistory)}
    Provide: 1) Performance trend 2) Next week prediction 3) 3 actionable recommendations`;

    const aiPrediction = await generateAIContent(prompt);

    res.json({
      prediction: aiPrediction,
      trend: "improving",
      confidence: 0.85,
    });
  } catch (error) {
    console.error("Predict performance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.checkMedication = async (req, res) => {
  try {
    const { medications } = req.body;

    const prompt = `Check for drug interactions and doping compliance for these medications: ${medications.join(
      ", "
    )}.
    Provide: 1) Safety status 2) Any interactions 3) WADA compliance notes`;

    const aiResponse = await generateAIContent(prompt);

    res.json({
      analysis: aiResponse,
      medications,
    });
  } catch (error) {
    console.error("Check medication error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.generateAlerts = async (req, res) => {
  try {
    const user = req.user;

    // Get user's recent activity
    const whereabouts = await pool.query(
      "SELECT COUNT(*) as count FROM whereabouts WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'",
      [user.id]
    );

    const alerts = [];

    if (whereabouts.rows[0].count < 3) {
      alerts.push({
        type: "location",
        severity: "high",
        message: "Whereabouts submissions below required threshold",
      });
    }

    // Generate AI-based alerts
    const prompt = `Generate 2 personalized alerts for a ${user.role} in athletics management. 
    Make them relevant, actionable, and professional. Return as JSON array with type, severity, and message.`;

    try {
      const aiAlerts = await generateAIContent(prompt);
      const parsed = JSON.parse(aiAlerts);
      alerts.push(...parsed);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
    }

    res.json({ alerts });
  } catch (error) {
    console.error("Generate alerts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.analyzeBiomechanics = async (req, res) => {
  try {
    const { biomechanicsData } = req.body;

    const prompt = `Analyze this athlete's biomechanics data:
    - Gait cycle: ${biomechanicsData.gait_cycle_duration}ms
    - Foot strike: ${biomechanicsData.foot_strike_pattern}
    - Pronation: ${biomechanicsData.pronation_type}
    - Impact force: ${biomechanicsData.impact_force}N
    - Stride length: ${biomechanicsData.stride_length}m
    - Cadence: ${biomechanicsData.cadence} steps/min
    - Ground contact time: ${biomechanicsData.ground_contact_time}ms
    - Vertical oscillation: ${biomechanicsData.vertical_oscillation}cm
    - Form quality score: ${biomechanicsData.form_quality_score}/10
    
    Provide:
    1. Overall assessment (good/fair/poor)
    2. Key strengths (2-3 points)
    3. Areas for improvement (2-3 points)
    4. Specific technique recommendations (3-4 actionable items)
    5. Injury risk factors based on the data
    
    Be specific and actionable.`;

    const analysis = await generateAIContent(prompt);

    // Save analysis to database if needed
    await pool.query(
      `INSERT INTO biomechanics_data (user_id, gait_cycle_duration, foot_strike_pattern, pronation_type,
        impact_force, stride_length, cadence, ground_contact_time, vertical_oscillation,
        form_quality_score, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        req.user.id,
        biomechanicsData.gait_cycle_duration,
        biomechanicsData.foot_strike_pattern,
        biomechanicsData.pronation_type,
        biomechanicsData.impact_force,
        biomechanicsData.stride_length,
        biomechanicsData.cadence,
        biomechanicsData.ground_contact_time,
        biomechanicsData.vertical_oscillation,
        biomechanicsData.form_quality_score,
        analysis,
      ]
    );

    res.json({ analysis, status: "success" });
  } catch (error) {
    console.error("Analyze biomechanics error:", error);
    res.status(500).json({ error: "Failed to analyze biomechanics data" });
  }
};

exports.predictInjuryRisk = async (req, res) => {
  try {
    const { trainingLoad, biomechanics, history } = req.body;

    const prompt = `Predict injury risk for an athlete based on:
    
    Training Load:
    - Weekly load: ${trainingLoad?.weekly_load || "N/A"}
    - Acute/Chronic ratio: ${trainingLoad?.ac_ratio || "N/A"}
    - Recent spike: ${trainingLoad?.spike || "No"}
    
    Biomechanics:
    - Impact force: ${biomechanics?.impact_force || "N/A"}N
    - Asymmetry: ${biomechanics?.asymmetry || "N/A"}%
    - Joint loads: Ankle ${biomechanics?.ankle_load || "N/A"}N, Knee ${
      biomechanics?.knee_load || "N/A"
    }N
    
    History:
    - Previous injuries: ${history?.previous_injuries || "None reported"}
    - Days since last injury: ${history?.days_since_injury || "N/A"}
    
    Provide:
    1. Overall risk level (low/moderate/high/critical)
    2. Risk score (0-100)
    3. Top 3 specific injury risks (e.g., stress fracture, Achilles tendinopathy)
    4. 5 prevention strategies
    5. When to rest (specific guidance)
    
    Format as JSON with keys: riskLevel, riskScore, specificRisks (array), preventionStrategies (array), restGuidance`;

    const aiResponse = await generateAIContent(prompt);

    // Try to parse JSON, fallback to text response
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      result = { analysis: aiResponse };
    }

    // Save to database
    await pool.query(
      `INSERT INTO injury_data (user_id, overall_injury_risk, risk_score, 
        prevention_recommendations, status)
      VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        result.riskLevel || "moderate",
        result.riskScore || 50,
        JSON.stringify(result.preventionStrategies || []),
        "active",
      ]
    );

    res.json(result);
  } catch (error) {
    console.error("Predict injury error:", error);
    res.status(500).json({ error: "Failed to predict injury risk" });
  }
};

exports.recommendTrainingLoad = async (req, res) => {
  try {
    const { currentLoad, recentLoads, goals, recoveryStatus } = req.body;

    const prompt = `Recommend optimal training load for next week:
    
    Current Status:
    - This week's load: ${currentLoad?.weekly || "N/A"}
    - AC Ratio: ${currentLoad?.acRatio || "N/A"}
    - Recovery score: ${recoveryStatus?.score || "N/A"}/10
    - Fatigue level: ${recoveryStatus?.fatigue || "N/A"}/10
    - Sleep quality: ${recoveryStatus?.sleep || "N/A"}/10
    
    Recent Trend: ${recentLoads?.map((l) => l.load).join(", ") || "N/A"}
    
    Goals: ${goals?.description || "General fitness"}
    Target race: ${goals?.raceDate || "None specified"}
    
    Provide:
    1. Recommended load for next week (number)
    2. Rationale (2-3 sentences)
    3. Daily breakdown (7 days with activity type and intensity)
    4. Recovery recommendations (3-4 specific items)
    5. Red flags to watch for (3 warning signs)
    
    Format as JSON with keys: recommendedLoad, rationale, dailyPlan (array), recoveryTips (array), warnings (array)`;

    const aiResponse = await generateAIContent(prompt);

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      result = { recommendation: aiResponse };
    }

    res.json(result);
  } catch (error) {
    console.error("Recommend training load error:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
};

exports.evaluateEquipment = async (req, res) => {
  try {
    const { equipment, usage, athleteProfile } = req.body;

    const prompt = `Evaluate running equipment condition and recommend action:
    
    Equipment Details:
    - Type: ${equipment?.type || "shoes"}
    - Brand/Model: ${equipment?.brand} ${equipment?.model}
    - Age: ${equipment?.age || "Unknown"}
    - Total mileage: ${equipment?.mileage || 0}km
    - Total uses: ${equipment?.uses || 0}
    
    Recent Usage:
    - Weekly average: ${usage?.weeklyKm || 0}km
    - Terrain: ${usage?.terrain || "mixed"}
    - Surface: ${usage?.surface || "road"}
    
    Athlete Profile:
    - Weight: ${athleteProfile?.weight || "N/A"}kg
    - Foot strike: ${athleteProfile?.footStrike || "N/A"}
    - Pronation: ${athleteProfile?.pronation || "neutral"}
    
    Provide:
    1. Cushioning score (0-10, where 10 is new)
    2. Wear level (new/good/fair/worn/replace)
    3. Estimated remaining km before replacement
    4. Specific wear indicators to watch for
    5. Replacement recommendations (specific models if appropriate)
    6. Usage optimization tips
    
    Format as JSON with keys: cushioningScore, wearLevel, remainingKm, wearIndicators (array), replacementAdvice, optimizationTips (array)`;

    const aiResponse = await generateAIContent(prompt);

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      result = { evaluation: aiResponse };
    }

    res.json(result);
  } catch (error) {
    console.error("Evaluate equipment error:", error);
    res.status(500).json({ error: "Failed to evaluate equipment" });
  }
};

exports.optimizePerformance = async (req, res) => {
  try {
    const { currentPerformance, goals, constraints } = req.body;

    const prompt = `Create a performance optimization plan:
    
    Current Performance:
    - Recent times: ${JSON.stringify(currentPerformance?.times || {})}
    - Training volume: ${currentPerformance?.weeklyKm || "N/A"}km/week
    - Performance trend: ${currentPerformance?.trend || "stable"}
    - Limiters: ${currentPerformance?.limiters || "Not specified"}
    
    Goals:
    - Target race: ${goals?.race || "General improvement"}
    - Target time: ${goals?.targetTime || "N/A"}
    - Race date: ${goals?.raceDate || "N/A"}
    - Weeks to race: ${goals?.weeksOut || "N/A"}
    
    Constraints:
    - Available training days: ${constraints?.daysPerWeek || 5}/week
    - Time per session: ${constraints?.timePerSession || "N/A"} minutes
    - Injury concerns: ${constraints?.injuries || "None"}
    
    Provide a detailed 12-week optimization plan with:
    1. Overall performance score (0-100)
    2. Efficiency score (0-100)
    3. Predicted race times for common distances
    4. Improvement potential percentage
    5. Weekly training structure (phases)
    6. 5 strength training exercises specific to their needs
    7. 3 technique corrections with descriptions
    8. Energy efficiency tips
    9. Race pacing strategy
    
    Format as JSON with keys: performanceScore, efficiencyScore, predictedTimes (object), improvementPotential, weeklyStructure (array), strengthExercises (array), techniqueCorrections (array), efficiencyTips (array), pacingStrategy`;

    const aiResponse = await generateAIContent(prompt);

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      result = { plan: aiResponse };
    }

    // Save to database
    await pool.query(
      `INSERT INTO performance_data (user_id, performance_score, efficiency_score,
        predicted_race_time, improvement_potential_percentage, performance_trend,
        strength_training_recommendations, technique_corrections, optimal_pace_strategy)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        req.user.id,
        result.performanceScore || 75,
        result.efficiencyScore || 70,
        JSON.stringify(result.predictedTimes || {}),
        result.improvementPotential || 15,
        currentPerformance?.trend || "stable",
        JSON.stringify(result.strengthExercises || []),
        JSON.stringify(result.techniqueCorrections || []),
        JSON.stringify(result.pacingStrategy || {}),
      ]
    );

    res.json(result);
  } catch (error) {
    console.error("Optimize performance error:", error);
    res.status(500).json({ error: "Failed to optimize performance" });
  }
};

exports.analyzeBehavior = async (req, res) => {
  try {
    const { trainingLog, consistency, mood, stress } = req.body;

    const prompt = `Analyze athlete's behavioral patterns and provide psychological insights:
    
    Training Log (last 4 weeks):
    - Sessions completed: ${trainingLog?.completed || 0}/${
      trainingLog?.planned || 0
    }
    - Consistency: ${consistency?.percentage || "N/A"}%
    - Missed sessions: ${trainingLog?.missed || 0}
    - Average quality rating: ${trainingLog?.avgQuality || "N/A"}/10
    
    Psychological Indicators:
    - Recent mood: ${mood?.recent || "Not reported"}
    - Motivation trend: ${mood?.motivationTrend || "stable"}
    - Stress level: ${stress?.level || "moderate"}
    - Sleep quality: ${stress?.sleep || "fair"}
    - Life stressors: ${stress?.external || "None reported"}
    
    Competition:
    - Next competition: ${trainingLog?.nextRace || "None scheduled"}
    - Pre-competition anxiety: ${mood?.raceAnxiety || "Not assessed"}
    
    Provide:
    1. Overall motivation score (0-10)
    2. Training consistency percentage
    3. Identified risky behaviors (array of 3-5 items)
    4. Positive patterns to reinforce (array of 2-3 items)
    5. Stress management recommendations (array of 4-5 items)
    6. Burnout risk (low/moderate/high)
    7. Competition anxiety score (0-10)
    8. Psychological support recommendations (array of 3-4 items)
    
    Format as JSON with keys: motivationScore, consistencyPercentage, riskyBehaviors (array), positivePatterns (array), stressManagement (array), burnoutRisk, anxietyScore, psychologicalSupport (array)`;

    const aiResponse = await generateAIContent(prompt);

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      result = { analysis: aiResponse };
    }

    // Save to database
    await pool.query(
      `INSERT INTO behavioral_insights (user_id, motivation_score, training_consistency_percentage,
        risky_behaviors, positive_patterns, stress_level, competition_anxiety_score,
        burnout_risk, psychological_support_recommendations, period_start, period_end)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        req.user.id,
        result.motivationScore || 7,
        result.consistencyPercentage || 80,
        JSON.stringify(result.riskyBehaviors || []),
        JSON.stringify(result.positivePatterns || []),
        stress?.level || "moderate",
        result.anxietyScore || 5,
        result.burnoutRisk || "low",
        JSON.stringify(result.psychologicalSupport || []),
        new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 4 weeks ago
        new Date(),
      ]
    );

    res.json(result);
  } catch (error) {
    console.error("Analyze behavior error:", error);
    res.status(500).json({ error: "Failed to analyze behavioral patterns" });
  }
};
