
// Shader 7: Dancing Lines (Oskar Fischinger 1930 inspired)
export function dancingLinesShader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Parameters
    const numLines = 18;
    const numPoints = 80;
    const margin = 80;
    // Color palette (Fischinger style: bold, simple, rhythmic)
    const palette = [
        '#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffbe0b', '#fb5607', '#8338ec', '#3a86ff'
    ];
    for (let i = 0; i < numLines; ++i) {
        // Each line has its own phase and amplitude
        const phase = t * 0.8 + i * 0.5;
        const amp = 120 + 40 * Math.sin(t * 0.3 + i);
        ctx.beginPath();
        for (let j = 0; j < numPoints; ++j) {
            const x = margin + (width - 2 * margin) * (j / (numPoints - 1));
            // Rhythmic, musical undulation
            const y = height/2 + (i - numLines/2) * 28
                + Math.sin(phase + j * 0.18 + Math.sin(t*0.7 + i*0.2 + j*0.05)*0.7) * amp * Math.sin(t*0.5 + i*0.13);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = palette[i % palette.length];
        ctx.lineWidth = 4 + 2 * Math.sin(t + i);
        ctx.globalAlpha = 0.85;
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}
