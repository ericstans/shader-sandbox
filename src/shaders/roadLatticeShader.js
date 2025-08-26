// roadLatticeShader.js
// Draws a lattice of two-lane roads with intersections, stop signs/lights, and cars following traffic rules.

const ROAD_COLOR = '#444';
const LANE_MARK_COLOR = '#fff';
const INTERSECTION_SIZE = 48;
const ROAD_WIDTH = 50;
const LANE_WIDTH = ROAD_WIDTH / 2;
const GRID_SIZE = 10; // 5x5 grid
const NUM_CARS = 10;
const CAR_LENGTH = 24;
const CAR_WIDTH = 12;
const CAR_COLOR = '#2e8b57';
const STOP_SIGN_COLOR = '#c00';
const LIGHT_GREEN = '#0c0';
const LIGHT_RED = '#c00';
const LIGHT_YELLOW = '#cc0';
const STOP_SIGNS_ENABLED = false;
// Helper: random choice
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Intersection object
function makeIntersection(x, y) {
  const r = Math.random();
  if (r < 0.33) {
    // Empty intersection
    return {
      x, y,
      type: 'empty',
    };
  } else if (STOP_SIGNS_ENABLED && r < 0.66) {
    // Four-way stop sign
    return {
      x, y,
      type: 'stopSign',
    };
  } else {
    // Stop light: two groups (NS and EW), each with its own state/timer
    return {
      x, y,
      type: 'stopLight',
      lightNS: { state: 'green', timer: 0 },
      lightEW: { state: 'red', timer: 0 },
    };
  }
}

// Car object
function makeCar(road, lane, dir, pos) {
  // dir: 'h' or 'v', direction: 1 (right/down) or -1 (left/up) -- direction must be passed in
  const maxSpeed = 10 + Math.random() * 25;
  // Generate a random color for the car
  const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 45%)`;
  return {
    road, lane, dir, pos,
    // direction will be set by caller
    speed: 0, // start at 0, accelerate up
    maxSpeed,
    targetSpeed: maxSpeed,
    stopped: false,
    waitTimer: 0,
    color,
    accelerating: false,
    turnSignal: null, // 'left', 'right', or null
    turnSignalTimer: 0,
    nextTurn: null, // 'left', 'right', 'straight', or null
    nextTurnSignal: null, // 'left', 'right', or null
    halfwayTurnSet: false, // true if halfway decision made for this intersection
  };
}

const state = {
  intersections: [],
  cars: [],
  t: 0,
  lastInit: 0,
  stopQueues: new Map(), // Map key: intersection id, value: array of car ids (indices)
};

function resetState(width, height) {
  state.stopQueues = new Map();
  // Place intersections in a grid
  state.intersections = [];
  for (let gx = 1; gx < GRID_SIZE; gx++) {
    for (let gy = 1; gy < GRID_SIZE; gy++) {
      state.intersections.push(makeIntersection(gx, gy));
    }
  }
  // Place cars on random roads
  state.cars = [];
  for (let i = 0; i < NUM_CARS; i++) {
    let dir = Math.random() < 0.5 ? 'h' : 'v';
    // Only use road indices 1 to GRID_SIZE-2 (inclusive)
    let road = 1 + Math.floor(Math.random() * (GRID_SIZE - 2));
    let direction = Math.random() < 0.5 ? 1 : -1;
    let lane;
    if (dir === 'v') {
      // Up uses right lane (1), down uses left lane (0)
      lane = direction === -1 ? 1 : 0;
    } else {
      // Left uses top lane (0), right uses bottom lane (1)
      lane = direction === -1 ? 0 : 1;
    }
    let pos = Math.random();
    // Pass direction to makeCar
    let car = makeCar(road, lane, dir, pos);
    car.direction = direction;
    state.cars.push(car);
  }
  state.t = 0;
  state.lastInit = Date.now();
}

function drawRoads(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = ROAD_COLOR;
  ctx.lineWidth = ROAD_WIDTH;
  // Draw horizontal roads
  for (let y = 1; y < GRID_SIZE; y++) {
    let py = y * h / GRID_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
  }
  // Draw vertical roads
  for (let x = 1; x < GRID_SIZE; x++) {
    let px = x * w / GRID_SIZE;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
  }
  ctx.restore();
  // Lane markings
  ctx.save();
  ctx.strokeStyle = LANE_MARK_COLOR;
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  // Horizontal
  for (let y = 1; y < GRID_SIZE; y++) {
    let py = y * h / GRID_SIZE - LANE_WIDTH / 2;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
    py = y * h / GRID_SIZE + LANE_WIDTH / 2;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
  }
  // Vertical
  for (let x = 1; x < GRID_SIZE; x++) {
    let px = x * w / GRID_SIZE - LANE_WIDTH / 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
    px = x * w / GRID_SIZE + LANE_WIDTH / 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawIntersections(ctx, w, h) {
  for (const inter of state.intersections) {
    if (inter.type === 'empty') continue;
    let px = inter.x * w / GRID_SIZE;
    let py = inter.y * h / GRID_SIZE;
    ctx.save();
    if (inter.type === 'stopSign') {
      // Draw four stop signs, one for each approach
      const offsets = [
        { dx: 0, dy: -18, rot: 0 }, // North
        { dx: 18, dy: 0, rot: Math.PI / 2 }, // East
        { dx: 0, dy: 18, rot: Math.PI }, // South
        { dx: -18, dy: 0, rot: -Math.PI / 2 }, // West
      ];
      for (const o of offsets) {
        ctx.save();
        ctx.translate(px + o.dx, py + o.dy);
        ctx.rotate(Math.PI / 8 + o.rot);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          let angle = (i / 8) * Math.PI * 2;
          let r = 13;
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = STOP_SIGN_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Draw post
        ctx.rotate(-Math.PI / 8);
        ctx.beginPath();
        ctx.moveTo(0, 13);
        ctx.lineTo(0, 28);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    } else if (inter.type === 'stopLight') {
      // Each direction gets its own color/state
      const offsets = [
        { dx: 0, dy: -18, rot: 0, dir: 'NS' }, // North
        { dx: 18, dy: 0, rot: Math.PI / 2, dir: 'EW' }, // East
        { dx: 0, dy: 18, rot: Math.PI, dir: 'NS' }, // South
        { dx: -18, dy: 0, rot: -Math.PI / 2, dir: 'EW' }, // West
      ];
      for (const o of offsets) {
        let state = o.dir === 'NS' ? inter.lightNS.state : inter.lightEW.state;
        let color = state === 'green' ? LIGHT_GREEN : (state === 'yellow' ? LIGHT_YELLOW : LIGHT_RED);
        ctx.save();
        ctx.translate(px + o.dx, py + o.dy);
        ctx.rotate(o.rot);
        // Draw light housing
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        // Draw light
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }
}

function drawCars(ctx, w, h, dt) {
  for (const car of state.cars) {
    // Compute car position
    let px, py, angle;
    if (car.dir === 'h') {
      // lane 0: top, lane 1: bottom
      py = (car.road + 1) * h / GRID_SIZE + (car.lane === 0 ? -LANE_WIDTH / 2 : LANE_WIDTH / 2);
      px = car.pos * w;
      angle = car.direction === 1 ? 0 : Math.PI;
    } else {
      // lane 0: left, lane 1: right
      px = (car.road + 1) * w / GRID_SIZE + (car.lane === 0 ? -LANE_WIDTH / 2 : LANE_WIDTH / 2);
      py = car.pos * h;
      angle = car.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
    }
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = car.color;
    ctx.fillRect(-CAR_LENGTH / 2, -CAR_WIDTH / 2, CAR_LENGTH, CAR_WIDTH);
    // Draw turn signal if active (blink every 0.2s)
    if (car.turnSignal) {
    let blink = Math.floor((state.t * 5) % 2) === 0;
    if (blink) {
        ctx.fillStyle = '#ff0';
        let x = 0, y = 0;
        if (car.turnSignal === 'left') {
        x = -CAR_LENGTH / 2 + 2;
        y = -CAR_WIDTH / 2 - 2;
        } else if (car.turnSignal === 'right') {
        x = -CAR_LENGTH / 2 + 2;
        y = CAR_WIDTH / 2 + 2;
        }
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    }
    ctx.restore();
  }
}

function updateCars(dt, w, h) {
  // Track which cars are at which stop sign intersection
  // Each car gets a .waitingForStopQueue boolean and .stopQueueKey string
  // --- Begin: Car queueing and collision avoidance ---
  // For each car, find the nearest car ahead in the same lane/road/dir
  const SAFE_DISTANCE = (CAR_LENGTH + 6) / (w > h ? w : h); // in normalized units
  for (let i = 0; i < state.cars.length; i++) {
    const car = state.cars[i];
    // Find if car is approaching an intersection
    let nextInter = null;
    let interDist = 1;
    let interKey = null;
    let interCenter = null;
    for (let j = 0; j < state.intersections.length; j++) {
      const inter = state.intersections[j];
      if (car.dir === 'h' && Math.abs((car.road + 1) - inter.y) < 0.2) {
        let interX = inter.x / GRID_SIZE;
        if ((car.direction === 1 && car.pos < interX && interX - car.pos < interDist) ||
            (car.direction === -1 && car.pos > interX && car.pos - interX < interDist)) {
          nextInter = inter;
          interDist = Math.abs(interX - car.pos);
          interKey = `h${inter.x},${inter.y}`;
          interCenter = interX;
        }
      } else if (car.dir === 'v' && Math.abs((car.road + 1) - inter.x) < 0.2) {
        let interY = inter.y / GRID_SIZE;
        if ((car.direction === 1 && car.pos < interY && interY - car.pos < interDist) ||
            (car.direction === -1 && car.pos > interY && car.pos - interY < interDist)) {
          nextInter = inter;
          interDist = Math.abs(interY - car.pos);
          interKey = `v${inter.x},${inter.y}`;
          interCenter = interY;
        }
      }
    }

    // --- Halfway to intersection: decide next turn and set turn signal ---
    if (nextInter && interDist < 0.5 && !car.halfwayTurnSet) {
      // Only set halfwayTurnSet if not already set for this intersection
      // Decide next turn: left, right, or straight
      let turnRand = Math.random();
      if (turnRand < 0.25) {
        car.nextTurn = 'left';
        car.nextTurnSignal = 'left';
      } else if (turnRand < 0.5) {
        car.nextTurn = 'right';
        car.nextTurnSignal = 'right';
      } else {
        car.nextTurn = 'straight';
        car.nextTurnSignal = null;
      }
      car.turnSignal = car.nextTurnSignal;
      car.turnSignalTimer = 999; // stays on until intersection
      car.halfwayTurnSet = true;
    }
    // Reset halfwayTurnSet when not approaching any intersection
    if (!nextInter || interDist > 0.5) {
      car.halfwayTurnSet = false;
      car.nextTurn = null;
      car.nextTurnSignal = null;
      car.turnSignal = null;
      car.turnSignalTimer = 0;
    }

    // --- Find nearest car ahead in same lane/road/dir ---
    let nearestDist = 1.1;
    let carAhead = null;
    for (let j = 0; j < state.cars.length; j++) {
      if (i === j) continue;
      const other = state.cars[j];
      if (other.dir !== car.dir || other.road !== car.road || other.lane !== car.lane || other.direction !== car.direction) continue;
      // Compute normalized distance ahead (wrap around)
      let d = (other.pos - car.pos) * car.direction;
      if (d <= 0) d += 1; // wrap
      if (d < nearestDist) {
        nearestDist = d;
        carAhead = other;
      }
    }

    // Stopping logic
    let shouldStop = false;
    let atStopSign = false;
    let stopPos = null;
    // If car is in 'clearingIntersection' mode, ignore signals until clear
    if (car.clearingIntersection && nextInter && interDist < 0.04) {
      shouldStop = false;
      // After clearing intersection, reset stop wait
      if (interDist < 0.01) {
        car._stopWait = 0;
        car.clearingIntersection = false;
      }
    } else if (nextInter && interDist < 0.04) {
      if (nextInter.type === 'stopSign') {
        atStopSign = true;
        let interPos = (car.dir === 'h') ? nextInter.x / GRID_SIZE : nextInter.y / GRID_SIZE;
        if (!car._stopWait) car._stopWait = 0;
        if (Math.abs(car.pos - interPos) < SAFE_DISTANCE * 0.5) {
          car._stopWait += dt;
          if (car._stopWait > 0.8 + Math.random() * 0.7) {
            shouldStop = false;
            car.clearingIntersection = true;
          } else {
            shouldStop = true;
          }
        } else {
          shouldStop = true;
        }
      } else if (nextInter.type === 'stopLight') {
        let group = (car.dir === 'h') ? nextInter.lightEW : nextInter.lightNS;
        if (group.state !== 'green') {
          shouldStop = true;
        }
        if (!shouldStop) {
          car.clearingIntersection = true;
        }
        car.waitingForStopQueue = false;
        car.stopQueueKey = null;
        car._stopWait = 0;
      } else if (nextInter.type === 'empty') {
        // No stop or light, just proceed
        shouldStop = false;
      }
    } else {
      // Reset all stop-related state when not at an intersection
      car.waitingForStopQueue = false;
      car.stopQueueKey = null;
      car._stopWait = 0;
      car.clearingIntersection = false;
    }

    // --- Collision avoidance: if car ahead is too close, stop or slow down ---
    let collisionStop = false;
    let targetSpeed = car.maxSpeed;
    if (carAhead && nearestDist < SAFE_DISTANCE * 1.1) {
      // If car ahead is stopped, stop; else, slow down
      if (carAhead.stopped) {
        collisionStop = true;
        targetSpeed = 0;
      } else {
        // Slow down proportionally
        targetSpeed = Math.max(4, car.maxSpeed * (nearestDist / (SAFE_DISTANCE * 1.1)));
      }
    }

    if (shouldStop || collisionStop) {
      car.stopped = true;
      car.waitTimer += dt;
      car.accelerating = false;
      car.targetSpeed = 0;
    } else {
      car.stopped = false;
      car.waitTimer = 0;
      // If just started moving, begin acceleration
      if (car.speed < car.maxSpeed - 0.1) {
        car.accelerating = true;
        car.targetSpeed = targetSpeed;
      } else {
        car.accelerating = false;
        car.targetSpeed = targetSpeed;
      }
    }

    // Smooth acceleration
    if (car.accelerating && car.targetSpeed > car.speed) {
      car.speed += 30 * dt; // acceleration rate (units/sec^2)
      if (car.speed > car.targetSpeed) car.speed = car.targetSpeed;
    } else if (car.speed > car.targetSpeed) {
      car.speed -= 60 * dt; // decelerate quickly if needed
      if (car.speed < car.targetSpeed) car.speed = car.targetSpeed;
    } else {
      car.speed = car.targetSpeed;
    }

    // Move car
    if (!car.stopped) {
      let delta = (car.speed * dt) / (car.dir === 'h' ? w : h);
      car.pos += car.direction === 1 ? delta : -delta;
      // Turn logic: trigger when car is near the center of an intersection, only once per crossing
      if (!car._hasTurned) {
        // Find if car is near the center of any intersection
        let intersectionCenters = [];
        let intersectionObjs = [];
        for (let j = 0; j < state.intersections.length; j++) {
          const inter = state.intersections[j];
          if (car.dir === 'h' && Math.abs((car.road + 1) - inter.y) < 0.2) {
            intersectionCenters.push(inter.x / GRID_SIZE);
            intersectionObjs.push(inter);
          } else if (car.dir === 'v' && Math.abs((car.road + 1) - inter.x) < 0.2) {
            intersectionCenters.push(inter.y / GRID_SIZE);
            intersectionObjs.push(inter);
          }
        }
        for (let idx = 0; idx < intersectionCenters.length; idx++) {
          let c = intersectionCenters[idx];
          if (Math.abs(car.pos - c) < 0.03) {
            // At intersection center: use pre-decided nextTurn
            let intersectionIdx = Math.round(c * (GRID_SIZE - 1));
            if (car.nextTurn === 'left') {
              if (car.dir === 'h') {
                let newRoad = intersectionIdx;
                if (newRoad > 0 && newRoad < GRID_SIZE - 1) {
                  car.dir = 'v';
                  car.direction = car.direction === 1 ? -1 : 1;
                  car.road = newRoad;
                  car.lane = car.direction === -1 ? 1 : 0;
                  car.pos = intersectionObjs[idx].y / GRID_SIZE;
                  car._hasTurned = true;
                }
              } else {
                let newRoad = intersectionIdx;
                if (newRoad > 0 && newRoad < GRID_SIZE - 1) {
                  car.dir = 'h';
                  car.direction = car.direction === 1 ? -1 : 1;
                  car.road = newRoad;
                  car.lane = car.direction === -1 ? 0 : 1;
                  car.pos = intersectionObjs[idx].x / GRID_SIZE;
                  car._hasTurned = true;
                }
              }
            } else if (car.nextTurn === 'right') {
              if (car.dir === 'h') {
                let newRoad = intersectionIdx;
                if (newRoad > 0 && newRoad < GRID_SIZE - 1) {
                  car.dir = 'v';
                  car.road = newRoad;
                  car.lane = car.direction === 1 ? 0 : 1;
                  car.pos = intersectionObjs[idx].y / GRID_SIZE;
                  car._hasTurned = true;
                }
              } else {
                let newRoad = intersectionIdx;
                if (newRoad > 0 && newRoad < GRID_SIZE - 1) {
                  car.dir = 'h';
                  car.road = newRoad;
                  car.lane = car.direction === 1 ? 1 : 0;
                  car.pos = intersectionObjs[idx].x / GRID_SIZE;
                  car._hasTurned = true;
                }
              }
            } else {
              // Go straight: do nothing special, just mark as turned
              car._hasTurned = true;
            }
            // Turn signal off after intersection
            car.turnSignal = null;
            car.turnSignalTimer = 0;
            car.nextTurn = null;
            car.nextTurnSignal = null;
            break;
          }
        }
      }
      // Reset _hasTurned when car is far from all intersection centers
      let farFromAll = true;
      for (let j = 0; j < state.intersections.length; j++) {
        const inter = state.intersections[j];
        let c = (car.dir === 'h') ? inter.x / GRID_SIZE : inter.y / GRID_SIZE;
        if (Math.abs(car.pos - c) < 0.05) {
          farFromAll = false;
          break;
        }
      }
      if (farFromAll) car._hasTurned = false;
      // Wrap position if needed
      if (car.direction === 1 && car.pos > 1) car.pos = 0;
      if (car.direction === -1 && car.pos < 0) car.pos = 1;
    }
    // Turn signal timer logic (for blinking, not for auto-off)
    // (No longer used for auto-off, but kept for blinking)
  }
  // --- End: Car queueing and collision avoidance ---
}

function updateIntersections(dt) {
  for (const inter of state.intersections) {
    if (inter.type === 'stopLight') {
      // North/South group
      inter.lightNS.timer += dt;
      if (inter.lightNS.state === 'green' && inter.lightNS.timer > 7.0) {
        inter.lightNS.state = 'yellow';
        inter.lightNS.timer = 0;
      } else if (inter.lightNS.state === 'yellow' && inter.lightNS.timer > 1.5) {
        inter.lightNS.state = 'red';
        inter.lightNS.timer = 0;
        inter.lightEW.state = 'green';
        inter.lightEW.timer = 0;
      }
      // East/West group
      inter.lightEW.timer += dt;
      if (inter.lightEW.state === 'green' && inter.lightEW.timer > 7.0) {
        inter.lightEW.state = 'yellow';
        inter.lightEW.timer = 0;
      } else if (inter.lightEW.state === 'yellow' && inter.lightEW.timer > 1.5) {
        inter.lightEW.state = 'red';
        inter.lightEW.timer = 0;
        inter.lightNS.state = 'green';
        inter.lightNS.timer = 0;
      }
    }
  }
}

function animate(ctx, t, width, height) {
  if (!state.lastInit || Date.now() - state.lastInit > 1000 * 60) {
    resetState(width, height);
  }
  let dt = 0.016;
  state.t += dt;
  ctx.clearRect(0, 0, width, height);
  drawRoads(ctx, width, height);
  drawIntersections(ctx, width, height);
  updateCars(dt, width, height);
  updateIntersections(dt);
  drawCars(ctx, width, height, dt);
}

export default {
  displayName: 'Road Lattice',
  resetState,
  animate,
  onResize: (opts) => resetState(opts.width, opts.height),
};
