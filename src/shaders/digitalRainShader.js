// Digital Rain (Matrix) Shader
export function digitalRainShader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    const fontSize = 20;
    const columns = Math.floor(width / fontSize);
    if (!digitalRainShader.drops || digitalRainShader.drops.length !== columns) {
        digitalRainShader.drops = Array(columns).fill(0).map(() => Math.random() * height);
    }
    const drops = digitalRainShader.drops;
    ctx.font = fontSize + 'px monospace';
    ctx.fillStyle = '#003300';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < columns; i++) {
        const text = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
        ctx.fillStyle = '#00ff41';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 8;
        ctx.fillText(text, i * fontSize, drops[i]);
        ctx.shadowBlur = 0;
        drops[i] += fontSize + Math.random() * 4;
        if (drops[i] > height && Math.random() > 0.975) {
            drops[i] = 0;
        }
    }
}
