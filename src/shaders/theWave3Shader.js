// Shader 16: The Wave 3 (randomized phase and position)
export function theWave3Shader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    const cols = 18;
    const rows = 14;
    const rectW = width / cols;
    const rectH = height / rows;
    // Deterministic random for stable layout
    function seededRandom(seed) {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    function lerpColor(a, b, t) {
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t)
        ];
    }
    const colorA = [
        40 + 80 * Math.sin(t * 0.3),
        120 + 80 * Math.sin(t * 0.4 + 1),
        255 + 0 * Math.sin(t * 0.5 + 2)
    ];
    const colorB = [
        255 + 0 * Math.sin(t * 0.2 + 2),
        80 + 80 * Math.sin(t * 0.25 + 1.5),
        120 + 80 * Math.sin(t * 0.33 + 2.5)
    ];
    for (let row = 0; row < rows; ++row) {
        for (let col = 0; col < cols; ++col) {
            const gradT = (col + row) / (cols + rows - 2);
            const color = lerpColor(colorA, colorB, gradT + 0.15 * Math.sin(t * 0.7 + gradT * 4));
            // Randomize phase and position
            const seed = row * 100 + col;
            const randPhase = seededRandom(seed) * Math.PI * 2;
            const randX = (seededRandom(seed + 1) - 0.5) * rectW * 0.5;
            const randY = (seededRandom(seed + 2) - 0.5) * rectH * 0.5;
            const phase = gradT * Math.PI * 2 + t * 1.5 + randPhase;
            const cx = col * rectW + rectW / 2 + randX;
            const cy = row * rectH + rectH / 2 + randY;
            const w = rectW * 0.8;
            const h = rectH * 0.8;
            const angle = Math.sin(phase) * Math.PI * 0.5;
            const corners = [
                [-w/2, -h/2, 0], [w/2, -h/2, 0], [w/2, h/2, 0], [-w/2, h/2, 0]
            ].map(([x, y, z]) => {
                let y1 = y * Math.cos(angle) - z * Math.sin(angle);
                let z1 = y * Math.sin(angle) + z * Math.cos(angle);
                const fov = 600;
                const scale = fov / (fov + z1);
                return [cx + x * scale, cy + y1 * scale];
            });
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
