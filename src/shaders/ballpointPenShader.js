// Shader: Ballpoint Pen Drawing
// Draws a thin black line that curves and splines randomly, creating a scribble from the origin.

export function ballpointPenShader(ctx, t, width = 1000, height = 1000) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = Math.max(1, width / 400);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Parameters
    const steps = 1200;
    const stepLen = width / 180;
    const noiseScale = 0.13;
    // Start at origin
    let x = width * 0.1;
    let y = height * 0.1;
    let angle = Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Use a seeded pseudo-random for repeatability
    function rand(seed) {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    let seed = t * 0.1;
    for (let i = 0; i < steps; ++i) {
        // Randomly curve the angle
        angle += (rand(seed + i * 0.7) - 0.5) * noiseScale;
        x += Math.cos(angle) * stepLen;
        y += Math.sin(angle) * stepLen;
        ctx.lineTo(x, y);
        // Bounce off edges
        if (x < 0 || x > width) angle = Math.PI - angle;
        if (y < 0 || y > height) angle = -angle;
    }
    ctx.stroke();
    ctx.restore();
}
