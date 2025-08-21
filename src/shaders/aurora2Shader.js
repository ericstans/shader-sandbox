// Aurora Borealis Shader v2 (wispy electromagnetic effect)
export function aurora2Shader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#1a2a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Wispy aurora bands
    for (let band = 0; band < 3; ++band) {
        // Draw to an offscreen canvas for alpha masking
        const bandCanvas = document.createElement('canvas');
        bandCanvas.width = width;
        bandCanvas.height = height;
        const bandCtx = bandCanvas.getContext('2d');
        bandCtx.save();
        bandCtx.globalAlpha = 0.22 + 0.16 * Math.sin(t * 0.7 + band);
        let baseY = height * (0.22 + band * 0.18);
        let colorStops = [
            ['#baffff', '#7fffd4', '#00ffcc'],
            ['#ffb3ff', '#aaccff', '#99ffcc'],
            ['#fff799', '#aaffee', '#b3aaff']
        ];
        let g = bandCtx.createLinearGradient(0, baseY - 120, 0, baseY + 180);
        g.addColorStop(0, colorStops[band][0]);
        g.addColorStop(0.3, colorStops[band][1]);
        g.addColorStop(0.7, colorStops[band][2]);
        g.addColorStop(1, 'rgba(26,42,74,0)');
        bandCtx.strokeStyle = g;
        bandCtx.lineWidth = 88 - band * 18;
        bandCtx.shadowColor = colorStops[band][0];
        bandCtx.shadowBlur = 64 - band * 10;
        // Draw slightly beyond the canvas edges to hide rectangle ends
        const xStart = -80;
        const xEnd = width + 80;
        bandCtx.beginPath();
        for (let x = xStart; x <= xEnd; x += 2) {
            let phase = t * 0.7 + x * 0.004 + band * 1.2;
            let y = baseY
                + Math.sin(phase) * (68 + 22 * band)
                + Math.cos(phase * 0.6) * (32 + 12 * band)
                + Math.sin(phase * 0.23 + Math.cos(t + x * 0.002) * 0.7) * 18
                + Math.cos(phase * 0.13 + Math.sin(t * 0.7 + x * 0.001) * 0.8) * 12;
            bandCtx.lineTo(x, y);
        }
        bandCtx.stroke();
        bandCtx.restore();
        // Create a vertical alpha gradient mask (fog/vapor effect)
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');
        const maskGrad = maskCtx.createLinearGradient(0, baseY - 180, 0, baseY + 220);
        maskGrad.addColorStop(0, 'rgba(0,0,0,0)');
        maskGrad.addColorStop(0.18, 'rgba(0,0,0,0.12)');
        maskGrad.addColorStop(0.32, 'rgba(0,0,0,0.32)');
        maskGrad.addColorStop(0.5, 'rgba(0,0,0,1)');
        maskGrad.addColorStop(0.68, 'rgba(0,0,0,0.32)');
        maskGrad.addColorStop(0.82, 'rgba(0,0,0,0.12)');
        maskGrad.addColorStop(1, 'rgba(0,0,0,0)');
        maskCtx.fillStyle = maskGrad;
        maskCtx.fillRect(0, 0, width, height);
        // Apply the mask to the band
        bandCtx.globalCompositeOperation = 'destination-in';
        bandCtx.drawImage(maskCanvas, 0, 0);
        // Draw the masked band to the main canvas
        ctx.drawImage(bandCanvas, 0, 0);
    }
    // Subtle vertical noise for electromagnetic effect
    let imgData = ctx.getImageData(0, 0, width, height);
    let d = imgData.data;
    for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
            let idx = 4 * (y * width + x);
            let n = Math.floor(Math.random() * 16) - 8;
            d[idx + 1] = Math.min(255, Math.max(0, d[idx + 1] + n));
            d[idx + 2] = Math.min(255, Math.max(0, d[idx + 2] + n));
        }
    }
    ctx.putImageData(imgData, 0, 0);
    // Stars
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 80; ++i) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 1.1 + 0.2, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }
    ctx.restore();
}
