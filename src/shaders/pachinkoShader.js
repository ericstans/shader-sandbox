// Shader: Pachinko Simulation
// Simulates balls bouncing off pegs and falling into slots, with auto-launched balls.

function pachinkoShader(ctx, t, width = 1000, height = 1000) {
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    // Parameters
    const nRows = 10, nCols = 11;
    const pegRadius = width / 80;
    const ballRadius = width / 40;
    const slotCount = nCols - 1;
    const gravity = width / 900;
    // Peg positions
    let pegs = [];
    for (let row = 0; row < nRows; ++row) {
        for (let col = 0; col < nCols; ++col) {
            let x = width * (0.1 + 0.8 * (col + (row % 2) * 0.5) / nCols);
            let y = width * (0.1 + 0.7 * row / nRows);
            pegs.push({ x, y });
        }
    }
    // Slot positions
    let slots = [];
    for (let i = 0; i < slotCount; ++i) {
        let x = width * (0.1 + 0.8 * (i + 0.5) / nCols);
        let y = width * 0.92;
        slots.push({ x, y });
    }
    // Ball state (persistent)
    if (!pachinkoShader.balls) pachinkoShader.balls = [];
    if (!pachinkoShader.lastLaunch) pachinkoShader.lastLaunch = 0;
    // Launch new balls every 0.7s
    if (t - pachinkoShader.lastLaunch > 0.7) {
        pachinkoShader.balls.push({
            x: width * 0.5 + (Math.random() - 0.5) * width * 0.1,
            y: width * 0.08,
            vx: (Math.random() - 0.5) * width / 350,
            vy: 0,
            color: pastel(Math.floor(Math.random() * 8)),
            slot: null
        });
        pachinkoShader.lastLaunch = t;
    }
    // Update and draw balls
    for (const ball of pachinkoShader.balls) {
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
            if (ball.x < ballRadius) { ball.x = ballRadius; ball.vx = Math.abs(ball.vx); }
            if (ball.x > width - ballRadius) { ball.x = width - ballRadius; ball.vx = -Math.abs(ball.vx); }
            // Check for slot
            if (ball.y > width * 0.91) {
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
            }
        }
        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, 2 * Math.PI);
        ctx.fillStyle = ball.color;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }
    // Draw pegs
    for (const peg of pegs) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#eee';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1.1;
        ctx.stroke();
    }
    // Draw slots
    for (const slot of slots) {
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, ballRadius * 1.1, 0, 2 * Math.PI);
        ctx.fillStyle = '#444';
        ctx.fill();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}
export default pachinkoShader;

function pastel(i) {
    const colors = [
        '#ffb3ba', '#bae1ff', '#baffc9', '#ffffba', '#ffdfba', '#e2baff', '#baffea', '#ffd6ba'
    ];
    return colors[i % colors.length];
}
