/**
 * Relational Database Schema (SQLite / MySQL) Specification
 * Corresponds to Section 4 & 6 of the SDF04 Project Proposal.
 */

export const SQL_SCHEMA_DDL = `
-- FitForge Workout Recommender and Progress Tracker
-- Relational Database DDL (SQLite / MySQL Compatible)
-- Course: SDF04 (Object-Oriented Programming & Database)
-- Author: Malo, Kent S.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) DEFAULT 'member' CHECK(role IN ('member', 'admin', 'trainer')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 10 AND age <= 120),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    height_cm REAL NOT NULL CHECK (height_cm > 0 AND height_cm <= 300),
    weight_kg REAL NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 500),
    experience_level VARCHAR(20) DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    fitness_goal VARCHAR(30) DEFAULT 'muscle_gain' CHECK (fitness_goal IN ('weight_loss', 'muscle_gain', 'strength', 'endurance')),
    activity_level VARCHAR(20) DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active')),
    target_workouts_per_week INTEGER DEFAULT 4 CHECK (target_workouts_per_week BETWEEN 1 AND 7),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(150) NOT NULL,
    split_type VARCHAR(20) NOT NULL CHECK (split_type IN ('push', 'pull', 'legs_core', 'full_body')),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    calories_burned INTEGER NOT NULL DEFAULT 0 CHECK (calories_burned >= 0),
    rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    notes TEXT,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exercise_logs (
    id VARCHAR(64) PRIMARY KEY,
    record_id VARCHAR(64) NOT NULL,
    exercise_name VARCHAR(100) NOT NULL,
    target_muscle VARCHAR(100),
    equipment VARCHAR(100),
    set_number INTEGER NOT NULL CHECK (set_number > 0),
    target_reps INTEGER NOT NULL CHECK (target_reps > 0),
    actual_reps INTEGER NOT NULL CHECK (actual_reps >= 0),
    target_weight_kg REAL NOT NULL DEFAULT 0 CHECK (target_weight_kg >= 0),
    actual_weight_kg REAL NOT NULL DEFAULT 0 CHECK (actual_weight_kg >= 0),
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (record_id) REFERENCES workout_records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_records_user ON workout_records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON workout_records(date);
CREATE INDEX IF NOT EXISTS idx_exercise_record ON exercise_logs(record_id);
`;

export interface SchemaTableInfo {
  tableName: string;
  purpose: string;
  primaryKey: string;
  foreignKeys: string[];
  attributes: { name: string; type: string; constraints: string }[];
}

export const SCHEMA_TABLES: SchemaTableInfo[] = [
  {
    tableName: 'users',
    purpose: 'Stores authentication credentials and account authorization data.',
    primaryKey: 'id',
    foreignKeys: [],
    attributes: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY' },
      { name: 'username', type: 'VARCHAR(50)', constraints: 'NOT NULL, UNIQUE' },
      { name: 'email', type: 'VARCHAR(100)', constraints: 'NOT NULL, UNIQUE' },
      { name: 'role', type: 'VARCHAR(20)', constraints: 'CHECK IN (member, admin, trainer)' },
      { name: 'password_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
  {
    tableName: 'member_profiles',
    purpose: 'Stores member biometrics, BMI inputs, goals, and weekly targets.',
    primaryKey: 'id',
    foreignKeys: ['user_id -> users(id)'],
    attributes: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY' },
      { name: 'user_id', type: 'VARCHAR(64)', constraints: 'NOT NULL, UNIQUE, FK' },
      { name: 'full_name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
      { name: 'age', type: 'INTEGER', constraints: 'CHECK (10 <= age <= 120)' },
      { name: 'gender', type: 'VARCHAR(10)', constraints: 'CHECK IN (male, female, other)' },
      { name: 'height_cm', type: 'REAL', constraints: 'CHECK (> 0 AND <= 300)' },
      { name: 'weight_kg', type: 'REAL', constraints: 'CHECK (> 0 AND <= 500)' },
      { name: 'experience_level', type: 'VARCHAR(20)', constraints: 'beginner | intermediate | advanced' },
      { name: 'fitness_goal', type: 'VARCHAR(30)', constraints: 'weight_loss | muscle_gain | strength | endurance' },
      { name: 'activity_level', type: 'VARCHAR(20)', constraints: 'sedentary .. extra_active' },
      { name: 'target_workouts_per_week', type: 'INTEGER', constraints: 'CHECK (1 to 7)' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
  {
    tableName: 'workout_records',
    purpose: 'Stores completed/logged workout sessions with duration, calories, and split.',
    primaryKey: 'id',
    foreignKeys: ['user_id -> users(id)'],
    attributes: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY' },
      { name: 'user_id', type: 'VARCHAR(64)', constraints: 'NOT NULL, FK' },
      { name: 'title', type: 'VARCHAR(150)', constraints: 'NOT NULL' },
      { name: 'split_type', type: 'VARCHAR(20)', constraints: 'push | pull | legs_core | full_body' },
      { name: 'duration_minutes', type: 'INTEGER', constraints: 'CHECK (> 0)' },
      { name: 'calories_burned', type: 'INTEGER', constraints: 'CHECK (>= 0)' },
      { name: 'rating', type: 'INTEGER', constraints: 'CHECK (1 to 5)' },
      { name: 'notes', type: 'TEXT', constraints: 'OPTIONAL' },
      { name: 'date', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP' },
    ],
  },
  {
    tableName: 'exercise_logs',
    purpose: 'Stores individual exercise set results, weights, reps, and completion flags.',
    primaryKey: 'id',
    foreignKeys: ['record_id -> workout_records(id)'],
    attributes: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY' },
      { name: 'record_id', type: 'VARCHAR(64)', constraints: 'NOT NULL, FK' },
      { name: 'exercise_name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
      { name: 'target_muscle', type: 'VARCHAR(100)', constraints: 'OPTIONAL' },
      { name: 'set_number', type: 'INTEGER', constraints: 'CHECK (> 0)' },
      { name: 'target_reps', type: 'INTEGER', constraints: 'CHECK (> 0)' },
      { name: 'actual_reps', type: 'INTEGER', constraints: 'CHECK (>= 0)' },
      { name: 'target_weight_kg', type: 'REAL', constraints: 'CHECK (>= 0)' },
      { name: 'actual_weight_kg', type: 'REAL', constraints: 'CHECK (>= 0)' },
      { name: 'completed', type: 'BOOLEAN', constraints: 'DEFAULT 0' },
    ],
  },
];
