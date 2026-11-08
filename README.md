# PillPal Care — Adult & Kid-Friendly Mobile Medication Companion (Iteration 3: Studio 3D Assets & Pillo UI)

Inspired by [**pillo.care**](https://pillo.care) (*"The Angry Pill Box"*), **PillPal Care** is a restyled, mobile-first medication reminder and adherence application designed for both **adults** and **kids/families**.

## Iteration 3 Visual & Graphic Overhaul (`pillo.care` Asset Recreation)

### 1. 12 Custom Studio-Grade 3D Pillo Character & Medication Assets (`assets/*.webp` & `assets.js`)
- **Adult Mode 3D Pillo Pill-Box Mascot (`adult_calm`, `adult_impatient`, `adult_angry`, `adult_celebrating`)**:
  - Recreates `pillo.care`'s signature rounded pill-organizer box mascot with a hinged lid, pastel vitamin capsules inside, stubby 3D arms/legs, and expressive eyes:
    - **Calm**: Mint-teal pill-box listening to focus music on headphones (`🎧 Focus Music • 528Hz Calm`).
    - **Impatient (`<= 35%` Circle Timer)**: Amber-gold pill-box leaning forward with a sweat drop (`💧`) and pocket watch.
    - **Angry Lockdown (`00:00` / Refill / Snooze Limit)**: Crimson-red **"Angry Pill Box"** with glowing V-brows, steam puffs (`💢`), and clenched fists that refuses to leave the screen.
    - **Celebrating**: Emerald-green pill-box tossing confetti and glowing charity heart (`❤️`).
- **Kid Mode 3D Buddy (`kid_calm`, `kid_worried`, `kid_worried_angry`, `kid_angry`)**:
  - Soft 3D toy-capsule buddy with a glowing star badge that transitions smoothly from **😟 Worried** (big puppy-dog eyes, drooping ears, tear drop) → **😣 Worried-Angry** → **😠 Grumpy-Angry** rather than immediately frightening the child.
- **3D Medication & Sensor Icons (`icon_adult_pills`, `icon_kid_meds`, `icon_refill_alert`, `icon_water_shield`)**:
  - Custom 3D renders for every scheduled medication card, critical refill alert bottle, and multi-sensor guarantee scanner.

### 2. Signature `pillo.care` "Time to take pills" Card & 3-Button Action Dock
- **Authentic Pillo Alarm Header**: *"Time to take pills"* header with live focus-music indicator (`🎧 Focus Music • 528Hz Calm`) and auto-snooze driving/call guard badge (`🚗 Driving >15mph & Call Guard Ready`).
- **3D Mascot Portrait Inside the Circular Time-Box Ring**: High-resolution 3D mascot showcase with floating glassmorphic mood badge, animated steam/sweat/tear overlays, and tactile 360° SVG countdown ring.
- **`pillo.care` 3-Button Action Dock**:
  - **`✓ Take now`** (Primary Emerald/Gold CTA — opens the Multi-Sensor Dose Guarantee)
  - **`⏰ Reschedule (+5m)`** (Tracks snooze count and triggers Persistent Lockdown if snoozed `> 2` times)
  - **`⏭️ Skip?`** (Escalates straight to the Persistent Lockdown screen so critical doses cannot be silently skipped)

### 3. Multi-Modal "Medication Guarantee" Suite
To unlock a persistent screen takeover (or confirm an on-time dose), users complete a multi-sensor verification flow:
- **📷 Camera / Photo Pill & Cup Scanner**: Uses `navigator.mediaDevices.getUserMedia` (with an AI vision laser-sweep + 3D pill render preview) to match the physical pill or measuring cup.
- **👦 Child Face Scan Verification (Kid Mode)**: Biometric facial landmark scanner that verifies the child taking their dose alongside their medicine cup.
- **📳 Shake-Phone-with-Water Gesture**: Uses hardware `DeviceMotionEvent` accelerometer detection (plus an interactive tap/shake meter with 3D water & shield graphics) to verify the user has water in hand.
- **🔐 Parent 4-Digit PIN Verification (Kid Mode)**: Caregiver approval keypad (`1234` default) before sealing a child's dose guarantee.
- **👆 3-Second Press-and-Hold Commitment Seal**: Final hold-to-guarantee progress bar that prevents accidental muscle-memory dismissals.

---

## Project Structure

- `index.html` — Mobile-first application shell, status bar / Dynamic Island, and modal overlays
- `styles.css` — Custom HSL design tokens for Adult & Kid themes, 3D portrait stage, Pillo 3-button dock, and keyframe animations
- `assets.js` & `assets/*.webp` — 12 studio-rendered 3D character states and medication/verification icons
- `app.js` — Circle timer engine, Worried→Angry state machine, Camera/Face/Accelerometer/PIN verification handlers, and Critical Refill Lockdown
- `manifest.json` — Progressive Web App (PWA) configuration for mobile home-screen installation
