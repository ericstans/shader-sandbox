// Shader: Starfield (Windows 95 screensaver style)
function starfieldShader(ctx, t, width = 1000, height = 1000) {
    // Attach click handler once to restart starfield on click
    if (!starfieldShader._clickHandlerAttached) {
        const canvas = ctx.canvas;
        starfieldShader._canvas = canvas;
        starfieldShader._clickHandler = function() {
            // Reset persistent state
            delete starfieldShader.stars;
            delete starfieldShader.lastW;
            delete starfieldShader.lastH;
        };
        canvas.addEventListener('click', starfieldShader._clickHandler);
        starfieldShader._clickHandlerAttached = true;
    }
    // Number of stars
    const numStars = 220;
    // Static star positions and speeds
    if (!starfieldShader.stars || starfieldShader.lastW !== width || starfieldShader.lastH !== height) {
        starfieldShader.stars = [];
        for (let i = 0; i < numStars; ++i) {
            // Start near the center, random angle, random speed
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 40 + 10;
            const speed = 0.18 + Math.random() * 0.22;
            starfieldShader.stars.push({
                angle,
                radius,
                speed,
                size: Math.random() * 1.2 + 0.7,
                color: `hsl(${Math.floor(Math.random()*60+200)},100%,${Math.floor(Math.random()*30+70)}%)`,
                offset: Math.random() * 1000
            });
        }
        starfieldShader.lastW = width;
        starfieldShader.lastH = height;
    }
    // Clear
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // Center
    const cx = width / 2;
    const cy = height / 2;
    // Animate and draw stars
    for (let i = 0; i < numStars; ++i) {
        let s = starfieldShader.stars[i];
        // Star moves outward from center
        let r = s.radius + (t * 60 + s.offset) * s.speed;
        // Wrap around if out of bounds
        if (r > Math.max(width, height) * 0.7) {
            s.radius = Math.random() * 40 + 10;
            s.angle = Math.random() * Math.PI * 2;
            s.speed = 0.18 + Math.random() * 0.22;
            s.size = Math.random() * 1.2 + 0.7;
            s.color = `hsl(${Math.floor(Math.random()*60+200)},100%,${Math.floor(Math.random()*30+70)}%)`;
            s.offset = Math.random() * 1000;
            r = s.radius;
        }
        const x = cx + Math.cos(s.angle) * r;
        const y = cy + Math.sin(s.angle) * r;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, 2 * Math.PI);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.restore();
    }
    // Optional: add a faint center glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.18);
    grad.addColorStop(0, 'rgba(255,255,255,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, width * 0.18, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}
export default starfieldShader;
