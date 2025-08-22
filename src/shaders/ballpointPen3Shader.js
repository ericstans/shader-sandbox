// Shader: Ballpoint Pen Drawing 3 (Cumulative Doodle)
// Draws a thin black line that continuously grows, never erasing previous sections.

export function ballpointPen3Shader(ctx, t, width = 1000, height = 1000) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = Math.max(1, width / 400);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Parameters
    const stepLen = width / 180;
    const noiseScale = 0.13;
    // Animation: how much of the line to show
    const steps = Math.floor(t * 120); // 120 points per second
    // Start at origin
    let x = width * 0.1;
    let y = height * 0.1;
    let angle = Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    function rand(seed) {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    let seed = 0;
    for (let i = 0; i < steps; ++i) {
        angle += (rand(seed + i * 0.7) - 0.5) * noiseScale;
        x += Math.cos(angle) * stepLen;
        y += Math.sin(angle) * stepLen;
        // Bounce off edges
        if (x < 0) { x = 0; angle = Math.PI - angle; }
        if (x > width) { x = width; angle = Math.PI - angle; }
        if (y < 0) { y = 0; angle = -angle; }
        if (y > height) { y = height; angle = -angle; }
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}
