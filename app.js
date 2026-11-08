/**
 * PillPal Care — Mobile Medication Companion Engine
 * Implements:
 * 1. Dual Adult & Kid-Friendly Personas
 * 2. Circular "Time-Box" Countdown Ring (Circle Timer)
 * 3. Conditional Persistent Angry Face Lockdown (triggers ONLY when Circle Timer hits 00:00 and med is not taken)
 * 4. Multi-Step Medication Guarantee (Checklist + 3-Second Hold-to-Guarantee)
 */

const INITIAL_DATA = {
  persona: 'adult', // 'adult' | 'kid'
  activeTab: 'today', // 'today' | 'log' | 'cabinet'
  soundEnabled: true,
  smartDrivingSnooze: true,
  smartCallPause: true,
  caregiverAlerts: true,
  streakCount: 14,
  charityHearts: 42,
  selectedMedId: 'adult-1',
  timerPaused: false,
  lockdownActive: false,
  dismissAttemptsBlocked: 0,
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
        refillThreshold: 7,
        timerTotal: 45,
        timerRemaining: 45,
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
        stockLeft: 5,
        refillThreshold: 7,
        timerTotal: 60,
        timerRemaining: 60,
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
        timerTotal: 45,
        timerRemaining: 45,
        status: 'taken',
        guaranteedAt: 'Yesterday, 08:59 PM',
        snoozeReason: null
      }
    ],
    kid: [
      {
        id: 'kid-1',
        name: 'Berry Shield Amoxicillin',
        dosage: '5 mL • Bubblegum Berry Spoon',
        visualDesc: '1 Pink Measuring Cup (5 mL) + Big Sip of Water',
        instructions: 'Super-Shield potion! Shake bottle well before pouring.',
        scheduledTime: '08:00 AM',
        icon: '🍓',
        stockLeft: 12,
        refillThreshold: 4,
        timerTotal: 45,
        timerRemaining: 45,
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
        stockLeft: 38,
        refillThreshold: 10,
        timerTotal: 45,
        timerRemaining: 45,
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
        timerTotal: 45,
        timerRemaining: 45,
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
      method: '3s Hold Guarantee + Parent High-Five',
      wasOverdue: false
    },
    {
      id: 'log-2',
      persona: 'adult',
      medName: 'Magnesium Glycinate',
      dosage: '200 mg',
      timestamp: 'Yesterday, 08:59 PM',
      method: '3s Hold Guarantee (18s left on Circle)',
      wasOverdue: false
    }
  ]
};

let state = JSON.parse(JSON.stringify(INITIAL_DATA));
let countdownInterval = null;
let holdInterval = null;
let holdProgress = 0;
let activeSheetMode = null; // 'calm-guarantee' | 'add-med' | null

// Web Audio API Synthesizer for subtle chimes & insistent angry buzzer
let audioCtx = null;
function playTone(type) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    if (type === 'angry-alarm') {
      // Insistent double-pulse alarm sound
      [0, 0.18].forEach((offset) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = state.persona === 'kid' ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(state.persona === 'kid' ? 520 : 440, now + offset);
        osc.frequency.exponentialRampToValueAtTime(280, now + offset + 0.14);
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
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
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
  } catch (_) {
    // Ignore audio context restrictions if not yet interacted
  }
}

/* ==========================================================================
   Expressive Companion SVG Generator (Adult "Pillo Guard" & Kid "Barnaby")
   ========================================================================== */

function getCompanionSVG(persona, mood, size = 90) {
  // mood: 'calm' | 'impatient' | 'angry' | 'celebrating'
  if (persona === 'adult') {
    if (mood === 'angry') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Steam puffs -->
          <circle cx="24" cy="22" r="7" fill="#FCA5A5" opacity="0.85"/>
          <circle cx="96" cy="20" r="8" fill="#FCA5A5" opacity="0.85"/>
          <path d="M55 8 L65 18 M65 8 L55 18" stroke="#FEF08A" stroke-width="3.5" stroke-linecap="round"/>
          <!-- Angry Crimson Capsule Body -->
          <rect x="26" y="18" width="68" height="88" rx="34" fill="#EF4444" stroke="#7F1D1D" stroke-width="4"/>
          <path d="M26 62 H94 V72 C94 90.7777 78.7777 106 60 106 C41.2223 106 26 90.7777 26 72 V62 Z" fill="#B91C1C"/>
          <!-- Heavy V-Shaped Furrowed Brows -->
          <path d="M36 42 L55 51" stroke="#450A0A" stroke-width="5.5" stroke-linecap="round"/>
          <path d="M84 42 L65 51" stroke="#450A0A" stroke-width="5.5" stroke-linecap="round"/>
          <!-- Fierce Glowing Eyes -->
          <circle cx="46" cy="54" r="6" fill="#FEF08A"/>
          <circle cx="46" cy="54" r="2.5" fill="#450A0A"/>
          <circle cx="74" cy="54" r="6" fill="#FEF08A"/>
          <circle cx="74" cy="54" r="2.5" fill="#450A0A"/>
          <!-- Gritted Shouting Mouth -->
          <rect x="42" y="70" width="36" height="16" rx="6" fill="#450A0A" stroke="#FCA5A5" stroke-width="2"/>
          <path d="M42 78 H78 M54 70 V86 M66 70 V86" stroke="#FFFFFF" stroke-width="2.5"/>
        </svg>
      `;
    }
    if (mood === 'impatient') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="mascot-impatient">
          <rect x="28" y="18" width="64" height="86" rx="32" fill="#F59E0B" stroke="#78350F" stroke-width="3.5"/>
          <path d="M28 61 H92 V72 C92 89.6731 77.6731 104 60 104 C42.3269 104 28 89.6731 28 72 V61 Z" fill="#D97706"/>
          <!-- Sweat Drop -->
          <path d="M96 30 C96 30 102 38 102 42 C102 45.3 99.3 48 96 48 C92.7 48 90 45.3 90 42 C90 38 96 30 96 30 Z" fill="#38BDF8"/>
          <!-- Worried/Impatient Brows -->
          <path d="M38 44 L52 47" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
          <path d="M82 42 L68 47" stroke="#451A03" stroke-width="4" stroke-linecap="round"/>
          <circle cx="46" cy="53" r="4.5" fill="#451A03"/>
          <circle cx="74" cy="53" r="4.5" fill="#451A03"/>
          <!-- Wavy Impatient Mouth -->
          <path d="M46 74 Q53 69 60 74 T74 74" stroke="#451A03" stroke-width="4" stroke-linecap="round" fill="none"/>
        </svg>
      `;
    }
    if (mood === 'celebrating') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="mascot-calm">
          <rect x="28" y="18" width="64" height="86" rx="32" fill="#10B981" stroke="#064E3B" stroke-width="3.5"/>
          <path d="M28 61 H92 V72 C92 89.6731 77.6731 104 60 104 C42.3269 104 28 89.6731 28 72 V61 Z" fill="#059669"/>
          <path d="M40 50 Q46 42 52 50" stroke="#064E3B" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M68 50 Q74 42 80 50" stroke="#064E3B" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M45 68 C45 77 75 77 75 68 Z" fill="#064E3B"/>
        </svg>
      `;
    }
    // Calm Default (Adult)
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="mascot-calm">
        <rect x="28" y="18" width="64" height="86" rx="32" fill="#34D399" stroke="#16382C" stroke-width="3.5"/>
        <path d="M28 61 H92 V72 C92 89.6731 77.6731 104 60 104 C42.3269 104 28 89.6731 28 72 V61 Z" fill="#10B981"/>
        <circle cx="46" cy="50" r="4.5" fill="#16382C"/>
        <circle cx="74" cy="50" r="4.5" fill="#16382C"/>
        <circle cx="38" cy="57" r="4" fill="#F43F5E" opacity="0.35"/>
        <circle cx="82" cy="57" r="4" fill="#F43F5E" opacity="0.35"/>
        <path d="M48 68 Q60 77 72 68" stroke="#16382C" stroke-width="4" stroke-linecap="round" fill="none"/>
      </svg>
    `;
  } else {
    // Kid Persona ("Barnaby the Hero Buddy")
    if (mood === 'angry') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Cute Monster Horns + Steam -->
          <path d="M28 34 L16 14 L38 24 Z" fill="#FDE047" stroke="#7F1D1D" stroke-width="3"/>
          <path d="M92 34 L104 14 L82 24 Z" fill="#FDE047" stroke="#7F1D1D" stroke-width="3"/>
          <!-- Puffy Grumpy Red Monster Body -->
          <circle cx="60" cy="64" r="42" fill="#FB7185" stroke="#881337" stroke-width="4"/>
          <!-- Puffed Angry Cheeks -->
          <circle cx="32" cy="70" r="10" fill="#E11D48"/>
          <circle cx="88" cy="70" r="10" fill="#E11D48"/>
          <!-- Giant Angry Eyebrows -->
          <path d="M34 45 L55 55" stroke="#881337" stroke-width="6" stroke-linecap="round"/>
          <path d="M86 45 L65 55" stroke="#881337" stroke-width="6" stroke-linecap="round"/>
          <!-- Intense Cartoon Eyes -->
          <circle cx="46" cy="58" r="7" fill="#FFFFFF"/>
          <circle cx="47" cy="58" r="3.5" fill="#881337"/>
          <circle cx="74" cy="58" r="7" fill="#FFFFFF"/>
          <circle cx="73" cy="58" r="3.5" fill="#881337"/>
          <!-- Grumpy Monster Roar Mouth with Little Fang -->
          <path d="M42 82 Q60 70 78 82 Z" fill="#881337"/>
          <polygon points="48,79 52,86 56,78" fill="#FFFFFF"/>
          <polygon points="64,78 68,86 72,79" fill="#FFFFFF"/>
        </svg>
      `;
    }
    if (mood === 'impatient') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="mascot-impatient">
          <path d="M30 34 L20 16 L40 26 Z" fill="#FBBF24" stroke="#1E293B" stroke-width="3"/>
          <path d="M90 34 L100 16 L80 26 Z" fill="#FBBF24" stroke="#1E293B" stroke-width="3"/>
          <circle cx="60" cy="64" r="40" fill="#FBBF24" stroke="#1E293B" stroke-width="3.5"/>
          <path d="M36 46 L52 49" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M84 44 L68 49" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round"/>
          <circle cx="46" cy="58" r="6" fill="#FFFFFF"/>
          <circle cx="46" cy="58" r="3" fill="#1E293B"/>
          <circle cx="74" cy="58" r="6" fill="#FFFFFF"/>
          <circle cx="74" cy="58" r="3" fill="#1E293B"/>
          <circle cx="60" cy="77" r="6" fill="#1E293B"/>
        </svg>
      `;
    }
    // Kid Calm / Happy Buddy
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="mascot-calm">
        <path d="M30 34 L20 16 L40 26 Z" fill="#FBBF24" stroke="#1E293B" stroke-width="3"/>
        <path d="M90 34 L100 16 L80 26 Z" fill="#FBBF24" stroke="#1E293B" stroke-width="3"/>
        <circle cx="60" cy="64" r="40" fill="#38BDF8" stroke="#1E293B" stroke-width="3.5"/>
        <circle cx="45" cy="56" r="6.5" fill="#FFFFFF"/>
        <circle cx="45" cy="56" r="3.5" fill="#1E293B"/>
        <circle cx="75" cy="56" r="6.5" fill="#FFFFFF"/>
        <circle cx="75" cy="56" r="3.5" fill="#1E293B"/>
        <circle cx="34" cy="66" r="5" fill="#F472B6" opacity="0.6"/>
        <circle cx="86" cy="66" r="5" fill="#F472B6" opacity="0.6"/>
        <path d="M44 72 Q60 86 76 72" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      </svg>
    `;
  }
}

/* ==========================================================================
   Helper & State Accessors
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

function getMoodForMed(med) {
  if (med.status === 'taken') return 'celebrating';
  if (med.timerRemaining <= 0) return 'angry';
  const ratio = med.timerRemaining / med.timerTotal;
  if (ratio <= 0.35) return 'impatient';
  return 'calm';
}

function formatSeconds(sec) {
  const clamped = Math.max(0, Math.floor(sec));
  const m = String(Math.floor(clamped / 60)).padStart(2, '0');
  const s = String(clamped % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* ==========================================================================
   Circle Timer Engine & Conditional Angry Lockdown Trigger
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

      // SPECIFIC SITUATION TRIGGER:
      // The moment the timer from the circle is up (00:00) AND the medication wasn't taken,
      // lock the screen with the persistent Angry Face!
      if (med.timerRemaining === 0 && med.status !== 'taken') {
        triggerAngryLockdown(med);
      }
    }
  }, 1000);
}

function triggerAngryLockdown(med) {
  med.status = 'overdue';
  state.lockdownActive = true;
  state.dismissAttemptsBlocked = 0;
  playTone('angry-alarm');
  renderAll();
}

function triggerAngryReject() {
  state.dismissAttemptsBlocked += 1;
  playTone('reject');

  const overlay = document.getElementById('angry-lockdown-overlay');
  if (overlay) {
    overlay.classList.remove('shake-reject');
    void overlay.offsetWidth; // force reflow
    overlay.classList.add('shake-reject');
  }

  const scoldBanner = document.getElementById('scold-feedback-banner');
  const adultScolds = [
    `🚫 Nice try! (Attempt #${state.dismissAttemptsBlocked} blocked) — The circle timer hit 00:00. I'm not leaving your screen until you guarantee you took your dose!`,
    `😠 Swiping won't work! Complete the 2-step Dose Guarantee below so we know 100% you took your medicine.`,
    `🔥 Still here! Either hold the Guarantee button for 3 seconds or log an intentional Smart Snooze.`
  ];
  const kidScolds = [
    `🦖 ROAR-POUT! (Blocked #${state.dismissAttemptsBlocked}) — The circle timer ran out! Barnaby is NOT leaving until you guarantee you took your medicine!`,
    `😤 No sneaking past me! Check the boxes and hold the Green Guarantee Button for 3 seconds!`,
    `🍓 My grumpy face is stuck here until your Super-Shield dose is guaranteed!`
  ];
  const pool = state.persona === 'kid' ? kidScolds : adultScolds;
  if (scoldBanner) {
    scoldBanner.textContent = pool[(state.dismissAttemptsBlocked - 1) % pool.length];
  }
}

/* ==========================================================================
   Simulation Actions (For Instant User Testing of All Circle States)
   ========================================================================== */

function simulateTimerState(mode) {
  const med = getSelectedMed();
  if (!med) return;

  if (mode === 'reset') {
    med.status = 'pending';
    med.timerRemaining = med.timerTotal;
    state.lockdownActive = false;
    renderAll();
  } else if (mode === 'low') {
    med.status = 'pending';
    med.timerRemaining = 10; // Low circle timer -> Impatient face (not angry lockdown yet!)
    state.lockdownActive = false;
    renderAll();
  } else if (mode === 'expired') {
    med.status = 'overdue';
    med.timerRemaining = 0;
    triggerAngryLockdown(med);
  }
}

/* ==========================================================================
   Medication Guarantee & Smart Snooze Completion
   ========================================================================== */

function areGuaranteeBoxesChecked(prefix) {
  const c1 = document.getElementById(`${prefix}-check-1`);
  const c2 = document.getElementById(`${prefix}-check-2`);
  return Boolean(c1 && c1.checked && c2 && c2.checked);
}

function updateHoldButtonState(prefix) {
  const ready = areGuaranteeBoxesChecked(prefix);
  const btn = document.getElementById(`${prefix}-hold-btn`);
  const label = document.getElementById(`${prefix}-hold-label`);
  if (!btn || !label) return;

  btn.disabled = !ready;
  if (!ready) {
    label.textContent =
      state.persona === 'kid'
        ? '☝️ Check Both Boxes Above First!'
        : '☝️ Check Both Verification Boxes First';
  } else {
    label.textContent =
      state.persona === 'kid'
        ? '👆 Hold 3 Seconds to Guarantee Dose!'
        : '👆 Press & Hold 3s to Guarantee Dose Taken';
  }
}

function startHoldGuarantee(prefix) {
  if (!areGuaranteeBoxesChecked(prefix)) {
    triggerAngryReject();
    return;
  }
  if (holdInterval) clearInterval(holdInterval);
  holdProgress = 0;
  const fillBar = document.getElementById(`${prefix}-hold-fill`);
  const label = document.getElementById(`${prefix}-hold-label`);

  holdInterval = setInterval(() => {
    holdProgress += 5; // 20 ticks * 120ms = 2.4s smooth hold
    if (fillBar) fillBar.style.width = `${Math.min(100, holdProgress)}%`;
    if (label) {
      const remainingSec = Math.max(0.1, ((100 - holdProgress) * 0.025)).toFixed(1);
      label.textContent = `🔒 Verifying Guarantee... Keep Holding (${remainingSec}s)`;
    }
    if (holdProgress >= 100) {
      clearInterval(holdInterval);
      holdInterval = null;
      completeDoseGuarantee();
    }
  }, 65);
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
    updateHoldButtonState(prefix);
  }
}

function completeDoseGuarantee() {
  const med = getSelectedMed();
  if (!med) return;

  const wasOverdue = med.timerRemaining <= 0 || state.lockdownActive;
  med.status = 'taken';
  med.stockLeft = Math.max(0, med.stockLeft - 1);
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  med.guaranteedAt = `Today, ${nowStr}`;

  state.streakCount += 1;
  state.charityHearts += 5;
  state.lockdownActive = false;
  activeSheetMode = null;

  state.guaranteeLogs.unshift({
    id: `log-${Date.now()}`,
    persona: state.persona,
    medName: med.name,
    dosage: med.dosage,
    timestamp: med.guaranteedAt,
    method: wasOverdue
      ? 'Rescued from Angry Face Lockdown (Verified 3s Hold)'
      : `Guaranteed on time (${med.timerRemaining}s left on Circle)`,
    wasOverdue
  });

  playTone('success');
  renderAll();
  showCelebrationToast(
    state.persona === 'kid'
      ? `🌟 Yay! ${med.name} Guaranteed! Barnaby is super happy & you earned +1 Hero Star!`
      : `✅ ${med.name} Guaranteed! Angry alert cleared & +5 Charity Hearts added.`
  );
}

function applySmartSnooze(reasonLabel, extraSeconds = 45) {
  const med = getSelectedMed();
  if (!med) return;

  med.status = 'pending';
  med.timerTotal = extraSeconds;
  med.timerRemaining = extraSeconds;
  med.snoozeReason = reasonLabel;
  state.lockdownActive = false;
  activeSheetMode = null;

  renderAll();
  showCelebrationToast(`⏳ Smart Snooze active (${reasonLabel}). Circle Timer restarted!`);
}

function showCelebrationToast(message) {
  const toast = document.getElementById('celebration-toast');
  const text = document.getElementById('celebration-toast-text');
  if (!toast || !text) return;
  text.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3800);
}

/* ==========================================================================
   DOM Rendering & Fast Circle Ring Updates
   ========================================================================== */

function updateCircleTimerDOM() {
  const med = getSelectedMed();
  if (!med) return;
  const mood = getMoodForMed(med);

  const card = document.getElementById('circle-timer-card');
  if (card) card.setAttribute('data-mood', mood);

  const radius = 88;
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
    } else if (mood === 'angry') {
      badge.textContent = 'Timer Expired (00:00) • Action Required!';
    } else if (mood === 'impatient') {
      badge.textContent = 'Circle Timer Low • Hurry!';
    } else {
      badge.textContent = 'Circle Timer Active';
    }
  }

  const mascotStage = document.getElementById('mascot-stage');
  if (mascotStage) {
    mascotStage.innerHTML = getCompanionSVG(state.persona, mood, 86);
  }

  const speech = document.getElementById('companion-speech');
  if (speech) {
    speech.textContent = getCompanionSpeechText(med, mood);
  }
}

function getCompanionSpeechText(med, mood) {
  if (state.persona === 'adult') {
    if (med.status === 'taken') {
      return `✨ "${med.name} is verified & logged (${med.guaranteedAt}). Your streak is safe!"`;
    }
    if (mood === 'angry') {
      return `😡 "The circle timer hit 00:00 and you haven't taken ${med.name}! I'm locking the screen until you guarantee it!"`;
    }
    if (mood === 'impatient') {
      return `🤨 "Only ${med.timerRemaining}s left on the circle! Grab your water before my angry face locks your screen!"`;
    }
    return `🙂 "Time-Box window open for ${med.name} (${med.visualDesc}). Take it before the circle runs out!"`;
  } else {
    if (med.status === 'taken') {
      return `🌟 "Woohoo! You guaranteed ${med.name}! Barnaby is doing a happy monster dance!"`;
    }
    if (mood === 'angry') {
      return `🦖 "GRRR-POUT! The circle timer ran out! Barnaby's angry face won't leave until we guarantee your medicine!"`;
    }
    if (mood === 'impatient') {
      return `😮 "Uh oh! Only ${med.timerRemaining} seconds left on the circle! Quick, before Barnaby turns super grumpy!"`;
    }
    return `😄 "Hi buddy! It's time for ${med.name}. Let's take it while the circle is green!"`;
  }
}

function renderAll() {
  const root = document.documentElement;
  root.setAttribute('data-persona', state.persona);

  // Header & Persona buttons
  const titleEl = document.getElementById('app-main-title');
  const subEl = document.getElementById('app-main-subtitle');
  if (titleEl && subEl) {
    if (state.persona === 'adult') {
      titleEl.textContent = 'PillPal Care';
      subEl.textContent = 'Alex (Adult Mode) • Persistent Adherence';
    } else {
      titleEl.textContent = 'PillPal Hero';
      subEl.textContent = 'Leo, Age 8 (Kid Mode) • Buddy Care';
    }
  }

  document.getElementById('btn-persona-adult')?.classList.toggle('active', state.persona === 'adult');
  document.getElementById('btn-persona-kid')?.classList.toggle('active', state.persona === 'kid');

  const streakChip = document.getElementById('streak-chip-text');
  if (streakChip) {
    streakChip.textContent =
      state.persona === 'kid' ? `⭐ ${state.streakCount} Stars` : `🔥 ${state.streakCount}d • ❤️ ${state.charityHearts}`;
  }

  const soundBtn = document.getElementById('btn-sound-toggle');
  if (soundBtn) {
    soundBtn.textContent = state.soundEnabled ? '🔊 Sound' : '🔇 Muted';
  }

  // Dynamic Island Alert State
  const island = document.getElementById('dynamic-island');
  const islandText = document.getElementById('dynamic-island-text');
  const med = getSelectedMed();
  if (island && islandText && med) {
    if (state.lockdownActive || (med.timerRemaining === 0 && med.status !== 'taken')) {
      island.classList.add('island-alert');
      islandText.textContent = 'ANGRY LOCK';
    } else {
      island.classList.remove('island-alert');
      islandText.textContent = med.status === 'taken' ? 'ALL GOOD' : formatSeconds(med.timerRemaining);
    }
  }

  // Render active tab view
  const mainContainer = document.getElementById('phone-main-content');
  if (mainContainer) {
    if (state.activeTab === 'today') {
      mainContainer.innerHTML = renderTodayTab(med);
      updateCircleTimerDOM();
    } else if (state.activeTab === 'log') {
      mainContainer.innerHTML = renderLogTab();
    } else if (state.activeTab === 'cabinet') {
      mainContainer.innerHTML = renderCabinetTab();
    }
  }

  // Update bottom tab buttons
  document.querySelectorAll('.tab-item').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === state.activeTab);
  });

  // Render Persistent Angry Face Lockdown Overlay (ONLY when lockdownActive is true)
  renderAngryLockdownOverlay(med);

  // Render Bottom Sheet Modal (for on-time Guarantee or Add Med)
  renderBottomSheet(med);
}

function renderTodayTab(med) {
  const meds = getCurrentMeds();
  const mood = getMoodForMed(med);

  return `
    <!-- Hero Circle Timer ("Time-Box" Countdown) -->
    <section class="circle-timer-card" id="circle-timer-card" data-mood="${mood}">
      <div class="timer-card-top">
        <span class="timer-status-badge">
          <span class="status-dot"></span>
          <span id="timer-status-badge-text">Circle Timer Active</span>
        </span>
        <span class="active-med-pill-tag">${med.scheduledTime}</span>
      </div>

      <div class="circle-ring-wrapper">
        <svg class="circle-ring-svg" viewBox="0 0 210 210">
          <circle class="ring-track" cx="105" cy="105" r="88"></circle>
          <circle class="ring-progress" id="ring-progress-circle" cx="105" cy="105" r="88"></circle>
        </svg>
        <div class="ring-center-content">
          <div class="mascot-stage" id="mascot-stage">
            ${getCompanionSVG(state.persona, mood, 86)}
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
        ${med.snoozeReason ? `<p class="active-dose-meta" style="color: var(--brand-secondary); font-weight: 700;">⏳ Snoozed: ${med.snoozeReason}</p>` : ''}
      </div>

      <div class="companion-speech-bubble" id="companion-speech">
        ${getCompanionSpeechText(med, mood)}
      </div>

      ${
        med.status !== 'taken'
          ? `
        <div class="timer-cta-row">
          <button class="btn-primary-take" onclick="openCalmGuaranteeSheet()">
            ✅ Take & Guarantee
          </button>
          <button class="btn-secondary-snooze" onclick="applySmartSnooze('Eating Meal (+15m)', 45)">
            ⏳ Snooze 15m
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

      <!-- Situation Simulator Strip so User Can Test Specific Angry Face Trigger Immediately -->
      <div class="simulator-bar">
        <div class="simulator-header">
          <span>🧪 Test Circle Timer Situations:</span>
          <span>${state.timerPaused ? 'Paused' : 'Live Counting'}</span>
        </div>
        <div class="simulator-buttons">
          <button class="sim-btn" onclick="simulateTimerState('reset')">
            🟢 Calm (45s)
          </button>
          <button class="sim-btn" onclick="simulateTimerState('low')">
            🟡 Low (10s)
          </button>
          <button class="sim-btn sim-danger" onclick="simulateTimerState('expired')">
            😡 Timer Up (0s)
          </button>
        </div>
      </div>
    </section>

    <!-- Scheduled Medications List -->
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
          let statusLabel = 'Circle Active';
          let statusClass = 'status-pending';
          if (item.status === 'taken') {
            statusLabel = 'Guaranteed ✓';
            statusClass = 'status-guaranteed';
          } else if (item.timerRemaining <= 0) {
            statusLabel = 'Timer Up! 😡';
            statusClass = 'status-overdue';
          }
          return `
            <div class="med-card ${isSelected ? 'active-selected' : ''} ${item.status === 'taken' ? 'med-taken' : ''}"
                 onclick="selectMedication('${item.id}')">
              <div class="med-left">
                <div class="med-icon-box">${item.icon}</div>
                <div class="med-info">
                  <div class="med-name">${item.name}</div>
                  <div class="med-sub">
                    <span>${item.dosage}</span>
                    ${
                      item.stockLeft <= item.refillThreshold
                        ? `<span style="color: var(--timer-expired); font-weight:700;">• Refill (${item.stockLeft} left)</span>`
                        : ''
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
        <span class="timer-status-badge">🛡️ Verified Adherence & Impact</span>
        <span class="active-med-pill-tag">96% On-Time</span>
      </div>
      <h2 class="active-dose-title" style="margin-top: 4px;">
        ${state.persona === 'kid' ? `🌟 ${state.streakCount} Hero Star Stickers Earned!` : `🔥 ${state.streakCount}-Day Verified Streak`}
      </h2>
      <p class="active-dose-meta">
        ${
          state.persona === 'kid'
            ? 'Every time you beat the Circle Timer and guarantee your medicine, Barnaby awards a Hero Star for your sticker book!'
            : `Inspired by pillo.care: Your ${state.charityHearts} Heart Points from verified dose guarantees help fund pediatric & chronic care charities.`
        }
      </p>
    </div>

    <div class="section-header">
      <h3 class="section-title">Guaranteed Dose Audit Log</h3>
    </div>

    <div class="med-list">
      ${state.guaranteeLogs
        .map(
          (entry) => `
        <div class="med-card" style="cursor: default;">
          <div class="med-left">
            <div class="med-icon-box">${entry.wasOverdue ? '🚨' : '✅'}</div>
            <div class="med-info">
              <div class="med-name">${entry.medName} (${entry.dosage})</div>
              <div class="med-sub">${entry.method}</div>
            </div>
          </div>
          <div class="med-right">
            <span class="med-time-badge">${entry.timestamp}</span>
            <span class="med-status-pill status-guaranteed">Guaranteed</span>
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
      <h3 class="section-title">Pill Cabinet & Refill Tracker</h3>
      <button class="section-action-btn" onclick="openAddMedSheet()">+ Add New</button>
    </div>

    <div class="med-list">
      ${meds
        .map(
          (m) => `
        <div class="med-card" onclick="selectMedication('${m.id}')">
          <div class="med-left">
            <div class="med-icon-box">${m.icon}</div>
            <div class="med-info">
              <div class="med-name">${m.name}</div>
              <div class="med-sub">${m.visualDesc}</div>
            </div>
          </div>
          <div class="med-right">
            <span class="med-time-badge">${m.stockLeft} left</span>
            <button class="sim-btn" style="padding: 3px 8px; font-size: 11px;" onclick="event.stopPropagation(); refillStock('${m.id}')">
              + Refill
            </button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="section-header" style="margin-top: 8px;">
      <h3 class="section-title">Smart Context & Caregiver Safety</h3>
    </div>

    <div class="circle-timer-card" style="align-items: stretch; gap: 10px;">
      <label class="check-row" style="justify-content: space-between;">
        <span>🚗 Auto-Snooze While Driving (&gt;15 mph)</span>
        <input type="checkbox" ${state.smartDrivingSnooze ? 'checked' : ''} onchange="state.smartDrivingSnooze = this.checked" />
      </label>
      <label class="check-row" style="justify-content: space-between;">
        <span>📞 Pause Alarm During Active Phone Calls</span>
        <input type="checkbox" ${state.smartCallPause ? 'checked' : ''} onchange="state.smartCallPause = this.checked" />
      </label>
      <label class="check-row" style="justify-content: space-between;">
        <span>👨‍👩‍👧 Notify Caregiver if Angry Face Ignored &gt;15m</span>
        <input type="checkbox" ${state.caregiverAlerts ? 'checked' : ''} onchange="state.caregiverAlerts = this.checked" />
      </label>
    </div>
  `;
}

/* ==========================================================================
   Persistent Angry Face Screen Lockdown Renderer
   ========================================================================== */

function renderAngryLockdownOverlay(med) {
  const overlay = document.getElementById('angry-lockdown-overlay');
  if (!overlay) return;

  if (!state.lockdownActive || !med) {
    overlay.classList.remove('active');
    return;
  }

  overlay.classList.add('active');
  const isKid = state.persona === 'kid';

  overlay.innerHTML = `
    <div class="lockdown-top-bar">
      <span class="lockdown-alert-pill">
        🚨 Circle Timer Expired (00:00)
      </span>
      <button class="fake-dismiss-btn" onclick="triggerAngryReject()">
        ✕ Try to Dismiss
      </button>
    </div>

    <div class="angry-face-hero" onclick="triggerAngryReject()">
      <div class="angry-svg-container">
        ${getCompanionSVG(state.persona, 'angry', 142)}
      </div>
      <h2 class="angry-headline">
        ${
          isKid
            ? `BARNABY IS GRUMPY! You didn't take ${med.name}!`
            : `HEY! The Circle Timer Ran Out for ${med.name}!`
        }
      </h2>
      <p class="angry-subcopy">
        ${
          isKid
            ? `My grumpy face is LOCKED to your screen until we have a 100% guarantee you took your ${med.dosage}!`
            : `This angry notification will NOT leave your screen until there is a verified guarantee that you took your medicine.`
        }
      </p>
      <div class="scold-feedback-banner" id="scold-feedback-banner">
        ${
          isKid
            ? `🔒 Screen Locked! Complete the 2-Step Hero Guarantee below to make Barnaby happy again!`
            : `🔒 Persistent Screen Lock Active — Complete the Dose Guarantee below to unlock.`
        }
      </div>
    </div>

    <div class="guarantee-box" onclick="event.stopPropagation()">
      <div class="guarantee-box-header">
        <span class="guarantee-box-title">
          🛡️ Required Medication Guarantee
        </span>
        <span class="guarantee-step-tag">Unlocks Screen</span>
      </div>

      <div class="guarantee-checklist">
        <label class="check-row" id="lockdown-row-1">
          <input type="checkbox" id="lockdown-check-1" onchange="onGuaranteeCheckChange('lockdown')" />
          <span>
            ${
              isKid
                ? `1. I have my ${med.visualDesc} ready right now!`
                : `1. Dose Match: I have ${med.visualDesc} in hand`
            }
          </span>
        </label>
        <label class="check-row" id="lockdown-row-2">
          <input type="checkbox" id="lockdown-check-2" onchange="onGuaranteeCheckChange('lockdown')" />
          <span>
            ${
              isKid
                ? `2. I swallowed my medicine & gave a Parent High-Five!`
                : `2. Taken Confirmation: I have physically swallowed/taken this dose`
            }
          </span>
        </label>
      </div>

      <button
        class="hold-guarantee-btn"
        id="lockdown-hold-btn"
        disabled
        onmousedown="startHoldGuarantee('lockdown')"
        onmouseup="cancelHoldGuarantee('lockdown')"
        onmouseleave="cancelHoldGuarantee('lockdown')"
        ontouchstart="event.preventDefault(); startHoldGuarantee('lockdown')"
        ontouchend="cancelHoldGuarantee('lockdown')"
      >
        <div class="hold-fill-bar" id="lockdown-hold-fill"></div>
        <span class="hold-btn-label" id="lockdown-hold-label">
          ☝️ Check Both Verification Boxes First
        </span>
      </button>

      <div class="lockdown-snooze-row">
        <button class="lockdown-snooze-btn" onclick="applySmartSnooze('Eating Meal First (+15m)', 45)">
          🍽️ Eating First (15m)
        </button>
        <button class="lockdown-snooze-btn" onclick="applySmartSnooze('Driving Safety Mode', 60)">
          🚗 Driving Mode
        </button>
        <button class="lockdown-snooze-btn" onclick="applySmartSnooze('When I Arrive Home', 60)">
          🏠 At Home
        </button>
      </div>
    </div>
  `;
}

function onGuaranteeCheckChange(prefix) {
  ['1', '2'].forEach((num) => {
    const input = document.getElementById(`${prefix}-check-${num}`);
    const row = document.getElementById(`${prefix}-row-${num}`);
    if (input && row) {
      row.classList.toggle('checked', input.checked);
    }
  });
  updateHoldButtonState(prefix);
}

/* ==========================================================================
   Calm Guarantee Bottom Sheet & Add Medication Sheet
   ========================================================================== */

function openCalmGuaranteeSheet() {
  activeSheetMode = 'calm-guarantee';
  renderAll();
}

function openAddMedSheet() {
  activeSheetMode = 'add-med';
  renderAll();
}

function closeBottomSheet() {
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
    const isKid = state.persona === 'kid';
    container.innerHTML = `
      <div class="sheet-header">
        <h3 class="sheet-title">
          ${isKid ? `🌟 Guarantee ${med.name}` : `✅ Verify & Guarantee Dose`}
        </h3>
        <button class="sheet-close" onclick="closeBottomSheet()">✕</button>
      </div>
      <p style="font-size: 13px; color: var(--text-secondary);">
        ${
          isKid
            ? `Great job beating the Circle Timer! Complete the quick Hero Guarantee so Barnaby knows you took it:`
            : `You beat the Circle Timer (${med.timerRemaining}s remaining)! Complete the quick guarantee to log your dose:`
        }
      </p>
      <div class="guarantee-checklist">
        <label class="check-row" id="calm-row-1">
          <input type="checkbox" id="calm-check-1" onchange="onGuaranteeCheckChange('calm')" />
          <span>1. Confirmed: ${med.visualDesc}</span>
        </label>
        <label class="check-row" id="calm-row-2">
          <input type="checkbox" id="calm-check-2" onchange="onGuaranteeCheckChange('calm')" />
          <span>
            ${
              isKid
                ? '2. I took my medicine & had a sip of water!'
                : '2. I have taken this medication dose now'
            }
          </span>
        </label>
      </div>
      <button
        class="hold-guarantee-btn"
        id="calm-hold-btn"
        disabled
        onmousedown="startHoldGuarantee('calm')"
        onmouseup="cancelHoldGuarantee('calm')"
        onmouseleave="cancelHoldGuarantee('calm')"
        ontouchstart="event.preventDefault(); startHoldGuarantee('calm')"
        ontouchend="cancelHoldGuarantee('calm')"
      >
        <div class="hold-fill-bar" id="calm-hold-fill"></div>
        <span class="hold-btn-label" id="calm-hold-label">
          ☝️ Check Both Verification Boxes First
        </span>
      </button>
    `;
  } else if (activeSheetMode === 'add-med') {
    container.innerHTML = `
      <div class="sheet-header">
        <h3 class="sheet-title">+ Add New Medication</h3>
        <button class="sheet-close" onclick="closeBottomSheet()">✕</button>
      </div>
      <form onsubmit="handleAddMedication(event)" style="display:flex; flex-direction:column; gap:12px;">
        <div class="form-group">
          <label for="new-med-name">Medicine Name</label>
          <input id="new-med-name" class="form-input" required placeholder="${state.persona === 'kid' ? 'e.g., Grape Allergy Syrup' : 'e.g., Metoprolol'}" />
        </div>
        <div class="form-group">
          <label for="new-med-dosage">Dosage & Form</label>
          <input id="new-med-dosage" class="form-input" required placeholder="${state.persona === 'kid' ? 'e.g., 5 mL Cup' : 'e.g., 25 mg • 1 Tablet'}" />
        </div>
        <div class="form-group">
          <label for="new-med-visual">Visual Guarantee Check Description</label>
          <input id="new-med-visual" class="form-input" required placeholder="e.g., 1 Blue Oval Pill + Glass of Water" />
        </div>
        <div class="form-group">
          <label for="new-med-timer">Circle Timer Window (Seconds before Angry Face)</label>
          <select id="new-med-timer" class="form-select">
            <option value="30">30 seconds (Fast Demo)</option>
            <option value="45" selected>45 seconds (Standard Demo)</option>
            <option value="90">90 seconds (Extended Window)</option>
          </select>
        </div>
        <button type="submit" class="btn-primary-take" style="width:100%;">
          Save & Start Circle Timer
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
  const timerTotal = parseInt(document.getElementById('new-med-timer').value, 10) || 45;

  if (!name) return;
  const newMed = {
    id: `${state.persona}-${Date.now()}`,
    name,
    dosage,
    visualDesc,
    instructions: 'Added to daily schedule • Protected by Circle Timer',
    scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    icon: state.persona === 'kid' ? '🦸' : '💊',
    stockLeft: 30,
    refillThreshold: 5,
    timerTotal,
    timerRemaining: timerTotal,
    status: 'pending',
    guaranteedAt: null,
    snoozeReason: null
  };

  state.medications[state.persona].unshift(newMed);
  state.selectedMedId = newMed.id;
  state.activeTab = 'today';
  activeSheetMode = null;
  renderAll();
}

/* ==========================================================================
   Navigation & User Event Handlers
   ========================================================================== */

function switchPersona(persona) {
  state.persona = persona;
  const meds = getCurrentMeds();
  const firstPending = meds.find((m) => m.status !== 'taken') || meds[0];
  state.selectedMedId = firstPending.id;
  state.lockdownActive = firstPending.timerRemaining <= 0 && firstPending.status !== 'taken';
  renderAll();
}

function selectMedication(medId) {
  state.selectedMedId = medId;
  const med = getSelectedMed();
  state.activeTab = 'today';
  if (med && med.timerRemaining <= 0 && med.status !== 'taken') {
    triggerAngryLockdown(med);
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

function refillStock(medId) {
  const meds = getCurrentMeds();
  const target = meds.find((m) => m.id === medId);
  if (target) {
    target.stockLeft += 30;
    renderAll();
    showCelebrationToast(`📦 Refilled ${target.name} (+30 doses added to cabinet)!`);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  renderAll();
  startCircleTimerLoop();
});
