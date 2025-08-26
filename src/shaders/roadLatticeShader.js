// roadLatticeShader.js
// Draws a lattice of two-lane roads with intersections, stop signs/lights, and cars following traffic rules.

const ROAD_COLOR = '#444';
const LANE_MARK_COLOR = '#fff';
const INTERSECTION_SIZE = 48;
const ROAD_WIDTH = 32;
const LANE_WIDTH = ROAD_WIDTH / 2;
const GRID_SIZE = 5; // 5x5 grid
const CAR_LENGTH = 18;
const CAR_WIDTH = 10;
const CAR_COLOR = '#2e8b57';
const STOP_SIGN_COLOR = '#c00';
const LIGHT_GREEN = '#0c0';
const LIGHT_RED = '#c00';
const LIGHT_YELLOW = '#cc0';

// Helper: random choice
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Intersection object
function makeIntersection(x, y) {
  if (Math.random() < 0.5) {
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
  return {
    road, lane, dir, pos,
    // direction will be set by caller
    speed: 2.5 + Math.random() * 25,
    stopped: false,
    waitTimer: 0,
    color: CAR_COLOR,
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
  for (let i = 0; i < 12; i++) {
    let dir = Math.random() < 0.5 ? 'h' : 'v';
    let road = dir === 'h' ? Math.floor(Math.random() * GRID_SIZE) : Math.floor(Math.random() * GRID_SIZE);
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
    } else {
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
      px = car.direction === 1 ? car.pos * w : (1 - car.pos) * w;
      angle = car.direction === 1 ? 0 : Math.PI;
    } else {
      // lane 0: left, lane 1: right
      px = (car.road + 1) * w / GRID_SIZE + (car.lane === 0 ? -LANE_WIDTH / 2 : LANE_WIDTH / 2);
      py = car.direction === 1 ? car.pos * h : (1 - car.pos) * h;
      angle = car.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
    }
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = car.color;
    ctx.fillRect(-CAR_LENGTH / 2, -CAR_WIDTH / 2, CAR_LENGTH, CAR_WIDTH);
    ctx.restore();
  }
}

function updateCars(dt, w, h) {
  // Track which cars are at which stop sign intersection
  // Each car gets a .waitingForStopQueue boolean and .stopQueueKey string
  for (let i = 0; i < state.cars.length; i++) {
    const car = state.cars[i];
    // Find if car is approaching an intersection
    let nextInter = null;
    let interDist = 1;
    let interKey = null;
    for (let j = 0; j < state.intersections.length; j++) {
      const inter = state.intersections[j];
      if (car.dir === 'h' && Math.abs((car.road + 1) - inter.y) < 0.2) {
        let interX = inter.x / GRID_SIZE;
        if ((car.direction === 1 && car.pos < interX && interX - car.pos < interDist) ||
            (car.direction === -1 && car.pos > interX && car.pos - interX < interDist)) {
          nextInter = inter;
          interDist = Math.abs(interX - car.pos);
          interKey = `h${inter.x},${inter.y}`;
        }
      } else if (car.dir === 'v' && Math.abs((car.road + 1) - inter.x) < 0.2) {
        let interY = inter.y / GRID_SIZE;
        if ((car.direction === 1 && car.pos < interY && interY - car.pos < interDist) ||
            (car.direction === -1 && car.pos > interY && car.pos - interY < interDist)) {
          nextInter = inter;
          interDist = Math.abs(interY - car.pos);
          interKey = `v${inter.x},${inter.y}`;
        }
      }
    }
    // Stopping logic
    let shouldStop = false;
    let atStopSign = false;
    // If car is in 'clearingIntersection' mode, ignore signals until clear
    if (car.clearingIntersection && nextInter && interDist < 0.04) {
      shouldStop = false;
    } else if (nextInter && interDist < 0.04) {
      if (nextInter.type === 'stopSign') {
        atStopSign = true;
        if (!car.waitingForStopQueue || car.stopQueueKey !== interKey) {
          car.waitingForStopQueue = true;
          car.stopQueueKey = interKey;
          if (!state.stopQueues.has(interKey)) state.stopQueues.set(interKey, []);
          const queue = state.stopQueues.get(interKey);
          if (!queue.includes(i)) queue.push(i);
        }
        const queue = state.stopQueues.get(interKey);
        if (queue[0] === i) {
          if (!car._stopWait) car._stopWait = 0;
          car._stopWait += dt;
          if (car._stopWait > 0.8 + Math.random() * 0.7) {
            shouldStop = false;
            // Enter clearingIntersection mode
            car.clearingIntersection = true;
            if (interDist < 0.01) {
              queue.shift();
              car.waitingForStopQueue = false;
              car.stopQueueKey = null;
              car._stopWait = 0;
            }
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
      }
    } else {
      car.waitingForStopQueue = false;
      car.stopQueueKey = null;
      car._stopWait = 0;
      car.clearingIntersection = false;
    }
    if (shouldStop) {
      car.stopped = true;
      car.waitTimer += dt;
    } else {
      car.stopped = false;
      car.waitTimer = 0;
    }
    // Move car
    if (!car.stopped) {
      let delta = (car.speed * dt) / (car.dir === 'h' ? w : h);
      car.pos += car.direction === 1 ? delta : -delta;
      // Check for intersection crossing and handle turns
      let crossed = false;
      if (car.dir === 'h') {
        if ((car.direction === 1 && car.pos >= 1) || (car.direction === -1 && car.pos <= 0)) crossed = true;
      } else {
        if ((car.direction === 1 && car.pos >= 1) || (car.direction === -1 && car.pos <= 0)) crossed = true;
      }
      if (crossed) {
        // At intersection: randomly decide to turn or go straight
        let turn = Math.random();
        if (turn < 0.25) { // Left turn
          if (car.dir === 'h') {
            car.dir = 'v';
            car.direction = car.direction === 1 ? -1 : 1; // h->v: right->up, left->down
            // Set road to intersection index
            car.road = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(car.pos * (GRID_SIZE - 1))));
            // Lane assignment for vertical
            car.lane = car.direction === -1 ? 1 : 0;
            car.pos = car.direction === 1 ? 0 : 1;
          } else {
            car.dir = 'h';
            car.direction = car.direction === 1 ? -1 : 1; // v->h: down->left, up->right
            car.road = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(car.pos * (GRID_SIZE - 1))));
            // Lane assignment for horizontal
            car.lane = car.direction === -1 ? 0 : 1;
            car.pos = car.direction === 1 ? 0 : 1;
          }
        } else if (turn < 0.5) { // Right turn
          if (car.dir === 'h') {
            car.dir = 'v';
            // Right turn keeps direction
            // h right->v down, h left->v up
            car.road = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(car.pos * (GRID_SIZE - 1))));
            car.lane = car.direction === 1 ? 0 : 1;
            car.pos = car.direction === 1 ? 0 : 1;
          } else {
            car.dir = 'h';
            car.road = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(car.pos * (GRID_SIZE - 1))));
            car.lane = car.direction === 1 ? 1 : 0;
            car.pos = car.direction === 1 ? 0 : 1;
          }
        } else { // Go straight
          if (car.pos > 1) car.pos = 0;
          if (car.pos < 0) car.pos = 1;
        }
      }
    }
  }
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
