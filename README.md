# PillPal Care — Adult & Kid-Friendly Mobile Medication Companion

Inspired by [**pillo.care**](https://pillo.care) (*"The Angry Pill Box"*), **PillPal Care** is a restyled, mobile-first medication reminder and adherence application designed for both **adults** and **kids/families**.

## Key Features & Iteration 2 Upgrades

### 1. Dual Persona Modes & Kid Mode "Worried → Angry" Emotional Progression
- **Adult Mode ("Tactile Botanical Studio")**: High-contrast editorial typography, pill shape/color identifiers, refill stock counters, and **Pillo Guard** (an expressive capsule companion who turns stern and fiery when a critical trigger fires).
- **Kid Mode ("Hero Dose Adventure")**: Friendly rounded typography, reassuring medicine descriptions (*"Berry Shield Chewable"*), Star Sticker & Hero Streak rewards, and **Barnaby the Buddy** with a gentle **Worried → Worried-Angry → Angry** emotional progression:
  - When the Circle Timer runs low or first hits `00:00`, Barnaby starts **😟 Worried** (big puppy-dog eyes, drooping horns, tear drop) rather than immediately frightening the child.
  - If the lockdown remains unverified (or if dismissal attempts are made), Barnaby escalates through **😣 Worried-Angry** to **😠 Full Grumpy-Angry**.

### 2. Multi-Modal "Medication Guarantee" Suite
To unlock a persistent screen takeover (or confirm an on-time dose), users complete a multi-sensor verification flow:
- **📷 Camera / Photo Pill & Cup Scanner**: Uses `navigator.mediaDevices.getUserMedia` (with an AI vision laser-sweep fallback) to match the physical pill or measuring cup.
- **👦 Child Face Scan Verification (Kid Mode)**: Biometric facial landmark scanner that verifies the child taking their dose alongside their medicine cup.
- **📳 Shake-Phone-with-Water Gesture**: Uses hardware `DeviceMotionEvent` accelerometer detection (plus an interactive tap/shake meter) to verify the user has water in hand.
- **🔐 Parent 4-Digit PIN Verification (Kid Mode)**: Caregiver approval keypad (`1234` default) before sealing a child's dose guarantee.
- **👆 3-Second Press-and-Hold Commitment Seal**: Final hold-to-guarantee progress bar that prevents accidental muscle-memory dismissals.

### 3. Specific Persistent Screen Lockdown Situations
The non-dismissible screen takeover **only** appears in specific high-priority situations:
1. **Circle Timer Expired (`00:00`)**: The countdown circle finishes and the medication has not been taken.
2. **Critical Refill Alert (`<= 2 doses remaining`)**: A medication's bottle stock drops into the critical threshold, requiring a **Refill Bottle Scan + 3s Hold Refill Guarantee** to clear.
3. **Excessive Snoozing (`> 2 consecutive snoozes`)**: Prevents无限 postponing a critical dose.

---

## Project Structure

- `index.html` — Mobile-first application shell, status bar / Dynamic Island, and modal overlays
- `styles.css` — Custom HSL design tokens for Adult & Kid themes, multi-sensor scanner UI, and keyframe character animations
- `app.js` — Circle timer engine, Worried→Angry state machine, Camera/Face/Accelerometer/PIN verification handlers, and Critical Refill Lockdown
- `manifest.json` — Progressive Web App (PWA) configuration for mobile home-screen installation

## Running Locally

Open `index.html` directly in any mobile or desktop browser, or serve locally:

```bash
python3 -m http.server 8080
```
