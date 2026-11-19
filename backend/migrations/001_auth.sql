CREATE TABLE IF NOT EXISTS portfolio_auth_sessions (
  token_hash text PRIMARY KEY CHECK (length(token_hash) = 64),
  credential_version text NOT NULL CHECK (length(credential_version) = 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS portfolio_auth_sessions_expiry ON portfolio_auth_sessions(expires_at);
CREATE TABLE IF NOT EXISTS portfolio_auth_rate_limit (
  scope text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts BETWEEN 1 AND 12)
);
