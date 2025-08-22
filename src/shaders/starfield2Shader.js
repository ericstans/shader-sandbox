// Shader: Starfield 2 (classic hyperspace, white dots, flying through)
export function starfield2Shader(ctx, t, width = 1000, height = 1000) {
    // Number of stars
    const numStars = 320;
    // Initialize static star positions and speeds
    if (!starfield2Shader.stars || starfield2Shader.lastW !== width || starfield2Shader.lastH !== height) {
        starfield2Shader.stars = [];
        for (let i = 0; i < numStars; ++i) {
            // Random position in 3D space
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 0.7 + 0.3; // radial distance (normalized)
            const z = Math.random() * 1.2 + 0.05; // depth (0.05=far, 1.25=close)
            starfield2Shader.stars.push({
                angle,
                dist,
                z,
                speed: 0.7 + Math.random() * 0.7,
                size: Math.random() * 1.1 + 0.7
            });
        }
        starfield2Shader.lastW = width;
        starfield2Shader.lastH = height;
    }
    // Clear
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // Center
    const cx = width / 2;
    const cy = height / 2;
    // Animate and draw stars
    for (let i = 0; i < numStars; ++i) {
        let s = starfield2Shader.stars[i];
        // Move star toward camera
        s.z -= s.speed * 0.012 * (1.2 + Math.sin(t * 0.13));
        if (s.z < 0.05) {
            // Reset star to far away
            s.angle = Math.random() * Math.PI * 2;
            s.dist = Math.random() * 0.7 + 0.3;
            s.z = 1.25;
            s.speed = 0.7 + Math.random() * 0.7;
            s.size = Math.random() * 1.1 + 0.7;
        }
        // Project 3D to 2D
        const proj = 0.48 / s.z;
        const x = cx + Math.cos(s.angle) * s.dist * width * proj;
        const y = cy + Math.sin(s.angle) * s.dist * height * proj;
        // Draw star (white, with a streak for hyperspace effect)
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, s.size * proj * 0.7, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = Math.max(0.18, Math.min(1, 0.38 + 0.85 * (1 - s.z)));
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8 * proj;
        ctx.fill();
        // Draw streak (motion blur)
        if (proj > 1.1) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - Math.cos(s.angle) * 18 * proj, y - Math.sin(s.angle) * 18 * proj);
            ctx.strokeStyle = 'rgba(255,255,255,0.32)';
            ctx.lineWidth = 1.2 * proj;
            ctx.stroke();
        }
        ctx.restore();
    }
}
