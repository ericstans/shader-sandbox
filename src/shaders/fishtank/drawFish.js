// Draw a single fish on the canvas
// Exports: drawFish(ctx, f, t)

/**
 * Draw a fish on the canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} f - fish object
 * @param {number} t - time
 */
export function drawFish(ctx, f, t) {
    ctx.save();
    ctx.translate(f.x, f.y);

    // Draw behavior label BEFORE flipping, so text is always readable
    if (typeof f.behavior === 'string' && f.behavior) {
        ctx.save();
        ctx.font = `${Math.max(12, Math.round(f.size * 1.2))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // Draw background for readability
        const label = f.behavior;
        const padY = f.size * f.species.body.ry + 6;
        const metrics = ctx.measureText(label);
        const bgW = metrics.width + 10;
        const bgH = Math.max(18, Math.round(f.size * 1.2));
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#222';
        ctx.fillRect(-bgW/2, -padY - bgH + 2, bgW, bgH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.fillText(label, 0, -padY);
        ctx.restore();
    }

    if (f.flip) ctx.scale(-1, 1);
    ctx.rotate(Math.sin(t * 0.7 + f.x * 0.01 + f.y * 0.01) * 0.1);
    // --- Draw tail by species ---
    ctx.beginPath();
    let tailLen = f.size * (f.species.tail.len);
    let tailHeight = f.size * (f.species.tail.height);
    if (f.species.tail.style === 'sturgeon') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.lineTo(-f.size * f.species.body.rx - f.size * f.species.tail.len * 1.1, -tailHeight * 0.7);
        ctx.lineTo(-f.size * f.species.body.rx - f.size * f.species.tail.len * 1.3, 0);
        ctx.lineTo(-f.size * f.species.body.rx - f.size * f.species.tail.len * 1.1, tailHeight * 0.7);
        ctx.closePath();
    } else if (f.species.tail.style === 'fan') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, -tailHeight);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, tailHeight);
        ctx.closePath();
    } else if (f.species.tail.style === 'fork') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, -tailHeight * 0.7);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen * 0.7, 0);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, tailHeight * 0.7);
        ctx.closePath();
    } else if (f.species.tail.style === 'veil') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.bezierCurveTo(-f.size * f.species.body.rx - tailLen * 0.7, -tailHeight * 1.2, -f.size * f.species.body.rx - tailLen * 1.1, tailHeight * 1.2, -f.size * f.species.body.rx - tailLen, 0);
        ctx.closePath();
    } else if (f.species.tail.style === 'triangle') {
        ctx.moveTo(-f.size * f.species.body.rx, 0);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, -tailHeight);
        ctx.lineTo(-f.size * f.species.body.rx - tailLen, tailHeight);
        ctx.closePath();
    }
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    // --- Draw body by species ---
    ctx.beginPath();
    ctx.ellipse(0, 0, f.size * f.species.body.rx, f.size * f.species.body.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();

    // Clown Loach stripes (drawn over body, clipped to body shape)
    if (f.species.name === 'Clown Loach' && f.species.hasStripes) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size * f.species.body.rx, f.size * f.species.body.ry, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = '#222';
        let bandAngles = [0.18, 0.08, -0.12];
        let bandOffsets = [-0.45, 0, 0.38];
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(bandAngles[i]);
            ctx.beginPath();
            ctx.ellipse(f.size * bandOffsets[i], 0, f.size * 0.11, f.size * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    // --- Draw spikes for Sturgeon ---
    if (f.species.name === 'Sturgeon') {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#e0f8d0';
        ctx.fillStyle = '#e0f8d0';
        let nSpikes = 7;
        let bodyLen = f.size * f.species.body.rx * 1.8;
        let bodyTopY = -f.size * f.species.body.ry;
        for (let i = 1; i < nSpikes - 3; i++) {
            let frac = i / (nSpikes - 1);
            let spikeX = -f.size * f.species.body.rx + frac * bodyLen;
            let spikeY = bodyTopY + 5;
            let spikeH = f.size * 0.22 + Math.sin(t * 0.5 + i) * f.size * 0.03;
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(spikeX, spikeY - spikeH);
            ctx.lineTo(spikeX + f.size * 0.08, spikeY - spikeH * 0.7);
            ctx.lineTo(spikeX - f.size * 0.08, spikeY - spikeH * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
    // --- Optional stripe for Neon Tetra ---
    if (f.species.stripe) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size * f.species.body.rx * 0.9, f.size * f.species.body.ry * 0.35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = f.size * 0.09;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();
    }
    // --- Eye ---
    if (f.species.whiskers) {
        ctx.save();
        ctx.strokeStyle = '#b98c4a';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.7;
        for (let w = -1; w <= 1; w += 2) {
            ctx.beginPath();
            ctx.moveTo(f.size * 0.9, f.size * 0.13 * w);
            ctx.quadraticCurveTo(f.size * 1.1, f.size * 0.18 * w, f.size * 1.18, f.size * 0.22 * w);
            ctx.stroke();
        }
        ctx.restore();
    }
    if (f.species.bigEye) {
        ctx.beginPath();
        ctx.arc(f.size * 0.18, 0, f.size * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = f.species.eye || '#fff';
        ctx.globalAlpha = 0.97;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.size * 0.18, 0, f.size * 0.11, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.size * 0.22, -f.size * 0.06, f.size * 0.04, 0, Math.PI * 2);
        ctx.fillStyle = '#fff8';
        ctx.globalAlpha = 1;
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(f.size * 0.32, -f.size * 0.08, f.size * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = f.species.eye || '#fff';
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.size * 0.36, -f.size * 0.08, f.size * 0.04, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.globalAlpha = 1;
        ctx.fill();
    }
    ctx.restore();
}
