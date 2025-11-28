# Athletics Management Backend

Express.js backend with PostgreSQL, Gemini AI, and M-Pesa integration.

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### 2. Database Setup

Install PostgreSQL if you haven't already:

**On Ubuntu/Debian:**
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
\`\`\`

**On macOS (with Homebrew):**
\`\`\`bash
brew install postgresql
brew services start postgresql
\`\`\`

**On Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 3. Create Database

\`\`\`bash
sudo -u postgres psql
CREATE DATABASE athlete_track_db;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE athlete_track_db TO your_user;
\q
\`\`\`

### 4. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

\`\`\`bash
cp .env.example .env
\`\`\`

**Required API Keys:**

- **Gemini AI API Key**: Get from https://makersuite.google.com/app/apikey
- **M-Pesa Credentials**: Get from https://developer.safaricom.co.ke/
  1. Create an app
  2. Get Consumer Key and Consumer Secret
  3. Get Passkey from the test credentials section

### 5. Run Database Setup

\`\`\`bash
npm run db:setup
npm run db:seed
\`\`\`

### 6. Start Server

**Development:**
\`\`\`bash
npm run dev
\`\`\`

**Production:**
\`\`\`bash
npm start
\`\`\`

Server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts/:id/read` - Mark as read
- `DELETE /api/alerts/:id` - Delete alert

### Whereabouts
- `GET /api/whereabouts` - Get whereabouts
- `POST /api/whereabouts/submissions` - Submit whereabout
- `PUT /api/whereabouts/:id` - Update whereabout
- `DELETE /api/whereabouts/:id` - Delete whereabout
- `POST /api/whereabouts/:id/verify` - Verify whereabout

### AI Services
- `POST /api/ai/chat` - AI chat assistant
- `POST /api/ai/nutrition/calculate` - Calculate nutrition
- `POST /api/ai/performance/predict` - Predict performance
- `POST /api/ai/medication/check` - Check medications
- `POST /api/ai/alerts/generate` - Generate AI alerts

### Payments
- `POST /api/payments/mpesa/stk-push` - Initiate M-Pesa payment
- `POST /api/payments/mpesa/callback` - M-Pesa callback
- `GET /api/payments/transactions` - Get transactions

### Users (Admin)
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PUT /api/users/:id/subscription` - Update subscription (Admin only)

## Testing M-Pesa STK Push

Use Safaricom test credentials:
- Phone: 254708374149
- Amount: Any amount (e.g., 1)

The STK push will appear on the test phone.

## Database Schema

- **users**: User accounts with roles and subscriptions
- **alerts**: User notifications and alerts
- **whereabouts**: Location submissions for anti-doping compliance
- **transactions**: Payment transactions

## Notes

- All endpoints except auth require Bearer token
- M-Pesa integration uses Safaricom Daraja API sandbox
- Gemini AI provides intelligent recommendations
- Database uses PostgreSQL with proper indexing
