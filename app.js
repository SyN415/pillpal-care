/**
 * PillPal Care — Mobile Medication Companion Engine (Iteration 3: 3D Pillo Assets & UI)
 * Implements:
 * 1. Studio 3D Pillo.care Character & Icon Assets (window.PILLO_ASSETS)
 * 2. Dual Adult & Kid-Friendly Personas
 * 3. Kid Mode "Worried -> Worried-Angry -> Angry" 3D Character Progression
 * 4. Multi-Modal Guarantee Suite:
 *    - Camera / Photo Pill & Cup Scanner
 *    - Child Face Scan Verification (Kid Mode)
 *    - Shake-Phone-with-Water Gesture (DeviceMotion + 3D Water Shield Meter)
 *    - Parent 4-Digit PIN Verification (Kid Mode)
 *    - Physical Dose Checklist + 3-Second Press-and-Hold Commitment Seal
 * 5. Specific Persistent Lockdown Triggers:
 *    - Trigger A: Circle Timer reaches 00:00 without taking medication
 *    - Trigger B: Critical Refill Alert (stock drops to <= 2 doses)
 *    - Trigger C: Excessive Snoozing (> 2 consecutive snoozes)
 */

const INITIAL_DATA = {
  persona: 'adult', // 'adult' | 'kid'
  activeTab: 'today', // 'today' | 'log' | 'cabinet'
  soundEnabled: true,
  focusMusicPlaying: true,
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

  // Multi-Modal Guarantee Sensor States
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
        dosage: '10 mg • 1 Capsule before meal',
        visualDesc: '1 Pink & White Capsule + Full Glass of Water',
        instructions: 'Take in the morning. Keep consistent daily timing.',
        scheduledTime: '08:00 AM',
        assetKey: 'icon_adult_pills',
        stockLeft: 18,
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
        id: 'adult-2',
        name: 'Omega-3 + Vitamin D3',
        dosage: '2000 IU • 1 Amber Softgel',
        visualDesc: '1 Amber Translucent Softgel with Meal',
        instructions: 'Critical stock warning — refill required soon.',
        scheduledTime: '12:30 PM',
        assetKey: 'icon_refill_alert',
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
        visualDesc: '2 Capsules + Water before bed',
        instructions: 'Supports evening recovery and sleep schedule.',
        scheduledTime: '09:00 PM',
        assetKey: 'icon_water_shield',
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
        dosage: '5 mL • Strawberry Measuring Cup',
        visualDesc: '1 Pink Strawberry Cup (5 mL) + Big Sip of Water',
        instructions: 'Super-Shield potion! Shake bottle well before pouring.',
        scheduledTime: '08:00 AM',
        assetKey: 'icon_kid_meds',
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
        name: 'Dino-Breathe Orange Inhaler',
        dosage: '2 Puffs • Friendly Dino Spacer',
        visualDesc: '2 Slow Dino Breaths with Orange Inhaler',
        instructions: 'Count to 5 like a friendly brontosaurus on each breath!',
        scheduledTime: '04:00 PM',
        assetKey: 'icon_refill_alert',
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
        visualDesc: '1 Sunny Star Gummy + Water Sip',
        instructions: 'Earned +1 Hero Star Sticker when taken on time!',
        scheduledTime: '07:30 AM',
        assetKey: 'icon_water_shield',
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
let activeSheetMode = null;
let activeCameraStream = null;

/* ==========================================================================
   3D Asset Resolver (Uses window.PILLO_ASSETS or "./assets/<key>.webp")
   ========================================================================== */

function getAssetURI(key) {
  if (window.PILLO_ASSETS && window.PILLO_ASSETS[key]) {
    return window.PILLO_ASSETS[key];
  }
  return `./assets/${key}.webp`;
}

function getCompanionAssetKey(persona, mood) {
  if (persona === 'adult') {
    if (mood === 'angry') return 'adult_angry';
    if (mood === 'impatient' || mood === 'worried') return 'adult_impatient';
    if (mood === 'celebrating') return 'adult_celebrating';
    return 'adult_calm';
  } else {
    if (mood === 'worried' || mood === 'impatient') return 'kid_worried';
    if (mood === 'worried-angry') return 'kid_worried_angry';
    if (mood === 'angry') return 'kid_angry';
    return 'kid_calm';
  }
}

function getCompanionArtworkHTML(persona, mood, animClass = 'mascot-calm') {
  const key = getCompanionAssetKey(persona, mood);
  const src = getAssetURI(key);
  return `<img src="${src}" alt="${persona} ${mood} companion" class="mascot-3d-img ${animClass}" />`;
}

function getMedArtworkSrc(med) {
  if (med.stockLeft <= med.criticalRefillThreshold && med.status !== 'taken') {
    return getAssetURI('icon_refill_alert');
  }
  return getAssetURI(med.assetKey || (state.persona === 'kid' ? 'icon_kid_meds' : 'icon_adult_pills'));
}

/* ==========================================================================
   Web Audio Synthesizer
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
   State Helpers & Circle Timer Engine
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
   ========================================================================== */

async function startCameraSensorScan(kind) {
  if (kind === 'pill') {
    state.verification.pillScanningNow = true;
  } else {
    state.verification.faceScanningNow = true;
  }
  playTone('scan-beep');
  renderAll();

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
  } catch (_) {}

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
  }, 1250);
}

function stopCameraStream() {
  if (activeCameraStream) {
    activeCameraStream.getTracks().forEach((t) => t.stop());
    activeCameraStream = null;
  }
}

async function triggerWaterShakeStep() {
  try {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      await DeviceMotionEvent.requestPermission().catch(() => {});
    }
  } catch (_) {}
  state.verification.waterShakeProgress = Math.min(100, state.verification.waterShakeProgress + 35);
  playTone('scan-beep');
  renderAll();
}

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
    med.stockLeft += 30;
    med.assetKey = state.persona === 'kid' ? 'icon_kid_meds' : 'icon_adult_pills';
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
      method: 'Rx Bottle Photo Scan + 3s Hold Refill Guarantee',
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
      ? `Child Face Scan + Cup Scan + Water Shake + Parent PIN (${state.parentPinCode}) + 3s Hold`
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
    med.stockLeft = 2;
    triggerPersistentLockdown(med, 'critical-refill');
  }
}

function applySmartSnooze(reasonLabel, extraSeconds = 45) {
  const med = getSelectedMed();
  if (!med) return;

  med.snoozeCount = (med.snoozeCount || 0) + 1;
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
  showCelebrationToast(`⏳ Rescheduled (${med.snoozeCount}/2): ${reasonLabel}. Circle Timer restarted!`);
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
      return `✨ "${med.name} is verified & logged (${med.guaranteedAt}). +5 Charity Hearts earned!"`;
    }
    if (mood === 'angry') {
      return `😡 "The circle timer hit 00:00 and you haven't taken ${med.name}! Complete the Camera + Water Shake Guarantee!"`;
    }
    if (mood === 'impatient') {
      return `🤨 "Only ${med.timerRemaining}s left on the circle! Grab your water before my angry face locks your screen!"`;
    }
    return `🙂 "Focus music is on! Take ${med.name} (${med.visualDesc}) while the Time-Box ring is green."`;
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
    return `😄 "Hi Leo! It's time for ${med.name}. Let's take it while the circle is bright!"`;
  }
}

function updateCircleTimerDOM() {
  const med = getSelectedMed();
  if (!med) return;
  const mood = getMoodForMed(med);

  const card = document.getElementById('circle-timer-card');
  if (card) card.setAttribute('data-mood', mood);

  const radius = 86;
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
    readout.textContent = med.status === 'taken' ? 'TAKEN ✓' : formatSeconds(med.timerRemaining);
  }

  const badge = document.getElementById('timer-status-badge-text');
  if (badge) {
    if (med.status === 'taken') {
      badge.textContent = 'Dose Guaranteed ✓';
    } else if (med.timerRemaining <= 0) {
      badge.textContent =
        state.persona === 'kid' ? 'Timer Up • Worried → Angry!' : '10m Late • Angry Pill Box!';
    } else if (mood === 'worried' || mood === 'impatient') {
      badge.textContent =
        state.persona === 'kid' ? '5m Late • Barnaby is Worried!' : '5m Late • Hurry Up!';
    } else {
      badge.textContent = 'First Ring • Calm Time-Box';
    }
  }

  const mascotStage = document.getElementById('mascot-stage');
  if (mascotStage) {
    const animClass = mood === 'calm' || mood === 'celebrating' ? 'mascot-calm' : 'mascot-impatient';
    mascotStage.innerHTML = getCompanionArtworkHTML(state.persona, mood, animClass);
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
        <button type="button" class="sim-btn" style="padding:2px 7px; font-size:11px;" onclick="quickVerifyAllSensors()">⚡ Instant Demo Check</button>
      </div>
      <div class="verification-modules-grid" style="grid-template-columns: 1fr;">
        <div class="verify-module-card ${v.pillPhotoScanned ? 'verified' : ''}">
          <div class="module-top">
            <span>📷 1. Refill Bottle / Rx Receipt Photo</span>
            <span class="module-status-tag">${v.pillPhotoScanned ? '✓ Verified' : 'Required'}</span>
          </div>
          <div class="scanner-preview-box">
            <img src="${getAssetURI('icon_refill_alert')}" alt="Refill bottle" class="scanner-bg-art" />
            <video id="pill-scanner-video" class="scanner-video" playsinline muted></video>
            ${v.pillScanningNow ? '<div class="scanner-laser"></div><span class="scanner-overlay-badge">Scanning Rx Barcode...</span>' : ''}
            ${!v.pillScanningNow && v.pillPhotoScanned ? '<span class="scanner-overlay-badge">✅ Rx Bottle Matched (99.8%)</span>' : ''}
            ${!v.pillScanningNow && !v.pillPhotoScanned ? `<span class="scanner-overlay-badge">Scan ${med.name} Bottle</span>` : ''}
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
      <span class="guarantee-box-title">🛡️ Multi-Sensor Dose Guarantee</span>
      <button type="button" class="sim-btn" style="padding:2px 7px; font-size:11px;" onclick="quickVerifyAllSensors()">
        ⚡ Auto-Verify All
      </button>
    </div>

    <div class="verification-modules-grid">
      <!-- Sensor 1: Camera Pill / Cup Photo Verification with 3D Asset Preview -->
      <div class="verify-module-card ${v.pillPhotoScanned ? 'verified' : ''}">
        <div class="module-top">
          <span>📷 ${isKid ? 'Cup Scan' : 'Pill Scan'}</span>
          <span class="module-status-tag">${v.pillPhotoScanned ? '✓ 99% Match' : 'Step 1'}</span>
        </div>
        <div class="scanner-preview-box">
          <img src="${getMedArtworkSrc(med)}" alt="${med.name}" class="scanner-bg-art" />
          <video id="pill-scanner-video" class="scanner-video" playsinline muted></video>
          ${v.pillScanningNow ? '<div class="scanner-laser"></div><span class="scanner-overlay-badge">AI Matching...</span>' : ''}
          ${!v.pillScanningNow && v.pillPhotoScanned ? `<span class="scanner-overlay-badge">✅ Dose Verified</span>` : ''}
          ${!v.pillScanningNow && !v.pillPhotoScanned ? `<span class="scanner-overlay-badge">Camera Check</span>` : ''}
        </div>
        <button type="button" class="module-action-btn" onclick="startCameraSensorScan('pill')">
          ${v.pillPhotoScanned ? '✓ Dose Scanned' : '📷 Scan Medicine'}
        </button>
      </div>

      <!-- Sensor 2: Child Face Scan (Kid Mode) OR Water Shake Gesture (Adult Mode) -->
      ${
        isKid
          ? `
        <div class="verify-module-card ${v.childFaceScanned ? 'verified' : ''}">
          <div class="module-top">
            <span>👦 Face Scan</span>
            <span class="module-status-tag">${v.childFaceScanned ? '✓ Leo ID' : 'Step 2'}</span>
          </div>
          <div class="scanner-preview-box">
            <img src="${getAssetURI('kid_calm')}" alt="Child Face Scan" class="scanner-bg-art" />
            <video id="face-scanner-video" class="scanner-video" playsinline muted></video>
            ${v.faceScanningNow ? '<div class="scanner-laser"></div><span class="scanner-overlay-badge">Face Mesh...</span>' : ''}
            ${!v.faceScanningNow && v.childFaceScanned ? '<span class="scanner-overlay-badge">✅ Leo Verified</span>' : ''}
            ${!v.faceScanningNow && !v.childFaceScanned ? '<span class="scanner-overlay-badge">Child Face ID</span>' : ''}
          </div>
          <button type="button" class="module-action-btn" onclick="startCameraSensorScan('face')">
            ${v.childFaceScanned ? '✓ Face Verified' : '👦 Scan Child Face'}
          </button>
        </div>
      `
          : `
        <div class="verify-module-card ${v.waterShakeProgress >= 100 ? 'verified' : ''}">
          <div class="module-top">
            <span>📳 Water Shake</span>
            <span class="module-status-tag">${v.waterShakeProgress}%</span>
          </div>
          <div class="scanner-preview-box">
            <img src="${getAssetURI('icon_water_shield')}" alt="Water Shake" class="scanner-bg-art" />
            <span class="scanner-overlay-badge">💧 ${v.waterShakeProgress}% Shaken</span>
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
  const animClass = mood === 'calm' || mood === 'celebrating' ? 'mascot-calm' : 'mascot-impatient';

  return `
    <!-- Pillo.care Style Time-Box Alarm Card -->
    <section class="circle-timer-card" id="circle-timer-card" data-mood="${mood}">
      <div class="pillo-alarm-banner">
        <span class="timer-status-badge">
          <span class="status-dot"></span>
          <span id="timer-status-badge-text">First Ring • Calm Time-Box</span>
        </span>
        <span class="active-med-pill-tag">🎵 Focus Music • ${med.scheduledTime}</span>
      </div>

      <div class="pillo-time-heading">
        <span class="pillo-time-kicker">
          ${state.persona === 'kid' ? 'Hero Quest Reminder' : 'Pillo Time-Box Alarm'}
        </span>
        <h2 class="pillo-time-main">
          ${state.persona === 'kid' ? 'Time for your Super-Shield!' : 'Time to take pills'}
        </h2>
      </div>

      <!-- Circular Countdown Ring with 3D Pillo / Kid Buddy Inside -->
      <div class="circle-ring-wrapper">
        <svg class="circle-ring-svg" viewBox="0 0 204 204">
          <circle class="ring-track" cx="102" cy="102" r="86"></circle>
          <circle class="ring-progress" id="ring-progress-circle" cx="102" cy="102" r="86"></circle>
        </svg>
        <div class="ring-center-content">
          <div class="mascot-stage" id="mascot-stage">
            ${getCompanionArtworkHTML(state.persona, mood, animClass)}
          </div>
          <div class="countdown-pill-floating" id="countdown-readout">
            ${med.status === 'taken' ? 'TAKEN ✓' : formatSeconds(med.timerRemaining)}
          </div>
        </div>
      </div>

      <!-- Active Medication 3D Spotlight Card -->
      <div class="pillo-med-spotlight">
        <img src="${getMedArtworkSrc(med)}" alt="${med.name}" class="spotlight-3d-thumb" />
        <div class="spotlight-details">
          <div class="spotlight-name">${med.name}</div>
          <div class="spotlight-dosage">${med.dosage} • ${med.stockLeft} left in bottle</div>
          ${
            med.snoozeReason
              ? `<div style="font-size:11px; color:var(--brand-secondary); font-weight:700;">⏳ ${med.snoozeReason}</div>`
              : ''
          }
        </div>
      </div>

      <div class="companion-speech-bubble" id="companion-speech">
        ${getCompanionSpeechText(med, mood)}
      </div>

      <!-- Pillo.care Signature 3-Button Action Dock ("Take now", "Reschedule", "Skip") -->
      ${
        med.status !== 'taken'
          ? `
        <div class="pillo-action-dock">
          <button type="button" class="btn-primary-take" onclick="openCalmGuaranteeSheet()">
            ✓ Take now
          </button>
          <button type="button" class="btn-secondary-snooze" onclick="applySmartSnooze('Rescheduled (+15m)', 45)">
            Reschedule (${med.snoozeCount || 0}/2)
          </button>
          <button type="button" class="btn-secondary-snooze" onclick="simulateTimerState('expired')" title="Skipping without guarantee triggers Pillo's insistent lockdown!">
            Skip?
          </button>
        </div>
      `
          : `
        <div class="pillo-action-dock" style="grid-template-columns: 1fr;">
          <button type="button" class="btn-secondary-snooze" onclick="simulateTimerState('reset')">
            🔄 Reset Time-Box Circle to Demo Again
          </button>
        </div>
      `
      }

      <!-- Interactive Simulator Strip -->
      <div class="simulator-bar">
        <div class="simulator-header">
          <span>🧪 Preview Pillo 3D States &amp; Lockdowns:</span>
          <span>${state.persona === 'kid' ? 'Worried → Angry' : 'Adult Pillo'}</span>
        </div>
        <div class="simulator-buttons">
          <button type="button" class="sim-btn" onclick="simulateTimerState('reset')">
            🟢 1st Ring: Calm (45s)
          </button>
          <button type="button" class="sim-btn" onclick="simulateTimerState('low')">
            🟡 5m Late: ${state.persona === 'kid' ? 'Worried' : 'Surprised'} (10s)
          </button>
          <button type="button" class="sim-btn sim-danger" onclick="simulateTimerState('expired')">
            😡 10m Late: Timer Up (0s)
          </button>
          <button type="button" class="sim-btn sim-refill" onclick="simulateTimerState('critical-refill')">
            🚨 Critical Refill (2 left)
          </button>
        </div>
      </div>
    </section>

    <div class="section-header">
      <h3 class="section-title">
        ${state.persona === 'kid' ? "Leo's Daily Quest Potions" : "Today's Medication List"}
      </h3>
      <button type="button" class="section-action-btn" onclick="openAddMedSheet()">+ Add Medicine</button>
    </div>

    <div class="med-list">
      ${meds
        .map((item) => {
          const isSelected = item.id === med.id;
          const isCritStock = item.stockLeft <= item.criticalRefillThreshold;
          let statusLabel = 'Time-Box Active';
          let statusClass = 'status-pending';
          if (item.status === 'taken') {
            statusLabel = 'Guaranteed ✓';
            statusClass = 'status-guaranteed';
          } else if (item.timerRemaining <= 0) {
            statusLabel = state.persona === 'kid' ? 'Worried → Angry!' : 'Angry Alarm! 😡';
            statusClass = 'status-overdue';
          }
          return `
            <div class="med-card ${isSelected ? 'active-selected' : ''} ${item.status === 'taken' ? 'med-taken' : ''}"
                 onclick="selectMedication('${item.id}')">
              <div class="med-left">
                <div class="med-3d-icon-box">
                  <img src="${getMedArtworkSrc(item)}" alt="${item.name}" />
                </div>
                <div>
                  <div class="med-name">${item.name}</div>
                  <div class="med-sub">
                    <span>${item.dosage}</span>
                    ${
                      isCritStock
                        ? `<span style="color: var(--timer-expired); font-weight:800;"> • 🚨 2 LEFT REFILL ALERT</span>`
                        : `<span> • ${item.stockLeft} left</span>`
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
  const heroArt = state.persona === 'kid' ? getAssetURI('kid_calm') : getAssetURI('adult_celebrating');
  return `
    <div class="circle-timer-card" style="flex-direction: row; text-align: left; gap: 12px;">
      <img src="${heroArt}" alt="Celebrating Mascot" style="width: 76px; height: 76px; border-radius: 18px; object-fit: contain; flex-shrink: 0;" />
      <div>
        <span class="timer-status-badge" style="margin-bottom: 4px;">🛡️ Pillo Hearts &amp; Streak</span>
        <h2 class="active-dose-title" style="font-size: 16px;">
          ${state.persona === 'kid' ? `🌟 ${state.streakCount} Hero Stars Earned!` : `🔥 ${state.streakCount}-Day Streak • ❤️ ${state.charityHearts} Hearts`}
        </h2>
        <p class="active-dose-meta">
          ${
            state.persona === 'kid'
              ? 'Verified with Child Face Scan, Medicine Cup Scan, Water Shake & Parent PIN!'
              : 'Taking all daily meds on time earns Heart Points donated to medical charities.'
          }
        </p>
      </div>
    </div>

    <div class="section-header">
      <h3 class="section-title">Timestamped Dose Guarantee Log</h3>
    </div>

    <div class="med-list">
      ${state.guaranteeLogs
        .map(
          (entry) => `
        <div class="med-card">
          <div class="med-left">
            <div class="med-3d-icon-box">
              <img src="${getAssetURI('icon_water_shield')}" alt="Verified Shield" />
            </div>
            <div>
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
      <h3 class="section-title">Med Cabinet &amp; Refill Stock Widget</h3>
      <button type="button" class="section-action-btn" onclick="openAddMedSheet()">+ Add New</button>
    </div>

    <div class="med-list">
      ${meds
        .map((m) => {
          const isCrit = m.stockLeft <= m.criticalRefillThreshold;
          return `
            <div class="med-card" onclick="selectMedication('${m.id}')">
              <div class="med-left">
                <div class="med-3d-icon-box">
                  <img src="${isCrit ? getAssetURI('icon_refill_alert') : getMedArtworkSrc(m)}" alt="${m.name}" />
                </div>
                <div>
                  <div class="med-name">${m.name}</div>
                  <div class="med-sub">
                    ${isCrit ? `<strong style="color:var(--timer-expired);">🚨 CRITICAL: ${m.stockLeft} LEFT (REFILL ALERT)</strong>` : `${m.stockLeft} pills in stock`}
                  </div>
                </div>
              </div>
              <div class="med-right">
                <button type="button" class="sim-btn ${isCrit ? 'sim-danger' : ''}" style="padding:4px 8px; font-size:11px;"
                        onclick="event.stopPropagation(); state.selectedMedId='${m.id}'; simulateTimerState('critical-refill')">
                  🚨 Refill Lock
                </button>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>

    <div class="section-header" style="margin-top: 6px;">
      <h3 class="section-title">Pillo Smart Handling &amp; Caregiver Safety</h3>
    </div>

    <div class="circle-timer-card" style="align-items: stretch; gap: 8px;">
      <label class="check-row" style="justify-content: space-between;">
        <span>🔐 Kid Mode Parent Approval PIN</span>
        <strong style="font-family:var(--font-mono);">${state.parentPinCode}</strong>
      </label>
      <label class="check-row" style="justify-content: space-between;">
        <span>🚗 Driving Safety Mode (&gt;15 mph Auto-Snooze)</span>
        <input type="checkbox" ${state.smartDrivingSnooze ? 'checked' : ''} onchange="state.smartDrivingSnooze = this.checked" />
      </label>
      <label class="check-row" style="justify-content: space-between;">
        <span>📞 Active Phone Call Auto-Pause</span>
        <input type="checkbox" ${state.smartCallPause ? 'checked' : ''} onchange="state.smartCallPause = this.checked" />
      </label>
    </div>
  `;
}

/* ==========================================================================
   Persistent Lockdown Overlay (With 3D Pillo Angry Pill Box & Kid Progression)
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

  let situationBadge = '🚨 Circle Timer Expired (00:00)';
  let headlineText = '';
  let subcopyText = '';

  if (state.lockdownReason === 'critical-refill') {
    situationBadge = `🚨 CRITICAL REFILL ALERT (${med.stockLeft} LEFT!)`;
    if (isKid) {
      headlineText =
        currentMood === 'worried'
          ? `😟 Barnaby is Worried! ${med.name} Only Has ${med.stockLeft} Left!`
          : currentMood === 'worried-angry'
          ? `😣 Barnaby is Getting Upset! Refill ${med.name} Soon!`
          : `😠 BARNABY IS GRUMPY! Refill ${med.name} Right Now!`;
      subcopyText = `This alert stays locked on screen until a parent scans the Rx bottle & guarantees the refill!`;
    } else {
      headlineText = `😡 CRITICAL REFILL LOCKDOWN: ${med.name} (${med.stockLeft} Left)!`;
      subcopyText = `The Angry Pill Box will not leave your screen until you scan & guarantee your prescription refill.`;
    }
  } else if (state.lockdownReason === 'max-snooze') {
    situationBadge = `🚨 Max Reschedule Limit (2/2 Used)`;
    headlineText = isKid
      ? `😣 No More Rescheduling, Leo! Barnaby Went From Worried to Grumpy!`
      : `😡 Enough Procrastinating! Take ${med.name} Now!`;
    subcopyText = `You already rescheduled twice. Complete the multi-sensor guarantee below to unlock your phone.`;
  } else {
    if (isKid) {
      if (currentMood === 'worried') {
        headlineText = `😟 Oh No Leo! The Circle Timer Ran Out & Barnaby is Worried!`;
        subcopyText = `In Kid Mode, Barnaby starts worried when the timer hits 00:00 — and turns angry if ignored!`;
      } else if (currentMood === 'worried-angry') {
        headlineText = `😣 Barnaby is Turning From Worried to Angry! Take ${med.name}!`;
        subcopyText = `Don't let Barnaby reach full Grumpy-Angry! Scan your face & medicine cup below!`;
      } else {
        headlineText = `😠 BARNABY IS FULL GRUMPY-ANGRY! Guarantee ${med.name} Now!`;
        subcopyText = `My grumpy face is locked to your screen until you complete the Child Face Scan, Water Shake, & Parent PIN!`;
      }
    } else {
      headlineText = `😡 THE ANGRY PILL BOX: Timer Hit 00:00 for ${med.name}!`;
      subcopyText = `This persistent alarm will NOT leave your screen until you complete the Pill Photo Scan, Water Shake, and 3s Hold Guarantee.`;
    }
  }

  const scoldText =
    state.dismissAttemptsBlocked > 0
      ? `🚫 Dismissal Blocked (#${state.dismissAttemptsBlocked})! ${
          isKid
            ? 'Trying to close the screen makes Barnaby go from Worried to Angry faster!'
            : 'Swiping away is disabled. Complete the Dose Guarantee below!'
        }`
      : isKid
      ? `💡 Tap the stages below (or wait) to see Barnaby transition: 😟 Worried ➔ 😣 Upset ➔ 😠 Angry`
      : `🔒 Persistent Screen Lock Active — Complete all verification sensors below to dismiss.`;

  overlay.innerHTML = `
    <div class="lockdown-top-bar">
      <span class="lockdown-alert-pill">${situationBadge}</span>
      <button type="button" class="fake-dismiss-btn" onclick="triggerAngryReject()">
        ✕ Try to Swipe Away
      </button>
    </div>

    ${
      isKid
        ? `
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
      <div class="lockdown-3d-portrait-row">
        <div class="angry-svg-container">
          ${getCompanionArtworkHTML(state.persona, currentMood, '')}
        </div>
        ${
          state.lockdownReason === 'critical-refill'
            ? `<img src="${getAssetURI('icon_refill_alert')}" alt="2 Left Refill Alert" class="refill-side-badge-img" />`
            : ''
        }
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
          <button type="button" class="lockdown-snooze-btn" onclick="applySmartSnooze('After Meal (+15m)', 45)">
            🍽️ After Meal (15m)
          </button>
          <button type="button" class="lockdown-snooze-btn" onclick="applySmartSnooze('Driving (>15 mph)', 60)">
            🚗 Driving Mode
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

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function openMobileInstallSheet() {
  activeSheetMode = 'mobile-install';
  renderAll();
}

function copyLiveHostedURL() {
  const liveUrl = 'https://syn415.github.io/pillpal-care/';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(liveUrl).catch(() => {});
  }
  showCelebrationToast('📋 Copied live mobile URL: https://syn415.github.io/pillpal-care/');
}

async function triggerNativePWAInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => {});
    deferredInstallPrompt = null;
    renderAll();
  } else {
    showCelebrationToast('📲 On iPhone: tap Share ➔ "Add to Home Screen". On Android: tap Chrome Menu ➔ "Install App"!');
  }
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
        <h3 class="sheet-title">✅ Take Now &amp; Guarantee ${med.name}</h3>
        <button type="button" class="sheet-close" onclick="closeBottomSheet()">✕</button>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary);">
        You responded before the Time-Box ran out (${med.timerRemaining}s left)! Complete the sensor verification below:
      </p>
      ${renderVerificationSuiteHTML('calm', med)}
    `;
  } else if (activeSheetMode === 'mobile-install') {
    const liveUrl = 'https://syn415.github.io/pillpal-care/';
    container.innerHTML = `
      <div class="sheet-header">
        <h3 class="sheet-title">📲 Test &amp; Install on Any Mobile Device</h3>
        <button type="button" class="sheet-close" onclick="closeBottomSheet()">✕</button>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary);">
        <strong>Pillo Care+</strong> is hosted live over HTTPS with full PWA mobile support (Camera Pill/Face Scanner, Hardware Shake Sensor, and Full-Screen Home Screen App mode):
      </p>
      <div class="pillo-med-spotlight" style="justify-content: space-between;">
        <div class="spotlight-details">
          <div class="spotlight-name" style="font-family: var(--font-mono); font-size: 12px; word-break: break-all;">
            ${liveUrl}
          </div>
          <div class="spotlight-dosage">Live HTTPS GitHub Pages Deployment • iOS &amp; Android Ready</div>
        </div>
        <button type="button" class="sim-btn" onclick="copyLiveHostedURL()" style="flex-shrink:0;">
          📋 Copy URL
        </button>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; font-size:12px; color:var(--text-secondary); background:var(--bg-surface-muted); padding:12px; border-radius:14px;">
        <div><strong>🍏 iPhone / iPad (Safari):</strong> Open <code>${liveUrl}</code> ➔ tap <strong>Share (↑)</strong> ➔ tap <strong>"Add to Home Screen"</strong> for a full-screen standalone app.</div>
        <div><strong>🤖 Android (Chrome):</strong> Open <code>${liveUrl}</code> ➔ tap <strong>Install App</strong> (or Chrome Menu ⋮ ➔ <strong>Add to Home screen</strong>).</div>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <button type="button" class="btn-primary-take" onclick="triggerNativePWAInstall()">
          📲 Install to Home Screen
        </button>
        <a href="${liveUrl}" target="_blank" rel="noopener" class="btn-secondary-snooze" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
          🌐 Open Live URL ↗
        </a>
      </div>
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
          <input id="new-med-visual" class="form-input" required placeholder="e.g., 1 Cup + Sip of Water" />
        </div>
        <button type="submit" class="btn-primary-take" style="width:100%;">
          Save &amp; Start Time-Box Circle
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
    instructions: 'Protected by Pillo Time-Box & Multi-Modal Guarantee',
    scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    assetKey: state.persona === 'kid' ? 'icon_kid_meds' : 'icon_adult_pills',
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

  const headerAvatar = document.getElementById('header-mascot-avatar');
  if (headerAvatar) {
    const avatarSrc = getAssetURI(state.persona === 'kid' ? 'kid_calm' : 'adult_calm');
    headerAvatar.innerHTML = `<img src="${avatarSrc}" alt="Mascot Avatar" />`;
  }

  const titleEl = document.getElementById('app-main-title');
  const subEl = document.getElementById('app-main-subtitle');
  if (titleEl && subEl) {
    titleEl.textContent = state.persona === 'adult' ? 'Pillo Care+' : 'Pillo Kids Hero';
    subEl.textContent =
      state.persona === 'adult'
        ? 'The Angry Pill Box • Adult Mode'
        : 'Leo, Age 8 • Worried → Angry Buddy';
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
