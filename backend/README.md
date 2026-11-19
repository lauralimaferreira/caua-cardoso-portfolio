# Phase 2 — authentication and profile editor

The public Vercel site retains its design and can now read the saved profile. This separate Node service serves `/admin` (login and authenticated editing) and a same-origin admin API. PostgreSQL stores sessions, rate limits and the public profile. Photos, additional content sections and full draft/preview/version history belong to later phases.

## Railway setup (only after approval)

1. Create a separate Railway project for Cauã; add a PostgreSQL service. Do not reuse another project's database. Add the portfolio GitHub repository as a second service. Set its **Root Directory** to `/backend`. Use the Dockerfile (service root) and set the config file path to `/backend/railway.toml` if configuring Railway via its config-file setting. Alternatively set healthcheck path `/healthz` in service settings. The repo root remains the Vercel project, and its build output remains static.
2. Generate the backend public domain under Networking. Set `APP_ORIGIN` to that exact `https://...` origin, no trailing slash. The login address is this Railway domain plus `/admin`. No cross-origin login or admin mutation is supported. Only the published profile GET has CORS for the exact `PUBLIC_SITE_ORIGIN` (default: https://caua-cardoso-portfolio.vercel.app).
3. Set `DATABASE_URL` via a Railway reference to the PostgreSQL service's private connection variable (for example `${{Postgres.DATABASE_URL}}`, using its actual service name). `ADMIN_USERNAME=caua`, `NODE_ENV=production`, `AUTH_CLIENT_IP_MODE=railway-edge`, `ADMIN_PASSWORD_HASH` from the command below. Railway provides `PORT`; the app binds to `0.0.0.0`.
4. Generate the hash locally with Node 22. From the repository root, in macOS Terminal (zsh):
   ```sh
   read -s 'PASSWORD?Choose Cauã password: '; printf '\n'
   printf '%s' "$PASSWORD" | node backend/scripts/hash-password.mjs
   unset PASSWORD
   ```
   Copy the **entire hash**, including dollar signs, into Railway's `ADMIN_PASSWORD_HASH` variable. Use a unique password of at least 12 characters; share it privately with Cauã, not in the group or repository. Never store the actual password in GitHub or frontend JavaScript. No default/test password works in production. Changing the hash or username invalidates existing sessions immediately.
5. Deploy. Startup applies `migrations/001_auth.sql`, `002_rate_limit.sql` and `003_profile.sql` inside an advisory-locked transaction. Verify `/healthz` returns 200 and `/admin` opens. Complete real deployment tests: wrong password, successful login, refresh, sign out, second browser session, expiration, database persistence across service restart, HTTPS Secure cookie. Review logs, check profile edits and verify that saved data persists across a restart. Railway may incur charges. Do not create a public database domain; the app connects through private networking. Do not expose a TCP proxy for the backend or allow untrusted private services in the project: the login limiter trusts the Railway HTTP edge only. Before approval, verify that the edge overwrites supplied X-Real-IP values, including repeated or comma-separated headers, and that missing/invalid client identity fails closed. Use a dedicated project with only trusted services.

## Local development

`cd backend && npm ci --ignore-scripts`, set `NODE_ENV=development`, `AUTH_CLIENT_IP_MODE=direct`, `APP_ORIGIN=http://localhost:3000`, `DATABASE_URL` to a local PostgreSQL database, and password hash/username as above. Run `npm start`. HTTP cookies without Secure are permitted only when explicitly running development on a loopback origin. Use the exact host specified in `APP_ORIGIN` in the browser.

No dependencies are required for `npm test` (HTTP + security tests inject an in-memory test store; this store is not part of the production entrypoint). Run `TEST_DATABASE_URL=... npm run test:postgres` against a disposable PostgreSQL instance to test real SQL, concurrent rate limiting, expiry and persistence logic. The integration test creates and drops a dedicated random schema. Do not run it against a production database. The Dockerfile now uses `npm ci --omit=dev --ignore-scripts` and a lockfile with exact versions and tarball integrity hashes. The lockfile was assembled from published package-resolution metadata because the npm registry could not be reached here. `npm ci --dry-run --offline` passed; actual package fetching, integrity verification, PostgreSQL integration and Docker execution remain mandatory release checks. Do not treat a dry run or skipped integration test as a passing production check. Run `npm ci --omit=dev --ignore-scripts` and `npm audit --omit=dev` in a networked environment before deploying.

## Browser tests

`python tests/browser_offline_smoke.py` validates the login UI at three viewport sizes using mocked API responses. `python tests/browser_smoke.py` exercises the same flows against a local real HTTP handler with a test-only in-memory store. The latter was blocked by the sandbox browser policy; run it again in a normal local environment with Playwright and Chromium installed. These tests do not replace the actual PostgreSQL integration test.

## Security choices

- Single account, no self-registration or password recovery. Password is salted scrypt, validated at startup; rotate via Railway variables. A fixed password means a password chosen once and changed when needed, not a password embedded in source.
- Random 256-bit tokens, only SHA-256 digests stored in PostgreSQL. HTTPS cookies are host-only, HttpOnly, Secure, SameSite=Strict, and expire after 12 hours. New login rotates the existing session; logout revokes it in the database. No tokens in localStorage. Database failures fail closed.
- JSON mutations require exact configured Origin. CORS only for public profile reads; no credentialed CORS. Output uses restrictive CSP, no-store, noindex; inputs have length limits. No full request logging or secret values in errors.
- Each IPv4 address or IPv6 /64 has its own PostgreSQL-backed 12-attempt / 15-minute window, including successful attempts. HMAC-derived keys avoid retaining raw IP addresses; stale rate rows are deleted after 24 hours by periodic cleanup. Username changes within one source do not bypass the budget. Direct mode ignores all forwarded headers. Railway-edge mode requires exactly one valid X-Real-IP supplied by trusted HTTP ingress; verify this assumption on the deployed service. A separate two-in-flight bound limits concurrent expensive password checks per process, returning a short retry rather than imposing a global 15-minute lockout. Shared NAT, distributed abuse, resource saturation and proxy misconfiguration remain possible; consider edge protection if needed. No self-service password recovery.
- Session expiry and rate limiting are enforced by PostgreSQL time; expired sessions removed during subsequent logins. Separate device sessions are supported. No permanent lockout. Profile mutations require an active session and the exact admin Origin. The API validates the full public data schema and rejects stale revisions atomically; no draft history is created yet.

## Sources for deployment and dependency resolution

- Railway public networking documentation: https://docs.railway.com/networking/public-networking/specs-and-limits
- Railway support, HTTP edge header overwrite and private-ingress boundary: https://station.railway.com/questions/railway-https-ingress-stable-proxy-cid-a5975383
- Published package metadata for pg 8.16.3: https://app.unpkg.com/pg%408.16.3/files/package.json
- Published dependency-resolution metadata used to assemble the lockfile: https://github.com/patrickAdegbesan/fortunetiles-system/blob/master/package-lock.json (only package names, versions, dependency ranges, tarball URLs and integrity values; not application source). Verify actual tarball integrity with npm ci before release.

## Connect the public site (after successful Railway integration tests)

Set `PORTFOLIO_BACKEND_ORIGIN` in the Vercel project environment to the exact HTTPS Railway backend origin (no trailing slash or `/admin`). Set the Railway `PUBLIC_SITE_ORIGIN` to the exact production Vercel origin. Redeploy the Vercel frontend. The build writes only the public URL, not any backend secret, into `dist/src/site-settings.js`. The Admin Login link appears in the footer and opens the backend's separate same-origin login. Preview domains are not automatically authorized for cross-origin reads.

Without this configuration, the existing public site stays static and has no nonfunctional admin link. If a configured backend is unavailable, it displays the initial portfolio with a clear warning. The backend serving a public JSON endpoint does not make the admin endpoints public. All edits in Phase 2 are live after explicit confirmation, once connected. A private draft workflow and media uploads are deferred.

For Phase 2 run the root `npm test`, `python tests/browser_offline_smoke.py`, `python tests/profile_browser_offline.py`, `python tests/profile_layout_offline.py`, backend `npm test`, `python backend/tests/browser_offline_smoke.py` from the root with Playwright installed, and the real PostgreSQL integration suite (`cd backend && TEST_DATABASE_URL=... npm run test:postgres`). Use a disposable database only.

Phase 2 V2 public behavior: the static baseline is used only if no backend is configured. With the API configured, the public page waits for a validated response; if unavailable, it shows a retry screen rather than old profile values. No persistent local cache of personal details is used.
