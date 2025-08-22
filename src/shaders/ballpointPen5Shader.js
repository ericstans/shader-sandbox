// Shader: Ballpoint Pen Drawing 5 (5 Persistent, Synchronized Pastel Lines)
// Draws 5 persistent lines in different pastel colors, all growing at the same speed.

export function ballpointPen5Shader(ctx, t, width = 1000, height = 1000) {
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = Math.max(1.5, width / 350);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Parameters
    const numLines = 5;
    const stepLen = width / 180;
    const noiseScale = 0.13;
    const pastelColors = [
        '#ffb3ba', // pastel red
        '#bae1ff', // pastel blue
        '#baffc9', // pastel green
        '#ffffba', // pastel yellow
        '#ffdfba'  // pastel orange
    ];
    const steps = Math.floor(t * 120); // All lines grow at the same rate
    for (let l = 0; l < numLines; ++l) {
        // Each line has its own seed, start, and color
        let x = width * (0.15 + 0.7 * l / (numLines - 1));
        let y = height * (0.15 + 0.7 * l / (numLines - 1));
        let angle = Math.PI / 4 + l * Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        function rand(seed) {
            let x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        }
        let seed = l * 1000;
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
        ctx.strokeStyle = pastelColors[l % pastelColors.length];
        ctx.shadowColor = pastelColors[l % pastelColors.length];
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}
