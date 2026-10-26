-- RS Paper and Packaging - Supabase Schema Migration
-- Run this in Supabase Dashboard -> SQL Editor to add optional columns natively

-- 1. Add previous_due to sales and purchases
ALTER TABLE sales ADD COLUMN IF NOT EXISTS previous_due NUMERIC DEFAULT 0;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS previous_due NUMERIC DEFAULT 0;

-- 2. Add photo to customers and suppliers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '';
