# PillPal Care — Adult & Kid-Friendly Mobile Medication Companion

Inspired by [**pillo.care**](https://pillo.care) (*"The Angry Pill Box"*), **PillPal Care** is a restyled, mobile-first medication reminder and adherence application designed for both **adults** and **kids/families**.

## Why We Built This (Research Insights from `pillo.care`)

50% of patients miss medications not out of resistance, but because **standard phone notifications are designed to be swiped away and forgotten**. Our research into `pillo.care` identified four behavioral pillars that drive 92%+ medication adherence:

1. **The Circular "Time-Box" Countdown (`Circle Timer`)**: Instead of a fleeting chime, each scheduled dose opens an active circular countdown window.
2. **Conditional Escalation (Calm → Impatient → Angry Lockdown)**:
   - While the **Circle Timer** has time remaining, the companion mascot stays **calm and encouraging** (then gets slightly **impatient** as time runs low).
   - **Specific Angry-Face Trigger**: The persistent, full-screen **Angry Face** takeover **only appears when the circle timer reaches `00:00` and the medication has still not been taken**.
3. **Un-Ignorable Screen Persistence**: Once the Angry Face appears, it refuses to leave the screen. Tapping outside or hitting a close button shakes the viewport and scolds the user until a verified **Dose Guarantee** (or an explicit context-aware Smart Snooze) is completed.
4. **The Medication Guarantee**: Prevents muscle-memory false confirmations by requiring a physical dose check plus a tactile **3-second Hold-to-Guarantee** confirmation ring.

---

## Key Restyling Features

- **Dual Persona Modes (Adult & Kid-Friendly)**:
  - **Adult Mode ("Tactile Clinical Warmth")**: High-contrast editorial typography, pill shape/color identifiers, interaction & food notes, refill stock counters, and **Pillo Guard** (an expressive capsule companion who turns hilariously stern and fiery when the circle timer expires).
  - **Kid Mode ("Hero Dose Adventure")**: Friendly rounded typography, reassuring medicine descriptions (*"Berry Shield Chewable"*), Star Sticker & Hero Streak rewards, caregiver/parent verification prompts, and **Barnaby the Buddy** (a lovable mascot who throws a dramatic, puffy-cheeked grumpy tantrum if the circle timer hits zero).
- **Interactive Circle Timer & Situation Simulator**:
  - Watch the live SVG circular timer count down, jump to the **Low Timer Warning (`00:08`)**, or tap **Simulate Timer Up (`00:00`)** to immediately test the non-dismissible Angry Face screen takeover.
- **Multi-Step Dose Guarantee**:
  - **Step 1**: Verify physical readiness (correct pill/liquid + water check, or parent high-five in Kid Mode).
  - **Step 2**: Press and hold the **Hold 3s to Guarantee** button to unlock the screen and log a verified timestamp.
- **Smart Context-Aware Snooze**:
  - Supports intentional rescheduling for *Eating a Meal First*, *Driving Safety (>15 mph)*, *On a Phone Call*, or *Until Arriving Home* without losing the pending dose.

---

## Project Structure

- `index.html` — Mobile-first application shell, SVG companion definitions, and modal overlays
- `styles.css` — Custom HSL design tokens for Adult & Kid themes, mobile phone viewport framing, and keyframe character animations
- `app.js` — Circle timer engine, conditional angry-face lockdown state machine, 3-second hold-to-guarantee gesture handler, Web Audio synthesizer, and local state persistence
- `manifest.json` — Progressive Web App (PWA) configuration for mobile home-screen installation

## Running Locally

Open `index.html` directly in any mobile or desktop browser, or serve locally:

```bash
python3 -m http.server 8080
```
