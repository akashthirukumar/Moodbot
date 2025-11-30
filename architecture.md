# Architecture — MoodBot (High level)

This is a single-page, client-side architecture for the MVP.

Files
- index.html — UI shell and wizard
- styles.css — styling
- engine.js — logic, scoring, UI wiring
- palette.json — palette library (JSON)
- prd.md, roadmap.md, engine-spec.md — docs

Runtime flow
1. Browser loads `index.html`.
2. `engine.js` attempts to fetch `palette.json` (fast local file). If unavailable, falls back to embedded palette.
3. User steps through the wizard; inputs are collected into a normalized object.
4. Engine scores shades, assembles palette and estimates paint.
5. Results rendered; user can export JSON.

Design considerations
- No server dependencies — suits offline usage.
- Small payloads — keep palette JSON compact; lazy-load larger palettes on demand.
- Future: split engine logic into modules (scoring, light-sim, export) and add simple UI state management (e.g., tiny state machine or Preact/React if project grows).

Deployment
- Static hosting (GitHub Pages, Netlify, S3 + CloudFront).
- For development, use a local static server to avoid CORS/fetch issues for `palette.json`.

Security & privacy
- No user data is transmitted by default.
- If you add telemetry, be explicit and provide opt-in.
