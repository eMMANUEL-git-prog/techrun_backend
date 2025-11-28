const pool = require("../config/database")
const bcrypt = require("bcryptjs")

const seedDatabase = async () => {
  try {
    console.log("🌱 Seeding database...")

    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 10)

    const users = [
      ["admin@test.com", hashedPassword, "Admin", "User", "admin", "premium"],
      ["athlete@test.com", hashedPassword, "John", "Athlete", "athlete", "pro"],
      ["coach@test.com", hashedPassword, "Sarah", "Coach", "coach", "pro"],
      ["medic@test.com", hashedPassword, "Dr. James", "Smith", "medic", "free"],
      ["nutritionist@test.com", hashedPassword, "Emma", "Wilson", "nutritionist", "premium"],
    ]

    for (const user of users) {
      await pool.query(
        `INSERT INTO users (email, password, first_name, last_name, role, subscription_tier) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (email) DO NOTHING`,
        user,
      )
    }

    console.log("✅ Database seeded successfully!")
    console.log("\n📝 Test accounts created:")
    console.log("   admin@test.com / password123")
    console.log("   athlete@test.com / password123")
    console.log("   coach@test.com / password123")
    console.log("   medic@test.com / password123")
    console.log("   nutritionist@test.com / password123\n")

    process.exit(0)
  } catch (error) {
    console.error("❌ Database seeding failed:", error)
    process.exit(1)
  }
}

seedDatabase()
