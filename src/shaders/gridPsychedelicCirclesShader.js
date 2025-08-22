// gridPsychedelicCirclesShader.js
// Shader: Many concentric pastel circles with animated size, thickness, and psychedelic trails

const pastelColors = [
    '#ffd1dc', '#b5ead7', '#c7ceea', '#ffdac1', '#e2f0cb', '#f1cbff', '#c1c8e4', '#f7d6e0', '#f9f6c1', '#d0f4de'
];

let circles = [];
let trailCanvas, trailCtx;

function resetState(width, height) {
    circles = [];
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.45;
    const count = 18;
    for (let i = 0; i < count; i++) {
        circles.push({
            baseR: maxR * (i + 1) / count,
            color: pastelColors[i % pastelColors.length],
            phase: Math.random() * Math.PI * 2,
            freq: 0.2 + Math.random() * 0.3,
            thickBase: 2 + Math.random() * 6,
            thickFreq: 0.5 + Math.random() * 0.5,
            thickPhase: Math.random() * Math.PI * 2
        });
    }
    // Setup trail canvas
    trailCanvas = document.createElement('canvas');
    trailCanvas.width = width;
    trailCanvas.height = height;
    trailCtx = trailCanvas.getContext('2d');
    trailCtx.clearRect(0, 0, width, height);
}

function animate(ctx, t, width, height) {
    if (!trailCanvas || trailCanvas.width !== width || trailCanvas.height !== height) {
        resetState(width, height);
    }
    // Fade trails
    trailCtx.globalAlpha = 0.18;
    trailCtx.fillStyle = '#222'; // dark grey for trails
    trailCtx.fillRect(0, 0, width, height);
    trailCtx.globalAlpha = 1.0;

    const cx = width / 2;
    const cy = height / 2;
    for (let i = 0; i < circles.length; i++) {
        const c = circles[i];
        // Animate radius and thickness
        const r = c.baseR * (1 + 0.13 * Math.sin(t * c.freq + c.phase + i * 0.2));
        const thick = c.thickBase + 6 * Math.sin(t * c.thickFreq + c.thickPhase + i * 0.3);
        trailCtx.save();
        trailCtx.strokeStyle = c.color;
        trailCtx.lineWidth = Math.max(1, thick);
        trailCtx.shadowColor = c.color;
        trailCtx.shadowBlur = 16 + 8 * Math.sin(t * 0.7 + i);
        trailCtx.beginPath();
        trailCtx.arc(cx, cy, r, 0, Math.PI * 2);
        trailCtx.stroke();
        trailCtx.restore();
    }
    // Draw trails to main ctx
    ctx.fillStyle = '#222'; // dark grey for main background
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(trailCanvas, 0, 0);
}

export default {
    name: 'Psychedelic Circles',
    animate,
    resetState
};
