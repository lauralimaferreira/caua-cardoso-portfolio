import {readFile} from 'node:fs/promises';
const migrations = ['001_auth.sql','002_rate_limit.sql'].map(file=>new URL('../migrations/'+file,import.meta.url));
export function postgresStore(pool) {
  return {
    async migrate() {
      const client=await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(71839201)');
        for(const migration of migrations)await client.query(await readFile(migration,'utf8'));
        await client.query('COMMIT');
      } catch(e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    },
    async healthy() { await pool.query('SELECT 1'); },
    async reserveAttempt(scope) {
      if(!/^ip:v1:[0-9a-f]{64}$/.test(scope))throw Error('Invalid login scope');
      // Separate atomic budgets shared across replicas; bounded retention of stale rows.
      const r=await pool.query(`INSERT INTO portfolio_auth_rate_limit AS limiter(scope, window_start, attempts)
        VALUES ($1,now(),1) ON CONFLICT(scope) DO UPDATE SET
        attempts = CASE WHEN limiter.window_start <= now()-interval '15 minutes' THEN 1 ELSE limiter.attempts+1 END,
        window_start = CASE WHEN limiter.window_start <= now()-interval '15 minutes' THEN now() ELSE limiter.window_start END
        WHERE limiter.window_start <= now()-interval '15 minutes' OR limiter.attempts < 12
        RETURNING attempts`,[scope]);
      return r.rowCount===1;
    },
    async cleanup() {
      await pool.query("DELETE FROM portfolio_auth_rate_limit WHERE window_start < now()-interval '1 day'");
      await pool.query('DELETE FROM portfolio_auth_sessions WHERE expires_at <= now()');
    },
    async createSession(tokenHash, credentialVersion, seconds) {
      await pool.query('DELETE FROM portfolio_auth_sessions WHERE expires_at <= now() OR credential_version <> $1',[credentialVersion]);
      await pool.query("INSERT INTO portfolio_auth_sessions(token_hash,credential_version,expires_at) VALUES ($1,$2,now()+($3::int * interval '1 second'))",[tokenHash,credentialVersion,seconds]);
    },
    async hasSession(tokenHash, credentialVersion) {
      const r=await pool.query('SELECT 1 FROM portfolio_auth_sessions WHERE token_hash=$1 AND credential_version=$2 AND expires_at>now()',[tokenHash,credentialVersion]);
      return r.rowCount===1;
    },
    async revokeSession(tokenHash) { await pool.query('DELETE FROM portfolio_auth_sessions WHERE token_hash=$1',[tokenHash]); },
    async close() { await pool.end(); }
  };
}
