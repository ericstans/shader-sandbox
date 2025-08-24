// Track surface time for each ant
function ensureAntSurfaceTimers() {
    for (let ant of ants) {
        if (ant.surfaceTime === undefined) ant.surfaceTime = 0;
    }
}
// Utility: check if a point is near any tunnel segment
function isInTunnel(x, y, tolerance = 10) {
    for (let t of tunnels) {
        for (let i = 1; i < t.length; i++) {
            let x1 = t[i-1].x, y1 = t[i-1].y, x2 = t[i].x, y2 = t[i].y;
            let dx = x2 - x1, dy = y2 - y1;
            let len2 = dx*dx + dy*dy;
            let tval = len2 === 0 ? 0 : ((x - x1) * dx + (y - y1) * dy) / len2;
            tval = Math.max(0, Math.min(1, tval));
            let px = x1 + tval * dx, py = y1 + tval * dy;
            let dist = Math.hypot(x - px, y - py);
            if (dist < tolerance) return true;
        }
    }
    return false;
}
// Dig Dug Ants Shader: Side view with overground, underground, and digging ants
// Exports: { displayName, animate, onResize }

const displayName = 'Dig Dug Ants';

let startTime = null;
let ants = [];
let tunnels = [];
let lastSpawn = 0;

function resetAnts(width, height) {
    ants = [];
    tunnels = [];
    for (let i = 0; i < 5; i++) {
        spawnAnt(width, height);
    }
}

function spawnAnt(width, height) {
    // Spawn above or below ground randomly
    let isAbove = Math.random() < 0.5;
    let x = Math.random() * width;
    let y = isAbove ? height * 0.18 : (height * 0.22 + Math.random() * height * 0.7);
    let dir = Math.random() * Math.PI * 2;
    ants.push({ x, y, dir, digging: !isAbove, path: [{ x, y }] });
}

function animate(ctx, t, width, height) {
    ensureAntSurfaceTimers();
    if (!startTime) startTime = performance.now();
    let elapsed = (performance.now() - startTime) / 1000;
    ctx.clearRect(0, 0, width, height);

    // Draw sky
    ctx.fillStyle = '#b3e6ff';
    ctx.fillRect(0, 0, width, height * 0.18);
    // Draw ground surface
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(0, height * 0.18, width, height * 0.04);
    // Draw underground
    ctx.fillStyle = '#e2c185';
    ctx.fillRect(0, height * 0.22, width, height * 0.78);

    // Draw tunnels (completed)
    ctx.save();
    ctx.strokeStyle = '#f7e6b2';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    for (let t of tunnels) {
        if (t.length > 1) {
            ctx.beginPath();
            ctx.moveTo(t[0].x, t[0].y);
            for (let p of t) ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }
    }
    // Draw active tunnel segments for each ant
    for (let ant of ants) {
        // Track time on surface
        if (ant.y < height * 0.22) {
            ant.surfaceTime += 1;
        } else {
            ant.surfaceTime = 0;
        }

        // If on surface for too long, force dig down
        if (ant.y < height * 0.22 && ant.surfaceTime > 60) { // ~1s at 60fps
            ant.dir = Math.PI / 2 + (Math.random() - 0.5) * 0.3; // mostly downward
        }
        if (ant.path && ant.path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(ant.path[0].x, ant.path[0].y);
            for (let p of ant.path) ctx.lineTo(p.x, p.y);
            ctx.globalAlpha = 0.7;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    ctx.restore();

    // Animate ants
    let antSpeed = 36 + Math.sin(elapsed * 0.7) * 8;
    let tunnelSpeed = antSpeed * 1.8;
    for (let ant of ants) {
        // Randomly change direction
        if (Math.random() < 0.04) ant.dir += (Math.random() - 0.5) * 0.7;
        let wasUnderground = ant.y >= height * 0.22;
        let wasAbove = ant.y < height * 0.22;

        // Check if in tunnel
        let inTunnel = isInTunnel(ant.x, ant.y, 11);

        // Track previous digging state
        let wasDigging = ant.digging;

        // Move ant
        // Allow digging through the surface if ant is moving downward
        let diggingDownFromSurface = (ant.y < height * 0.22 && Math.abs(ant.dir % (2 * Math.PI) - Math.PI / 2) < Math.PI / 3);
        if (ant.y >= height * 0.22 || diggingDownFromSurface) {
            if (inTunnel) {
                // If transitioning from digging to tunnel, save unfinished tunnel
                if (wasDigging && ant.path && ant.path.length > 1) {
                    tunnels.push([...ant.path]);
                }
                // Navigate tunnel, move faster, don't dig
                ant.x += Math.cos(ant.dir) * tunnelSpeed * 0.012;
                ant.y += Math.sin(ant.dir) * tunnelSpeed * 0.012;
                ant.digging = false;
                ant.path = [{ x: ant.x, y: ant.y }];
            } else {
                // Digging (underground or through surface)
                ant.x += Math.cos(ant.dir) * antSpeed * 0.012;
                ant.y += Math.sin(ant.dir) * antSpeed * 0.012;
                if (!ant.digging) {
                    ant.path = [{ x: ant.x, y: ant.y }];
                }
                ant.digging = true;
            }
        } else {
            // Above ground, not digging
            ant.x += Math.cos(ant.dir) * antSpeed * 0.016;
            ant.digging = false;
            ant.path = [{ x: ant.x, y: ant.y }];
        }

        // Clamp to world
        ant.x = Math.max(8, Math.min(width - 8, ant.x));
        ant.y = Math.max(0, Math.min(height - 8, ant.y));

        let nowUnderground = ant.y >= height * 0.22;
        let nowAbove = ant.y < height * 0.22;

        // Handle crossing ground boundary
        if (wasAbove && nowUnderground) {
            // Entering underground: start new path
            ant.path = [{ x: ant.x, y: ant.y }];
        } else if (wasUnderground && nowAbove) {
            // Exiting to above ground: finish tunnel
            if (ant.path && ant.path.length > 1 && ant.digging) {
                tunnels.push([...ant.path]);
            }
            ant.path = [{ x: ant.x, y: ant.y }];
        }

        // Add to tunnel path if digging and not in tunnel
        if (ant.digging && !inTunnel) {
            ant.path.push({ x: ant.x, y: ant.y });
            if (ant.path.length > 1 && Math.hypot(ant.x - ant.path[ant.path.length-2].x, ant.y - ant.path[ant.path.length-2].y) > 8) {
                tunnels.push([...ant.path]);
                ant.path = [{ x: ant.x, y: ant.y }];
            }
        }

        // Bounce off edges
        if (ant.x <= 8 || ant.x >= width - 8) ant.dir = Math.PI - ant.dir;
        if (ant.y <= 8 || ant.y >= height - 8) ant.dir = -ant.dir;
    }

    // Draw ants
    for (let ant of ants) {
        ctx.save();
        ctx.translate(ant.x, ant.y);
        ctx.rotate(ant.dir);
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.shadowColor = '#0008';
        ctx.shadowBlur = 2;
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.ellipse(7, 0, 3, 2.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#444';
        ctx.fill();
        // Legs
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1.2;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(-2, i * 3);
            ctx.lineTo(-7, i * 5 + 2 * Math.sin(elapsed * 6 + ant.x * 0.1 + i));
            ctx.stroke();
        }
        ctx.restore();
    }

    // Occasionally spawn new ants
    if (elapsed - lastSpawn > 2.5 && ants.length < 12) {
        spawnAnt(width, height);
        lastSpawn = elapsed;
    }
}

function onResize({ canvas, ctx, width, height }) {
    startTime = null;
    resetAnts(width, height);
}


function onClick(ev, { width, height, canvas }) {
    // Get mouse position relative to canvas
    let rect = canvas.getBoundingClientRect();
    let x = (ev.clientX - rect.left) * (width / rect.width);
    let y = (ev.clientY - rect.top) * (height / rect.height);
    // Spawn a new ant at this location, random direction
    let dir = Math.random() * Math.PI * 2;
    let digging = y >= height * 0.22;
    ants.push({ x, y, dir, digging, path: [{ x, y }] });
}

export default {
    displayName,
    animate,
    onResize,
    onClick
};
