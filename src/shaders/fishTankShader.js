import {
    WALL_WIDTH,
    SURFACE_HEIGHT,
    DAY_LENGTH_MS,
    TRANSITION_MS,
    NET_PROBABILITY,
    NET_SPEED
} from './fishtank/constants.js';
import { drawPlants, drawRocks, drawCaustics, drawBubbles, generateTankDecor } from './fishtank/tankEnvironment.js';
import { addFoodPelletUtil, drawFoodPellets } from './fishtank/foodPellets.js';
import { startNetEvent as startNetEventUtil, drawNetEvent } from './fishtank/netevent.js';
import { drawLilyPads, spawnLilyPads } from './fishtank/lilyPads.js';
import { speciesList } from './fishtank/species.js';
import { updateFishBehavior } from './fishtank/fishBehavior.js'

const displayName = 'Fish Tank';

// Encapsulated state object
const state = {
    fish: [],
    netEvent: null,
    eggs: [],
    bubbles: [],
    tankDecor: null,
    foodPellets: [],
    lilyPads: [],
    isNight: false,
    lastDayNightSwitch: 0,
    transitioning: false,
    transitionStart: 0,
    transitionFromNight: false
};

// Add a food pellet at (x, y)
function addFoodPellet(x, y) {
    addFoodPelletUtil(state.foodPellets, x, y);
    // 25% chance for each fish to switch to 'lookForFood' and target nearest pellet
    for (let f of state.fish) {
        if (Math.random() < 0.25 && state.foodPellets.some(p => !p.eaten)) {
            f.behavior = 'lookForFood';
            f.behaviorTimer = 60 + Math.random() * 1200;
            // Target nearest uneaten pellet
            let minDist = Infinity, targetPellet = null;
            for (let pellet of state.foodPellets) {
                if (pellet.eaten) continue;
                let dx = pellet.x - f.x;
                let dy = pellet.y - f.y;
                let dist = dx * dx + dy * dy;
                if (dist < minDist) {
                    minDist = dist;
                    targetPellet = pellet;
                }
            }
            if (targetPellet) {
                f.target = { x: targetPellet.x, y: targetPellet.y, pellet: targetPellet };
            }
        }
    }
}

// Handle click event to add food pellet or start net event
function onClick(e, { canvas, ctx, width, height }) {
    // Convert mouse event to canvas coordinates, accounting for pan/zoom
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    let rawX = (e.clientX - rect.left) * scaleX;
    let rawY = (e.clientY - rect.top) * scaleY;
    // Undo pan/zoom transform
    let x = (typeof window.viewZoom === 'number' ? (rawX - (window.viewOffsetX || 0)) / (window.viewZoom || 1) : rawX);
    let y = (typeof window.viewZoom === 'number' ? (rawY - (window.viewOffsetY || 0)) / (window.viewZoom || 1) : rawY);
    // Only add food or fish if inside tank (not on wall)
    if (x > WALL_WIDTH && x < width-WALL_WIDTH && y > WALL_WIDTH && y < height-WALL_WIDTH) {
        if (e.ctrlKey) {
            // Ctrl-click: start a net event
            if (!state.netEvent) {
                startNetEvent(width, height);
            }
        } else if (e.shiftKey) {
            // Add a fish at this location (random species)
            if (typeof resetFish === 'function') {
                let species = speciesList[Math.floor(Math.random()*speciesList.length)];
                state.fish.push({
                    x: x,
                    y: y,
                    vx: (Math.random()*0.5+0.3) * (Math.random()<0.5?-1:1),
                    vy: (Math.random()-0.5)*0.2,
                    size: species.size || (18+Math.random()*18),
                    color: species.color(),
                    flip: Math.random()<0.5,
                    behavior: 'float',
                    behaviorTimer: 60 + Math.random()*120,
                    target: null,
                    species: species
                });
            }
        } else {
            addFoodPellet(x, y);
        }
    }
}

function resetFish(width, height) {
    state.fish = [];
    const n = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
        let dir = Math.random() < 0.5 ? 1 : -1;
        let vx = (Math.random() * 0.5 + 0.3) * dir;
        let flip = Math.random() < 0.5;
        let behaviors = ['float', 'swim', 'explore', 'lookForFood', 'sleep'];
        let behavior = behaviors[Math.floor(Math.random() * (behaviors.length - 1))]; // don't start as sleep
        let species = speciesList[Math.floor(Math.random() * speciesList.length)];
        state.fish.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.7 + height * 0.15,
            vx: vx,
            vy: (Math.random() - 0.5) * 0.2,
            size: 18 + Math.random() * 18,
            color: species.color(),
            flip: flip,
            behavior: behavior,
            behaviorTimer: 60 + Math.random() * 120, // frames until next behavior
            target: null, // for explore/food
            species: species,
            sleeper: Math.random() < 0.6 // 60% of fish are sleepers
        });
    }
}

function resetBubbles(width, height) {
    state.bubbles = [];
    for (let i = 0; i < 12; i++) {
        state.bubbles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 3 + Math.random() * 4,
            vy: 0.5 + Math.random() * 0.7
        });
    }
}

// Start a new net event at a random position
function startNetEvent(width, height) {
    state.netEvent = startNetEventUtil(width, height);
}


function animate(ctx, t, width, height) {
    // At night, put all fish to sleep; during day, wake them up
    if (typeof state.isNight !== 'undefined') {
        for (let f of state.fish) {
            if (f.sleeper) {
                if (state.isNight && f.behavior !== 'sleep') {
                    f.behavior = 'sleep';
                    f.behaviorTimer = 999999; // stay asleep all night
                } else if (!state.isNight && f.behavior === 'sleep') {
                    // Wake up: pick a random behavior
                    let behaviors = ['float', 'swim', 'explore', 'lookForFood'];
                    let next = behaviors[Math.floor(Math.random() * behaviors.length)];
                    f.behavior = next;
                    f.behaviorTimer = 60 + Math.random() * 1200;
                }
            }
        }
    }
    // Day/Night cycle logic
    let now = performance.now();
    // Handle day/night switching and transition
    let transitionT = 0;
    if (!state.transitioning && now - state.lastDayNightSwitch > DAY_LENGTH_MS) {
        state.transitioning = true;
        state.transitionStart = now;
        state.transitionFromNight = state.isNight;
        state.lastDayNightSwitch = now;
    }
    if (state.transitioning) {
        transitionT = Math.min(1, (now - state.transitionStart) / TRANSITION_MS);
        if (transitionT >= 1) {
            state.isNight = !state.isNight;
            state.transitioning = false;
        }
    }
    ctx.save();
    // draw background first
    // Water background (inside tank)
    // Day and night gradient colors
    const dayTop = '#5ec6e6', dayBottom = '#0a2a3a';
    const nightTop = '#438da3ff', nightBottom = '#0a2a3a';
    let grad = ctx.createLinearGradient(0, 0, 0, height - WALL_WIDTH);
    if (state.transitioning) {
        // Crossfade between gradients
        let fromTop = state.transitionFromNight ? nightTop : dayTop;
        let fromBottom = state.transitionFromNight ? nightBottom : dayBottom;
        let toTop = state.transitionFromNight ? dayTop : nightTop;
        let toBottom = state.transitionFromNight ? dayBottom : nightBottom;
        // Interpolate colors
        function lerpColor(a, b, t) {
            // a, b: hex strings '#rrggbb'
            let ah = a.startsWith('#') ? a.slice(1) : a;
            let bh = b.startsWith('#') ? b.slice(1) : b;
            let ar = parseInt(ah.slice(0,2),16), ag = parseInt(ah.slice(2,4),16), ab = parseInt(ah.slice(4,6),16);
            let br = parseInt(bh.slice(0,2),16), bg = parseInt(bh.slice(2,4),16), bb = parseInt(bh.slice(4,6),16);
            let rr = Math.round(ar + (br-ar)*t);
            let rg = Math.round(ag + (bg-ag)*t);
            let rb = Math.round(ab + (bb-ab)*t);
            return `#${rr.toString(16).padStart(2,'0')}${rg.toString(16).padStart(2,'0')}${rb.toString(16).padStart(2,'0')}`;
        }
        grad.addColorStop(0, lerpColor(fromTop, toTop, transitionT));
        grad.addColorStop(1, lerpColor(fromBottom, toBottom, transitionT));
    } else if (state.isNight) {
        grad.addColorStop(0, nightTop);
        grad.addColorStop(1, nightBottom);
    } else {
        grad.addColorStop(0, dayTop);
        grad.addColorStop(1, dayBottom);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(WALL_WIDTH, 0, width - 2 * WALL_WIDTH, height - WALL_WIDTH);
    // Lily pad spawning logic
    state.lilyPads = spawnLilyPads(state.lilyPads, width, WALL_WIDTH);

    let surfaceH = 50;
    // Fill above the highest wavy line with black
    let highestY = 10; // yBase of first wavy line
    let waveTop = [];
    for (let x = WALL_WIDTH; x <= width - WALL_WIDTH; x += 1) {
        let y = highestY + Math.sin((x/32) + t*0.8) * 3.5 + Math.cos((x/18) - t*0.5) * 1.2;
        waveTop.push({x, y});
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(WALL_WIDTH, 0);
    for (let i = 0; i < waveTop.length; i++) {
        ctx.lineTo(waveTop[i].x, Math.max(0, waveTop[i].y));
    }
    ctx.lineTo(width - WALL_WIDTH, 0);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Shimmering highlight gradient
    let surfGrad = ctx.createLinearGradient(0, 0, 0, surfaceH);
    surfGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
    surfGrad.addColorStop(0.25, 'rgba(180,220,255,0.13)');
    surfGrad.addColorStop(0.7, 'rgba(120,180,255,0.08)');
    surfGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = surfGrad;
    ctx.fillRect(WALL_WIDTH, 0, width-2*WALL_WIDTH, surfaceH);

    // Wavy caustic lines for surface shimmer
    ctx.save();
    ctx.beginPath();
    let waveCount = 4;
    for (let w = 0; w < waveCount; w++) {
        let yBase = 10 + w*10;
        ctx.moveTo(WALL_WIDTH, yBase);
        for (let x = WALL_WIDTH; x <= width-WALL_WIDTH; x += 4) {
            let y = yBase + Math.sin((x/32) + t*0.8 + w*1.2) * (3.5 + w*1.2) + Math.cos((x/18) - t*0.5 + w*0.7) * 1.2;
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.7;
    ctx.shadowColor = '#b8e0f8';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // Draw tank floor decorations (static, cached)
    if (!state.tankDecor) {
        state.tankDecor = generateTankDecor(width, height, WALL_WIDTH);
    }
    // --- Continuous gravel surface (band, static) ---
    for (let gb of state.tankDecor.gravelBand) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(gb.x, gb.y, gb.rx, gb.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = gb.color;
        ctx.globalAlpha = gb.alpha;
        ctx.fill();
        ctx.restore();
    }
    // --- Individual gravel ---
    for (let g of state.tankDecor.gravel) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.globalAlpha = g.alpha;
        ctx.fill();
        ctx.restore();
    }
    // Plants
    drawPlants(ctx, state.tankDecor.plants, t);
    // Rocks
    drawRocks(ctx, state.tankDecor.rocks);
    state.foodPellets = state.foodPellets.filter(p => !p.eaten);
    // Draw and update food pellets
    drawFoodPellets(ctx, state.foodPellets, t, SURFACE_HEIGHT);
    // Caustics
    drawCaustics(ctx, width, height, t);
    // Bubbles
    drawBubbles(ctx, state.bubbles, t, width, height);
    // Fish
    // Clamp fish to new bounds if canvas size changed
    if (ctx._fishW !== width || ctx._fishH !== height) {
        const minX = WALL_WIDTH;
        const maxX = width - WALL_WIDTH;
        const minY = WALL_WIDTH;
        const maxY = height - WALL_WIDTH;
        for (let f of state.fish) {
            f.x = Math.max(minX, Math.min(maxX, f.x));
            f.y = Math.max(minY, Math.min(maxY, f.y));
        }
        ctx._fishW = width;
        ctx._fishH = height;
    }
    if (!state.fish.length) {
        resetFish(width, height);
        resetBubbles(width, height);
    }
    // Track indices of fish to remove (eaten)
    let fishToRemove = new Set();
    updateFishBehavior(state.fish, fishToRemove, state.eggs, state.foodPellets, width, height, ctx, t);

    // Remove eaten fish (except sturgeons)
    if (fishToRemove.size > 0) {
        state.fish = state.fish.filter((f, idx) => !fishToRemove.has(idx));
    }

    // Rare random event: cartoon net on a pole swings in from the top
    if (!state.netEvent && Math.random() < NET_PROBABILITY) {
        startNetEvent(width, height);
    }
    if (state.netEvent) {
        drawNetEvent(ctx, state.netEvent, state.fish, NET_SPEED);
        // End event after swing
        if (state.netEvent.t >= 1000) {
            state.netEvent = null;
        }
        // Remove fish 1000ms after being scooped
        const now = performance.now();
        state.fish = state.fish.filter(f => !(f.scoopedByNet && f.scoopedTime && now - f.scoopedTime > 1000));
    }

    // Draw lily pads (float at top)
    drawLilyPads(ctx, state.lilyPads, t);

    // Draw tank walls
    ctx.save();
    ctx.fillStyle = '#b8e0f8';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, 0, WALL_WIDTH, height); // left
    ctx.fillRect(width - WALL_WIDTH, 0, WALL_WIDTH, height); // right
    // ctx.fillRect(0,0,width,WALL_WIDTH); // top (removed)
    ctx.fillRect(0, height - WALL_WIDTH, width, WALL_WIDTH); // bottom
    ctx.restore();
}

function onResize({ canvas, ctx, width, height }) {
    console.log('onResize')
    state.tankDecor = null;
}


export default {
    displayName,
    animate,
    onClick,
    onResize
};
