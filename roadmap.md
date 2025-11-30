# MoodBot — Roadmap

This roadmap translates the PRD into short-, mid-, and long-term milestones.

Short term (MVP — 0–4 weeks)
- Fully client-side single-page app (wizard + results)
- Rule-based prediction engine (implemented in `engine.js`)
- Palette JSON and export as JSON
- Basic explainability text per shade
- Mobile-friendly UI and performance targets (fast initial paint)

Medium term (1–3 months)
- Expand palette JSON to cover full Birla Opus families (>200 shades)
- Tunable weight system (expose sliders for designers to tweak)
- Save & load project JSON; accept user feedback on recommendations
- Add offline storage (IndexedDB) for recent projects

Long term (3–12 months)
- Lightweight ML refinement: collect anonymized approval/disapproval to adjust weights
- Light simulation improvements using perceptual color models (CIE L*ab)
- Optional image upload + CV module to detect room undertones and materials
- PDF export, shopping list integrations with local retailers
- Accessibility & localization

Stretch goals
- AR preview integration (mobile)
- Integration with Birla Opus SKU/stock lookup
- Marketplace for recommended accessories and contractors
