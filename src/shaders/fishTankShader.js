const displayName = 'Fish Tank';
// Day/Night cycle state

const WALL_WIDTH = 10;
const SURFACE_HEIGHT = 10;
const DAY_LENGTH_MS = 18000; // 18 seconds day, 18 seconds night
const TRANSITION_MS = 1000; // 1 second transition
const EGG_LAYING_PROBABILITY = 1 / 150;
const NET_PROBABILITY = 1 / 5000;
const NET_SPEED = 1 / 30000
const MAX_LILY_PADS = 8;
const LILY_PAD_SPAWN_CHANCE = 1 / 3000; // chance per frame

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

// Start a new net event at a random position
function startNetEvent(width, height) {
    let pivotX = Math.random() * (width * 0.7) + width * 0.15;
    let netRadius = 60 + Math.random() * 40;
    let pivotY = -height * 0.5 - 60;
    // Ensure pole (minus the net diameter) is long enough to reach the top of the canvas
    // The pole must reach from pivotY to y=0, minus the net's diameter (2*netRadius)
    let minPoleLen = Math.abs(pivotY) - 2 * netRadius;
    minPoleLen = Math.max(minPoleLen, 0); // Clamp to non-negative
    let poleLen = minPoleLen + Math.random() * (height * 0.5);
    let netAngleStart = 0;
    let netAngleEnd = 180;
    let swingDir = Math.random() < 0.5 ? 1 : -1;
    netEvent = {
        pivotX,
        pivotY,
        poleLen,
        netRadius,
        t: 0,
        swingDir,
        netAngleStart,
        netAngleEnd,
        scooped: false
    };
}

// Add a food pellet at (x, y)
// Generate static decorations for the tank floor
function generateTankDecor(width, height, WALL_WIDTH) {
    // Generate static decorations for the tank floor
    // --- Continuous gravel band (static, cached) ---
    let gravelBand = [];
    let gravelBandY = height - WALL_WIDTH - 10;
    let bandHeight = 18 * 2;
    let bandCount = Math.floor((width - 2 * WALL_WIDTH) / 7);
    for (let i = 0; i < bandCount; i++) {
        let gx = WALL_WIDTH + 3 + i * 7 + Math.random() * 2;
        let gy = gravelBandY + Math.random() * bandHeight;
        gy = Math.min(gy, height - WALL_WIDTH - 2); // Clamp to bottom
        let gr = (3.5 + Math.random() * 2.5) * 2;
        gravelBand.push({
            x: gx,
            y: gy,
            rx: gr,
            ry: gr * (0.7 + Math.random() * 0.3),
            color: `hsl(${35 + Math.random() * 30},${40 + Math.random() * 30}%,${60 + Math.random() * 20}%)`,
            alpha: 0.38 + Math.random() * 0.18
        });
    }
    // Individual gravel
    let gravel = [];
    for (let i = 0; i < 60; i++) {
        let gy = height - WALL_WIDTH - 8 - Math.random() * 8 * 2;
        gy = Math.min(gy, height - WALL_WIDTH - 2); // Clamp to bottom
        gravel.push({
            x: 20 + Math.random() * (width - 40),
            y: gy,
            r: (2.2 + Math.random() * 1.8) * 2,
            color: `hsl(${35 + Math.random() * 30},${40 + Math.random() * 30}%,${60 + Math.random() * 20}%)`,
            alpha: 0.45 + Math.random() * 0.25
        });
    }
    let rocks = [];
    for (let i = 0; i < 5; i++) {
        let ry = height - WALL_WIDTH - 12 - Math.random() * 10 * 2;
        ry = Math.min(ry, height - WALL_WIDTH - 2); // Clamp to bottom
        rocks.push({
            x: 30 + Math.random() * (width - 60),
            y: ry,
            rx: (12 + Math.random() * 10) * 2,
            ry: (7 + Math.random() * 6) * 2,
            rot: Math.random() * Math.PI,
            color: `hsl(${180 + Math.random() * 60},${10 + Math.random() * 20}%,${30 + Math.random() * 20}%)`,
            alpha: 0.7
        });
    }
    let plants = [];
    for (let i = 0; i < (5 + Math.random() * 10); i++) {
        let baseY = height - WALL_WIDTH - 10;
        baseY = Math.min(baseY, height - WALL_WIDTH - 2); // Clamp to bottom
        plants.push({
            x: 25 + Math.random() * (width - 50),
            baseY: baseY,
            h: (28 + Math.random() * 200) * 2,
            color: `hsl(${90 + Math.random() * 60},${40 + Math.random() * 40}%,${30 + Math.random() * 30}%)`,
            lw: (2 + Math.random() * 3) * 2
        });
    }
    return { gravelBand, gravel, rocks, plants };
}

function addFoodPellet(x, y) {
    foodPellets.push({
        x,
        y,
        r: 5 + Math.random() * 3,
        vy: - 0.35 + Math.random() * 0.18, // floating speed
        eaten: false
    });
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
                // Use the same speciesList as in resetFish
                const speciesList = [
                    {
                        name: 'Eyeball Fish',
                        body: { rx: 0.5, ry: 0.5 },
                        tail: { len: 0.18, height: 0.18, style: 'fan' },
                        color: () => `hsl(320,90%,65%)`,
                        eye: '#fff',
                        bigEye: true
                    },
                    {
                        name: 'Clown Loach',
                        body: { rx: 1.1, ry: 0.28 },
                        tail: { len: 0.32, height: 0.18, style: 'fork' },
                        color: () => `hsl(32,90%,55%)`,
                        eye: '#222',
                        size: 28 + Math.random()*10,
                        hasStripes: true,
                        whiskers: true
                    },
                    {
                        name: 'Sturgeon',
                        body: { rx: 1.3, ry: 0.22 },
                        tail: { len: 0.7, height: 0.18, style: 'sturgeon' },
                        color: () => `hsl(${110+Math.random()*20},60%,32%)`,
                        eye: '#fff',
                        size: 44 + Math.random()*12
                    },
                    {
                        name: 'Goldfish',
                        body: { rx: 0.7, ry: 0.32 },
                        tail: { len: 0.38, height: 0.28, style: 'fan' },
                        color: () => `hsl(${35+Math.random()*20},90%,60%)`,
                        eye: '#fff',
                    },
                    {
                        name: 'Neon Tetra',
                        body: { rx: 0.9, ry: 0.18 },
                        tail: { len: 0.22, height: 0.12, style: 'fork' },
                        color: () => `hsl(200,80%,60%)`,
                        stripe: true,
                        eye: '#fff',
                    },
                    {
                        name: 'Betta',
                        body: { rx: 0.7, ry: 0.32 },
                        tail: { len: 0.7, height: 0.5, style: 'veil' },
                        color: () => `hsl(${300+Math.random()*60},70%,60%)`,
                        eye: '#fff',
                    },
                    {
                        name: 'Corydoras',
                        body: { rx: 0.6, ry: 0.28 },
                        tail: { len: 0.28, height: 0.18, style: 'fan' },
                        color: () => `hsl(${90+Math.random()*40},40%,60%)`,
                        eye: '#fff',
                    },
                    {
                        name: 'Guppy',
                        body: { rx: 0.5, ry: 0.22 },
                        tail: { len: 0.5, height: 0.32, style: 'triangle' },
                        color: () => `hsl(${Math.floor(Math.random()*360)},80%,65%)`,
                        eye: '#fff',
                    },
                ];
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
    // Define fish species
    const speciesList = [
        {
            name: 'Eyeball Fish',
            body: { rx: 0.5, ry: 0.5 }, // circular
            tail: { len: 0.18, height: 0.18, style: 'fan' },
            color: () => `hsl(320,90%,65%)`, // hot pink
            eye: '#fff',
            bigEye: true
        },
        {
            name: 'Clown Loach',
            body: { rx: 1.1, ry: 0.28 }, // long, slightly arched
            tail: { len: 0.32, height: 0.18, style: 'fork' },
            color: () => `hsl(32,90%,55%)`, // bright orange
            eye: '#222',
            size: 28 + Math.random()*10,
            hasStripes: true,
            whiskers: true
        },
        {
            name: 'Sturgeon',
            body: { rx: 1.3, ry: 0.22 }, // long, slender
            tail: { len: 0.7, height: 0.18, style: 'sturgeon' },
            color: () => `hsl(${110 + Math.random() * 20},60%,32%)`, // deep green
            eye: '#fff',
            size: 44 + Math.random() * 12 // much larger
        },
        {
            name: 'Goldfish',
            body: { rx: 0.7, ry: 0.32 },
            tail: { len: 0.38, height: 0.28, style: 'fan' },
            color: () => `hsl(${35 + Math.random() * 20},90%,60%)`,
            eye: '#fff',
        },
        {
            name: 'Neon Tetra',
            body: { rx: 0.9, ry: 0.18 },
            tail: { len: 0.22, height: 0.12, style: 'fork' },
            color: () => `hsl(200,80%,60%)`,
            stripe: true,
            eye: '#fff',
        },
        {
            name: 'Betta',
            body: { rx: 0.7, ry: 0.32 },
            tail: { len: 0.7, height: 0.5, style: 'veil' },
            color: () => `hsl(${300 + Math.random() * 60},70%,60%)`,
            eye: '#fff',
        },
        {
            name: 'Corydoras',
            body: { rx: 0.6, ry: 0.28 },
            tail: { len: 0.28, height: 0.18, style: 'fan' },
            color: () => `hsl(${90 + Math.random() * 40},40%,60%)`,
            eye: '#fff',
        },
        {
            name: 'Guppy',
            body: { rx: 0.5, ry: 0.22 },
            tail: { len: 0.5, height: 0.32, style: 'triangle' },
            color: () => `hsl(${Math.floor(Math.random() * 360)},80%,65%)`,
            eye: '#fff',
        },
    ];
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

function drawFish(ctx, f, t) {
    ctx.save();
    ctx.translate(f.x, f.y);
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

function drawCaustics(ctx, width, height, t) {
    ctx.save();
    ctx.globalAlpha = 0.13;
    for (let i = 0; i < 18; i++) {
        let phase = t * 0.12 + i * 0.7;
        let amp = 18 + Math.sin(phase * 1.2 + i) * 8;
        let y = (height / 18) * i + Math.sin(phase) * 8;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 4) {
            let yoff = Math.sin(phase + x * 0.03 + Math.sin(x * 0.01 + phase) * 0.7) * amp * 0.08;
            ctx.lineTo(x, y + yoff);
        }
        ctx.strokeStyle = `rgba(180,220,255,0.18)`;
        ctx.lineWidth = 2.2 + Math.sin(phase * 1.3) * 0.7;
        ctx.stroke();
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
    // Water surface effect (top 50px)
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
    if (lilyPads.length < MAX_LILY_PADS && Math.random() < LILY_PAD_SPAWN_CHANCE) {
        // Spawn a lily pad at a random X, floating at the top, with drop-in animation
        const WALL_WIDTH = 10;
        let padW = 38 + Math.random() * 22;
        let padH = padW * (0.7 + Math.random() * 0.2);
        let padX = WALL_WIDTH + padW / 2 + Math.random() * (width - 2 * WALL_WIDTH - padW);
        let padY = WALL_WIDTH + padH / 2 + Math.random() * 8;
        let rot = Math.random() * Math.PI * 0.2 - 0.4;
        let color = 'hsl(' + (90 + Math.random() * 30) + ', 60%, 38%)';
        let skew = Math.random() * 0.2 - 0.1;
        let veinBaseAngle = Math.random() * Math.PI * 2;
        // 20% chance for a bug, 10% for a flower, mutually exclusive
        let hasBug = Math.random() < 0.2;
        let hasFlower = !hasBug && Math.random() < 0.1;
        let bugType = hasBug ? (Math.random() < 0.5 ? 'ladybug' : 'bee') : null;
        // Drop-in animation: start above, animate to padY
        let appearTime = performance.now();
        let startY = padY - 60 - Math.random() * 40;
        lilyPads.push({ x: padX, y: padY, w: padW, h: padH, rot, color, skew, veinBaseAngle, hasBug, hasFlower, bugType, appearTime, startY, animating: true });
    }

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

    // Rare random event: cartoon net on a pole swings in from the top
    if (!netEvent && Math.random() < NET_PROBABILITY) {
        startNetEvent(width, height);
    }
    if (netEvent) {
        // Animate net swinging down
        netEvent.t++;
        let swingT = Math.min(1, netEvent.t * NET_SPEED);
        let angle = netEvent.netAngleStart + (netEvent.netAngleEnd - netEvent.netAngleStart) * swingT * netEvent.swingDir;
        // Net position at end of pole
        let netX = netEvent.pivotX + Math.cos(angle) * netEvent.poleLen;
        let netY = netEvent.pivotY + Math.sin(angle) * netEvent.poleLen;
        // Draw pole
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#a88';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(netEvent.pivotX, netEvent.pivotY);
        ctx.lineTo(netX, netY);
        ctx.stroke();
        // Draw net hoop
        ctx.save();
        ctx.translate(netX, netY);
        ctx.rotate(angle + Math.PI / 2);
        ctx.strokeStyle = '#b8b8b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, netEvent.netRadius, netEvent.netRadius * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Draw net mesh
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            let meshAngle = (Math.PI * 2 / 8) * i;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(meshAngle) * netEvent.netRadius, Math.sin(meshAngle) * netEvent.netRadius * 0.85);
        }
        ctx.strokeStyle = '#b8b8b8';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        ctx.restore();

        // Mark fish inside net ellipse as scooped and attach to net, but do not remove from fish array
        const now = performance.now();
        for (let f of fish) {
            if (f.scoopedByNet) {
                // Already scooped, update position to follow net
                f.x = netX + (Math.random() - 0.5) * netEvent.netRadius * 0.7;
                f.y = netY + (Math.random() - 0.5) * netEvent.netRadius * 1.5;
                // If not already set, mark the time scooped
                if (!f.scoopedTime) f.scoopedTime = now;
                continue;
            }
            // Transform fish position into net's local ellipse space
            let dx = f.x - netX;
            let dy = f.y - netY;
            let localX = Math.cos(-angle - Math.PI / 2) * dx - Math.sin(-angle - Math.PI / 2) * dy;
            let localY = Math.sin(-angle - Math.PI / 2) * dx + Math.cos(-angle - Math.PI / 2) * dy;
            // Ellipse: (x/a)^2 + (y/b)^2 < 1
            let a = netEvent.netRadius;
            let b = netEvent.netRadius * 2;
            let inNet = (localX * localX) / (a * a) + (localY * localY) / (b * b) < 1;
            if (inNet) {
                f.scoopedByNet = true;
                f.scoopedTime = now;
                f.x = netX + (Math.random() - 0.5) * netEvent.netRadius * 0.7;
                f.y = netY + (Math.random() - 0.5) * netEvent.netRadius * 1.5;
            }
        }
        // End event after swing
        if (netEvent.t >= 1000) {
            netEvent = null;
        }

        // Remove fish 1000ms after being scooped
        fish = fish.filter(f => !(f.scoopedByNet && f.scoopedTime && now - f.scoopedTime > 1000));
    }

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
    for (let p of tankDecor.plants) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p.x, p.baseY);
        // Make plant movement more noticeable: increase amplitude and frequency
        let sway = Math.sin(t * 1.3 + p.x * 0.06) * 5;
        ctx.bezierCurveTo(p.x + sway, p.baseY - p.h * 0.3, p.x - sway * 0.5, p.baseY - p.h * 0.7, p.x + sway * 0.2, p.baseY - p.h);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lw;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();
    }
    if (!fish.length) {
        resetFish(width, height);
        resetBubbles(width, height);
    }
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
    // Rocks
    for (let r of tankDecor.rocks) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.rx, r.ry, r.rot, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.globalAlpha = r.alpha;
        ctx.shadowColor = '#222';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
    }
    foodPellets = foodPellets.filter(p => !p.eaten);
    // Draw and update food pellets
    if (foodPellets.length > 0) console.log('foodPellets:', foodPellets.length);
    for (let pellet of foodPellets) {
        if (pellet.eaten) continue;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, pellet.r, 0, Math.PI * 2);
        ctx.fillStyle = '#c49a6c';
        ctx.shadowColor = '#7a5a2b';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
        // Pellet floats up
        pellet.y += pellet.vy;
        // Stop at surface below top of tank
        const stopY = SURFACE_HEIGHT + 10 + pellet.r;
        if (pellet.y < stopY) {
            pellet.y = stopY;
            pellet.vy = 0;
        }
    }
    // Caustics
    drawCaustics(ctx, width, height, t);
    // Bubbles
    for (let b of bubbles) {
        ctx.save();
        ctx.globalAlpha = 0.18 + Math.sin(t * 0.7 + b.x * 0.01 + b.y * 0.01) * 0.12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
        b.y -= b.vy;
        if (b.y < -b.r) {
            b.x = Math.random() * width;
            b.y = height + b.r + Math.random() * 20;
            b.r = 3 + Math.random() * 4;
            b.vy = 0.5 + Math.random() * 0.7;
        }
    }
    // Fish
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
                }
            }
        }
        // Behavior timer
        f.behaviorTimer--;
        if (f.behaviorTimer <= 0) {
            // Rare chance: lay eggs (unless 50 or more fish)
            if (fish.length < 1000 && Math.random() < EGG_LAYING_PROBABILITY) {
                // If Eyeball Fish, lay way more eggs
                let isEyeball = f.species && f.species.name === 'Eyeball Fish';
                let numEggs = isEyeball ? (18 + Math.floor(Math.random() * 10)) : (2 + Math.floor(Math.random() * 4));
                for (let i = 0; i < numEggs; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = 10 + Math.random() * 18;
                    // Add a small outward velocity proportional to distance
                    let spreadV = 0.12 + Math.random() * 0.18;
                    eggs.push({
                        x: f.x + Math.cos(angle) * dist,
                        y: f.y + Math.sin(angle) * dist,
                        vx: Math.cos(angle) * (0.7 + spreadV * dist / 18) + (Math.random() - 0.5) * 0.5,
                        vy: Math.sin(angle) * (0.7 + spreadV * dist / 18) + (Math.random() - 0.5) * 0.5,
                        r: 4 + Math.random() * 2,
                        hatchTimer: 1000 + Math.random() * 6000,
                        species: f.species
                    });
                }
            }
            // Pick a new behavior
            let behaviors = ['float', 'swim', 'explore', 'lookForFood'];
            let next = behaviors[Math.floor(Math.random() * behaviors.length)];
            f.behavior = next;
            // Enforce at least 30 frames for 'explore' mode
            if (next === 'explore') {
                f.behaviorTimer = 30 + Math.random() * 1200;
            } else {
                f.behaviorTimer = 60 + Math.random() * 1200;
            }
            if (next === 'lookForFood' && foodPellets.some(p => !p.eaten)) {
                // Target the nearest uneaten food pellet
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
                } else {
                    // fallback to random target
                    const WALL_WIDTH = 10;
                    f.target = {
                        x: WALL_WIDTH + f.size * 0.7 + Math.random() * (width - 2 * WALL_WIDTH - f.size * 1.4),
                        y: WALL_WIDTH + f.size * 0.5 + Math.random() * (height - 2 * WALL_WIDTH - f.size)
                    };
                }
            } else if (next === 'explore') {
                // Pick a random target in tank
                const WALL_WIDTH = 10;
                f.target = {
                    x: WALL_WIDTH + f.size * 0.7 + Math.random() * (width - 2 * WALL_WIDTH - f.size * 1.4),
                    y: WALL_WIDTH + f.size * 0.5 + Math.random() * (height - 2 * WALL_WIDTH - f.size)
                };
            } else {
                f.target = null;
            }
        }
        // Draw and update eggs
        for (let i = eggs.length - 1; i >= 0; i--) {
            let egg = eggs[i];
            // Draw egg
            ctx.save();
            ctx.beginPath();
            ctx.arc(egg.x, egg.y, egg.r, 0, Math.PI * 2);
            ctx.fillStyle = egg.species ? egg.species.color() : '#fff';
            ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 0.2 + egg.x * 0.01);
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
            // Animate egg
            egg.x += egg.vx;
            egg.y += egg.vy;
            egg.vx *= 0.96;
            egg.vy *= 0.96;
            // Gravity (sink to bottom)
            const WALL_WIDTH = 10;
            const bottom = height - WALL_WIDTH - egg.r;
            if (egg.y > bottom) { egg.y = bottom; egg.vy *= -0.3; }
            // Hatch timer
            egg.hatchTimer--;
            if (egg.hatchTimer <= 0) {
                // Hatch: add new fish of same species
                fish.push({
                    x: egg.x,
                    y: egg.y,
                    vx: (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? -1 : 1),
                    vy: (Math.random() - 0.5) * 0.2,
                    size: 18 + Math.random() * 18,
                    color: egg.species.color(),
                    flip: Math.random() < 0.5,
                    behavior: 'float',
                    behaviorTimer: 60 + Math.random() * 120,
                    target: null,
                    species: egg.species
                });
                eggs.splice(i, 1);
            }
        }
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

    // Draw lily pads (float at top)
    for (let pad of lilyPads) {
        ctx.save();
        // Animate floating left/right
        let floatX = pad.x + Math.sin(t * 0.22 + pad.x * 0.013) * 18;
        // Drop-in animation: animate y from startY to pad.y over 0.7s with ease-out bounce
        let dropDuration = 700; // ms
        let now = performance.now();
        let dropT = 1;
        if (pad.animating && pad.appearTime) {
            dropT = Math.min(1, (now - pad.appearTime) / dropDuration);
            // Ease-out bounce
            let easeT = dropT < 1 ? (1 - Math.pow(1 - dropT, 2.5)) : 1;
            let bounce = dropT < 1 ? Math.abs(Math.sin(Math.PI * easeT * 2.2) * (1 - easeT) * 8) : 0;
            var drawY = pad.startY + (pad.y - pad.startY) * easeT + bounce;
            if (dropT >= 1) pad.animating = false;
        } else {
            var drawY = pad.y;
        }
        ctx.translate(floatX, drawY);
        // Perspective skew: compress Y, skew X by a small amount
        ctx.transform(1, 0, pad.skew, 0.65, 0, 0); // [a, b, c, d, e, f]
        ctx.rotate(pad.rot + Math.sin(t * 0.1 + pad.x * 0.01) * 0.08);
        // Radial gradient for shading/highlight
        let grad = ctx.createRadialGradient(0, 0, pad.w * 0.1, 0, 0, pad.w);
        grad.addColorStop(0, 'rgba(255,255,255,0.18)');
        grad.addColorStop(0.5, pad.color);
        grad.addColorStop(1, 'rgba(40,80,30,0.7)');
        ctx.beginPath();
        ctx.ellipse(0, 0, pad.w, pad.h, 0, 0, Math.PI * 2);
        // Notch
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, pad.w, -Math.PI / 8, Math.PI / 8, false);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.82;
        ctx.shadowColor = '#1a3a1a';
        ctx.shadowBlur = 8;
        ctx.fill();

        // Draw veins: subtle curved lines from center to edge, with random group direction
        ctx.save();
        // Apply the same skew and scale as the pad body
        ctx.transform(1, 0, pad.skew, 0.65, 0, 0);
        ctx.rotate(pad.veinBaseAngle || 0);
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = '#eaf7d0';
        ctx.lineWidth = 1.1;
        let nVeins = 5 + Math.floor(pad.w / 12);
        for (let i = 0; i < nVeins; i++) {
            let angle = -Math.PI / 7 + (i / (nVeins - 1)) * (Math.PI / 3.5);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Main control point: fixed for all veins
            let cpR = pad.w * 0.45;
            let cpA = angle;
            // End point: edge of pad
            let endR = pad.w * 0.97;
            let endA = angle;
            ctx.bezierCurveTo(
                Math.cos(cpA) * cpR, Math.sin(cpA) * cpR * 0.7,
                Math.cos(cpA) * cpR * 0.7, Math.sin(cpA) * cpR * 0.5,
                Math.cos(endA) * endR, Math.sin(endA) * endR * 0.7
            );
            ctx.lineWidth = 1.1 - 0.5 * (i === Math.floor(nVeins / 2) ? 0 : Math.abs(i - nVeins / 2) / nVeins); // center vein thicker
            ctx.globalAlpha = 0.22 - 0.08 * Math.abs(i - nVeins / 2) / nVeins;
            ctx.stroke();
        }
        // Draw bug or flower if present
        if (pad.hasBug) {
            ctx.save();
            // Place bug near edge, random angle
            let bugA = Math.PI / 2 + Math.sin(pad.x) * 1.2;
            let bugR = pad.w * 0.68;
            let bx = Math.cos(bugA) * bugR;
            let by = Math.sin(bugA) * bugR * 0.7;
            ctx.translate(bx, by);
            ctx.rotate(bugA + Math.PI / 2);
            if (pad.bugType === 'ladybug') {
                // Ladybug: red oval with black spots
                ctx.beginPath();
                ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#d22';
                ctx.globalAlpha = 0.95;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, -2, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#222';
                ctx.fill();
                // Spots
                ctx.beginPath(); ctx.arc(-2, 0, 0.7, 0, Math.PI * 2); ctx.arc(2, 0, 0.7, 0, Math.PI * 2);
                ctx.fillStyle = '#222'; ctx.fill();
            } else if (pad.bugType === 'bee') {
                // Bee: yellow oval with black stripes
                ctx.beginPath();
                ctx.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#ffb800';
                ctx.globalAlpha = 0.95;
                ctx.fill();
                // Stripes
                ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-2, 2);
                ctx.moveTo(0, -2.5); ctx.lineTo(0, 2.5);
                ctx.moveTo(2, -2); ctx.lineTo(2, 2);
                ctx.strokeStyle = '#222'; ctx.lineWidth = 1.1; ctx.stroke();
                // Head
                ctx.beginPath(); ctx.arc(0, -2.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill();
                ctx.save();
                ctx.globalAlpha = 0.22;
                ctx.strokeStyle = '#eaf7d0';
                ctx.lineWidth = 1.1;
                let nVeins = 2 + Math.floor(pad.w / 20);
                for (let i = 0; i < nVeins; i++) {
                    let angle = -Math.PI / 7 + (i / (nVeins - 1)) * (Math.PI / 3.5);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    // Main control point: slightly wobbly, for organic look
                    let cpR = pad.w * (0.38 + 0.13 * Math.sin(i * 1.2 + t * 0.1 + pad.x * 0.03));
                    let cpA = angle + Math.sin(i + t * 0.13 + pad.x * 0.02) * 0.13;
                    // End point: edge of pad
                    let endR = pad.w * (0.97 + 0.02 * Math.cos(i * 1.7 + t * 0.09 + pad.x * 0.01));
                    let endA = angle + Math.sin(i * 1.5 + t * 0.11 + pad.x * 0.01) * 0.07;
                    ctx.bezierCurveTo(
                        Math.cos(cpA) * cpR, Math.sin(cpA) * cpR * 0.7,
                        Math.cos(cpA) * cpR * 0.7, Math.sin(cpA) * cpR * 0.5,
                        Math.cos(endA) * endR, Math.sin(endA) * endR * 0.7
                    );
                    ctx.lineWidth = 1.1 - 0.5 * (i === Math.floor(nVeins / 2) ? 0 : Math.abs(i - nVeins / 2) / nVeins); // center vein thicker
                    ctx.globalAlpha = 0.22 - 0.08 * Math.abs(i - nVeins / 2) / nVeins;
                    ctx.stroke();
                }
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffe066';
            ctx.globalAlpha = 0.98;
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
        ctx.restore();
    }

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
