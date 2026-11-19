-- Retain the existing table and its 12-attempt constraint. Old global budget
-- is no longer used; removing it is idempotent on new or upgraded databases.
CREATE INDEX IF NOT EXISTS portfolio_auth_rate_window ON portfolio_auth_rate_limit(window_start);
DELETE FROM portfolio_auth_rate_limit WHERE scope = 'login';
