// Shader: Ballpoint Pen Drawing 2 (Animated Doodle)
// Draws a thin black line that slowly appears, simulating a continuous hand-drawn doodle.

export function ballpointPen2Shader(ctx, t, width = 1000, height = 1000) {
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
    // Animation: let the line continue forever, using a moving window
    const pointsToShow = 800;
    const totalSteps = Math.floor(t * 120); // 120 points per second
    // Start at origin
    let x = width * 0.1;
    let y = height * 0.1;
    let angle = Math.PI / 4;
    // Precompute the full path up to totalSteps
    let points = [{ x, y }];
    function rand(seed) {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    let seed = 0;
    for (let i = 1; i <= totalSteps; ++i) {
        angle += (rand(seed + i * 0.7) - 0.5) * noiseScale;
        x += Math.cos(angle) * stepLen;
        y += Math.sin(angle) * stepLen;
        // Bounce off edges
        if (x < 0) { x = 0; angle = Math.PI - angle; }
        if (x > width) { x = width; angle = Math.PI - angle; }
        if (y < 0) { y = 0; angle = -angle; }
        if (y > height) { y = height; angle = -angle; }
        points.push({ x, y });
    }
    // Draw only the most recent pointsToShow points
    ctx.beginPath();
    let startIdx = Math.max(0, points.length - pointsToShow);
    ctx.moveTo(points[startIdx].x, points[startIdx].y);
    for (let i = startIdx + 1; i < points.length; ++i) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
}
