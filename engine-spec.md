# Engine Specification — MoodBot (Readable & Technical)

This file documents the rule-based recommendation engine used by the MoodBot MVP.

Overview
- Input: room dimensions, light (strength & tone), objective, 4-question personality profile, household constraints, optional preferred accent.
- Library: `palette.json` — each shade must provide `id`, `name`, `hex`, `lrv`, `undertone`, `family`.
- Output: 3-shade palette (Base, Accent, Trim/Ceiling), explanation strings, paint litre estimates.

Core pipeline
1. Collect & normalize inputs.
2. Light analysis: compute a target LRV that expresses how light/dark the base should be.
3. Objective filter: apply a base LRV shift and biases (e.g., cozy => warmer).
4. Personality mapping: map 4 answers to modifiers controlling accent freedom vs neutral bias.
5. Household reality: prune/penalize shades (kids, pets, budget heuristics).
6. Scoring: compute an additive score per shade:
   - Environmental fit (LRV closeness)
   - Undertone match (warm/cool)
   - Personality fit (family-based boosts)
   - Practical penalties (kids/pets)
   - Preferred accent boost
7. Assemble palette:
   - Base: preference for neutral + LRV fit
   - Accent: maximize visual contrast vs base and personality freedom
   - Trim: prefer light/clean shade for edges
8. Estimate paint (litres): wall area × coats ÷ coverage (default 120 sqft per litre). Round up for purchase.

Data models
- Shade: {id, name, hex, lrv, undertone, family, _hsl, _luma}
- Inputs: {roomProps, persona, light, objective, household}
- Result: {palette: {base, accent, trim}, estimates, explanation}

Performance constraints
- Single evaluation < 10 ms on modern smartphones (algorithm is O(n) over palette size)
- Offline-first: all operations in browser, optional palette fetching

Extensibility
- Weights are simple constants in engine.js — move them into a config JSON for A/B tuning.
- Collect votes: store result + user acceptance to build a small dataset to re-weight heuristics.
- Replace scoring component with a light ML model that takes same inputs and outputs probabilities for shades.

Testing
- Unit tests: scoring should be deterministic given a seeded palette.
- Cross-browser tests: ensure color parsing works across platforms.
