// Minimum speed required to make sound
const MIN_SOUND_SPEED = 0.18;
// rainstickShader.js
// 2D rainstick simulation with interactive rotation and sound

const displayName = 'Rainstick';

const STICK_LENGTH = 500;
const STICK_RADIUS = 30;
const NUM_PINS = 60;
let NUM_PEBBLES = 2;
const GRAVITY = 0.3;
const FRICTION = 0.96;
const REST_THRESHOLD = 0.08;


let state = null;
let uiElements = null;
let lastAnimateTime = 0;
// Remove UI cleanup timeout logic; use onChangedAway instead

function reset() {
  // Pins are distributed in a slightly irregular grid
  let pins = [];
  const ROWS = 6;
  const COLS = Math.ceil(NUM_PINS / ROWS);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (pins.length >= NUM_PINS) break;
      // Evenly spaced, but with a small random jitter
      let x = (col + 0.3) * (STICK_LENGTH / COLS) + (Math.random() * 4) * 6;
      let y = (row + 0.5) * ((STICK_RADIUS * 2) / ROWS) //+ (Math.random() - 0.5) * 4;
      pins.push({x, y});
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
    pebbles.push({x, y, vx: 0, vy: 0});
  }
  state = {
    pins,
    pebbles,
    angle: 0,
    dragging: false,
    dragStart: null,
    angleStart: 0,
    soundQueue: [],
  };
}

function playSound(volume, speed=1) {
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
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.7;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  // Bandpass filter
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  // Map speed to frequency: low speed = 800Hz, high speed = 2500Hz
  let minF = 1200, maxF = 5000;
  let freq = minF + Math.min(1, speed/6) * (maxF - minF) + Math.random() * 100;
  bp.frequency.value = freq;
  bp.Q.value = 18;
  // Gain
  const g = ctx.createGain();
  g.gain.value = 0.08 * volume * scale;
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
  // Remove Balls slider and label UI immediately
  if (uiElements && uiElements.slider && uiElements.slider.parentNode) {
    uiElements.slider.parentNode.removeChild(uiElements.slider);
  }
  if (uiElements && uiElements.label && uiElements.label.parentNode) {
    uiElements.label.parentNode.removeChild(uiElements.label);
  }
  uiElements = null;
}

function animate(ctx, t, width, height) {
  if (!state || ctx._rainstickW !== width || ctx._rainstickH !== height) {
    reset();
    ctx._rainstickW = width;
    ctx._rainstickH = height;
  }
  // UI code moved to animate()
  // --- UI: Add slider for number of balls ---
  if (uiElements && uiElements.slider) {
    uiElements.slider.value = NUM_PEBBLES;
    uiElements.label.textContent = `Balls: ${NUM_PEBBLES}`;
  }
  if (!uiElements || !uiElements.slider || !document.body.contains(uiElements.slider)) {
    // Remove old UI if present
    if (uiElements && uiElements.slider && uiElements.slider.parentNode) {
      uiElements.slider.parentNode.removeChild(uiElements.slider);
      uiElements.label.parentNode.removeChild(uiElements.label);
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
    document.body.appendChild(slider);
    document.body.appendChild(label);
    slider.addEventListener('input', e => {
      window.NUM_PEBBLES = parseInt(slider.value);
      label.textContent = `Balls: ${slider.value}`;
      // Update global and local NUM_PEBBLES, then reset
      NUM_PEBBLES = parseInt(slider.value);
      reset();
    });
    uiElements = {slider, label};
  }
  // Keep UI in sync with canvas position
  if (uiElements && uiElements.slider) {
    const rect = ctx.canvas.getBoundingClientRect();
    uiElements.slider.style.left = (rect.left + 20) + 'px';
    uiElements.slider.style.top = (rect.top + 20) + 'px';
    uiElements.label.style.left = (rect.left + 150) + 'px';
    uiElements.label.style.top = (rect.top + 18) + 'px';
  }



  // Handle mouse drag for rotation
  if (!window._rainstickEvents) {
    window._rainstickEvents = true;
    ctx.canvas.addEventListener('mousedown', e => {
      state.dragging = true;
      state.dragStart = {x: e.clientX, y: e.clientY};
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
  
  // Physics for pebbles
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
    if (pebble.y > STICK_RADIUS*2) { pebble.y = STICK_RADIUS*2; pebble.vy *= -0.2; }
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
    for (let pin of state.pins) {
      let dx = pebble.x - pin.x;
      let dy = pebble.y - pin.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 6) {
        // Only play sound if speed before bounce is above threshold
        let preSpeed = Math.sqrt(pebble.vx*pebble.vx + pebble.vy*pebble.vy);
        // Simple bounce with energy loss
        let nx = dx / (dist || 1);
        let ny = dy / (dist || 1);
        pebble.vx += nx * 0.8;
        pebble.vy += ny * 0.8;
        // Slow down the pebble to simulate energy loss
        pebble.vx *= 0.5;
        pebble.vy *= 0.5;
        if (preSpeed > MIN_SOUND_SPEED) {
          state.soundQueue.push({x: pebble.x, y: pebble.y, t: performance.now(), speed: preSpeed});
        }
      }
    }
    // Collide with other pebbles
    for (let j = i+1; j < state.pebbles.length; j++) {
      let other = state.pebbles[j];
      let dx = pebble.x - other.x;
      let dy = pebble.y - other.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < RADIUS*2 && dist > 0) {
        // Push them apart
        let overlap = RADIUS*2 - dist;
        let nx = dx / dist;
        let ny = dy / dist;
        pebble.x += nx * overlap/2;
        pebble.y += ny * overlap/2;
        other.x -= nx * overlap/2;
        other.y -= ny * overlap/2;
        // If both are nearly at rest, damp their velocities to zero
        let v1 = Math.sqrt(pebble.vx*pebble.vx + pebble.vy*pebble.vy);
        let v2 = Math.sqrt(other.vx*other.vx + other.vy*other.vy);
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
  // Play queued sounds
  if (state.soundQueue.length) {
    let now = performance.now();
    state.soundQueue = state.soundQueue.filter(s => {
      if (now - s.t < 30) return true;
      playSound(1, s.speed);
      return false;
    });
  }
  // Draw
  
  ctx.save();
  ctx.clearRect(0,0,width,height);
  ctx.translate((width-STICK_LENGTH)/2, (height-STICK_RADIUS*2)/2);
  ctx.save();
  ctx.translate(STICK_LENGTH/2, STICK_RADIUS);
  ctx.rotate(state.angle);
  ctx.translate(-STICK_LENGTH/2, -STICK_RADIUS);
  // Draw stick
  ctx.fillStyle = '#b97a57';
  ctx.fillRect(0, 0, STICK_LENGTH, STICK_RADIUS*2);
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
  ctx.strokeRect(0, 0, STICK_LENGTH, STICK_RADIUS*2);
  // Draw pins
  for (let pin of state.pins) {
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, 3, 0, 2*Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
  }
  // Draw pebbles
  for (let pebble of state.pebbles) {
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, 5, 0, 2*Math.PI);
    ctx.fillStyle = '#ccc';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}


export default {
  displayName,
  animate,
  onChangedAway
};
