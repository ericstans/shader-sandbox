// Minimum speed required to make sound
let BANDPASS_Q = 18;

const MIN_SOUND_SPEED = 0.1;
// rainstickShader.js
// 2D rainstick simulation with interactive rotation and sound

const displayName = 'Rainstick';

const STICK_LENGTH = 500;
const STICK_RADIUS = 30;
const NUM_PINS = 80;
const PIN_RADIUS = 2;
let NUM_PEBBLES = 12;
const GRAVITY = 0.3;
const FRICTION = 0.96;
const REST_THRESHOLD = 0.08;


let state = null;
let uiElements = null;
let BLINK_ENABLED = false;
let CUTOFF_FREQ = 2000;
let SOUND_TYPE = 'white';
let lastAnimateTime = 0;
// Remove UI cleanup timeout logic; use onChangedAway instead

function reset() {
  // Pins are distributed in a slightly irregular grid
  let pins = [];
  const ROWS = 6;
  const COLS = Math.ceil(NUM_PINS / ROWS);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Skip the first and last column of pegs
      if (col === 0 || col === COLS - 1) continue;
      if (pins.length >= NUM_PINS) break;
      // Evenly spaced, but with a small random jitter
      let x = (col + 0.3) * (STICK_LENGTH / COLS) + (Math.random() * 4) * 6;
      let y = (row + 0.5) * ((STICK_RADIUS * 2) / ROWS);
      pins.push({ x, y });
    }
  }
  // Pebbles start at random positions, partitioned by the center wall
  let pebbles = [];
  let half = Math.floor(NUM_PEBBLES / 2);
  for (let i = 0; i < NUM_PEBBLES; i++) {
    let t = Math.random();
    let x = t * STICK_LENGTH;
    // Partition: first half above center, second half below
    let y;
    if (i < half) {
      y = Math.random() * (STICK_RADIUS - 3) + 3; // upper half
    } else {
      y = Math.random() * (STICK_RADIUS - 3) + STICK_RADIUS + 3; // lower half
    }
    pebbles.push({ x, y, vx: 0, vy: 0, lastPin: -1, prevPin: -1, blink: 0 });
  }
  state = {
    pins,
    pebbles,
    angle: 0,
    BANDPASS_Q: 18,
    dragging: false,
    dragStart: null,
    angleStart: 0,
    soundQueue: [],
  };
}

function playSound(volume, speed = 1) {
  // Bandpassed noise burst using Web Audio API, frequency depends on impact speed (legacy)
  if (!window._rainstickAudioCtx) {
    window._rainstickAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const ctx = window._rainstickAudioCtx;
  // Only play sound if speed is above threshold
  if (speed < MIN_SOUND_SPEED) return;
  // Count currently playing sounds
  let nActive = (window._rainstickActiveImpacts || 0);
  let scale = 0.5 / Math.max(1, nActive) + 0.5;
  if (speed < MIN_SOUND_SPEED) return;
  // Create a short noise buffer
  const duration = 0.04;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  // Generate noise based on SOUND_TYPE
  if (SOUND_TYPE === 'white') {
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }
  } else if (SOUND_TYPE === 'pink') {
    // Pink noise (simple filter)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      let white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // scale
      b6 = white * 0.115926;
    }
  } else if (SOUND_TYPE === 'brown') {
    // Brownian noise
    let lastOut = 0.0;
    for (let i = 0; i < data.length; i++) {
      let white = Math.random() * 2 - 1;
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      data[i] = lastOut * 3.5;
    }
  } else if (SOUND_TYPE === 'metallic') {
    // Inharmonic partials + noise for a bell-like metallic sound
    const partials = [1, 2.32, 2.9, 4.05, 5.43];
    const baseFreq = 700 + Math.random() * 200;
    for (let i = 0; i < data.length; i++) {
      let t = i / sampleRate;
      let val = 0;
      for (let j = 0; j < partials.length; j++) {
        val += Math.sin(2 * Math.PI * baseFreq * partials[j] * t) * Math.exp(-t * (6 + j * 2));
      }
      val += (Math.random() * 2 - 1) * 0.15 * Math.exp(-t * 8);
      data[i] = val * 0.5;
    }
  } else if (SOUND_TYPE === 'glass') {
    // Harmonic partials with shimmer for a glassy sound
    const baseFreq = 400 + Math.random() * 80;
    for (let i = 0; i < data.length; i++) {
      let t = i / sampleRate;
      let val = 0;
      for (let h = 1; h <= 6; h++) {
        let mod = 1 + 0.01 * Math.sin(2 * Math.PI * 3 * t + h);
        val += Math.sin(2 * Math.PI * baseFreq * h * mod * t) * Math.exp(-t * (2 + h * 0.7));
      }
      val += (Math.random() * 2 - 1) * 0.05 * Math.exp(-t * 6);
      data[i] = val * 0.4;
    }
  } else {
    // Default to white
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  // Bandpass filter
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  // Use cutoff slider value as base frequency, modulate by speed
  let minF = Math.max(100, CUTOFF_FREQ - 800), maxF = CUTOFF_FREQ + 2000;
  let freq = minF + Math.min(1, speed / 6) * (maxF - minF) + Math.random() * 100;
  bp.frequency.value = freq;
  bp.Q.value = BANDPASS_Q;
  // Gain
  const g = ctx.createGain();
  // Compensate for Q: as Q increases above 18, increase gain up to 2x at Q=40; as Q drops below 10, decrease gain to 0.5x at Q=1
  let qComp = 1;
  if (BANDPASS_Q > 18) {
    qComp = 1 + (BANDPASS_Q - 18) / 22; // 1.0 at 18, 2.0 at 40
  } else if (BANDPASS_Q < 10) {
    qComp = 0.4 + 0.6 * (BANDPASS_Q / 10); // 0.4 at Q=1, 1.0 at Q=10
  }
  g.gain.value = 0.08 * volume * scale * qComp;
  noise.connect(bp).connect(g).connect(ctx.destination);
  // Track active impact sounds for scaling
  window._rainstickActiveImpacts = (window._rainstickActiveImpacts || 0) + 1;
  noise.onended = () => {
    window._rainstickActiveImpacts = Math.max(0, (window._rainstickActiveImpacts || 1) - 1);
  };
  noise.start();
  noise.stop(ctx.currentTime + duration);
}

export function onChangedAway() {
  // Remove all UI elements created by the rainstick shader
  if (uiElements) {
    for (const key of Object.keys(uiElements)) {
      const el = uiElements[key];
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
  }
  uiElements = null;
}

function animate(ctx, t, width, height) {
  if (!state || ctx._rainstickW !== width || ctx._rainstickH !== height) {
    reset();
    ctx._rainstickW = width;
    ctx._rainstickH = height;
  }

  // --- Physics rate control: run physics at half the render rate ---
  if (typeof animate._physicsFrame === 'undefined') animate._physicsFrame = 0;
  animate._physicsFrame++;
  let doPhysics = (animate._physicsFrame % 2 === 0);
  // --- UI: Add slider for number of balls, dropdown for sound type, and slider for bandpass Q ---
  if (uiElements && uiElements.slider) {
    uiElements.slider.value = NUM_PEBBLES;
    uiElements.label.textContent = `Balls: ${NUM_PEBBLES}`;
    if (uiElements.soundDropdown) {
      uiElements.soundDropdown.value = SOUND_TYPE;
    }
    if (uiElements.qSlider) {
      uiElements.qSlider.value = BANDPASS_Q;
      uiElements.qLabel.textContent = `Q: ${BANDPASS_Q}`;
    }
  }
  if (!uiElements || !uiElements.slider || !document.body.contains(uiElements.slider) || !uiElements.soundDropdown || !document.body.contains(uiElements.soundDropdown) || !uiElements.qSlider || !document.body.contains(uiElements.qSlider) || !uiElements.blinkCheckbox || !document.body.contains(uiElements.blinkCheckbox) || !uiElements.cutoffSlider || !document.body.contains(uiElements.cutoffSlider)) {
    // Cutoff slider
    const cutoffSlider = document.createElement('input');
    cutoffSlider.type = 'range';
    cutoffSlider.min = 200;
    cutoffSlider.max = 6000;
    cutoffSlider.value = CUTOFF_FREQ;
    cutoffSlider.step = 1;
    cutoffSlider.style.position = 'absolute';
    cutoffSlider.style.left = (ctx.canvas.getBoundingClientRect().left + 20) + 'px';
    cutoffSlider.style.top = (ctx.canvas.getBoundingClientRect().top + 140) + 'px';
    cutoffSlider.style.zIndex = 1000;
    cutoffSlider.style.width = '120px';
    const cutoffLabel = document.createElement('span');
    cutoffLabel.textContent = `Bandpass: ${CUTOFF_FREQ} Hz`;
    cutoffLabel.style.position = 'absolute';
    cutoffLabel.style.left = (ctx.canvas.getBoundingClientRect().left + 150) + 'px';
    cutoffLabel.style.top = (ctx.canvas.getBoundingClientRect().top + 138) + 'px';
    cutoffLabel.style.zIndex = 1000;
    cutoffLabel.style.color = 'white';
    cutoffSlider.addEventListener('input', e => {
      CUTOFF_FREQ = parseInt(cutoffSlider.value);
      cutoffLabel.textContent = `Cutoff: ${CUTOFF_FREQ} Hz`;
    });
    // Remove old UI if present
    if (uiElements) {
      if (uiElements.slider && uiElements.slider.parentNode) uiElements.slider.parentNode.removeChild(uiElements.slider);
      if (uiElements.label && uiElements.label.parentNode) uiElements.label.parentNode.removeChild(uiElements.label);
      if (uiElements.soundDropdown && uiElements.soundDropdown.parentNode) uiElements.soundDropdown.parentNode.removeChild(uiElements.soundDropdown);
      if (uiElements.soundLabel && uiElements.soundLabel.parentNode) uiElements.soundLabel.parentNode.removeChild(uiElements.soundLabel);
      if (uiElements.qSlider && uiElements.qSlider.parentNode) uiElements.qSlider.parentNode.removeChild(uiElements.qSlider);
      if (uiElements.qLabel && uiElements.qLabel.parentNode) uiElements.qLabel.parentNode.removeChild(uiElements.qLabel);
    }
    // Create new UI
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 1;
    slider.max = 100;
    slider.value = NUM_PEBBLES;
    slider.style.position = 'absolute';
    slider.style.left = (ctx.canvas.getBoundingClientRect().left + 20) + 'px';
    slider.style.top = (ctx.canvas.getBoundingClientRect().top + 20) + 'px';
    slider.style.zIndex = 1000;
    slider.style.width = '120px';
    const label = document.createElement('span');
    label.textContent = `Balls: ${NUM_PEBBLES}`;
    label.style.position = 'absolute';
    label.style.left = (ctx.canvas.getBoundingClientRect().left + 150) + 'px';
    label.style.top = (ctx.canvas.getBoundingClientRect().top + 18) + 'px';
    label.style.zIndex = 1000;
    label.style.color = 'white';
    // --- Sound type dropdown ---
    const soundDropdown = document.createElement('select');
    soundDropdown.style.position = 'absolute';
    soundDropdown.style.left = (ctx.canvas.getBoundingClientRect().left + 20) + 'px';
    soundDropdown.style.top = (ctx.canvas.getBoundingClientRect().top + 50) + 'px';
    soundDropdown.style.zIndex = 1000;
    const soundLabel = document.createElement('span');
    soundLabel.textContent = 'Sound: ';
    soundLabel.style.position = 'absolute';
    soundLabel.style.left = (ctx.canvas.getBoundingClientRect().left + 150) + 'px';
    soundLabel.style.top = (ctx.canvas.getBoundingClientRect().top + 48) + 'px';
    soundLabel.style.zIndex = 1000;
    soundLabel.style.color = 'white';
    const options = [
      { value: 'white', label: 'White Noise' },
      { value: 'pink', label: 'Pink Noise' },
      { value: 'brown', label: 'Brown Noise' },
      { value: 'metallic', label: 'Metallic' },
      { value: 'glass', label: 'Glass' },
    ];
    for (const opt of options) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      soundDropdown.appendChild(o);
    }
    soundDropdown.value = SOUND_TYPE;
    soundDropdown.addEventListener('change', e => {
      SOUND_TYPE = soundDropdown.value;
    });
    // --- Q slider ---
    const qSlider = document.createElement('input');
    qSlider.type = 'range';
    qSlider.min = 1;
    qSlider.max = 40;
    qSlider.value = BANDPASS_Q;
    qSlider.step = 0.1;
    qSlider.style.position = 'absolute';
    qSlider.style.left = (ctx.canvas.getBoundingClientRect().left + 20) + 'px';
    qSlider.style.top = (ctx.canvas.getBoundingClientRect().top + 80) + 'px';
    qSlider.style.zIndex = 1000;
    qSlider.style.width = '120px';
    const qLabel = document.createElement('span');
    qLabel.textContent = `Q: ${BANDPASS_Q}`;
    qLabel.style.position = 'absolute';
    qLabel.style.left = (ctx.canvas.getBoundingClientRect().left + 150) + 'px';
    qLabel.style.top = (ctx.canvas.getBoundingClientRect().top + 78) + 'px';
    qLabel.style.zIndex = 1000;
    qLabel.style.color = 'white';
    qSlider.addEventListener('input', e => {
      BANDPASS_Q = parseFloat(qSlider.value);
      qLabel.textContent = `Q: ${BANDPASS_Q}`;
    });
    // Blinking checkbox
    const blinkCheckbox = document.createElement('input');
    blinkCheckbox.type = 'checkbox';
    blinkCheckbox.checked = BLINK_ENABLED;
    blinkCheckbox.style.position = 'absolute';
    blinkCheckbox.style.left = (ctx.canvas.getBoundingClientRect().left + 20) + 'px';
    blinkCheckbox.style.top = (ctx.canvas.getBoundingClientRect().top + 110) + 'px';
    blinkCheckbox.style.zIndex = 1000;
    const blinkLabel = document.createElement('span');
    blinkLabel.textContent = 'Blink balls on sound';
    blinkLabel.style.position = 'absolute';
    blinkLabel.style.left = (ctx.canvas.getBoundingClientRect().left + 40) + 'px';
    blinkLabel.style.top = (ctx.canvas.getBoundingClientRect().top + 108) + 'px';
    blinkLabel.style.zIndex = 1000;
    blinkLabel.style.color = 'white';
    blinkCheckbox.onchange = () => { BLINK_ENABLED = blinkCheckbox.checked; };

    document.body.appendChild(slider);
    document.body.appendChild(label);
    document.body.appendChild(soundDropdown);
    document.body.appendChild(soundLabel);
    document.body.appendChild(qSlider);
    document.body.appendChild(qLabel);
    document.body.appendChild(blinkCheckbox);
    document.body.appendChild(blinkLabel);
    document.body.appendChild(cutoffSlider);
    document.body.appendChild(cutoffLabel);
    slider.addEventListener('input', e => {
      window.NUM_PEBBLES = parseInt(slider.value);
      label.textContent = `Balls: ${slider.value}`;
      NUM_PEBBLES = parseInt(slider.value);
      reset();
    });
    uiElements = { slider, label, soundDropdown, soundLabel, qSlider, qLabel, blinkCheckbox, blinkLabel, cutoffSlider, cutoffLabel };

  }
  // Keep UI in sync with canvas position
  if (uiElements && uiElements.slider) {
    const rect = ctx.canvas.getBoundingClientRect();
    uiElements.slider.style.left = (rect.left + 20) + 'px';
    uiElements.slider.style.top = (rect.top + 20) + 'px';
    uiElements.label.style.left = (rect.left + 150) + 'px';
    uiElements.label.style.top = (rect.top + 18) + 'px';
    if (uiElements.soundDropdown) {
      uiElements.soundDropdown.style.left = (rect.left + 20) + 'px';
      uiElements.soundDropdown.style.top = (rect.top + 50) + 'px';
    }
    if (uiElements.soundLabel) {
      uiElements.soundLabel.style.left = (rect.left + 150) + 'px';
      uiElements.soundLabel.style.top = (rect.top + 48) + 'px';
    }
    if (uiElements.qSlider) {
      uiElements.qSlider.style.left = (rect.left + 20) + 'px';
      uiElements.qSlider.style.top = (rect.top + 80) + 'px';
    }
    if (uiElements.qLabel) {
      uiElements.qLabel.style.left = (rect.left + 150) + 'px';
      uiElements.qLabel.style.top = (rect.top + 78) + 'px';
    }
        // Keep cutoff slider in sync with canvas position
    if (uiElements.cutoffSlider) {
      const rect = ctx.canvas.getBoundingClientRect();
      uiElements.cutoffSlider.style.left = (rect.left + 20) + 'px';
      uiElements.cutoffSlider.style.top = (rect.top + 140) + 'px';
      uiElements.cutoffLabel.style.left = (rect.left + 150) + 'px';
      uiElements.cutoffLabel.style.top = (rect.top + 138) + 'px';
    }
  }



  // Handle mouse drag for rotation
  if (!window._rainstickEvents) {
    window._rainstickEvents = true;
    ctx.canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return; // Only left click
      state.dragging = true;
      state.dragStart = { x: e.clientX, y: e.clientY };
      state.angleStart = state.angle;
    });
    window.addEventListener('mousemove', e => {
      if (state.dragging) {
        let dx = e.clientX - state.dragStart.x;
        state.angle = state.angleStart + dx * 0.01;
      }
    });
    window.addEventListener('mouseup', e => {
      state.dragging = false;
    });
  }

  // Physics for pebbles (run at half rate)
  if (doPhysics) {
    let sinA = Math.sin(state.angle), cosA = Math.cos(state.angle);
    const RADIUS = 5;
    for (let i = 0; i < state.pebbles.length; i++) {
      let pebble = state.pebbles[i];
      // Gravity along stick
      pebble.vx += GRAVITY * sinA;
      pebble.vy += GRAVITY * cosA;
      pebble.vx *= FRICTION;
      pebble.vy *= FRICTION;
      // Zero out tiny velocities for rest
      if (Math.abs(pebble.vx) < REST_THRESHOLD) pebble.vx = 0;
      if (Math.abs(pebble.vy) < REST_THRESHOLD) pebble.vy = 0;
      pebble.x += pebble.vx;
      pebble.y += pebble.vy;
      // Improved wall collision
      const WALL_THRESHOLD = 0.5;
      if (pebble.y < 0) { pebble.y = 0; pebble.vy *= -0.2; }
      if (pebble.y > STICK_RADIUS * 2) {
        pebble.y = STICK_RADIUS * 2;
        pebble.vy *= -0.2;
      }

      // Extra damping near the bottom to help balls settle
      if (pebble.y > STICK_RADIUS * 2 - 2 && Math.abs(pebble.vy) < 0.5 && Math.abs(pebble.vx) < 0.5) {
        pebble.vx *= 0.7;
        pebble.vy *= 0.7;
        // If very slow, stop completely
        if (Math.abs(pebble.vy) < 0.08 && Math.abs(pebble.vx) < 0.08) {
          pebble.vx = 0;
          pebble.vy = 0;
        }
      }
      // Center wall (lengthwise)
      if (Math.abs(pebble.y - STICK_RADIUS) < 2.5) {
        // If pebble is about to cross the wall, push it back
        if (pebble.y < STICK_RADIUS) {
          pebble.y = STICK_RADIUS - 2.5;
          if (pebble.vy > 0) pebble.vy *= -0.2;
        } else {
          pebble.y = STICK_RADIUS + 2.5;
          if (pebble.vy < 0) pebble.vy *= -0.2;
        }
      }
      // Left wall
      if (pebble.x <= WALL_THRESHOLD) {
        if (pebble.x < 0) { pebble.x = 0; pebble.vx *= -0.2; }
      }
      // Right wall
      if (pebble.x >= STICK_LENGTH - WALL_THRESHOLD) {
        if (pebble.x > STICK_LENGTH) { pebble.x = STICK_LENGTH; pebble.vx *= -0.2; }
      }
      // Collide with pins
      for (let pinIdx = 0; pinIdx < state.pins.length; pinIdx++) {
        let pin = state.pins[pinIdx];
        let dx = pebble.x - pin.x;
        let dy = pebble.y - pin.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 6) {
          // Only play sound if speed before bounce is above threshold and not hitting same pin as last time or the one before
          let preSpeed = Math.sqrt(pebble.vx * pebble.vx + pebble.vy * pebble.vy);
          // Simple bounce with energy loss
          let nx = dx / (dist || 1);
          let ny = dy / (dist || 1);
          pebble.vx += nx * 0.8;
          pebble.vy += ny * 0.8;
          // Slow down the pebble to simulate energy loss
          pebble.vx *= 0.5;
          pebble.vy *= 0.5;
          if (
            preSpeed > MIN_SOUND_SPEED &&
            pebble.lastPin !== pinIdx &&
            pebble.prevPin !== pinIdx
          ) {
            // Map speed to velocity: min 0.25, max 1.0
            let minV = 0.25, maxV = 1.0, maxSpeed = 6;
            let velocity = minV + Math.min(1, (preSpeed - MIN_SOUND_SPEED) / (maxSpeed - MIN_SOUND_SPEED)) * (maxV - minV);
            state.soundQueue.push({ x: pebble.x, y: pebble.y, t: performance.now(), speed: velocity, pebbleIdx: i });
            pebble.prevPin = pebble.lastPin;
            pebble.lastPin = pinIdx;
          }
        } else if (pebble.lastPin === pinIdx) {
          // Only reset lastPin if not colliding with any pin
          // (Do not reset on wall, center wall, or other collisions)
          let stillOnAnyPin = false;
          for (let k = 0; k < state.pins.length; k++) {
            if (k !== pinIdx) {
              let p2 = state.pins[k];
              let dx2 = pebble.x - p2.x;
              let dy2 = pebble.y - p2.y;
              let dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
              if (dist2 < 6) {
                stillOnAnyPin = true;
                break;
              }
            }
          }
          // Also, do not reset if pebble is in contact with the center wall
          let onCenterWall = Math.abs(pebble.y - STICK_RADIUS) < 2.5;
          if (!stillOnAnyPin && !onCenterWall) {
            pebble.lastPin = -1;
          }
        }
      }
      // Collide with other pebbles
      for (let j = i + 1; j < state.pebbles.length; j++) {
        let other = state.pebbles[j];
        let dx = pebble.x - other.x;
        let dy = pebble.y - other.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RADIUS * 2 && dist > 0) {
          // Push them apart
          let overlap = RADIUS * 2 - dist;
          let nx = dx / dist;
          let ny = dy / dist;
          pebble.x += nx * overlap / 2;
          pebble.y += ny * overlap / 2;
          other.x -= nx * overlap / 2;
          other.y -= ny * overlap / 2;
          // If both are nearly at rest, damp their velocities to zero
          let v1 = Math.sqrt(pebble.vx * pebble.vx + pebble.vy * pebble.vy);
          let v2 = Math.sqrt(other.vx * other.vx + other.vy * other.vy);
          if (v1 < REST_THRESHOLD && v2 < REST_THRESHOLD) {
            pebble.vx = 0; pebble.vy = 0;
            other.vx = 0; other.vy = 0;
          } else {
            // Exchange velocity (simple elastic)
            let tx = pebble.vx;
            let ty = pebble.vy;
            pebble.vx = other.vx;
            pebble.vy = other.vy;
            other.vx = tx;
            other.vy = ty;
          }
        }
      }
    }
  }
  // Play queued sounds
  if (state.soundQueue.length) {
    let now = performance.now();
    state.soundQueue = state.soundQueue.filter(s => {
      if (now - s.t < 30) return true;
      playSound(1, s.speed);
      // Blink the corresponding pebble
      if (typeof s.pebbleIdx === 'number' && state.pebbles[s.pebbleIdx]) {
        state.pebbles[s.pebbleIdx].blink = 8; // frames to blink
      }
      return false;
    });
  }
  // Draw

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.translate((width - STICK_LENGTH) / 2, (height - STICK_RADIUS * 2) / 2);
  ctx.save();
  ctx.translate(STICK_LENGTH / 2, STICK_RADIUS);
  ctx.rotate(state.angle);
  ctx.translate(-STICK_LENGTH / 2, -STICK_RADIUS);
  // Draw stick
  ctx.fillStyle = '#b97a57';
  ctx.fillRect(0, 0, STICK_LENGTH, STICK_RADIUS * 2);
  // Draw center wall
  ctx.save();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, STICK_RADIUS);
  ctx.lineTo(STICK_LENGTH, STICK_RADIUS);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#7a4a2f';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, STICK_LENGTH, STICK_RADIUS * 2);
  // Draw pins
  for (let pin of state.pins) {
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, PIN_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
  }
  // Draw pebbles
  for (let pebble of state.pebbles) {
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, 5, 0, 2 * Math.PI);
    if (BLINK_ENABLED && pebble.blink > 0) {
      ctx.fillStyle = '#f33';
      pebble.blink--;
    } else {
      ctx.fillStyle = '#ccc';
    }
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.stroke();
  }
  // Keep UI in sync with canvas position
  if (uiElements && uiElements.slider) {
    const rect = ctx.canvas.getBoundingClientRect();
    uiElements.slider.style.left = (rect.left + 20) + 'px';
    uiElements.slider.style.top = (rect.top + 20) + 'px';
    uiElements.label.style.left = (rect.left + 150) + 'px';
    uiElements.label.style.top = (rect.top + 18) + 'px';
    uiElements.soundDropdown.style.left = (rect.left + 20) + 'px';
    uiElements.soundDropdown.style.top = (rect.top + 50) + 'px';
    uiElements.soundLabel.style.left = (rect.left + 150) + 'px';
    uiElements.soundLabel.style.top = (rect.top + 48) + 'px';
    uiElements.qSlider.style.left = (rect.left + 20) + 'px';
    uiElements.qSlider.style.top = (rect.top + 80) + 'px';
    uiElements.qLabel.style.left = (rect.left + 150) + 'px';
    uiElements.qLabel.style.top = (rect.top + 78) + 'px';
    uiElements.blinkCheckbox.style.left = (rect.left + 20) + 'px';
    uiElements.blinkCheckbox.style.top = (rect.top + 110) + 'px';
    uiElements.blinkLabel.style.left = (rect.left + 40) + 'px';
    uiElements.blinkLabel.style.top = (rect.top + 108) + 'px';
  }
  ctx.restore();
  ctx.restore();
}


export default {
  displayName,
  animate,
  onChangedAway
};
