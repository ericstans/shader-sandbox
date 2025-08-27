import {
    WALL_WIDTH,
    SURFACE_HEIGHT,
    EGG_LAYING_PROBABILITY,
    FISH_SHOW_BEHAVIOR_LABELS,
    DAY_LENGTH_MS,
    TRANSITION_MS,
    NET_PROBABILITY,
    NET_SPEED,
    MAX_LILY_PADS,
    LILY_PAD_SPAWN_CHANCE
} from './fishtank/constants.js';
import { drawPlants, drawRocks, drawCaustics, drawBubbles, generateTankDecor } from './fishtank/tankEnvironment.js';
import { addFoodPelletUtil, drawFoodPellets } from './fishtank/foodPellets.js';
import { startNetEvent as startNetEventUtil, drawNetEvent } from './fishtank/netevent.js';
import { drawLilyPads, spawnLilyPads } from './fishtank/lilyPads.js';
import { speciesList } from './fishtank/species.js';
import { layEggs, updateAndDrawEggs } from './fishtank/eggs.js';

const displayName = 'Fish Tank';
// Day/Night cycle state

let fish = [];
let netEvent = null;
let eggs = [];
let bubbles = [];
let tankDecor = null;
let foodPellets = [];
let lilyPads = [];
let isNight = false;
let lastDayNightSwitch = 0;
let transitioning = false;
let transitionStart = 0;
let transitionFromNight = false;

// Add a food pellet at (x, y)
function addFoodPellet(x, y) {
    addFoodPelletUtil(foodPellets, x, y);
    // 25% chance for each fish to switch to 'lookForFood' and target nearest pellet
    for (let f of fish) {
        if (Math.random() < 0.25 && foodPellets.some(p => !p.eaten)) {
            f.behavior = 'lookForFood';
            f.behaviorTimer = 60 + Math.random() * 1200;
            // Target nearest uneaten pellet
            let minDist = Infinity, targetPellet = null;
            for (let pellet of foodPellets) {
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
            if (!netEvent) {
                startNetEvent(width, height);
            }
        } else if (e.shiftKey) {
            // Add a fish at this location (random species)
            if (typeof resetFish === 'function') {
                let species = speciesList[Math.floor(Math.random()*speciesList.length)];
                fish.push({
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
    fish = [];
    const n = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
        let dir = Math.random() < 0.5 ? 1 : -1;
        let vx = (Math.random() * 0.5 + 0.3) * dir;
        let flip = Math.random() < 0.5;
        let behaviors = ['float', 'swim', 'explore', 'lookForFood', 'sleep'];
        let behavior = behaviors[Math.floor(Math.random() * (behaviors.length - 1))]; // don't start as sleep
        let species = speciesList[Math.floor(Math.random() * speciesList.length)];
        fish.push({
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
    bubbles = [];
    for (let i = 0; i < 12; i++) {
        bubbles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 3 + Math.random() * 4,
            vy: 0.5 + Math.random() * 0.7
        });
    }
}

// Start a new net event at a random position
function startNetEvent(width, height) {
    netEvent = startNetEventUtil(width, height);
}

function drawFish(ctx, f, t) {
    ctx.save();
    ctx.translate(f.x, f.y);

    // Draw behavior label BEFORE flipping, so text is always readable
    if (typeof FISH_SHOW_BEHAVIOR_LABELS !== 'undefined' && FISH_SHOW_BEHAVIOR_LABELS && f.behavior) {
        ctx.save();
        ctx.font = `${Math.max(12, Math.round(f.size * 1.2))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // Draw background for readability
        const label = f.behavior;
        const padY = f.size * f.species.body.ry + 6;
        const metrics = ctx.measureText(label);
        const bgW = metrics.width + 10;
        const bgH = Math.max(18, Math.round(f.size * 1.2));
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#222';
        ctx.fillRect(-bgW/2, -padY - bgH + 2, bgW, bgH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.fillText(label, 0, -padY);
        ctx.restore();
    }

    if (f.flip) ctx.scale(-1, 1);
    ctx.rotate(Math.sin(t * 0.7 + f.x * 0.01 + f.y * 0.01) * 0.1);
    // --- Draw tail by species ---
    ctx.beginPath();
    let tailLen = f.size * (f.species.tail.len);
    let tailHeight = f.size * (f.species.tail.height);
    if (f.species.tail.style === 'sturgeon') {
        // Sturgeon: long, pointed, slightly forked tail
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.lineTo(-f.size * f.species.body.rx - f.size * f.species.tail.len * 1.1, -tailHeight * 0.7);
        ctx.lineTo(-f.size * f.species.body.rx - f.size * f.species.tail.len * 1.3, 0);
        ctx.lineTo(-f.size * f.species.body.rx - f.size * f.species.tail.len * 1.1, tailHeight * 0.7);
        ctx.closePath();
    } else if (f.species.tail.style === 'fan') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, -tailHeight);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, tailHeight);
        ctx.closePath();
    } else if (f.species.tail.style === 'fork') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, -tailHeight * 0.7);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen * 0.7, 0);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, tailHeight * 0.7);
        ctx.closePath();
    } else if (f.species.tail.style === 'veil') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.bezierCurveTo(-f.size * f.species.body.rx - tailLen * 0.7, -tailHeight * 1.2, -f.size * f.species.body.rx - tailLen * 1.1, tailHeight * 1.2, -f.size * f.species.body.rx - tailLen, 0);
        ctx.closePath();
    } else if (f.species.tail.style === 'triangle') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, -tailHeight);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, tailHeight);
        ctx.closePath();
    }
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    // --- Draw body by species ---
    ctx.beginPath();
    ctx.ellipse(0, 0, f.size * f.species.body.rx, f.size * f.species.body.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();

    // Clown Loach stripes (drawn over body, clipped to body shape)
    if (f.species.name === 'Clown Loach' && f.species.hasStripes) {
        ctx.save();
        // Clip to body ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size * f.species.body.rx, f.size * f.species.body.ry, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = '#222';
        // 3 vertical bands, slightly angled, spaced along the body
        let bandAngles = [0.18, 0.08, -0.12];
        let bandOffsets = [-0.45, 0, 0.38];
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(bandAngles[i]);
            ctx.beginPath();
            ctx.ellipse(f.size * bandOffsets[i], 0, f.size * 0.11, f.size * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    // --- Draw spikes for Sturgeon ---
    if (f.species.name === 'Sturgeon') {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#e0f8d0';
        ctx.fillStyle = '#e0f8d0';
        let nSpikes = 7;
        let bodyLen = f.size * f.species.body.rx * 1.8;
        let bodyTopY = -f.size * f.species.body.ry;
        for (let i = 1; i < nSpikes - 3; i++) {
            let frac = i / (nSpikes - 1);
            let spikeX = -f.size * f.species.body.rx + frac * bodyLen;
            let spikeY = bodyTopY + 5;
            let spikeH = f.size * 0.22 + Math.sin(t * 0.5 + i) * f.size * 0.03;
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(spikeX, spikeY - spikeH);
            ctx.lineTo(spikeX + f.size * 0.08, spikeY - spikeH * 0.7);
            ctx.lineTo(spikeX - f.size * 0.08, spikeY - spikeH * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
    // --- Optional stripe for Neon Tetra ---
    if (f.species.stripe) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size * f.species.body.rx * 0.9, f.size * f.species.body.ry * 0.35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = f.size * 0.09;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();
    }
    // --- Eye ---
    if (f.species.whiskers) {
        // Draw whiskers (barbels) near mouth
        ctx.save();
        ctx.strokeStyle = '#b98c4a';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.7;
        for (let w = -1; w <= 1; w += 2) {
            ctx.beginPath();
            ctx.moveTo(f.size * 0.9, f.size * 0.13 * w);
            ctx.quadraticCurveTo(f.size * 1.1, f.size * 0.18 * w, f.size * 1.18, f.size * 0.22 * w);
            ctx.stroke();
        }
        ctx.restore();
    }
    if (f.species.bigEye) {
        // Huge eyeball, centered
        ctx.beginPath();
        ctx.arc(f.size * 0.18, 0, f.size * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = f.species.eye || '#fff';
        ctx.globalAlpha = 0.97;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.size * 0.18, 0, f.size * 0.11, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.globalAlpha = 1;
        ctx.fill();
        // Add a little highlight
        ctx.beginPath();
        ctx.arc(f.size * 0.22, -f.size * 0.06, f.size * 0.04, 0, Math.PI * 2);
        ctx.fillStyle = '#fff8';
        ctx.globalAlpha = 1;
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(f.size * 0.32, -f.size * 0.08, f.size * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = f.species.eye || '#fff';
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.size * 0.36, -f.size * 0.08, f.size * 0.04, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.globalAlpha = 1;
        ctx.fill();
    }
    ctx.restore();
}

function animate(ctx, t, width, height) {
    // At night, put all fish to sleep; during day, wake them up
    if (typeof isNight !== 'undefined') {
        for (let f of fish) {
            if (f.sleeper) {
                if (isNight && f.behavior !== 'sleep') {
                    f.behavior = 'sleep';
                    f.behaviorTimer = 999999; // stay asleep all night
                } else if (!isNight && f.behavior === 'sleep') {
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
    if (!transitioning && now - lastDayNightSwitch > DAY_LENGTH_MS) {
        transitioning = true;
        transitionStart = now;
        transitionFromNight = isNight;
        lastDayNightSwitch = now;
    }
    if (transitioning) {
        transitionT = Math.min(1, (now - transitionStart) / TRANSITION_MS);
        if (transitionT >= 1) {
            isNight = !isNight;
            transitioning = false;
        }
    }
    ctx.save();
    // draw background first
    // Water background (inside tank)
    // Day and night gradient colors
    const dayTop = '#5ec6e6', dayBottom = '#0a2a3a';
    const nightTop = '#438da3ff', nightBottom = '#0a2a3a';
    let grad = ctx.createLinearGradient(0, 0, 0, height - WALL_WIDTH);
    if (transitioning) {
        // Crossfade between gradients
        let fromTop = transitionFromNight ? nightTop : dayTop;
        let fromBottom = transitionFromNight ? nightBottom : dayBottom;
        let toTop = transitionFromNight ? dayTop : nightTop;
        let toBottom = transitionFromNight ? dayBottom : nightBottom;
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
    } else if (isNight) {
        grad.addColorStop(0, nightTop);
        grad.addColorStop(1, nightBottom);
    } else {
        grad.addColorStop(0, dayTop);
        grad.addColorStop(1, dayBottom);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(WALL_WIDTH, 0, width - 2 * WALL_WIDTH, height - WALL_WIDTH);
    // Lily pad spawning logic
    lilyPads = spawnLilyPads(lilyPads, width, WALL_WIDTH);

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
    if (!tankDecor) {
        tankDecor = generateTankDecor(width, height, WALL_WIDTH);
    }
    // --- Continuous gravel surface (band, static) ---
    for (let gb of tankDecor.gravelBand) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(gb.x, gb.y, gb.rx, gb.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = gb.color;
        ctx.globalAlpha = gb.alpha;
        ctx.fill();
        ctx.restore();
    }
    // --- Individual gravel ---
    for (let g of tankDecor.gravel) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.globalAlpha = g.alpha;
        ctx.fill();
        ctx.restore();
    }
    // Plants
    drawPlants(ctx, tankDecor.plants, t);
    // Rocks
    drawRocks(ctx, tankDecor.rocks);
    foodPellets = foodPellets.filter(p => !p.eaten);
    // Draw and update food pellets
    drawFoodPellets(ctx, foodPellets, t, SURFACE_HEIGHT);
    // Caustics
    drawCaustics(ctx, width, height, t);
    // Bubbles
    drawBubbles(ctx, bubbles, t, width, height);
    // Fish
    // Clamp fish to new bounds if canvas size changed
    if (ctx._fishW !== width || ctx._fishH !== height) {
        const minX = WALL_WIDTH;
        const maxX = width - WALL_WIDTH;
        const minY = WALL_WIDTH;
        const maxY = height - WALL_WIDTH;
        for (let f of fish) {
            f.x = Math.max(minX, Math.min(maxX, f.x));
            f.y = Math.max(minY, Math.min(maxY, f.y));
        }
        ctx._fishW = width;
        ctx._fishH = height;
    }
    if (!fish.length) {
        resetFish(width, height);
        resetBubbles(width, height);
    }
    // Track indices of fish to remove (eaten)
    let fishToRemove = new Set();
    for (let i = 0; i < fish.length; i++) {
        let f = fish[i];
        // If in lookForFood mode and has a pellet target, update target position to follow pellet
        if (f.behavior === 'lookForFood' && f.target && f.target.pellet && !f.target.pellet.eaten) {
            f.target.x = f.target.pellet.x;
            f.target.y = f.target.pellet.y;
        }

        // Sturgeon predation: eat other fish they encounter
        if (f.species && f.species.name === 'Sturgeon' && f.behavior === 'lookForFood') {
            let ateFish = false;
            for (let j = 0; j < fish.length; j++) {
                if (i === j) continue;
                let prey = fish[j];
                // Don't eat other sturgeons or already eaten fish
                if (prey.species && prey.species.name === 'Sturgeon') continue;
                if (fishToRemove.has(j)) continue;
                // Only eat if close enough and sturgeon is bigger
                let dx = f.x - prey.x;
                let dy = f.y - prey.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let eatRadius = Math.max(f.size * 0.7, 32);
                if (dist < eatRadius && f.size > prey.size * 0.7) {
                    fishToRemove.add(j);
                    ateFish = true;
                }
            }
            if (ateFish) {
                f.behavior = 'float';
                f.behaviorTimer = 60 + Math.random() * 120;
                f.target = null;
            }
        }
        // Behavior timer
        f.behaviorTimer--;
        if (f.behaviorTimer <= 0) {
            // Rare chance: lay eggs (unless 1000 or more fish)
            if (fish.length < 1000 && Math.random() < EGG_LAYING_PROBABILITY) {
                let isEyeball = f.species && f.species.name === 'Eyeball Fish';
                let isSturgeon = f.species && f.species.name === 'Sturgeon';
                let numEggs;
                if (isEyeball) {
                    numEggs = 18 + Math.floor(Math.random() * 10);
                } else if (isSturgeon) {
                    numEggs = 1 + Math.floor(Math.random() * 2);
                } else {
                    numEggs = 2 + Math.floor(Math.random() * 4);
                }
                layEggs(eggs, f, numEggs);
            }
            // Pick a new behavior
            let behaviors = ['float', 'swim', 'explore', 'lookForFood'];
            let next = behaviors[Math.floor(Math.random() * behaviors.length)];
            f.behaviorTimer--;
            // If in lookForFood, stay in that behavior as long as there are uneaten pellets
            if (f.behavior === 'lookForFood') {
                if (!foodPellets.some(p => !p.eaten)) {
                    // No more food, switch to another behavior
                    let behaviors = ['float', 'swim', 'explore'];
                    let next = behaviors[Math.floor(Math.random() * behaviors.length)];
                    f.behavior = next;
                    f.behaviorTimer = 60 + Math.random() * 1200;
                } else {
                    // Stay in lookForFood until a pellet is eaten
                    f.behaviorTimer = 30; // keep resetting timer to prevent random change
                }
            } else if (f.behaviorTimer <= 0) {
                // Pick a new behavior
                let canEatPellets = foodPellets.some(p => !p.eaten);
                let isSturgeon = f.species && f.species.name === 'Sturgeon';
                let canEatFish = isSturgeon && fish.some(other => other !== f && other.species && other.species.name !== 'Sturgeon');
                let behaviors = ['float', 'swim', 'explore'];
                if ((canEatPellets) || canEatFish) {
                    behaviors.push('lookForFood');
                }
                let next = behaviors[Math.floor(Math.random() * behaviors.length)];
                f.behavior = next;
                if (next === 'lookForFood') {
                    if (canEatPellets) {
                        // Target nearest pellet
                        let nearest = null, minDist = 1e9;
                        for (let pellet of foodPellets) {
                            if (pellet.eaten) continue;
                            let dx = pellet.x - f.x, dy = pellet.y - f.y;
                            let dist = dx*dx + dy*dy;
                            if (dist < minDist) { minDist = dist; nearest = pellet; }
                        }
                        if (nearest) f.target = { pellet: nearest };
                    } else if (canEatFish) {
                        // Sturgeon: target nearest non-sturgeon fish
                        let nearest = null, minDist = 1e9;
                        for (let other of fish) {
                            if (other === f) continue;
                            if (!other.species || other.species.name === 'Sturgeon') continue;
                            let dx = other.x - f.x, dy = other.y - f.y;
                            let dist = dx*dx + dy*dy;
                            if (dist < minDist) { minDist = dist; nearest = other; }
                        }
                        if (nearest) f.target = { fish: nearest };
                    }
                }
                if (next === 'float') {
                    f.behaviorTimer = 30 + Math.random() * 1200;
                } else {
                    f.behaviorTimer = 60 + Math.random() * 1200;
                }
                // fallback to random target if not lookForFood
                if (next === 'explore') {
                    // Pick a random target in tank
                    // use imported WALL_WIDTH
                    f.target = {
                        x: WALL_WIDTH + f.size * 0.7 + Math.random() * (width - 2 * WALL_WIDTH - f.size * 1.4),
                        y: WALL_WIDTH + f.size * 0.5 + Math.random() * (height - 2 * WALL_WIDTH - f.size)
                    };
                } else if (next !== 'lookForFood') {
                    f.target = null;
                }
            }
        }
    // Draw and update eggs
    updateAndDrawEggs(ctx, eggs, t, width, height, WALL_WIDTH, fish);
        // Behavior logic
        let vx = f.vx, vy = f.vy;
        if (f.behavior === 'sleep') {
            vx = 0;
            vy = 0;
        } else if (f.behavior === 'float') {
            vx = 0.05 * (Math.random() - 0.5);
            vy = 0.05 * (Math.random() - 0.5);
        } else if (f.behavior === 'swim') {
            // Swim back and forth
            vx = (Math.abs(f.vx) + 0.1) * (f.flip ? -1 : 1);
            vy = 0.1 * Math.sin(t * 0.1 + f.x * 0.01);
        } else if (f.behavior === 'explore' && f.target) {
            // Move toward target with deadzone
            let dx = f.target.x - f.x;
            let dy = f.target.y - f.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let deadzone = 6; // pixels
            if (dist > deadzone) {
                vx = 0.7 * dx / dist;
                vy = 0.4 * dy / dist;
                f.flip = vx < 0;
            } else {
                vx = 0; vy = 0;
            }
        } else if (f.behavior === 'lookForFood' && f.target) {
            // Move toward target pellet, slower, with more jitter, and deadzone
            let dx = f.target.x - f.x;
            let dy = f.target.y - f.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let eatRadius = (f.size * 0.7) + (f.target.pellet ? f.target.pellet.r : 6) + 8; // larger eat radius
            let deadzone = 6; // pixels
            if (dist > Math.max(eatRadius, deadzone)) {
                vx = 0.3 * dx / dist + 0.08 * (Math.random() - 0.5);
                vy = 0.2 * dy / dist + 0.08 * (Math.random() - 0.5);
                f.flip = vx < 0;
            } else {
                vx = 0; vy = 0;
                // If close to pellet, mark as eaten
                if (f.target.pellet && !f.target.pellet.eaten) {
                    f.target.pellet.eaten = true;
                }
            }
        }
        // Swim backwards = moving in direction of tail
        let swimmingBackwards = (vx > 0 && f.flip) || (vx < 0 && !f.flip);
        if (swimmingBackwards) vx *= 0.25;
        f.x += vx;
        f.y += vy + (f.behavior === 'sleep' ? 0 : Math.sin(t * 0.08 + f.x * 0.01) * 0.2);
        drawFish(ctx, f, t);
        // Prevent fish from leaving tank (bounce off tank walls)
        const minX = WALL_WIDTH + f.size * 0.7;
        const maxX = width - WALL_WIDTH - f.size * 0.7;
        const minY = WALL_WIDTH + f.size * 0.5;
        const maxY = height - WALL_WIDTH - f.size * 0.5;
        if (f.x < minX) { f.x = minX; f.vx = Math.abs(f.vx); f.flip = false; }
        if (f.x > maxX) { f.x = maxX; f.vx = -Math.abs(f.vx); f.flip = true; }
        if (f.y < minY) { f.y = minY; f.vy = Math.abs(f.vy); }
        if (f.y > maxY) { f.y = maxY; f.vy = -Math.abs(f.vy); }
    }

    // Remove eaten fish (except sturgeons)
    if (fishToRemove.size > 0) {
        fish = fish.filter((f, idx) => !fishToRemove.has(idx));
    }

    // Rare random event: cartoon net on a pole swings in from the top
    if (!netEvent && Math.random() < NET_PROBABILITY) {
        startNetEvent(width, height);
    }
    if (netEvent) {
        drawNetEvent(ctx, netEvent, fish, NET_SPEED);
        // End event after swing
        if (netEvent.t >= 1000) {
            netEvent = null;
        }
        // Remove fish 1000ms after being scooped
        const now = performance.now();
        fish = fish.filter(f => !(f.scoopedByNet && f.scoopedTime && now - f.scoopedTime > 1000));
    }

    // Draw lily pads (float at top)
    drawLilyPads(ctx, lilyPads, t);

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
    tankDecor = null;
}


export default {
    displayName,
    animate,
    onClick,
    onResize
};
