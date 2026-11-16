# Version 2.2 — Static Vercel entrypoint fix

Observed deployment error: `500 FUNCTION_INVOCATION_FAILED`. The Vercel build output said: `Using dist/src/main.js as the root entrypoint`, despite the site being a purely static SPA.

Changes:
- Renamed browser-only script `src/main.js` to `src/site-client.js` to avoid matching the Node backend auto-detection entrypoint named `main.js`.
- Updated HTML, tests and documentation to reference the new browser script.
- Explicitly selected the Vercel **Other** framework preset through `"framework": null` in `vercel.json`; preserved static `dist` output and SPA fallback.
- Extended tests to guard against accidental reintroduction of the backend entrypoint.
- No content/design changes and no backend or Railway dependency.

The Vercel production deployment must still be checked after this commit: building locally doesn't verify deployed routing.