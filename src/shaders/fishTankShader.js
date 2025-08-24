// Fish Tank Shader: animated fish, bubbles, and water caustics
// Exports: { displayName, animate, onResize }

const displayName = 'Fish Tank';


let fish = [];
let netEvent = null;
let scoopedFish = [];
let eggs = [];
let bubbles = [];
let causticPhase = 0;
let tankDecor = null;
let foodPellets = [];
// Add a food pellet at (x, y)
// Generate static decorations for the tank floor
function generateTankDecor(width, height, wallW) {
    // Generate static decorations for the tank floor
    // --- Continuous gravel band (static, cached) ---
    let gravelBand = [];
    let gravelBandY = height - wallW - 10;
    let bandHeight = 18 * 2;
    let bandCount = Math.floor((width - 2 * wallW) / 7);
    for (let i = 0; i < bandCount; i++) {
        let gx = wallW + 3 + i * 7 + Math.random() * 2;
        let gy = gravelBandY + Math.random() * bandHeight;
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
        gravel.push({
            x: 20 + Math.random() * (width - 40),
            y: height - wallW - 8 - Math.random() * 8 * 2,
            r: (2.2 + Math.random()*1.8) * 2,
            color: `hsl(${35+Math.random()*30},${40+Math.random()*30}%,${60+Math.random()*20}%)`,
            alpha: 0.45 + Math.random()*0.25
        });
    }
    let rocks = [];
    for (let i = 0; i < 5; i++) {
        rocks.push({
            x: 30 + Math.random() * (width - 60),
            y: height - wallW - 12 - Math.random() * 10 * 2,
            rx: (12 + Math.random()*10) * 2,
            ry: (7 + Math.random()*6) * 2,
            rot: Math.random()*Math.PI,
            color: `hsl(${180+Math.random()*60},${10+Math.random()*20}%,${30+Math.random()*20}%)`,
            alpha: 0.7
        });
    }
    let plants = [];
    for (let i = 0; i < (5 + Math.random()*10); i++) {
        plants.push({
            x: 25 + Math.random() * (width - 50),
            baseY: height - wallW - 10,
            h: (28 + Math.random()*200) * 2,
            color: `hsl(${90+Math.random()*60},${40+Math.random()*40}%,${30+Math.random()*30}%)`,
            lw: (2 + Math.random()*3) * 2
        });
    }
    return {gravelBand, gravel, rocks, plants};
}

function addFoodPellet(x, y) {
    foodPellets.push({
        x,
        y,
        r: 5 + Math.random()*3,
        vy: 0.35 + Math.random()*0.18, // slower sinking
        eaten: false
    });
    // 25% chance for each fish to switch to 'lookForFood' and target nearest pellet
    for (let f of fish) {
        if (Math.random() < 0.25 && foodPellets.some(p => !p.eaten)) {
            f.behavior = 'lookForFood';
            f.behaviorTimer = 60 + Math.random()*1200;
            // Target nearest uneaten pellet
            let minDist = Infinity, targetPellet = null;
            for (let pellet of foodPellets) {
                if (pellet.eaten) continue;
                let dx = pellet.x - f.x;
                let dy = pellet.y - f.y;
                let dist = dx*dx + dy*dy;
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

// Handle click event to add food pellet
function onClick(e, {canvas, ctx, width, height}) {
    // Convert mouse event to canvas coordinates, accounting for pan/zoom
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    let rawX = (e.clientX - rect.left) * scaleX;
    let rawY = (e.clientY - rect.top) * scaleY;
    // Undo pan/zoom transform
    let x = (typeof window.viewZoom === 'number' ? (rawX - (window.viewOffsetX || 0)) / (window.viewZoom || 1) : rawX);
    let y = (typeof window.viewZoom === 'number' ? (rawY - (window.viewOffsetY || 0)) / (window.viewZoom || 1) : rawY);
    // Only add food if inside tank (not on wall)
    const wallW = 10;
    if (x > wallW && x < width-wallW && y > wallW && y < height-wallW) {
        addFoodPellet(x, y);
    }
}

function resetFish(width, height) {
    fish = [];
    const n = 6 + Math.floor(Math.random()*4);
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
            name: 'Sturgeon',
            body: { rx: 1.3, ry: 0.22 }, // long, slender
            tail: { len: 0.7, height: 0.18, style: 'sturgeon' },
            color: () => `hsl(${110+Math.random()*20},60%,32%)`, // deep green
            eye: '#fff',
            size: 44 + Math.random()*12 // much larger
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
    for (let i = 0; i < n; i++) {
        let dir = Math.random() < 0.5 ? 1 : -1;
        let vx = (Math.random()*0.5+0.3) * dir;
        let flip = Math.random() < 0.5;
        let behaviors = ['float','swim','explore','lookForFood'];
        let behavior = behaviors[Math.floor(Math.random()*behaviors.length)];
        let species = speciesList[Math.floor(Math.random()*speciesList.length)];
        fish.push({
            x: Math.random()*width,
            y: Math.random()*height*0.7 + height*0.15,
            vx: vx,
            vy: (Math.random()-0.5)*0.2,
            size: 18+Math.random()*18,
            color: species.color(),
            flip: flip,
            behavior: behavior,
            behaviorTimer: 60 + Math.random()*120, // frames until next behavior
            target: null, // for explore/food
            species: species
        });
    }
}

function resetBubbles(width, height) {
    bubbles = [];
    for (let i = 0; i < 12; i++) {
        bubbles.push({
            x: Math.random()*width,
            y: Math.random()*height,
            r: 3+Math.random()*4,
            vy: 0.5+Math.random()*0.7
        });
    }
}

function drawFish(ctx, f, t) {
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.flip) ctx.scale(-1,1);
    ctx.rotate(Math.sin(t*0.7+f.x*0.01+f.y*0.01)*0.1);
    // --- Draw tail by species ---
    ctx.beginPath();
    let tailLen = f.size * (f.species.tail.len);
    let tailHeight = f.size * (f.species.tail.height);
    if (f.species.tail.style === 'sturgeon') {
        // Sturgeon: long, pointed, slightly forked tail
        ctx.moveTo(-f.size*f.species.body.rx,0);
        ctx.lineTo(-f.size*f.species.body.rx-f.size*f.species.tail.len*1.1, -tailHeight*0.7);
        ctx.lineTo(-f.size*f.species.body.rx-f.size*f.species.tail.len*1.3, 0);
        ctx.lineTo(-f.size*f.species.body.rx-f.size*f.species.tail.len*1.1, tailHeight*0.7);
        ctx.closePath();
    } else if (f.species.tail.style === 'fan') {
        ctx.moveTo(-f.size*f.species.body.rx,0);
        ctx.lineTo(-f.size*f.species.body.rx-tailLen, -tailHeight);
        ctx.lineTo(-f.size*f.species.body.rx-tailLen, tailHeight);
        ctx.closePath();
    } else if (f.species.tail.style === 'fork') {
        ctx.moveTo(-f.size*f.species.body.rx,0);
        ctx.lineTo(-f.size*f.species.body.rx-tailLen, -tailHeight*0.7);
        ctx.lineTo(-f.size*f.species.body.rx-tailLen*0.7, 0);
        ctx.lineTo(-f.size*f.species.body.rx-tailLen, tailHeight*0.7);
        ctx.closePath();
    } else if (f.species.tail.style === 'veil') {
        ctx.moveTo(-f.size*f.species.body.rx,0);
        ctx.bezierCurveTo(-f.size*f.species.body.rx-tailLen*0.7, -tailHeight*1.2, -f.size*f.species.body.rx-tailLen*1.1, tailHeight*1.2, -f.size*f.species.body.rx-tailLen, 0);
        ctx.closePath();
    } else if (f.species.tail.style === 'triangle') {
        ctx.moveTo(-f.size*f.species.body.rx,0);
        ctx.lineTo(-f.size*f.species.body.rx-tailLen, -tailHeight);
        ctx.lineTo(-f.size*f.species.body.rx-tailLen, tailHeight);
        ctx.closePath();
    }
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    // --- Draw body by species ---
    ctx.beginPath();
    ctx.ellipse(0,0, f.size*f.species.body.rx, f.size*f.species.body.ry, 0, 0, Math.PI*2);
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();

    // --- Draw spikes for Sturgeon ---
    if (f.species.name === 'Sturgeon') {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#e0f8d0';
        ctx.fillStyle = '#e0f8d0';
        let nSpikes = 7;
        let bodyLen = f.size * f.species.body.rx * 2;
        let bodyTopY = -f.size * f.species.body.ry;
        for (let i = 0; i < nSpikes; i++) {
            let frac = i / (nSpikes-1);
            let spikeX = -f.size*f.species.body.rx + frac*bodyLen;
            let spikeY = bodyTopY;
            let spikeH = f.size * 0.22 + Math.sin(t*0.5 + i)*f.size*0.03;
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(spikeX, spikeY - spikeH);
            ctx.lineTo(spikeX + f.size*0.08, spikeY - spikeH*0.7);
            ctx.lineTo(spikeX - f.size*0.08, spikeY - spikeH*0.7);
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
        ctx.ellipse(0,0, f.size*f.species.body.rx*0.9, f.size*f.species.body.ry*0.35, 0, 0, Math.PI*2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = f.size*0.09;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();
    }
    // --- Eye ---
    if (f.species.bigEye) {
        // Huge eyeball, centered
        ctx.beginPath();
        ctx.arc(f.size*0.18, 0, f.size*0.22, 0, Math.PI*2);
        ctx.fillStyle = f.species.eye || '#fff';
        ctx.globalAlpha = 0.97;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.size*0.18, 0, f.size*0.11, 0, Math.PI*2);
        ctx.fillStyle = '#222';
        ctx.globalAlpha = 1;
        ctx.fill();
        // Add a little highlight
        ctx.beginPath();
        ctx.arc(f.size*0.22, -f.size*0.06, f.size*0.04, 0, Math.PI*2);
        ctx.fillStyle = '#fff8';
        ctx.globalAlpha = 1;
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(f.size*0.32, -f.size*0.08, f.size*0.09, 0, Math.PI*2);
        ctx.fillStyle = f.species.eye || '#fff';
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.size*0.36, -f.size*0.08, f.size*0.04, 0, Math.PI*2);
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
        let phase = t*0.12 + i*0.7;
        let amp = 18 + Math.sin(phase*1.2+i)*8;
        let y = (height/18)*i + Math.sin(phase)*8;
        ctx.beginPath();
        for (let x = 0; x <= width; x+=4) {
            let yoff = Math.sin(phase + x*0.03 + Math.sin(x*0.01+phase)*0.7)*amp*0.08;
            ctx.lineTo(x, y+yoff);
        }
        ctx.strokeStyle = `rgba(180,220,255,0.18)`;
        ctx.lineWidth = 2.2 + Math.sin(phase*1.3)*0.7;
        ctx.stroke();
    }
    ctx.restore();
}

function animate(ctx, t, width, height) {
     // draw background first
    // Draw tank walls
    const wallW = 10;
    ctx.save();
    ctx.fillStyle = '#b8e0f8';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0,0,wallW,height); // left
    ctx.fillRect(width-wallW,0,wallW,height); // right
    ctx.fillRect(0,0,width,wallW); // top
    ctx.fillRect(0,height-wallW,width,wallW); // bottom
    ctx.restore();
    // Water background (inside tank)
    let grad = ctx.createLinearGradient(0,wallW,0,height-wallW);
    grad.addColorStop(0,'#5ec6e6');
    grad.addColorStop(1,'#0a2a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(wallW,wallW,width-2*wallW,height-2*wallW);
    // Rare random event: cartoon net on a pole swings in from the top
    if (!netEvent && Math.random() < 1/1024) {
        // Net pivots from a point off the top of the screen
        let pivotX = Math.random() * (width * 0.7) + width*0.15;
        let pivotY = -height * 0.5 - 60;
        // Always randomize pole length for each swing
        let poleLenBase = height * 0.8;
        let poleLen = poleLenBase * (Math.random()*1.5);
        let netRadius = 60 + Math.random()*40;
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
    if (netEvent) {
        // Animate net swinging down
        netEvent.t++;
        let swingT = Math.min(1, netEvent.t / 15000);
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
        ctx.rotate(angle + Math.PI/2);
        ctx.strokeStyle = '#b8b8b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, netEvent.netRadius, netEvent.netRadius*2, 0, 0, Math.PI*2);
        ctx.stroke();
        // Draw net mesh
        ctx.setLineDash([8,8]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            let meshAngle = (Math.PI*2/8)*i;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(meshAngle)*netEvent.netRadius, Math.sin(meshAngle)*netEvent.netRadius*0.85);
        }
        ctx.strokeStyle = '#b8b8b8';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        ctx.restore();

        // Mark fish inside net ellipse as scooped and attach to net, but do not remove from fish array
        const now = performance.now();
        let scoopedThisFrame = false;
        for (let f of fish) {
            if (f.scoopedByNet) {
                // Already scooped, update position to follow net
                f.x = netX + (Math.random()-0.5)*netEvent.netRadius*0.7;
                f.y = netY + (Math.random()-0.5)*netEvent.netRadius*1.5;
                // If not already set, mark the time scooped
                if (!f.scoopedTime) f.scoopedTime = now;
                continue;
            }
            // Transform fish position into net's local ellipse space
            let dx = f.x - netX;
            let dy = f.y - netY;
            let localX = Math.cos(-angle - Math.PI/2)*dx - Math.sin(-angle - Math.PI/2)*dy;
            let localY = Math.sin(-angle - Math.PI/2)*dx + Math.cos(-angle - Math.PI/2)*dy;
            // Ellipse: (x/a)^2 + (y/b)^2 < 1
            let a = netEvent.netRadius;
            let b = netEvent.netRadius * 2;
            let inNet = (localX*localX)/(a*a) + (localY*localY)/(b*b) < 1;
            if (inNet) {
                f.scoopedByNet = true;
                f.scoopedTime = now;
                f.x = netX + (Math.random()-0.5)*netEvent.netRadius*0.7;
                f.y = netY + (Math.random()-0.5)*netEvent.netRadius*1.5;
                scoopedThisFrame = true;
            }
        }
        // End event after swing
        if (swingT >= 1.0) {
            netEvent = null;
        }

        // Remove fish 1000ms after being scooped
        const now2 = performance.now();
        fish = fish.filter(f => !(f.scoopedByNet && f.scoopedTime && now2 - f.scoopedTime > 1000));

        // End event 1000ms after first fish is scooped, or after swing if no fish caught
        if ((netEvent.scoopedTime && now2 - netEvent.scoopedTime > 1000) || (!netEvent.scoopedTime && swingT >= 1.0)) {
            netEvent = null;
        }
    }
   
    // Draw tank floor decorations (static, cached)
    if (!tankDecor) {
        tankDecor = generateTankDecor(width, height, wallW);
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
        ctx.arc(g.x, g.y, g.r, 0, Math.PI*2);
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
        let sway = Math.sin(t*1.3 + p.x*0.06) * 5;
        ctx.bezierCurveTo(p.x+sway, p.baseY-p.h*0.3, p.x-sway*0.5, p.baseY-p.h*0.7, p.x+sway*0.2, p.baseY-p.h);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lw;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();
    }
    if (!fish.length || ctx._fishW !== width || ctx._fishH !== height) {
        resetFish(width, height);
        resetBubbles(width, height);
        ctx._fishW = width;
        ctx._fishH = height;
    }
    // Rocks
    for (let r of tankDecor.rocks) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.rx, r.ry, r.rot, 0, Math.PI*2);
        ctx.fillStyle = r.color;
        ctx.globalAlpha = r.alpha;
        ctx.shadowColor = '#222';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
    }
    foodPellets = foodPellets.filter(p => !p.eaten);
    // Draw and update food pellets
    console.log('foodPellets:', foodPellets.length);
    for (let pellet of foodPellets) {
        if (pellet.eaten) continue;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, pellet.r, 0, Math.PI*2);
        ctx.fillStyle = '#c49a6c';
        ctx.shadowColor = '#7a5a2b';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
        // Pellet falls down
        pellet.y += pellet.vy;
        // Stop at bottom of tank
        const wallW = 10;
        const bottom = height - wallW - pellet.r;
        if (pellet.y > bottom) pellet.y = bottom;
    }
    // Caustics
    drawCaustics(ctx, width, height, t);
    // Bubbles
    for (let b of bubbles) {
        ctx.save();
        ctx.globalAlpha = 0.18 + Math.sin(t*0.7+b.x*0.01+b.y*0.01)*0.12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
        b.y -= b.vy;
        if (b.y < -b.r) {
            b.x = Math.random()*width;
            b.y = height + b.r + Math.random()*20;
            b.r = 3+Math.random()*4;
            b.vy = 0.5+Math.random()*0.7;
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
        if (f.species && f.species.name === 'Sturgeon') {
            for (let j = 0; j < fish.length; j++) {
                if (i === j) continue;
                let prey = fish[j];
                // Don't eat other sturgeons or already eaten fish
                if (prey.species && prey.species.name === 'Sturgeon') continue;
                if (fishToRemove.has(j)) continue;
                // Only eat if close enough and sturgeon is bigger
                let dx = f.x - prey.x;
                let dy = f.y - prey.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
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
            if (fish.length < 50 && Math.random() < 1/200) {
                // If Eyeball Fish, lay way more eggs
                let isEyeball = f.species && f.species.name === 'Eyeball Fish';
                let numEggs = isEyeball ? (18 + Math.floor(Math.random()*10)) : (2 + Math.floor(Math.random()*4));
                for (let i = 0; i < numEggs; i++) {
                    let angle = Math.random()*Math.PI*2;
                    let dist = 10 + Math.random()*18;
                    // Add a small outward velocity proportional to distance
                    let spreadV = 0.12 + Math.random()*0.18;
                    eggs.push({
                        x: f.x + Math.cos(angle)*dist,
                        y: f.y + Math.sin(angle)*dist,
                        vx: Math.cos(angle)*(0.7 + spreadV*dist/18) + (Math.random()-0.5)*0.5,
                        vy: Math.sin(angle)*(0.7 + spreadV*dist/18) + (Math.random()-0.5)*0.5,
                        r: 4 + Math.random()*2,
                        hatchTimer: 1000 + Math.random()*6000,
                        species: f.species
                    });
                }
            }
            // Pick a new behavior
            let behaviors = ['float','swim','explore','lookForFood'];
            let next = behaviors[Math.floor(Math.random()*behaviors.length)];
            f.behavior = next;
            // Enforce at least 30 frames for 'explore' mode
            if (next === 'explore') {
                f.behaviorTimer = 30 + Math.random()*1200;
            } else {
                f.behaviorTimer = 60 + Math.random()*1200;
            }
            if (next === 'lookForFood' && foodPellets.some(p => !p.eaten)) {
                // Target the nearest uneaten food pellet
                let minDist = Infinity, targetPellet = null;
                for (let pellet of foodPellets) {
                    if (pellet.eaten) continue;
                    let dx = pellet.x - f.x;
                    let dy = pellet.y - f.y;
                    let dist = dx*dx + dy*dy;
                    if (dist < minDist) {
                        minDist = dist;
                        targetPellet = pellet;
                    }
                }
                if (targetPellet) {
                    f.target = { x: targetPellet.x, y: targetPellet.y, pellet: targetPellet };
                } else {
                    // fallback to random target
                    const wallW = 10;
                    f.target = {
                        x: wallW + f.size*0.7 + Math.random()*(width-2*wallW-f.size*1.4),
                        y: wallW + f.size*0.5 + Math.random()*(height-2*wallW-f.size)
                    };
                }
            } else if (next === 'explore') {
                // Pick a random target in tank
                const wallW = 10;
                f.target = {
                    x: wallW + f.size*0.7 + Math.random()*(width-2*wallW-f.size*1.4),
                    y: wallW + f.size*0.5 + Math.random()*(height-2*wallW-f.size)
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
        ctx.arc(egg.x, egg.y, egg.r, 0, Math.PI*2);
        ctx.fillStyle = egg.species ? egg.species.color() : '#fff';
        ctx.globalAlpha = 0.7 + 0.3*Math.sin(t*0.2+egg.x*0.01);
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
        const wallW = 10;
        const bottom = height - wallW - egg.r;
        if (egg.y > bottom) { egg.y = bottom; egg.vy *= -0.3; }
        // Hatch timer
        egg.hatchTimer--;
        if (egg.hatchTimer <= 0) {
            // Hatch: add new fish of same species
            fish.push({
                x: egg.x,
                y: egg.y,
                vx: (Math.random()*0.5+0.3) * (Math.random()<0.5?-1:1),
                vy: (Math.random()-0.5)*0.2,
                size: 18+Math.random()*18,
                color: egg.species.color(),
                flip: Math.random()<0.5,
                behavior: 'float',
                behaviorTimer: 60 + Math.random()*120,
                target: null,
                species: egg.species
            });
            eggs.splice(i,1);
        }
    }
        // Behavior logic
        let vx = f.vx, vy = f.vy;
        if (f.behavior === 'float') {
            vx = 0.05 * (Math.random()-0.5);
            vy = 0.05 * (Math.random()-0.5);
        } else if (f.behavior === 'swim') {
            // Swim back and forth
            vx = (Math.abs(f.vx) + 0.1) * (f.flip ? -1 : 1);
            vy = 0.1 * Math.sin(t*0.1+f.x*0.01);
        } else if (f.behavior === 'explore' && f.target) {
            // Move toward target
            let dx = f.target.x - f.x;
            let dy = f.target.y - f.y;
            let dist = Math.sqrt(dx*dx+dy*dy);
            if (dist > 2) {
                vx = 0.7 * dx/dist;
                vy = 0.4 * dy/dist;
                f.flip = vx < 0;
            } else {
                vx = 0; vy = 0;
            }
        } else if (f.behavior === 'lookForFood' && f.target) {
            // Move toward target pellet, slower, with more jitter
            let dx = f.target.x - f.x;
            let dy = f.target.y - f.y;
            let dist = Math.sqrt(dx*dx+dy*dy);
            let eatRadius = (f.size * 0.7) + (f.target.pellet ? f.target.pellet.r : 6) + 8; // larger eat radius
            if (dist > eatRadius) {
                vx = 0.3 * dx/dist + 0.08*(Math.random()-0.5);
                vy = 0.2 * dy/dist + 0.08*(Math.random()-0.5);
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
        f.y += vy + Math.sin(t*0.08+f.x*0.01)*0.2;
    drawFish(ctx, f, t);
        // Prevent fish from leaving tank (bounce off tank walls)
        const minX = wallW + f.size*0.7;
        const maxX = width - wallW - f.size*0.7;
        const minY = wallW + f.size*0.5;
        const maxY = height - wallW - f.size*0.5;
        if (f.x < minX) { f.x = minX; f.vx = Math.abs(f.vx); f.flip = false; }
        if (f.x > maxX) { f.x = maxX; f.vx = -Math.abs(f.vx); f.flip = true; }
        if (f.y < minY) { f.y = minY; f.vy = Math.abs(f.vy); }
        if (f.y > maxY) { f.y = maxY; f.vy = -Math.abs(f.vy); }
    }

    // Remove eaten fish (except sturgeons)
    if (fishToRemove.size > 0) {
        fish = fish.filter((f, idx) => !fishToRemove.has(idx));
    }
}

function onResize({canvas, ctx, width, height}) {
    resetFish(width, height);
    resetBubbles(width, height);
}

export default {
    displayName,
    animate,
    onResize,
    onClick
};
