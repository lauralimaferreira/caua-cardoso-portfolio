CREATE TABLE IF NOT EXISTS portfolio_public_profile (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
