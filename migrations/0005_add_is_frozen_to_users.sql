-- Migration: Add is_frozen column to users
ALTER TABLE users ADD COLUMN is_frozen INTEGER NOT NULL DEFAULT 0;
