const pool = require("../config/database")

const setupDatabase = async () => {
  try {
    console.log("🔧 Setting up database...")

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'athlete',
        subscription_tier VARCHAR(50) DEFAULT 'free',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        details TEXT,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Whereabouts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whereabouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        activity_type VARCHAR(100),
        notes TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        status VARCHAR(50) DEFAULT 'pending',
        verified BOOLEAN DEFAULT FALSE,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        phone_number VARCHAR(20),
        checkout_request_id VARCHAR(255),
        merchant_request_id VARCHAR(255),
        mpesa_receipt_number VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        package_type VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `)

    // Create indexes
    await pool.query("CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);")
    await pool.query("CREATE INDEX IF NOT EXISTS idx_whereabouts_user_id ON whereabouts(user_id);")
    await pool.query("CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);")

    console.log("✅ Database setup completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    process.exit(1)
  }
}

setupDatabase()
