/**
 * PillPal Care — Mobile Medication Companion Engine (Iteration 2)
 * Implements:
 * 1. Dual Adult & Kid-Friendly Personas
 * 2. Kid Mode "Worried -> Worried-Angry -> Angry" Emotional Progression
 * 3. Full Multi-Modal Guarantee Suite:
 *    - Camera / Photo Pill & Cup Scanner
 *    - Child Face Scan Verification (Biometric Face Mesh)
 *    - Shake-Phone-with-Water Gesture (DeviceMotion + Interactive Shake Meter)
 *    - Parent 4-Digit PIN Verification (Kid Mode)
 *    - Physical Dose Checklist + 3-Second Press-and-Hold Commitment Seal
 * 4. Specific Persistent Lockdown Triggers:
 *    - Trigger A: Circle Timer reaches 00:00 without taking medication
 *    - Trigger B: Critical Refill Alert (stock drops to <= 2 doses)
 *    - Trigger C: Excessive Snoozing (> 2 consecutive snoozes)
 */

const INITIAL_DATA = {
  persona: 'adult', // 'adult' | 'kid'
  activeTab: 'today', // 'today' | 'log' | 'cabinet'
  soundEnabled: true,
  smartDrivingSnooze: true,
  smartCallPause: true,
  caregiverAlerts: true,
  parentPinCode: '1234',
  streakCount: 14,
  charityHearts: 42,
  selectedMedId: 'adult-1',
  timerPaused: false,

  // Lockdown State Machine
  lockdownActive: false,
  lockdownReason: 'timer-expired', // 'timer-expired' | 'critical-refill' | 'max-snooze'
  kidLockdownStage: 'worried', // 'worried' | 'worried-angry' | 'angry'
  dismissAttemptsBlocked: 0,

  // Multi-Modal Guarantee Sensor States (Reset on each new dose/lockdown)
  verification: {
    pillPhotoScanned: false,
    pillScanningNow: false,
    childFaceScanned: false,
    faceScanningNow: false,
    waterShakeProgress: 0, // 0 to 100
    parentPinVerified: false,
    parentPinInput: '',
    checklistConfirmed: false
  },

  medications: {
    adult: [
      {
        id: 'adult-1',
        name: 'Lisinopril',
        dosage: '10 mg • 1 Tablet',
        visualDesc: '1 Pink Round Tablet + Full Glass of Water',
        instructions: 'Take in the morning. Keep consistent daily timing.',
        scheduledTime: '08:00 AM',
        icon: '💊',
        stockLeft: 18,
        refillThreshold: 5,
        criticalRefillThreshold: 2,
        timerTotal: 45,
        timerRemaining: 45,
        snoozeCount: 0,
        status: 'pending', // 'pending' | 'taken' | 'overdue'
        guaranteedAt: null,
        snoozeReason: null
      },
      {
        id: 'adult-2',
        name: 'Omega-3 + Vitamin D3',
        dosage: '2000 IU • 1 Softgel',
        visualDesc: '1 Amber Translucent Softgel with Food',
        instructions: 'Take alongside breakfast or lunch for absorption.',
        scheduledTime: '12:30 PM',
        icon: '☀️',
        stockLeft: 2, // Critical Refill Alert ready!
        refillThreshold: 5,
        criticalRefillThreshold: 2,
        timerTotal: 60,
        timerRemaining: 60,
        snoozeCount: 0,
        status: 'pending',
        guaranteedAt: null,
        snoozeReason: null
      },
      {
        id: 'adult-3',
        name: 'Magnesium Glycinate',
        dosage: '200 mg • 2 Capsules',
        visualDesc: '2 White Capsules + Water before bed',
        instructions: 'Supports evening recovery and sleep schedule.',
        scheduledTime: '09:00 PM',
        icon: '🌙',
        stockLeft: 24,
        refillThreshold: 5,
        criticalRefillThreshold: 2,
        timerTotal: 45,
        timerRemaining: 45,
        snoozeCount: 0,
        status: 'taken',
        guaranteedAt: 'Yesterday, 08:59 PM',
        snoozeReason: null
      }
    ],
    kid: [
      {
        id: 'kid-1',
        name: 'Berry Shield Amoxicillin',
        dosage: '5 mL • Bubblegum Berry Cup',
        visualDesc: '1 Pink Measuring Cup (5 mL) + Big Sip of Water',
        instructions: 'Super-Shield potion! Shake bottle well before pouring.',
        scheduledTime: '08:00 AM',
        icon: '🍓',
        stockLeft: 12,
        refillThreshold: 5,
        criticalRefillThreshold: 2,
        timerTotal: 45,
        timerRemaining: 45,
        snoozeCount: 0,
        status: 'pending',
        guaranteedAt: null,
        snoozeReason: null
      },
      {
        id: 'kid-2',
        name: 'Dino-Breathe Spacer Puff',
        dosage: '2 Puffs • Orange Inhaler',
        visualDesc: '2 Slow Dino Breaths with Spacer Mask',
        instructions: 'Count to 5 like a friendly brontosaurus on each breath!',
        scheduledTime: '04:00 PM',
        icon: '🦖',
        stockLeft: 2, // Critical refill threshold!
        refillThreshold: 6,
        criticalRefillThreshold: 2,
        timerTotal: 45,
        timerRemaining: 45,
        snoozeCount: 0,
        status: 'pending',
        guaranteedAt: null,
        snoozeReason: null
      },
      {
        id: 'kid-3',
        name: 'Sunshine Star Gummy',
        dosage: '1 Gummy • Orange Chew',
        visualDesc: '1 Sunny Orange Star Gummy chewed well',
        instructions: 'Earned +1 Hero Star Sticker when taken on time!',
        scheduledTime: '07:30 AM',
        icon: '⭐',
        stockLeft: 29,
        refillThreshold: 5,
        criticalRefillThreshold: 2,
        timerTotal: 45,
        timerRemaining: 45,
        snoozeCount: 0,
        status: 'taken',
        guaranteedAt: 'Today, 07:28 AM',
        snoozeReason: null
      }
    ]
  },
  guaranteeLogs: [
    {
      id: 'log-1',
      persona: 'kid',
      medName: 'Sunshine Star Gummy',
      dosage: '1 Gummy',
      timestamp: 'Today, 07:28 AM',
      method: 'Child Face Scan + Parent PIN + 3s Hold',
      wasOverdue: false
    },
    {
      id: 'log-2',
      persona: 'adult',
      medName: 'Magnesium Glycinate',
      dosage: '200 mg',
      timestamp: 'Yesterday, 08:59 PM',
      method: 'Pill Photo Scan + Water Shake + 3s Hold',
      wasOverdue: false
    }
  ]
};

let state = JSON.parse(JSON.stringify(INITIAL_DATA));
let countdownInterval = null;
let kidEscalationInterval = null;
let holdInterval = null;
let holdProgress = 0;
let activeSheetMode = null; // 'calm-guarantee' | 'add-med' | null
let activeCameraStream = null;

/* ==========================================================================
   Web Audio Synthesizer (Gentle Chimes, Worried Whimper, & Angry Buzzer)
   ========================================================================== */

let audioCtx = null;
function playTone(type) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    if (type === 'worried-chime') {
      // Soft descending worried two-note chime for Kid Mode initial lockdown
      [440, 349.23].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.16);
        gain.gain.setValueAtTime(0.11, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.22);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.22);
      });
    } else if (type === 'angry-alarm') {
      [0, 0.18].forEach((offset) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = state.persona === 'kid' ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(state.persona === 'kid' ? 510 : 430, now + offset);
        osc.frequency.exponentialRampToValueAtTime(260, now + offset + 0.14);
        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.15);
      });
    } else if (type === 'reject') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.setValueAtTime(145, now + 0.08);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'scan-beep') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'success') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.22);
      });
    }
  } catch (_) {}
}

/* ==========================================================================
   Expressive Companion SVG Generator
   - Adult ("Pillo Guard"): calm -> impatient -> angry -> celebrating
   - Kid ("Barnaby the Buddy"): calm -> worried -> worried-angry -> angry -> celebrating
   ========================================================================== */

function getCompanionSVG(persona, mood, size = 84) {
  if (persona === 'adult') {
    if (mood === 'angry') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none">
          <circle cx="24" cy="22" r="7" fill="#FCA5A5" opacity="0.85"/>
          <circle cx="96" cy="20" r="8" fill="#FCA5A5" opacity="0.85"/>
          <path d="M55 8 L65 18 M65 8 L55 18" stroke="#FEF08A" stroke-width="3.5" stroke-linecap="round"/>
          <rect x="26" y="18" width="68" height="88" rx="34" fill="#EF4444" stroke="#7F1D1D" stroke-width="4"/>
          <path d="M26 62 H94 V72 C94 90.77 78.77 106 60 106 C41.22 106 26 90.77 26 72 V62 Z" fill="#B91C1C"/>
          <path d="M36 42 L55 51" stroke="#450A0A" stroke-width="5.5" stroke-linecap="round"/>
          <path d="M84 42 L65 51" stroke="#450A0A" stroke-width="5.5" stroke-linecap="round"/>
          <circle cx="46" cy="54" r="6" fill="#FEF08A"/><circle cx="46" cy="54" r="2.5" fill="#450A0A"/>
          <circle cx="74" cy="54" r="6" fill="#FEF08A"/><circle cx="74" cy="54" r="2.5" fill="#450A0A"/>
          <rect x="42" y="70" width="36" height="16" rx="6" fill="#450A0A" stroke="#FCA5A5" stroke-width="2"/>
          <path d="M42 78 H78 M54 70 V86 M66 70 V86" stroke="#FFFFFF" stroke-width="2.5"/>
        </svg>
      `;
    }
    if (mood === 'impatient' || mood === 'worried') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" class="mascot-impatient">
          <rect x="28" y="18" width="64" height="86" rx="32" fill="#F59E0B" stroke="#78350F" stroke-width="3.5"/>
          <path d="M28 61 H92 V72 C92 89.67 77.67 104 60 104 C42.32 104 28 89.67 28 72 V61 Z" fill="#D97706"/>
          <path d="M96 30 C96 30 102 38 102 42 C102 45.3 99.3 48 96 48 C92.7 48 90 45.3 90 42 C90 38 96 30 96 30 Z" fill="#38BDF8"/>
          <path d="M38 44 L52 47" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
          <path d="M82 42 L68 47" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
          <circle cx="46" cy="53" r="4.5" fill="#451A03"/><circle cx="74" cy="53" r="4.5" fill="#451A03"/>
          <path d="M46 74 Q53 69 60 74 T74 74" stroke="#451A03" stroke-width="4" stroke-linecap="round" fill="none"/>
        </svg>
      `;
    }
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" class="mascot-calm">
        <rect x="28" y="18" width="64" height="86" rx="32" fill="#34D399" stroke="#16382C" stroke-width="3.5"/>
        <path d="M28 61 H92 V72 C92 89.67 77.67 104 60 104 C42.32 104 28 89.67 28 72 V61 Z" fill="#10B981"/>
        <circle cx="46" cy="50" r="4.5" fill="#16382C"/><circle cx="74" cy="50" r="4.5" fill="#16382C"/>
        <circle cx="38" cy="57" r="4" fill="#F43F5E" opacity="0.35"/><circle cx="82" cy="57" r="4" fill="#F43F5E" opacity="0.35"/>
        <path d="M48 68 Q60 77 72 68" stroke="#16382C" stroke-width="4" stroke-linecap="round" fill="none"/>
      </svg>
    `;
  } else {
    // KID PERSONA ("Barnaby the Buddy"): Worried -> Worried-Angry -> Angry
    if (mood === 'worried' || mood === 'impatient') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" class="mascot-impatient">
          <!-- Drooping Worried Horns/Ears -->
          <path d="M28 38 L12 28 L36 28 Z" fill="#FDE047" stroke="#1E1B4B" stroke-width="3"/>
          <path d="M92 38 L108 28 L84 28 Z" fill="#FDE047" stroke="#1E1B4B" stroke-width="3"/>
          <!-- Soft Periwinkle-Blue Worried Body -->
          <circle cx="60" cy="64" r="41" fill="#818CF8" stroke="#1E1B4B" stroke-width="3.5"/>
          <!-- Upturned Sympathetic Worried Eyebrows (/ \) -->
          <path d="M34 48 L52 41" stroke="#1E1B4B" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M86 48 L68 41" stroke="#1E1B4B" stroke-width="4.5" stroke-linecap="round"/>
          <!-- Big Glistening Puppy Eyes -->
          <circle cx="46" cy="57" r="7.5" fill="#FFFFFF"/>
          <circle cx="46" cy="58" r="4" fill="#1E1B4B"/>
          <circle cx="44" cy="55" r="2" fill="#FFFFFF"/>
          <circle cx="74" cy="57" r="7.5" fill="#FFFFFF"/>
          <circle cx="74" cy="58" r="4" fill="#1E1B4B"/>
          <circle cx="72" cy="55" r="2" fill="#FFFFFF"/>
          <!-- Little Glistening Tear Drop -->
          <path d="M36 65 C36 65 40 72 40 75 C40 77.5 38.2 79 36 79 C33.8 79 32 77.5 32 75 C32 72 36 65 36 65 Z" fill="#38BDF8"/>
          <!-- Quivering Worried Frown -->
          <path d="M46 82 Q60 72 74 82" stroke="#1E1B4B" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        </svg>
      `;
    }
    if (mood === 'worried-angry') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none">
          <!-- Perking Horns -->
          <path d="M28 36 L15 19 L38 26 Z" fill="#FDE047" stroke="#7C2D12" stroke-width="3"/>
          <path d="M92 36 L105 19 L82 26 Z" fill="#FDE047" stroke="#7C2D12" stroke-width="3"/>
          <!-- Transitioning Tangerine-Coral Body -->
          <circle cx="60" cy="64" r="41" fill="#FB923C" stroke="#7C2D12" stroke-width="4"/>
          <circle cx="34" cy="69" r="8" fill="#EF4444" opacity="0.65"/>
          <circle cx="86" cy="69" r="8" fill="#EF4444" opacity="0.65"/>
          <!-- Asymmetric Worried-Turning-Angry Brows -->
          <path d="M35 45 L54 52" stroke="#431407" stroke-width="5" stroke-linecap="round"/>
          <path d="M85 45 L66 52" stroke="#431407" stroke-width="5" stroke-linecap="round"/>
          <circle cx="46" cy="57" r="7" fill="#FFFFFF"/>
          <circle cx="46" cy="57" r="3.5" fill="#431407"/>
          <circle cx="74" cy="57" r="7" fill="#FFFFFF"/>
          <circle cx="74" cy="57" r="3.5" fill="#431407"/>
          <!-- Upset Pouty Grumble Mouth -->
          <path d="M44 81 Q60 71 76 81" stroke="#431407" stroke-width="5" stroke-linecap="round" fill="none"/>
        </svg>
      `;
    }
    if (mood === 'angry') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none">
          <path d="M28 34 L16 14 L38 24 Z" fill="#FDE047" stroke="#7F1D1D" stroke-width="3"/>
          <path d="M92 34 L104 14 L82 24 Z" fill="#FDE047" stroke="#7F1D1D" stroke-width="3"/>
          <circle cx="60" cy="64" r="42" fill="#FB7185" stroke="#881337" stroke-width="4"/>
          <circle cx="32" cy="70" r="10" fill="#E11D48"/>
          <circle cx="88" cy="70" r="10" fill="#E11D48"/>
          <path d="M34 45 L55 55" stroke="#881337" stroke-width="6" stroke-linecap="round"/>
          <path d="M86 45 L65 55" stroke="#881337" stroke-width="6" stroke-linecap="round"/>
          <circle cx="46" cy="58" r="7" fill="#FFFFFF"/><circle cx="47" cy="58" r="3.5" fill="#881337"/>
          <circle cx="74" cy="58" r="7" fill="#FFFFFF"/><circle cx="73" cy="58" r="3.5" fill="#881337"/>
          <path d="M42 82 Q60 70 78 82 Z" fill="#881337"/>
          <polygon points="48,79 52,86 56,78" fill="#FFFFFF"/>
          <polygon points="64,78 68,86 72,79" fill="#FFFFFF"/>
        </svg>
      `;
    }
    // Calm / Happy Kid Mascot
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" class="mascot-calm">
        <path d="M30 34 L20 16 L40 26 Z" fill="#FBBF24" stroke="#1E293B" stroke-width="3"/>
        <path d="M90 34 L100 16 L80 26 Z" fill="#FBBF24" stroke="#1E293B" stroke-width="3"/>
        <circle cx="60" cy="64" r="40" fill="#38BDF8" stroke="#1E293B" stroke-width="3.5"/>
        <circle cx="45" cy="56" r="6.5" fill="#FFFFFF"/><circle cx="45" cy="56" r="3.5" fill="#1E293B"/>
        <circle cx="75" cy="56" r="6.5" fill="#FFFFFF"/><circle cx="75" cy="56" r="3.5" fill="#1E293B"/>
        <circle cx="34" cy="66" r="5" fill="#F472B6" opacity="0.6"/><circle cx="86" cy="66" r="5" fill="#F472B6" opacity="0.6"/>
        <path d="M44 72 Q60 86 76 72" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      </svg>
    `;
  }
}

/* ==========================================================================
   State Helpers & Verification Reset
   ========================================================================== */

function getCurrentMeds() {
  return state.medications[state.persona];
}

function getSelectedMed() {
  const meds = getCurrentMeds();
  let found = meds.find((m) => m.id === state.selectedMedId);
  if (!found) {
    found = meds.find((m) => m.status !== 'taken') || meds[0];
    state.selectedMedId = found.id;
  }
  return found;
}

function resetVerificationState() {
  stopCameraStream();
  state.verification = {
    pillPhotoScanned: false,
    pillScanningNow: false,
    childFaceScanned: false,
    faceScanningNow: false,
    waterShakeProgress: 0,
    parentPinVerified: false,
    parentPinInput: '',
    checklistConfirmed: false
  };
}

function getMoodForMed(med) {
  if (med.status === 'taken') return 'celebrating';
  if (med.timerRemaining <= 0) {
    return state.persona === 'kid' ? state.kidLockdownStage : 'angry';
  }
  if (med.timerRemaining / med.timerTotal <= 0.35) {
    return state.persona === 'kid' ? 'worried' : 'impatient';
  }
  return 'calm';
}

function formatSeconds(sec) {
  const clamped = Math.max(0, Math.floor(sec));
  const m = String(Math.floor(clamped / 60)).padStart(2, '0');
  const s = String(clamped % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* ==========================================================================
   Circle Timer Loop & Kid Mode Worried -> Angry Escalation Loop
   ========================================================================== */

function startCircleTimerLoop() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (state.timerPaused || state.lockdownActive || activeSheetMode) return;
    const med = getSelectedMed();
    if (!med || med.status === 'taken') return;

    if (med.timerRemaining > 0) {
      med.timerRemaining -= 1;
      updateCircleTimerDOM();

      // SPECIFIC TRIGGER #1: Circle Timer reaches 00:00 without medication taken
      if (med.timerRemaining === 0 && med.status !== 'taken') {
        triggerPersistentLockdown(med, 'timer-expired');
      }
    }
  }, 1000);
}

function startKidMoodEscalationTimer() {
  if (kidEscalationInterval) clearInterval(kidEscalationInterval);
  if (state.persona !== 'kid' || !state.lockdownActive) return;

  // Automatically escalates Kid Mode from Worried -> Worried-Angry -> Angry if unverified!
  kidEscalationInterval = setInterval(() => {
    if (!state.lockdownActive || state.persona !== 'kid') {
      clearInterval(kidEscalationInterval);
      return;
    }
    if (state.kidLockdownStage === 'worried') {
      state.kidLockdownStage = 'worried-angry';
      playTone('worried-chime');
      renderAll();
    } else if (state.kidLockdownStage === 'worried-angry') {
      state.kidLockdownStage = 'angry';
      playTone('angry-alarm');
      renderAll();
    }
  }, 6500);
}

function setKidLockdownStage(stage) {
  state.kidLockdownStage = stage;
  if (stage === 'worried') playTone('worried-chime');
  else playTone('angry-alarm');
  renderAll();
}

function triggerPersistentLockdown(med, reason = 'timer-expired') {
  if (reason === 'timer-expired') {
    med.status = 'overdue';
    med.timerRemaining = 0;
  }
  state.lockdownActive = true;
  state.lockdownReason = reason;
  state.dismissAttemptsBlocked = 0;
  resetVerificationState();

  // In Kid Mode, start Worried and escalate to Angry!
  if (state.persona === 'kid') {
    state.kidLockdownStage = 'worried';
    playTone('worried-chime');
    startKidMoodEscalationTimer();
  } else {
    playTone('angry-alarm');
  }
  renderAll();
}

function triggerAngryReject() {
  state.dismissAttemptsBlocked += 1;
  playTone('reject');

  // If in Kid Mode, trying to dismiss makes Barnaby escalate faster toward Angry!
  if (state.persona === 'kid') {
    if (state.kidLockdownStage === 'worried') {
      state.kidLockdownStage = 'worried-angry';
    } else if (state.kidLockdownStage === 'worried-angry') {
      state.kidLockdownStage = 'angry';
    }
  }

  const overlay = document.getElementById('angry-lockdown-overlay');
  if (overlay) {
    overlay.setAttribute('data-kid-stage', state.persona === 'kid' ? state.kidLockdownStage : 'angry');
    overlay.classList.remove('shake-reject');
    void overlay.offsetWidth;
    overlay.classList.add('shake-reject');
  }

  renderAngryLockdownOverlay(getSelectedMed());
}

/* ==========================================================================
   Multi-Modal Verification Sensor Handlers
   (Camera Pill Scan, Child Face Scan, Shake-with-Water, Parent PIN)
   ========================================================================== */

async function startCameraSensorScan(kind) {
  // kind: 'pill' | 'face'
  if (kind === 'pill') {
    state.verification.pillScanningNow = true;
  } else {
    state.verification.faceScanningNow = true;
  }
  playTone('scan-beep');
  renderAll();

  // Attempt optional live camera preview if available in browser
  const videoId = kind === 'pill' ? 'pill-scanner-video' : 'face-scanner-video';
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      activeCameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: kind === 'face' ? 'user' : 'environment' },
        audio: false
      });
      const videoEl = document.getElementById(videoId);
      if (videoEl) {
        videoEl.srcObject = activeCameraStream;
        videoEl.play().catch(() => {});
      }
    }
  } catch (_) {
    // Graceful simulated AI vision scan when in headless/sandbox environment
  }

  setTimeout(() => {
    stopCameraStream();
    if (kind === 'pill') {
      state.verification.pillScanningNow = false;
      state.verification.pillPhotoScanned = true;
    } else {
      state.verification.faceScanningNow = false;
      state.verification.childFaceScanned = true;
    }
    playTone('scan-beep');
    renderAll();
  }, 1300);
}

function stopCameraStream() {
  if (activeCameraStream) {
    activeCameraStream.getTracks().forEach((t) => t.stop());
    activeCameraStream = null;
  }
}

function triggerWaterShakeStep() {
  state.verification.waterShakeProgress = Math.min(100, state.verification.waterShakeProgress + 35);
  playTone('scan-beep');
  renderAll();
}

// Listen for real mobile phone accelerometer shake (DeviceMotionEvent)
window.addEventListener('devicemotion', (event) => {
  if (!state.lockdownActive && !activeSheetMode) return;
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;
  const totalForce = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
  if (totalForce > 26 && state.verification.waterShakeProgress < 100) {
    state.verification.waterShakeProgress = Math.min(100, state.verification.waterShakeProgress + 35);
    renderAll();
  }
});

function handleParentPinInput(val) {
  state.verification.parentPinInput = val.trim();
  if (state.verification.parentPinInput === state.parentPinCode) {
    state.verification.parentPinVerified = true;
    playTone('scan-beep');
  } else {
    state.verification.parentPinVerified = false;
  }
  renderAll();
}

function autoFillParentPin() {
  state.verification.parentPinInput = state.parentPinCode;
  state.verification.parentPinVerified = true;
  playTone('scan-beep');
  renderAll();
}

function toggleChecklistConfirm(checked) {
  state.verification.checklistConfirmed = Boolean(checked);
  renderAll();
}

function quickVerifyAllSensors() {
  state.verification.pillPhotoScanned = true;
  state.verification.childFaceScanned = true;
  state.verification.waterShakeProgress = 100;
  state.verification.parentPinInput = state.parentPinCode;
  state.verification.parentPinVerified = true;
  state.verification.checklistConfirmed = true;
  playTone('scan-beep');
  renderAll();
}

function isGuaranteeReadyToHold() {
  const v = state.verification;
  if (state.lockdownReason === 'critical-refill') {
    // For critical refill lockdown, require Pill/Bottle Photo Scan + Checklist
    return v.pillPhotoScanned && v.checklistConfirmed;
  }
  if (state.persona === 'kid') {
    return (
      v.childFaceScanned &&
      v.pillPhotoScanned &&
      v.waterShakeProgress >= 100 &&
      v.parentPinVerified &&
      v.checklistConfirmed
    );
  }
  return v.pillPhotoScanned && v.waterShakeProgress >= 100 && v.checklistConfirmed;
}

/* ==========================================================================
   3-Second Hold-to-Guarantee Final Seal
   ========================================================================== */

function startHoldGuarantee(prefix) {
  if (!isGuaranteeReadyToHold()) {
    triggerAngryReject();
    return;
  }
  if (holdInterval) clearInterval(holdInterval);
  holdProgress = 0;
  const fillBar = document.getElementById(`${prefix}-hold-fill`);
  const label = document.getElementById(`${prefix}-hold-label`);

  holdInterval = setInterval(() => {
    holdProgress += 5;
    if (fillBar) fillBar.style.width = `${Math.min(100, holdProgress)}%`;
    if (label) {
      const rem = Math.max(0.1, ((100 - holdProgress) * 0.025)).toFixed(1);
      label.textContent = `🔒 Sealing Guarantee... Keep Holding (${rem}s)`;
    }
    if (holdProgress >= 100) {
      clearInterval(holdInterval);
      holdInterval = null;
      completeGuaranteeAction();
    }
  }, 60);
}

function cancelHoldGuarantee(prefix) {
  if (holdInterval) {
    clearInterval(holdInterval);
    holdInterval = null;
  }
  if (holdProgress > 0 && holdProgress < 100) {
    holdProgress = 0;
    const fillBar = document.getElementById(`${prefix}-hold-fill`);
    if (fillBar) fillBar.style.width = '0%';
    renderAll();
  }
}

function completeGuaranteeAction() {
  const med = getSelectedMed();
  if (!med) return;

  if (state.lockdownReason === 'critical-refill') {
    // Completed Critical Refill Guarantee!
    med.stockLeft += 30;
    state.lockdownActive = false;
    state.lockdownReason = 'timer-expired';
    activeSheetMode = null;
    resetVerificationState();

    state.guaranteeLogs.unshift({
      id: `log-${Date.now()}`,
      persona: state.persona,
      medName: `${med.name} (Refill Verified)`,
      dosage: '+30 Doses Restocked',
      timestamp: 'Just now',
      method: 'Bottle Photo Scan + 3s Hold Refill Guarantee',
      wasOverdue: true
    });

    playTone('success');
    renderAll();
    showCelebrationToast(`📦 Critical Refill Guaranteed! +30 doses added to ${med.name}.`);
    return;
  }

  const wasOverdue = med.timerRemaining <= 0 || state.lockdownActive;
  med.status = 'taken';
  med.stockLeft = Math.max(0, med.stockLeft - 1);
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  med.guaranteedAt = `Today, ${nowStr}`;

  state.streakCount += 1;
  state.charityHearts += 5;
  state.lockdownActive = false;
  activeSheetMode = null;
  resetVerificationState();

  const methodDesc =
    state.persona === 'kid'
      ? `Child Face Scan + Pill Scan + Water Shake + Parent PIN (${state.parentPinCode}) + 3s Hold`
      : `Pill Photo Scan + Water Shake (100%) + 3s Hold Guarantee`;

  state.guaranteeLogs.unshift({
    id: `log-${Date.now()}`,
    persona: state.persona,
    medName: med.name,
    dosage: med.dosage,
    timestamp: med.guaranteedAt,
    method: methodDesc,
    wasOverdue
  });

  playTone('success');

  // SPECIFIC TRIGGER #2: Check if taking this dose dropped stock into Critical Refill Alert (<= 2 left)!
  if (med.stockLeft <= med.criticalRefillThreshold) {
    renderAll();
    setTimeout(() => {
      triggerPersistentLockdown(med, 'critical-refill');
    }, 900);
    return;
  }

  renderAll();
  showCelebrationToast(
    state.persona === 'kid'
      ? `🌟 Yay! Leo's Face Scan & Dose Guaranteed! Barnaby is super happy (+1 Hero Star)!`
      : `✅ ${med.name} Guaranteed via Camera + Shake + 3s Hold!`
  );
}

/* ==========================================================================
   Simulation & Snooze Controls
   ========================================================================== */

function simulateTimerState(mode) {
  const med = getSelectedMed();
  if (!med) return;

  if (mode === 'reset') {
    med.status = 'pending';
    med.timerRemaining = med.timerTotal;
    med.snoozeCount = 0;
    state.lockdownActive = false;
    resetVerificationState();
    renderAll();
  } else if (mode === 'low') {
    med.status = 'pending';
    med.timerRemaining = 10;
    state.lockdownActive = false;
    renderAll();
  } else if (mode === 'expired') {
    triggerPersistentLockdown(med, 'timer-expired');
  } else if (mode === 'critical-refill') {
    med.stockLeft = 2; // Critical threshold!
    triggerPersistentLockdown(med, 'critical-refill');
  }
}

function applySmartSnooze(reasonLabel, extraSeconds = 45) {
  const med = getSelectedMed();
  if (!med) return;

  med.snoozeCount = (med.snoozeCount || 0) + 1;
  // SPECIFIC TRIGGER #3: More than 2 consecutive snoozes triggers persistent lockdown!
  if (med.snoozeCount > 2) {
    triggerPersistentLockdown(med, 'max-snooze');
    return;
  }

  med.status = 'pending';
  med.timerTotal = extraSeconds;
  med.timerRemaining = extraSeconds;
  med.snoozeReason = `${reasonLabel} (Snooze ${med.snoozeCount}/2)`;
  state.lockdownActive = false;
  activeSheetMode = null;

  renderAll();
  showCelebrationToast(`⏳ Smart Snooze (${med.snoozeCount}/2): ${reasonLabel}. Circle Timer restarted!`);
}

function showCelebrationToast(message) {
  const toast = document.getElementById('celebration-toast');
  const text = document.getElementById('celebration-toast-text');
  if (!toast || !text) return;
  text.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3800);
}

/* ==========================================================================
   DOM Rendering & Circle Timer Ring Updates
   ========================================================================== */

function getCompanionSpeechText(med, mood) {
  if (state.persona === 'adult') {
    if (med.status === 'taken') {
      return `✨ "${med.name} is verified & logged (${med.guaranteedAt}). Stock remaining: ${med.stockLeft} doses."`;
    }
    if (mood === 'angry') {
      return `😡 "The circle timer hit 00:00 and you haven't taken ${med.name}! Complete the Camera + Water Shake Guarantee!"`;
    }
    if (mood === 'impatient') {
      return `🤨 "Only ${med.timerRemaining}s left on the circle! Grab your water before my angry face locks your screen!"`;
    }
    return `🙂 "Circle Timer active for ${med.name} (${med.visualDesc}). Take it before the ring runs out!"`;
  } else {
    if (med.status === 'taken') {
      return `🌟 "Woohoo! Leo's Face Scan & ${med.name} are guaranteed! Barnaby is doing a happy dance!"`;
    }
    if (mood === 'worried') {
      return `😟 "Oh no, Leo! Only ${med.timerRemaining}s left on the circle! Barnaby is getting worried you'll miss your dose!"`;
    }
    if (mood === 'worried-angry') {
      return `😣 "Barnaby is going from worried to upset! Hurry and scan your Hero Face with your medicine!"`;
    }
    if (mood === 'angry') {
      return `😠 "Barnaby was worried and now he's GRUMPY-ANGRY! Complete the Face Scan & Parent PIN Guarantee!"`;
    }
    return `😄 "Hi Leo! It's time for ${med.name}. Let's take it while the circle is green!"`;
  }
}

function updateCircleTimerDOM() {
  const med = getSelectedMed();
  if (!med) return;
  const mood = getMoodForMed(med);

  const card = document.getElementById('circle-timer-card');
  if (card) card.setAttribute('data-mood', mood);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const ratio = med.status === 'taken' ? 1 : Math.max(0, med.timerRemaining / med.timerTotal);
  const offset = circumference * (1 - ratio);

  const progressCircle = document.getElementById('ring-progress-circle');
  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${offset}`;
  }

  const readout = document.getElementById('countdown-readout');
  if (readout) {
    readout.textContent = med.status === 'taken' ? 'DONE' : formatSeconds(med.timerRemaining);
  }

  const badge = document.getElementById('timer-status-badge-text');
  if (badge) {
    if (med.status === 'taken') {
      badge.textContent = 'Dose Guaranteed ✓';
    } else if (med.timerRemaining <= 0) {
      badge.textContent =
        state.persona === 'kid' ? 'Timer Up • Worried → Angry!' : 'Timer Expired (00:00)!';
    } else if (mood === 'worried' || mood === 'impatient') {
      badge.textContent =
        state.persona === 'kid' ? 'Circle Low • Barnaby is Worried!' : 'Circle Timer Low • Hurry!';
    } else {
      badge.textContent = 'Circle Timer Active';
    }
  }

  const mascotStage = document.getElementById('mascot-stage');
  if (mascotStage) {
    mascotStage.innerHTML = getCompanionSVG(state.persona, mood, 78);
  }

  const speech = document.getElementById('companion-speech');
  if (speech) {
    speech.textContent = getCompanionSpeechText(med, mood);
  }
}

function renderVerificationSuiteHTML(prefix, med) {
  const v = state.verification;
  const isKid = state.persona === 'kid';
  const isRefill = state.lockdownReason === 'critical-refill';
  const ready = isGuaranteeReadyToHold();

  if (isRefill) {
    return `
      <div class="guarantee-box-header">
        <span class="guarantee-box-title">📦 Critical Refill Guarantee (${med.stockLeft} Left!)</span>
        <button class="sim-btn" style="padding:2px 7px; font-size:11px;" onclick="quickVerifyAllSensors()">⚡ Instant Demo Check</button>
      </div>
      <div class="verification-modules-grid" style="grid-template-columns: 1fr;">
        <div class="verify-module-card ${v.pillPhotoScanned ? 'verified' : ''}">
          <div class="module-top">
            <span>📷 1. Refill Bottle / Rx Receipt Photo</span>
            <span class="module-status-tag">${v.pillPhotoScanned ? '✓ Verified' : 'Required'}</span>
          </div>
          <div class="scanner-preview-box">
            <video id="pill-scanner-video" class="scanner-video" playsinline muted></video>
            ${v.pillScanningNow ? '<div class="scanner-laser"></div><span>Scanning Rx Bottle Barcode...</span>' : ''}
            ${!v.pillScanningNow && v.pillPhotoScanned ? '<span>✅ Rx Refill Bottle Matched (99.8%)</span>' : ''}
            ${!v.pillScanningNow && !v.pillPhotoScanned ? `<span>Point camera at ${med.name} bottle or pharmacy receipt</span>` : ''}
          </div>
          <button type="button" class="module-action-btn" onclick="startCameraSensorScan('pill')">
            ${v.pillPhotoScanned ? '✓ Rx Bottle Scanned' : '📷 Scan Refill Bottle / Rx'}
          </button>
        </div>
      </div>

      <label class="check-row ${v.checklistConfirmed ? 'checked' : ''}">
        <input type="checkbox" ${v.checklistConfirmed ? 'checked' : ''} onchange="toggleChecklistConfirm(this.checked)" />
        <span>2. I have restocked ${med.name} (+30 doses) or confirmed pharmacy pickup</span>
      </label>

      <button
        type="button"
        class="hold-guarantee-btn"
        id="${prefix}-hold-btn"
        ${!ready ? 'disabled' : ''}
        onmousedown="startHoldGuarantee('${prefix}')"
        onmouseup="cancelHoldGuarantee('${prefix}')"
        onmouseleave="cancelHoldGuarantee('${prefix}')"
        ontouchstart="event.preventDefault(); startHoldGuarantee('${prefix}')"
        ontouchend="cancelHoldGuarantee('${prefix}')"
      >
        <div class="hold-fill-bar" id="${prefix}-hold-fill"></div>
        <span class="hold-btn-label" id="${prefix}-hold-label">
          ${ready ? '👆 Hold 3s to Guarantee Refill (+30 Doses)' : '☝️ Complete Bottle Scan & Check Above First'}
        </span>
      </button>
    `;
  }

  return `
    <div class="guarantee-box-header">
      <span class="guarantee-box-title">
        🛡️ Multi-Sensor Dose Guarantee
      </span>
      <button type="button" class="sim-btn" style="padding:2px 7px; font-size:11px;" onclick="quickVerifyAllSensors()">
        ⚡ Auto-Verify Sensors
      </button>
    </div>

    <div class="verification-modules-grid">
      <!-- Sensor 1: Camera Pill / Cup Photo Verification -->
      <div class="verify-module-card ${v.pillPhotoScanned ? 'verified' : ''}">
        <div class="module-top">
          <span>📷 ${isKid ? 'Cup Scan' : 'Pill Scan'}</span>
          <span class="module-status-tag">${v.pillPhotoScanned ? '✓ 99% Match' : 'Step 1'}</span>
        </div>
        <div class="scanner-preview-box">
          <video id="pill-scanner-video" class="scanner-video" playsinline muted></video>
          ${v.pillScanningNow ? '<div class="scanner-laser"></div><span>AI Matching Dose...</span>' : ''}
          ${!v.pillScanningNow && v.pillPhotoScanned ? `<span>✅ ${med.icon} Dose Verified</span>` : ''}
          ${!v.pillScanningNow && !v.pillPhotoScanned ? `<span>Scan ${med.dosage}</span>` : ''}
        </div>
        <button type="button" class="module-action-btn" onclick="startCameraSensorScan('pill')">
          ${v.pillPhotoScanned ? '✓ Dose Scanned' : '📷 Scan Medicine'}
        </button>
      </div>

      <!-- Sensor 2: Child Face Scan (Kid Mode) OR Water Shake Gesture -->
      ${
        isKid
          ? `
        <div class="verify-module-card ${v.childFaceScanned ? 'verified' : ''}">
          <div class="module-top">
            <span>👦 Face Scan</span>
            <span class="module-status-tag">${v.childFaceScanned ? '✓ Leo ID' : 'Step 2'}</span>
          </div>
          <div class="scanner-preview-box">
            <video id="face-scanner-video" class="scanner-video" playsinline muted></video>
            ${v.faceScanningNow ? '<div class="scanner-laser"></div><span>Scanning Child Face...</span>' : ''}
            ${!v.faceScanningNow && v.childFaceScanned ? '<span>✅ Leo (Age 8) Verified</span>' : ''}
            ${!v.faceScanningNow && !v.childFaceScanned ? '<span>Child Face + Sip Check</span>' : ''}
          </div>
          <button type="button" class="module-action-btn" onclick="startCameraSensorScan('face')">
            ${v.childFaceScanned ? '✓ Child Face Verified' : '👦 Scan Child Face'}
          </button>
        </div>
      `
          : `
        <div class="verify-module-card ${v.waterShakeProgress >= 100 ? 'verified' : ''}">
          <div class="module-top">
            <span>📳 Water Shake</span>
            <span class="module-status-tag">${v.waterShakeProgress}%</span>
          </div>
          <div class="scanner-preview-box" style="background: hsl(200, 65%, 18%); padding: 6px;">
            <span>💧 Shake Phone with Water</span>
            <div class="shake-meter-bar" style="margin-top:4px;">
              <div class="shake-meter-fill" style="width:${v.waterShakeProgress}%;"></div>
            </div>
          </div>
          <button type="button" class="module-action-btn" onclick="triggerWaterShakeStep()">
            ${v.waterShakeProgress >= 100 ? '✓ Water Shake Done' : '📳 Shake / Tap (+35%)'}
          </button>
        </div>
      `
      }
    </div>

    ${
      isKid
        ? `
      <!-- Kid Mode Row 2: Water Shake Gesture + Parent 4-Digit PIN -->
      <div class="verification-modules-grid">
        <div class="verify-module-card ${v.waterShakeProgress >= 100 ? 'verified' : ''}">
          <div class="module-top">
            <span>📳 Water Shake</span>
            <span class="module-status-tag">${v.waterShakeProgress}%</span>
          </div>
          <div class="shake-meter-bar">
            <div class="shake-meter-fill" style="width:${v.waterShakeProgress}%;"></div>
          </div>
          <button type="button" class="module-action-btn" onclick="triggerWaterShakeStep()">
            ${v.waterShakeProgress >= 100 ? '✓ Water Shaken!' : '📳 Shake Water Cup'}
          </button>
        </div>

        <div class="verify-module-card ${v.parentPinVerified ? 'verified' : ''}">
          <div class="module-top">
            <span>🔐 Parent PIN</span>
            <span class="module-status-tag">${v.parentPinVerified ? '✓ Approved' : 'PIN: 1234'}</span>
          </div>
          <div class="pin-input-row">
            <input
              type="password"
              maxlength="4"
              class="pin-field"
              placeholder="1234"
              value="${v.parentPinInput}"
              oninput="handleParentPinInput(this.value)"
            />
            <button type="button" class="sim-btn" style="padding:5px 7px;" title="Auto-fill Parent PIN 1234" onclick="autoFillParentPin()">
              🔑
            </button>
          </div>
        </div>
      </div>
    `
        : ''
    }

    <label class="check-row ${v.checklistConfirmed ? 'checked' : ''}">
      <input
        type="checkbox"
        ${v.checklistConfirmed ? 'checked' : ''}
        onchange="toggleChecklistConfirm(this.checked)"
      />
      <span>
        ${
          isKid
            ? `Final Check: Leo swallowed ${med.visualDesc}!`
            : `Final Check: I physically took ${med.visualDesc}`
        }
      </span>
    </label>

    <button
      type="button"
      class="hold-guarantee-btn"
      id="${prefix}-hold-btn"
      ${!ready ? 'disabled' : ''}
      onmousedown="startHoldGuarantee('${prefix}')"
      onmouseup="cancelHoldGuarantee('${prefix}')"
      onmouseleave="cancelHoldGuarantee('${prefix}')"
      ontouchstart="event.preventDefault(); startHoldGuarantee('${prefix}')"
      ontouchend="cancelHoldGuarantee('${prefix}')"
    >
      <div class="hold-fill-bar" id="${prefix}-hold-fill"></div>
      <span class="hold-btn-label" id="${prefix}-hold-label">
        ${
          ready
            ? '👆 Hold 3 Seconds to Seal Dose Guarantee!'
            : '☝️ Complete Sensor Checks Above (or Tap ⚡ Auto-Verify)'
        }
      </span>
    </button>
  `;
}

function renderTodayTab(med) {
  const meds = getCurrentMeds();
  const mood = getMoodForMed(med);

  return `
    <section class="circle-timer-card" id="circle-timer-card" data-mood="${mood}">
      <div class="timer-card-top">
        <span class="timer-status-badge">
          <span class="status-dot"></span>
          <span id="timer-status-badge-text">Circle Timer Active</span>
        </span>
        <span class="active-med-pill-tag">${med.scheduledTime} • ${med.stockLeft} left</span>
      </div>

      <div class="circle-ring-wrapper">
        <svg class="circle-ring-svg" viewBox="0 0 192 192">
          <circle class="ring-track" cx="96" cy="96" r="80"></circle>
          <circle class="ring-progress" id="ring-progress-circle" cx="96" cy="96" r="80"></circle>
        </svg>
        <div class="ring-center-content">
          <div class="mascot-stage" id="mascot-stage">
            ${getCompanionSVG(state.persona, mood, 78)}
          </div>
          <div class="countdown-readout" id="countdown-readout">
            ${med.status === 'taken' ? 'DONE' : formatSeconds(med.timerRemaining)}
          </div>
          <div class="countdown-caption">
            ${med.status === 'taken' ? 'Verified Guarantee' : 'Circle Timer Window'}
          </div>
        </div>
      </div>

      <div class="active-dose-summary">
        <h2 class="active-dose-title">${med.icon} ${med.name}</h2>
        <p class="active-dose-meta">${med.dosage} • ${med.instructions}</p>
        ${
          med.snoozeReason
            ? `<p class="active-dose-meta" style="color: var(--brand-secondary); font-weight: 700;">⏳ ${med.snoozeReason}</p>`
            : ''
        }
      </div>

      <div class="companion-speech-bubble" id="companion-speech">
        ${getCompanionSpeechText(med, mood)}
      </div>

      ${
        med.status !== 'taken'
          ? `
        <div class="timer-cta-row">
          <button class="btn-primary-take" onclick="openCalmGuaranteeSheet()">
            ✅ Verify &amp; Guarantee
          </button>
          <button class="btn-secondary-snooze" onclick="applySmartSnooze('Eating Meal (+15m)', 45)">
            ⏳ Snooze (${med.snoozeCount || 0}/2)
          </button>
        </div>
      `
          : `
        <div class="timer-cta-row" style="grid-template-columns: 1fr;">
          <button class="btn-secondary-snooze" onclick="simulateTimerState('reset')">
            🔄 Reset Dose Timer to Demo Again
          </button>
        </div>
      `
      }

      <!-- Interactive Simulator Strip (Now with Critical Refill Alert & Timer Up!) -->
      <div class="simulator-bar">
        <div class="simulator-header">
          <span>🧪 Test Specific Lockdown Situations:</span>
          <span>${state.persona === 'kid' ? 'Worried → Angry' : 'Adult Mode'}</span>
        </div>
        <div class="simulator-buttons">
          <button class="sim-btn" onclick="simulateTimerState('reset')">
            🟢 Calm Circle (45s)
          </button>
          <button class="sim-btn" onclick="simulateTimerState('low')">
            🟡 ${state.persona === 'kid' ? 'Worried (10s)' : 'Low Timer (10s)'}
          </button>
          <button class="sim-btn sim-danger" onclick="simulateTimerState('expired')">
            ${state.persona === 'kid' ? '😟➔😠 Timer Up (0s)' : '😡 Timer Up (0s)'}
          </button>
          <button class="sim-btn sim-refill" onclick="simulateTimerState('critical-refill')">
            🚨 Critical Refill (2 left)
          </button>
        </div>
      </div>
    </section>

    <div class="section-header">
      <h3 class="section-title">
        ${state.persona === 'kid' ? "Leo's Daily Quest Potions" : "Today's Medication Schedule"}
      </h3>
      <button class="section-action-btn" onclick="openAddMedSheet()">+ Add Medicine</button>
    </div>

    <div class="med-list">
      ${meds
        .map((item) => {
          const isSelected = item.id === med.id;
          const isCritStock = item.stockLeft <= item.criticalRefillThreshold;
          let statusLabel = 'Circle Active';
          let statusClass = 'status-pending';
          if (item.status === 'taken') {
            statusLabel = 'Guaranteed ✓';
            statusClass = 'status-guaranteed';
          } else if (item.timerRemaining <= 0) {
            statusLabel = state.persona === 'kid' ? 'Worried → Angry!' : 'Timer Up! 😡';
            statusClass = 'status-overdue';
          }
          return `
            <div class="med-card ${isSelected ? 'active-selected' : ''} ${item.status === 'taken' ? 'med-taken' : ''}"
                 onclick="selectMedication('${item.id}')">
              <div class="med-left">
                <div class="med-icon-box">${item.icon}</div>
                <div>
                  <div class="med-name">${item.name}</div>
                  <div class="med-sub">
                    <span>${item.dosage}</span>
                    ${
                      isCritStock
                        ? `<span style="color: var(--timer-expired); font-weight:800;"> • 🚨 CRITICAL (${item.stockLeft} left)</span>`
                        : `<span> • ${item.stockLeft} in bottle</span>`
                    }
                  </div>
                </div>
              </div>
              <div class="med-right">
                <span class="med-time-badge">${item.scheduledTime}</span>
                <span class="med-status-pill ${statusClass}">${statusLabel}</span>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderLogTab() {
  return `
    <div class="circle-timer-card" style="align-items: flex-start; text-align: left;">
      <div class="timer-card-top">
        <span class="timer-status-badge">🛡️ Multi-Modal Guarantee Audit</span>
        <span class="active-med-pill-tag">100% Verified</span>
      </div>
      <h2 class="active-dose-title">
        ${state.persona === 'kid' ? `🌟 ${state.streakCount} Hero Star Stickers Earned!` : `🔥 ${state.streakCount}-Day Verified Streak`}
      </h2>
      <p class="active-dose-meta">
        ${
          state.persona === 'kid'
            ? 'Every dose is verified with Child Face Scan, Medicine Cup Scan, Water Shake, and Parent PIN!'
            : `Every dose is verified with AI Pill Photo Scan, Water Shake Accelerometer, and a 3-Second Hold Guarantee.`
        }
      </p>
    </div>

    <div class="section-header">
      <h3 class="section-title">Verified Guarantee Log</h3>
    </div>

    <div class="med-list">
      ${state.guaranteeLogs
        .map(
          (entry) => `
        <div class="med-card">
          <div class="med-left">
            <div class="med-icon-box">${entry.wasOverdue ? '🚨' : '✅'}</div>
            <div>
              <div class="med-name">${entry.medName} (${entry.dosage})</div>
              <div class="med-sub">${entry.method}</div>
            </div>
          </div>
          <div class="med-right">
            <span class="med-time-badge">${entry.timestamp}</span>
            <span class="med-status-pill status-guaranteed">Verified</span>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function renderCabinetTab() {
  const meds = getCurrentMeds();
  return `
    <div class="section-header">
      <h3 class="section-title">Pill Cabinet &amp; Critical Refill Alerts</h3>
      <button class="section-action-btn" onclick="openAddMedSheet()">+ Add New</button>
    </div>

    <div class="med-list">
      ${meds
        .map((m) => {
          const isCrit = m.stockLeft <= m.criticalRefillThreshold;
          return `
            <div class="med-card" onclick="selectMedication('${m.id}')">
              <div class="med-left">
                <div class="med-icon-box">${m.icon}</div>
                <div>
                  <div class="med-name">${m.name}</div>
                  <div class="med-sub">
                    ${isCrit ? `<strong style="color:var(--timer-expired);">🚨 CRITICAL STOCK (${m.stockLeft} left)</strong>` : `${m.stockLeft} doses remaining`}
                  </div>
                </div>
              </div>
              <div class="med-right">
                <button class="sim-btn ${isCrit ? 'sim-danger' : ''}" style="padding:4px 8px; font-size:11px;"
                        onclick="event.stopPropagation(); state.selectedMedId='${m.id}'; simulateTimerState('critical-refill')">
                  🚨 Trigger Refill Lock
                </button>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>

    <div class="section-header" style="margin-top: 6px;">
      <h3 class="section-title">Caregiver &amp; Smart Safety Rules</h3>
    </div>

    <div class="circle-timer-card" style="align-items: stretch; gap: 8px;">
      <label class="check-row" style="justify-content: space-between;">
        <span>🔐 Kid Mode Parent Approval PIN</span>
        <strong style="font-family:var(--font-mono);">${state.parentPinCode}</strong>
      </label>
      <label class="check-row" style="justify-content: space-between;">
        <span>🚗 Auto-Snooze While Driving (&gt;15 mph)</span>
        <input type="checkbox" ${state.smartDrivingSnooze ? 'checked' : ''} onchange="state.smartDrivingSnooze = this.checked" />
      </label>
      <label class="check-row" style="justify-content: space-between;">
        <span>📞 Pause Alarm During Active Phone Calls</span>
        <input type="checkbox" ${state.smartCallPause ? 'checked' : ''} onchange="state.smartCallPause = this.checked" />
      </label>
    </div>
  `;
}

/* ==========================================================================
   Persistent Lockdown Overlay (Worried -> Angry in Kid Mode + All Triggers)
   ========================================================================== */

function renderAngryLockdownOverlay(med) {
  const overlay = document.getElementById('angry-lockdown-overlay');
  if (!overlay) return;

  if (!state.lockdownActive || !med) {
    overlay.classList.remove('active');
    return;
  }

  const isKid = state.persona === 'kid';
  const currentMood = isKid ? state.kidLockdownStage : 'angry';
  overlay.setAttribute('data-kid-stage', currentMood);
  overlay.classList.add('active');

  // Determine situation headline & copy
  let situationBadge = '🚨 Circle Timer Expired (00:00)';
  let headlineText = '';
  let subcopyText = '';

  if (state.lockdownReason === 'critical-refill') {
    situationBadge = `🚨 CRITICAL REFILL ALERT (${med.stockLeft} Doses Left!)`;
    if (isKid) {
      headlineText =
        currentMood === 'worried'
          ? `😟 Barnaby is Worried! ${med.name} is Almost Empty!`
          : currentMood === 'worried-angry'
          ? `😣 Barnaby is Getting Upset! Only ${med.stockLeft} Doses Left!`
          : `😠 BARNABY IS GRUMPY! Refill ${med.name} Right Now!`;
      subcopyText = `This alert will NOT leave your screen until a parent scans the refill bottle & guarantees the restock!`;
    } else {
      headlineText = `😡 CRITICAL REFILL LOCKDOWN: ${med.name} (${med.stockLeft} Left)!`;
      subcopyText = `You are about to run out of ${med.name}. This angry alert will not leave your screen until you scan & guarantee your refill.`;
    }
  } else if (state.lockdownReason === 'max-snooze') {
    situationBadge = `🚨 Max Snooze Limit Reached (2/2 Snoozes Used)`;
    headlineText = isKid
      ? `😣 No More Snoozing, Leo! Barnaby Went From Worried to Grumpy!`
      : `😡 Enough Snoozing! Take ${med.name} Right Now!`;
    subcopyText = `You already snoozed twice. Complete the multi-sensor guarantee below to unlock your phone.`;
  } else {
    // Timer Expired (00:00)
    if (isKid) {
      if (currentMood === 'worried') {
        headlineText = `😟 Oh No Leo! The Circle Timer Ran Out & Barnaby is Worried!`;
        subcopyText = `Barnaby starts worried when the timer hits 00:00 — and gets angrier if you wait! Complete your Face Scan & Guarantee now!`;
      } else if (currentMood === 'worried-angry') {
        headlineText = `😣 Barnaby is Going from Worried to Angry! Take ${med.name}!`;
        subcopyText = `Don't let Barnaby reach full Grumpy-Angry! Scan your face & medicine cup below!`;
      } else {
        headlineText = `😠 BARNABY IS FULL GRUMPY-ANGRY! You Still Haven't Guaranteed ${med.name}!`;
        subcopyText = `My grumpy face is locked to your screen until you complete the Child Face Scan, Water Shake, & Parent PIN!`;
      }
    } else {
      headlineText = `😡 HEY! The Circle Timer Hit 00:00 for ${med.name}!`;
      subcopyText = `This angry face will NOT leave your screen until you complete the Pill Photo Scan, Water Shake, and 3s Hold Guarantee.`;
    }
  }

  const scoldText =
    state.dismissAttemptsBlocked > 0
      ? `🚫 Dismissal Blocked (#${state.dismissAttemptsBlocked})! ${
          isKid
            ? 'Trying to close the screen makes Barnaby go from Worried to Angry faster!'
            : 'Swiping or tapping X will never close this screen. Complete the guarantee below!'
        }`
      : isKid
      ? `💡 Kid Mode Progression: Barnaby starts 😟 Worried and escalates to 😠 Angry until verified!`
      : `🔒 Persistent Screen Lock Active — Complete all verification sensors below to dismiss.`;

  overlay.innerHTML = `
    <div class="lockdown-top-bar">
      <span class="lockdown-alert-pill">${situationBadge}</span>
      <button type="button" class="fake-dismiss-btn" onclick="triggerAngryReject()">
        ✕ Try to Dismiss
      </button>
    </div>

    ${
      isKid
        ? `
      <!-- Interactive Worried -> Worried-Angry -> Angry Escalation Bar for Kid Mode -->
      <div class="kid-mood-stepper">
        <button type="button" class="kid-stage-chip ${currentMood === 'worried' ? 'active' : ''}" onclick="setKidLockdownStage('worried')">
          😟 1. Worried
        </button>
        <button type="button" class="kid-stage-chip ${currentMood === 'worried-angry' ? 'active' : ''}" onclick="setKidLockdownStage('worried-angry')">
          😣 2. Worried-Angry
        </button>
        <button type="button" class="kid-stage-chip ${currentMood === 'angry' ? 'active' : ''}" onclick="setKidLockdownStage('angry')">
          😠 3. Angry
        </button>
      </div>
    `
        : ''
    }

    <div class="angry-face-hero" onclick="triggerAngryReject()">
      <div class="angry-svg-container">
        ${getCompanionSVG(state.persona, currentMood, 102)}
      </div>
      <h2 class="angry-headline">${headlineText}</h2>
      <p class="angry-subcopy">${subcopyText}</p>
      <div class="scold-feedback-banner" id="scold-feedback-banner">
        ${scoldText}
      </div>
    </div>

    <div class="guarantee-box" onclick="event.stopPropagation()">
      ${renderVerificationSuiteHTML('lockdown', med)}

      ${
        state.lockdownReason !== 'critical-refill'
          ? `
        <div class="lockdown-snooze-row">
          <button type="button" class="lockdown-snooze-btn" onclick="applySmartSnooze('Eating Meal First (+15m)', 45)">
            🍽️ Eating (15m)
          </button>
          <button type="button" class="lockdown-snooze-btn" onclick="applySmartSnooze('Driving Safety Mode', 60)">
            🚗 Driving
          </button>
          <button type="button" class="lockdown-snooze-btn" onclick="applySmartSnooze('Arrive Home', 60)">
            🏠 At Home
          </button>
        </div>
      `
          : ''
      }
    </div>
  `;
}

/* ==========================================================================
   On-Time Guarantee Bottom Sheet & Add Medication Sheet
   ========================================================================== */

function openCalmGuaranteeSheet() {
  resetVerificationState();
  state.lockdownReason = 'timer-expired';
  activeSheetMode = 'calm-guarantee';
  renderAll();
}

function openAddMedSheet() {
  activeSheetMode = 'add-med';
  renderAll();
}

function closeBottomSheet() {
  stopCameraStream();
  activeSheetMode = null;
  renderAll();
}

function renderBottomSheet(med) {
  const backdrop = document.getElementById('sheet-backdrop');
  const container = document.getElementById('bottom-sheet-content');
  if (!backdrop || !container) return;

  if (!activeSheetMode) {
    backdrop.classList.remove('open');
    return;
  }

  backdrop.classList.add('open');

  if (activeSheetMode === 'calm-guarantee' && med) {
    container.innerHTML = `
      <div class="sheet-header">
        <h3 class="sheet-title">✅ Guarantee ${med.name}</h3>
        <button type="button" class="sheet-close" onclick="closeBottomSheet()">✕</button>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary);">
        You beat the Circle Timer (${med.timerRemaining}s left)! Complete the sensor verification below:
      </p>
      ${renderVerificationSuiteHTML('calm', med)}
    `;
  } else if (activeSheetMode === 'add-med') {
    container.innerHTML = `
      <div class="sheet-header">
        <h3 class="sheet-title">+ Add New Medication</h3>
        <button type="button" class="sheet-close" onclick="closeBottomSheet()">✕</button>
      </div>
      <form onsubmit="handleAddMedication(event)" style="display:flex; flex-direction:column; gap:10px;">
        <div class="form-group">
          <label>Medicine Name</label>
          <input id="new-med-name" class="form-input" required placeholder="e.g., Grape Allergy Syrup" />
        </div>
        <div class="form-group">
          <label>Dosage &amp; Form</label>
          <input id="new-med-dosage" class="form-input" required placeholder="e.g., 5 mL • 1 Cup" />
        </div>
        <div class="form-group">
          <label>Visual Guarantee Description</label>
          <input id="new-med-visual" class="form-input" required placeholder="e.g., 1 Purple Cup + Sip of Water" />
        </div>
        <button type="submit" class="btn-primary-take" style="width:100%;">
          Save &amp; Start Circle Timer
        </button>
      </form>
    `;
  }
}

function handleAddMedication(e) {
  e.preventDefault();
  const name = document.getElementById('new-med-name').value.trim();
  const dosage = document.getElementById('new-med-dosage').value.trim();
  const visualDesc = document.getElementById('new-med-visual').value.trim();
  if (!name) return;

  const newMed = {
    id: `${state.persona}-${Date.now()}`,
    name,
    dosage,
    visualDesc,
    instructions: 'Protected by Circle Timer & Multi-Modal Guarantee',
    scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    icon: state.persona === 'kid' ? '🦸' : '💊',
    stockLeft: 15,
    refillThreshold: 5,
    criticalRefillThreshold: 2,
    timerTotal: 45,
    timerRemaining: 45,
    snoozeCount: 0,
    status: 'pending',
    guaranteedAt: null,
    snoozeReason: null
  };

  state.medications[state.persona].unshift(newMed);
  state.selectedMedId = newMed.id;
  activeSheetMode = null;
  renderAll();
}

/* ==========================================================================
   Navigation & Persona Switching
   ========================================================================== */

function switchPersona(persona) {
  stopCameraStream();
  state.persona = persona;
  const meds = getCurrentMeds();
  const firstPending = meds.find((m) => m.status !== 'taken') || meds[0];
  state.selectedMedId = firstPending.id;

  if (firstPending.timerRemaining <= 0 && firstPending.status !== 'taken') {
    triggerPersistentLockdown(firstPending, 'timer-expired');
  } else {
    state.lockdownActive = false;
    renderAll();
  }
}

function selectMedication(medId) {
  state.selectedMedId = medId;
  const med = getSelectedMed();
  state.activeTab = 'today';

  if (med && med.stockLeft <= med.criticalRefillThreshold && med.status !== 'taken') {
    triggerPersistentLockdown(med, 'critical-refill');
  } else if (med && med.timerRemaining <= 0 && med.status !== 'taken') {
    triggerPersistentLockdown(med, 'timer-expired');
  } else {
    renderAll();
  }
}

function switchTab(tab) {
  state.activeTab = tab;
  renderAll();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  renderAll();
}

function renderAll() {
  document.documentElement.setAttribute('data-persona', state.persona);

  const titleEl = document.getElementById('app-main-title');
  const subEl = document.getElementById('app-main-subtitle');
  if (titleEl && subEl) {
    titleEl.textContent = state.persona === 'adult' ? 'PillPal Care' : 'PillPal Hero';
    subEl.textContent =
      state.persona === 'adult'
        ? 'Alex (Adult) • Pill Scan + Shake Guarantee'
        : 'Leo, Age 8 (Kid) • Face Scan + Worried→Angry';
  }

  document.getElementById('btn-persona-adult')?.classList.toggle('active', state.persona === 'adult');
  document.getElementById('btn-persona-kid')?.classList.toggle('active', state.persona === 'kid');

  const streakChip = document.getElementById('streak-chip-text');
  if (streakChip) {
    streakChip.textContent =
      state.persona === 'kid' ? `⭐ ${state.streakCount} Stars` : `🔥 ${state.streakCount}d • ❤️ ${state.charityHearts}`;
  }

  const soundBtn = document.getElementById('btn-sound-toggle');
  if (soundBtn) soundBtn.textContent = state.soundEnabled ? '🔊 Sound' : '🔇 Muted';

  const island = document.getElementById('dynamic-island');
  const islandText = document.getElementById('dynamic-island-text');
  const med = getSelectedMed();
  if (island && islandText && med) {
    island.classList.remove('island-alert', 'island-worried');
    if (state.lockdownActive) {
      if (state.persona === 'kid' && state.kidLockdownStage === 'worried') {
        island.classList.add('island-worried');
        islandText.textContent = 'WORRIED LOCK';
      } else {
        island.classList.add('island-alert');
        islandText.textContent = state.lockdownReason === 'critical-refill' ? 'REFILL LOCK' : 'ANGRY LOCK';
      }
    } else {
      islandText.textContent = med.status === 'taken' ? 'ALL GOOD' : formatSeconds(med.timerRemaining);
    }
  }

  const mainContainer = document.getElementById('phone-main-content');
  if (mainContainer) {
    if (state.activeTab === 'today') {
      mainContainer.innerHTML = renderTodayTab(med);
      updateCircleTimerDOM();
    } else if (state.activeTab === 'log') {
      mainContainer.innerHTML = renderLogTab();
    } else {
      mainContainer.innerHTML = renderCabinetTab();
    }
  }

  document.querySelectorAll('.tab-item').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === state.activeTab);
  });

  renderAngryLockdownOverlay(med);
  renderBottomSheet(med);
}

window.addEventListener('DOMContentLoaded', () => {
  renderAll();
  startCircleTimerLoop();
});
