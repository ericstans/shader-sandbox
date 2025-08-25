// Shader 14: The Wave (spinning 3D rectangles with gradient and phase offset)
function theWaveShader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Grid parameters
    const cols = 18;
    const rows = 14;
    const rectW = width / cols;
    const rectH = height / rows;
    // Gradient colors (top left to bottom right)
    function lerpColor(a, b, t) {
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t)
        ];
    }
    const colorA = [40, 120, 255]; // blue
    const colorB = [255, 80, 120]; // pink
    // 3D spin and projection
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            // Gradient t
            const gradT = (col + row) / (cols + rows - 2);
            const color = lerpColor(colorA, colorB, gradT);
            // 3D spin phase
            const phase = gradT * Math.PI * 2 + t * 1.5;
            // 3D rectangle corners (centered at cx, cy)
            const cx = col * rectW + rectW / 2;
            const cy = row * rectH + rectH / 2;
            const w = rectW * 0.8;
            const h = rectH * 0.8;
            // 3D rotation: end-over-end (X axis)
            const angle = Math.sin(phase) * Math.PI * 0.5;
            // Project corners
            const corners = [
                [-w/2, -h/2, 0], [w/2, -h/2, 0], [w/2, h/2, 0], [-w/2, h/2, 0]
            ].map(([x, y, z]) => {
                // Rotate around X axis
                let y1 = y * Math.cos(angle) - z * Math.sin(angle);
                let z1 = y * Math.sin(angle) + z * Math.cos(angle);
                // Perspective
                const fov = 600;
                const scale = fov / (fov + z1);
                return [cx + x * scale, cy + y1 * scale];
            });
            // Draw rectangle
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(corners[0][0], corners[0][1]);
            for (let i = 1; i < 4; ++i) ctx.lineTo(corners[i][0], corners[i][1]);
            ctx.closePath();
            ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
            ctx.globalAlpha = 0.92;
            ctx.fill();
            ctx.restore();
        }
    }
}
export default theWaveShader;
