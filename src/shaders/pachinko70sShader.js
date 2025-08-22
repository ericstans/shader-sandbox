// Shader: Pachinko 70s (Classic Board)
// Simulates a 1970s-style pachinko board: small metallic balls, dense brass pegs in a fan pattern, launch on right, ornate look.

export function pachinko70sShader(ctx, t, width = 1000, height = 1000) {
    ctx.save();
    // Background: wood paneling look
    let grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#b88c4a');
    grad.addColorStop(1, '#e2c28b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Board border
    ctx.strokeStyle = '#7a5a2b';
    ctx.lineWidth = width / 30;
    ctx.strokeRect(width/40, width/40, width-width/20, height-width/20);
    // Parameters
    const nRows = 16, nCols = 17;
    const pegRadius = width / 120;
    const ballRadius = width / 110;
    const slotCount = nCols - 2;
    const gravity = width / 1200;
    // Peg positions (realistic 70s layout: denser, vertical, curved rows, clear launch path)
    let pegs = [];
    for (let row = 0; row < nRows; ++row) {
        // Curve the row for a "fan" shape, leave a launch gap on the right
        let y = width * (0.13 + 0.7 * row / nRows);
        let curve = Math.pow((row - nRows/2) / (nRows/2), 2) * 0.18 * width; // more curve at top/bottom
        let nPins = nCols - (row < 2 ? 4 : row > nRows-3 ? 3 : 0); // fewer pins at very top/bottom
        let xStart = width * 0.16 + (row < 2 ? width*0.04 : 0);
        let rightSide = [];
        for (let col = 0; col < nPins; ++col) {
            // Leave a launch gap on the far right
            if (col === nPins-1 && row > 1 && row < nRows-2) continue;
            let x = xStart + (width*0.68-curve) * (col/(nPins-1));
            if (x >= width/2) rightSide.push({ x, y }); // Only right side
        }
        // Remove all pegs left of center, then re-add mirrored right side
        let mid = width/2;
        let mirrored = rightSide.map(peg => ({ x: mid - (peg.x - mid), y: peg.y }));
        // Combine mirrored and right side, but remove overlapping pegs (within 1px)
        let allPegs = mirrored.concat(rightSide);
        let uniquePegs = [];
        for (let peg of allPegs) {
            if (!uniquePegs.some(p => Math.abs(p.x - peg.x) < 1 && Math.abs(p.y - peg.y) < 1)) {
                uniquePegs.push(peg);
            }
        }
        // Remove two center pegs from row 1 and row 3 (0-based)
        if (row === 1 || row === 3) {
            // Sort by x, remove two pegs closest to center
            uniquePegs.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));
            uniquePegs = uniquePegs.slice(2); // remove two closest to center
        }
        // Add a single pin in the 2nd row directly in the center
        if (row === 1) {
            uniquePegs.push({ x: mid, y });
        }
        // Remove two center pegs from the second row from the bottom and add a single center pin
        if (row === nRows - 2) {
            uniquePegs.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));
            uniquePegs = uniquePegs.slice(2); // remove two closest to center
            uniquePegs.push({ x: mid, y });
        }
        pegs.push(...uniquePegs);
    }
    // Slot positions
    let slots = [];
    // Center slots horizontally
    let slotSpacing = (width * 0.68) / slotCount;
    let slotStart = width * 0.16 + slotSpacing / 2;
    for (let i = 0; i < slotCount; ++i) {
        let x = slotStart + i * slotSpacing;
        let y = width * 0.89;
        slots.push({ x, y });
    }
    // Ball state (persistent)
    if (!pachinko70sShader.balls) pachinko70sShader.balls = [];
    if (!pachinko70sShader.lastLaunch) pachinko70sShader.lastLaunch = 0;
    if (!pachinko70sShader.audioCtx) {
        try {
            pachinko70sShader.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { pachinko70sShader.audioCtx = null; }
    }
    // Launch new balls every 0.5s from the middle top, angled downward
    if (t - pachinko70sShader.lastLaunch > 0.5) {
        let angle = Math.PI * (0.5 + (Math.random()-0.5)*0.08); // mostly straight down
    let speed = width/150 + Math.random()*width/300;
        pachinko70sShader.balls.push({
            x: width * 0.5,
            y: width * 0.03,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed,
            color: 'silver',
            slot: null
        });
        pachinko70sShader.lastLaunch = t;
    }
    // Update and draw balls
    // Update and draw balls, remove balls that enter a slot
    let newBalls = [];
    for (const ball of pachinko70sShader.balls) {
        if (ball.slot == null) {
            // Physics
            ball.vy += gravity;
            ball.x += ball.vx;
            ball.y += ball.vy;
            // Collide with pegs
            for (const peg of pegs) {
                let dx = ball.x - peg.x, dy = ball.y - peg.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < pegRadius + ballRadius) {
                    // Reflect velocity
                    let angle = Math.atan2(dy, dx);
                    let speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                    let bounce = 0.7 + 0.2 * Math.random();
                    ball.vx = Math.cos(angle) * speed * bounce;
                    ball.vy = Math.sin(angle) * speed * bounce;
                    // Move ball out of peg
                    ball.x = peg.x + Math.cos(angle) * (pegRadius + ballRadius + 0.1);
                    ball.y = peg.y + Math.sin(angle) * (pegRadius + ballRadius + 0.1);
                }
            }
            // Collide with walls
            if (ball.x < ballRadius + width/40) { ball.x = ballRadius + width/40; ball.vx = Math.abs(ball.vx); }
            if (ball.x > width - ballRadius - width/40) { ball.x = width - ballRadius - width/40; ball.vx = -Math.abs(ball.vx); }
            // (No jackpot logic)
            // Check for slot
            if (ball.y > width * 0.88) {
                // Find nearest slot
                let minDist = 1e9, slotIdx = 0;
                for (let i = 0; i < slots.length; ++i) {
                    let d = Math.abs(ball.x - slots[i].x);
                    if (d < minDist) { minDist = d; slotIdx = i; }
                }
                ball.slot = slotIdx;
                ball.y = slots[slotIdx].y - ballRadius;
                ball.vx = 0;
                ball.vy = 0;
                // Play sound effect for this slot (one per ball)
                if (!ball.playedSound && pachinko70sShader.audioCtx) {
                    let ctx = pachinko70sShader.audioCtx;
                    let osc = ctx.createOscillator();
                    let gain = ctx.createGain();
                    let filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 1200;
                    filter.Q.value = 0.7;
                    let baseFreq = 440; // A4
                    // Pentatonic major scale intervals in semitones: 0, 2, 4, 7, 9
                    let pentatonic = [0, 2, 4, 7, 9];
                    // Spread pentatonic notes across slots
                    let scaleLen = pentatonic.length;
                    let octaves = Math.floor(slotCount / scaleLen);
                    let noteIdx = slotIdx % scaleLen;
                    let octave = Math.floor(slotIdx / scaleLen);
                    let semitones = pentatonic[noteIdx] + 12 * octave;
                    let freq = baseFreq * Math.pow(2, semitones / 12);
                    osc.frequency.value = freq;
                    osc.type = 'triangle';
                    gain.gain.value = 0.08;
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.18);
                    osc.onended = () => { osc.disconnect(); gain.disconnect(); filter.disconnect(); };
                    ball.playedSound = true;
                }
            } else {
                newBalls.push(ball);
            }
        } else {
            // Ball already in slot, do not keep
        }
        // Draw ball (metallic look)
        let grad = ctx.createRadialGradient(ball.x-ballRadius/2, ball.y-ballRadius/2, ballRadius/4, ball.x, ball.y, ballRadius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, '#bbb');
        grad.addColorStop(1, '#888');
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1.1;
        ctx.stroke();
    }
    pachinko70sShader.balls = newBalls;
    // Draw pegs (brass look)
    for (const peg of pegs) {
        let grad = ctx.createRadialGradient(peg.x-pegRadius/2, peg.y-pegRadius/2, pegRadius/4, peg.x, peg.y, pegRadius);
        grad.addColorStop(0, '#fff6c1');
        grad.addColorStop(0.5, '#e2b84a');
        grad.addColorStop(1, '#a88c2a');
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.shadowColor = '#ffe680';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#a88c2a';
        ctx.lineWidth = 1.1;
        ctx.stroke();
    }
    // (No jackpot pocket)
    // Draw slots
    for (const slot of slots) {
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, ballRadius * 1.1, 0, 2 * Math.PI);
        ctx.fillStyle = '#444';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}
