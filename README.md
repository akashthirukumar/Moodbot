# MoodBot — Powered by Birla Opus (Client-side demo)

This repository contains a minimal client-side implementation of MoodBot (proof-of-concept) based on the PRD.

What you'll find:
- `index.html` — Single-page app UI and wizard
- `styles.css` — Dark, glass-like aesthetic
- `engine.js` — Client-side rule-based prediction engine and paint estimator
- `palette.json` — Curated palette with LRV and metadata
- `prd.md`, `roadmap.md`, `engine-spec.md`, `architecture.md` — Product docs

How to run
1. For best results, serve the folder with a static HTTP server.
   - Python 3: `python -m http.server 8000`
   - Node (http-server): `npx http-server -c-1`
2. Open `http://localhost:8000` in your browser.
3. Use the wizard to enter room details and click "Generate".

Offline behavior
- All computation runs in-browser.
- Palette is loaded from `palette.json`; a small fallback palette is embedded in `engine.js` if the fetch fails.

Development notes
- `engine.js` contains the rule-based scoring algorithm. See `engine-spec.md` for design details.
- To expand the palette, edit `palette.json` and include LRV estimates and undertone metadata.

License & authorship
- Created by akashthirukumar as a prototype.
- This demo is provided for educational/product design purposes.

Feedback & next steps
- If you want, I can push these files to your repo directly, or create a branch and open a PR with incremental improvements (routing, tests, build system).
