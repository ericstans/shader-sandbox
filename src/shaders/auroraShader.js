// Aurora Borealis Shader
export function auroraShader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#1a2a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Aurora bands
    for (let band = 0; band < 4; ++band) {
        const baseY = height * (0.25 + band * 0.15);
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t + band);
        for (let i = 0; i < 3; ++i) {
            ctx.beginPath();
            ctx.moveTo(0, baseY);
            for (let x = 0; x <= width; x += 8) {
                const phase = t * (0.5 + 0.2 * band) + x * 0.002 + i * 1.2;
                const y = baseY + Math.sin(phase) * (30 + 18 * band) + Math.cos(phase * 0.7) * 12;
                ctx.lineTo(x, y);
            }
            const auroraColors = [
                ['#aaffee', '#55ff99', '#33ffcc'],
                ['#ffb3ff', '#aaccff', '#99ffcc'],
                ['#fff799', '#aaffee', '#b3aaff'],
                ['#99e6ff', '#b3ffb3', '#e6b3ff']
            ];
            const g = ctx.createLinearGradient(0, baseY - 40, 0, baseY + 60);
            g.addColorStop(0, auroraColors[band][0]);
            g.addColorStop(0.5, auroraColors[band][1]);
            g.addColorStop(1, auroraColors[band][2]);
            ctx.strokeStyle = g;
            ctx.lineWidth = 18 - band * 3 + i * 2;
            ctx.shadowColor = auroraColors[band][0];
            ctx.shadowBlur = 24 - band * 4;
            ctx.stroke();
        }
        ctx.restore();
    }
    // Stars
    ctx.save();
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 120; ++i) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 1.2 + 0.3, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }
    ctx.restore();
}
