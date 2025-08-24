// Fish Tank Shader: animated fish, bubbles, and water caustics
// Exports: { displayName, animate, onResize }

const displayName = 'Fish Tank';


let fish = [];
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
    for (let i = 0; i < n; i++) {
        let dir = Math.random() < 0.5 ? 1 : -1;
        let vx = (Math.random()*0.5+0.3) * dir;
        let flip = Math.random() < 0.5;
        let behaviors = ['float','swim','explore','lookForFood'];
        let behavior = behaviors[Math.floor(Math.random()*behaviors.length)];
        fish.push({
            x: Math.random()*width,
            y: Math.random()*height*0.7 + height*0.15,
            vx: vx,
            vy: (Math.random()-0.5)*0.2,
            size: 18+Math.random()*18,
            color: `hsl(${Math.floor(Math.random()*360)},70%,60%)`,
            flip: flip,
            behavior: behavior,
            behaviorTimer: 60 + Math.random()*120, // frames until next behavior
            target: null // for explore/food
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
    ctx.rotate(Math.sin(t*0.7+f.x*0.01+f.y*0.01)*0.08);
    ctx.beginPath();
    // Body
    ctx.ellipse(0,0, f.size*0.7, f.size*0.32, 0, 0, Math.PI*2);
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(-f.size*0.7,0);
    ctx.lineTo(-f.size*0.7-f.size*0.32, -f.size*0.18);
    ctx.lineTo(-f.size*0.7-f.size*0.32, f.size*0.18);
    ctx.closePath();
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    // Eye
    ctx.beginPath();
    ctx.arc(f.size*0.32, -f.size*0.08, f.size*0.09, 0, Math.PI*2);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(f.size*0.36, -f.size*0.08, f.size*0.04, 0, Math.PI*2);
    ctx.fillStyle = '#222';
    ctx.globalAlpha = 1;
    ctx.fill();
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
    for (let f of fish) {
        // If in lookForFood mode and has a pellet target, update target position to follow pellet
        if (f.behavior === 'lookForFood' && f.target && f.target.pellet && !f.target.pellet.eaten) {
            f.target.x = f.target.pellet.x;
            f.target.y = f.target.pellet.y;
        }
        // Behavior timer
        f.behaviorTimer--;
        if (f.behaviorTimer <= 0) {
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
        if (f.y < minY) f.vy = Math.abs(f.vy);
        if (f.y > maxY) f.vy = -Math.abs(f.vy);
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
