-- Add rental categories and stay duration to properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS rental_category TEXT NOT NULL DEFAULT 'long_term'
    CHECK (rental_category IN ('short_stay', 'temporary', 'long_term')),
  ADD COLUMN IF NOT EXISTS min_stay_days INTEGER,
  ADD COLUMN IF NOT EXISTS max_stay_days INTEGER;

-- Add rental_category to tenant_requests
ALTER TABLE tenant_requests
  ADD COLUMN IF NOT EXISTS rental_category TEXT
    CHECK (rental_category IN ('short_stay', 'temporary', 'long_term'));
