-- Athletics Management System - Seed Data
-- Run this script after 01-create-tables.sql in Supabase SQL Editor

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE transactions, whereabouts, alerts, users RESTART IDENTITY CASCADE;

-- Insert test users
-- Password for all test users: password123 (hashed with bcrypt)
INSERT INTO users (email, password, full_name, first_name, last_name, role, subscription_tier, image_url)
VALUES
  ('admin@test.com', '$2b$10$rWqZ5h5YL5LGZQxJ5bK5u.2pQJ0xQXhK5L5L5L5L5L5L5L5L5L5L5L', 'Admin User', 'Admin', 'User', 'admin', 'premium', '/placeholder.svg?height=100&width=100'),
  ('athlete@test.com', '$2b$10$rWqZ5h5YL5LGZQxJ5bK5u.2pQJ0xQXhK5L5L5L5L5L5L5L5L5L5L5L', 'John Athlete', 'John', 'Athlete', 'athlete', 'pro', '/placeholder.svg?height=100&width=100'),
  ('athlete2@test.com', '$2b$10$rWqZ5h5YL5LGZQxJ5bK5u.2pQJ0xQXhK5L5L5L5L5L5L5L5L5L5L5L', 'Jane Runner', 'Jane', 'Runner', 'athlete', 'free', '/placeholder.svg?height=100&width=100'),
  ('coach@test.com', '$2b$10$rWqZ5h5YL5LGZQxJ5bK5u.2pQJ0xQXhK5L5L5L5L5L5L5L5L5L5L5L', 'Mike Coach', 'Mike', 'Coach', 'coach', 'pro', '/placeholder.svg?height=100&width=100'),
  ('medic@test.com', '$2b$10$rWqZ5h5YL5LGZQxJ5bK5u.2pQJ0xQXhK5L5L5L5L5L5L5L5L5L5L5L', 'Sarah Medic', 'Sarah', 'Medic', 'medic', 'pro', '/placeholder.svg?height=100&width=100'),
  ('nutritionist@test.com', '$2b$10$rWqZ5h5YL5LGZQxJ5bK5u.2pQJ0xQXhK5L5L5L5L5L5L5L5L5L5L5L', 'Emily Nutritionist', 'Emily', 'Nutritionist', 'nutritionist', 'premium', '/placeholder.svg?height=100&width=100')
ON CONFLICT (email) DO NOTHING;

-- Insert sample alerts
INSERT INTO alerts (user_id, type, severity, message, details, read)
SELECT 
  u.id,
  'location',
  'high',
  'Whereabouts Filing Reminder',
  'You have not filed your whereabouts for next week. Please submit your location details.',
  false
FROM users u WHERE u.email = 'athlete@test.com'
UNION ALL
SELECT 
  u.id,
  'medical',
  'medium',
  'Medical Clearance Required',
  'Your annual medical clearance is due next month. Please schedule an appointment.',
  false
FROM users u WHERE u.email = 'athlete2@test.com'
UNION ALL
SELECT 
  u.id,
  'doping',
  'high',
  'Anti-Doping Test Notification',
  'You have been selected for out-of-competition testing on Dec 25, 2024.',
  false
FROM users u WHERE u.email = 'athlete@test.com';

-- Insert sample whereabouts
INSERT INTO whereabouts (
  user_id, date, time_slot, start_time, end_time, 
  location, address, city, country, 
  activity_type, notes, status, verified
)
SELECT 
  u.id,
  CURRENT_DATE + INTERVAL '1 day',
  'Morning (6:00 - 12:00)',
  '06:00',
  '09:00',
  'Training Center',
  '123 Olympic Avenue',
  'Nairobi',
  'Kenya',
  'Training',
  'Morning training session',
  'approved',
  true
FROM users u WHERE u.email = 'athlete@test.com'
UNION ALL
SELECT 
  u.id,
  CURRENT_DATE + INTERVAL '2 days',
  'Afternoon (12:00 - 18:00)',
  '14:00',
  '17:00',
  'Home',
  '456 Athlete Street',
  'Nairobi',
  'Kenya',
  'Rest',
  'Recovery day at home',
  'pending',
  false
FROM users u WHERE u.email = 'athlete@test.com';

-- Insert sample transactions
INSERT INTO transactions (
  user_id, amount, currency, phone_number, 
  status, package_type, payment_method
)
SELECT 
  u.id,
  2999.00,
  'KES',
  '254712345678',
  'completed',
  'pro',
  'mpesa'
FROM users u WHERE u.email = 'athlete@test.com'
UNION ALL
SELECT 
  u.id,
  4999.00,
  'KES',
  '254798765432',
  'completed',
  'premium',
  'card'
FROM users u WHERE u.email = 'nutritionist@test.com';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Test user credentials:';
  RAISE NOTICE '  admin@test.com / password123';
  RAISE NOTICE '  athlete@test.com / password123';
  RAISE NOTICE '  coach@test.com / password123';
  RAISE NOTICE '  medic@test.com / password123';
  RAISE NOTICE '  nutritionist@test.com / password123';
END $$;
