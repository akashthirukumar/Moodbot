# **📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)**

## **MoodBot — Powered by Birla Opus**

### *Intelligent Colour & Paint Planning Assistant*

---

# **1. Overview**

### **1.1 Product Summary**

MoodBot is a **client-side, interactive colour-personalisation assistant** that guides a user through understanding their room, lighting, personality, and aesthetic preferences to generate:

1. A **3-shade moodchart** (Base, Accent, Trim/Ceiling),
2. A **paint coverage estimate**,
3. A **simple design plan** that explains “why” the chosen palette works.

The next phase of MoodBot requires a **more advanced prediction engine** grounded in human design logic, measurable lighting data, and behavioural preference modelling.

---

# **2. Problem Statement**

Users struggle with:

* Choosing paint colours confidently,
* Understanding how light and furniture affect colour,
* Predicting how much paint to buy,
* Translating subjective feelings (e.g., “calm”, “energetic”, “minimal”) into colours.

Painting is high-stakes: a wrong shade cannot be easily undone.
A guided tool that “listens” to the room and the user solves this.

---

# **3. Goals & Non-Goals**

### **3.1 Goals**

* Deliver **personalised, explainable** colour schemes.
* Use a **predictive model** that weighs room-light-personality factors.
* Provide **instant**, **offline**, **client-side** recommendations.
* Keep the experience **fun**, **beautiful**, and **frictionless**.

### **3.2 Non-Goals**

* MoodBot does *not* aim to replace interior designers.
* It does *not* simulate real 3D rooms or require image inputs (future stretch).
* It does not *output structural renovation advice (only colour guidance).

---

# **4. Target Users**

### **Primary**

* Homeowners / renters choosing colours
* Architecture/interior students
* Painters & contractors
* People without design background

### **Secondary**

* Retail store visitors choosing Birla Opus shades
* Birla Opus marketing partners / campaigns

---

# **5. System Summary (High-Level Logic)**

MoodBot makes colour choices using **three pillars**:

---

## **Pillar 1 — Room Reality**

Interprets **measurable conditions**:

* Room type
* Size
* Ceiling height
* Natural light amount
* Light direction (cool vs warm daylight)
* Artificial light colour temperature
* Count & intensity

**Why?**
Light dramatically changes how colours appear.
Low-light rooms need higher-LRV (lighter) colours.
South/warm rooms can support deeper shades.

---

## **Pillar 2 — Human Personality & Mood**

Four targeted questions extract:

* Extroversion vs Introversion (bold vs gentle accents)
* Practical vs expressive taste
* Strong vs soft contrast preference
* Decisive vs experimental planning style

**Why?**
Two people in identical rooms might want different atmospheres.
This connects **colours to personality**, not just room physics.

---

## **Pillar 3 — Practical Life Constraints**

* Kids / pets
* Furniture undertones
* Flooring material
* Budget
* Preferred accent colours

**Why?**
Design must be livable, not theoretical.

---

# **6. Behavioural Logic (Prediction Framework)**

## **6.1 Overview**

MoodBot uses a **rule-based scoring system** that simulates how a trained designer thinks.

### **Colour Score = Environmental Fit + Personality Fit + Objective Fit + Material Fit + Practical Fit**

Every shade in the palette library (Birla Opus inspired) is scored based on:

* How well it works in the given light
* Whether it fits the user’s intended mood
* Whether it aligns with their personality profile
* Whether it harmonises with furniture & floor
* Whether it's sensible for kids/pets

The top shades form the Base–Accent–Trim trio.

### **Important: This is NOT random.**

It is *ego-free interior design logic*, encoded into structured rules.

---

# **7. Detailed Recommendation Engine Logic (Readable Version)**

This section is written in a professor-friendly way.

---

## **Step 1 — Light Analysis**

The system evaluates:

* Does the room get *strong*, *medium*, or *weak* daylight?
* Is the daylight *cool* (north) or *warm* (south/west)?
* Are the artificial lights warm or cool?
* Is the room overlit or underlit?

**Outcome:**
The engine decides whether to use:

* **High-LRV** colours (reflective, room-brightening)
* **Medium neutrals** (balanced)
* **Deep accents** (dramatic)

---

## **Step 2 — Objective Interpretation**

User’s goal influences the direction:

* *Bigger*: lighter base + low contrast
* *Cozier*: deeper base + warm undertones
* *Taller*: lighter ceilings
* *Shorter*: darker ceilings or trims
* *Brighter*: highest-LRV picks
* *Softer*: desaturated neutrals

**Outcome:**
A filter applied on top of Step 1.

---

## **Step 3 — Personality Mapping**

Personality is inferred from 4 questions.

* **E**: likes liveliness → colour-forward accents
* **I**: likes calm → gentle harmonies
* **S**: grounded → material-matching neutrals
* **N**: imaginative → surprising accents
* **T**: crisp contrast
* **F**: subdued gradients
* **J**: structured, safe
* **P**: playful, boundary-pushing

**Outcome:**
A slope adjustment:

* E/N → more accent freedom
* I/S → tighter neutrals

---

## **Step 4 — Household Reality Check**

* Kids: avoid delicate super-pale walls
* Pets: avoid colours where fur marks show
* Tight budget: prefer fewer accent walls
* Light wood furniture → warm neutrals
* Dark wood → cool neutrals
* Cold flooring → warm up the space
* Terracotta preference → accent locked to that hue family

**Outcome:**
Candidate colours get boosted or pruned.

---

## **Step 5 — Palette Assembly**

From a curated palette list:

### 1. **Base** (most important)

Chosen for:

* Light performance
* Objective (big/cozy/etc.)
* Personality restraint
* Material compatibility

### 2. **Accent**

Chosen for:

* Contrast vs base
* Personality boldness
* Desired mood
* User’s preferred hue (if given)

### 3. **Trim/Ceiling**

Chosen for:

* Whether height should visually increase/decrease
* Balancing the base
* Clean crispness around edges

---

# **8. Paint Estimation Logic**

A simple, honest equation:

**Litres = (Room Area × Number of Coats) ÷ Coverage Rate**

Coverage is set to **120 sqft per litre per coat** (conservative, real-world aligned).

Output:

* Rounded to one decimal
* Purchase rounding: always round UP to nearest litre

---

# **9. User Flow (UX)**

1. **Landing Page:**
   “MoodBot — powered by Birla Opus” → Start
2. **Step Wizard:**

   * Room basics
   * Light & objective
   * Personality quiz
   * Household & finishes
   * Review
3. **Results Page:**

   * 3 shades (with swatches & codes)
   * Action plan
   * Paint litres estimate
4. **Exports:**

   * JSON summary
   * (Future) PDF
5. **Reset / Modify:**
   Users can jump back and adjust any answer.

---

# **10. Requirements**

## **10.1 Functional Requirements**

### **FR1 — Multi-step wizard**

User must answer all sections clearly, with progress indicators.

### **FR2 — Personality Scoring**

Convert 4 answers into a 4-letter profile.

### **FR3 — Prediction Engine**

Compute the three-shade combination using weighted scoring rules.

### **FR4 — Paint Estimator**

Output total litres needed.

### **FR5 — Explainability**

Each chosen shade must show *why it was chosen*.

### **FR6 — Offline/Client-side**

All computation runs in-browser (no backend).

### **FR7 — Export**

Allow export as JSON.

---

## **10.2 Non-functional Requirements**

### **Performance**

* Single-page app load < 2 seconds
* Prediction < 10 ms

### **Reliability**

* Should work without internet
* Should degrade gracefully if inputs missing

### **Usability**

* Smooth transitions
* Dark, glass-like UI aesthetic
* Mobile-friendly

---

# **11. Future Model Improvements (Better Prediction Algorithm)**

### **11.1 More advanced scoring**

Move from rule-based scoring → hybrid model:

* Weighted heuristics +
* Data-driven adjustments (collected from user choices over time)

### **11.2 Light simulation**

Approximate perceived brightness using:

* Hex → HSL → L* (perceived lightness)

### **11.3 Finetuned ML model**

Train on:

* Room types
* Personality inputs
* User selections
* Approval/disapproval votes

Model outputs:

* Optimal base shade
* Probability-weighted accent recommendations

### **11.4 Add computer vision (optional future)**

User uploads a photo → detect:

* Materials
* Furniture colours
* Floor undertone

---

# **12. Risks & Mitigations**

| Risk                             | Impact | Mitigation                                       |
| -------------------------------- | ------ | ------------------------------------------------ |
| Users feel overwhelmed           | Medium | Funny micro-copy, simpler questions              |
| Too much reliance on personality | Low    | Keep personality influence within defined bounds |
| Palette accuracy expectations    | High   | Use conservative, widely accepted shade families |

---

# **13. Success Metrics**

### **Quantitative**

* > 80% users accept at least one recommended palette
* > 90% accuracy in paint litre estimation (±10% acceptable)
* Completion rate of the wizard > 70%

### **Qualitative**

* Users feel “confident choosing colours”
* Professors/peers validate logical reasoning
* Painters accept action plans as reasonable

---

# **14. Deliverables**

* `/index.html` – App UI
* `/styles.css` – Aesthetic design
* `/engine.js` – Prediction logic
* `/palette.json` – Birla Opus shade approximations
* `/prd.md` – This document
* `/roadmap.md` – Future improvements

---

# **Would you like me to generate this as a GitHub-ready Markdown file (`prd.md`)?**

I can also generate:
* `roadmap.md`
* `architecture.md`
* `engine-spec.md`
* `palette-library.json`
* `README.md` for GitHub