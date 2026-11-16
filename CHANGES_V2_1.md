# Cauã Portfolio — v2.1 Static Vercel Deployment Fix

## Symptom
After importing the approved v2 into Vercel, the public page showed HTTP 500 `FUNCTION_INVOCATION_FAILED` instead of the static portfolio. The exact runtime trace has not been retrieved, but Vercel now detects root `server.mjs` files as Node server entrypoints.

## Changes
- Moved the local-only Node preview server out of the root entrypoint path: `server.mjs` → `scripts/serve-local.mjs`.
- Removed the package `start` script to avoid treating the static site as a server deployment. Local development uses `npm run dev`; production-style local preview uses `npm run serve:local`.
- Updated local smoke tests and documentation to reference the new server path.
- Added a test that asserts the Vercel build emits a static `dist/` site without an inferred Node root server.
- Kept the approved visual design, page content, review gates and `vercel.json` build/output settings unchanged.

## Validation
Run `npm test` and `npm run test:browser:offline`. A successful GitHub push should trigger a fresh Vercel deployment. Confirm the new deployment URL returns HTML instead of the Vercel 500 error, and verify assets, SPA routes and mobile behavior.