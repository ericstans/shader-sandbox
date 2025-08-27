import { MAX_LILY_PADS, LILY_PAD_SPAWN_CHANCE } from "./constants.js";
// Lily pad spawning, animation, and drawing for fish tank simulation

export function spawnLilyPads(lilyPads, width, WALL_WIDTH) {
    //if (!lilyPads) lilyPads = [];
    if (lilyPads.length < MAX_LILY_PADS && Math.random() < LILY_PAD_SPAWN_CHANCE) {
        // Spawn a lily pad at a random X, floating at the top, with drop-in animation
        let padW = 38 + Math.random() * 22;
        let padH = padW * (0.7 + Math.random() * 0.2);
        let padX = WALL_WIDTH + padW / 2 + Math.random() * (width - 2 * WALL_WIDTH - padW);
        let padY = WALL_WIDTH + padH / 2 + Math.random() * 8;
        let rot = Math.random() * Math.PI * 0.2 - 0.4;
        let color = 'hsl(' + (90 + Math.random() * 30) + ', 60%, 38%)';
        let skew = Math.random() * 0.2 - 0.1;
        let veinBaseAngle = Math.random() * Math.PI * 2;
        // 20% chance for a bug, 10% for a flower, mutually exclusive
        let hasBug = Math.random() < 0.2;
        let hasFlower = !hasBug && Math.random() < 0.1;
        let bugType = hasBug ? (Math.random() < 0.5 ? 'ladybug' : 'bee') : null;
        // Drop-in animation: start above, animate to padY
        let appearTime = performance.now();
        let startY = padY - 60 - Math.random() * 40;
        lilyPads.push({ x: padX, y: padY, w: padW, h: padH, rot, color, skew, veinBaseAngle, hasBug, hasFlower, bugType, appearTime, startY, animating: true });
    }
    return lilyPads;
}

export function drawLilyPads(ctx, lilyPads, t) {
    for (let pad of lilyPads) {
        ctx.save();
        // Animate floating left/right
        let floatX = pad.x + Math.sin(t * 0.22 + pad.x * 0.013) * 18;
        // Drop-in animation: animate y from startY to pad.y over 0.7s with ease-out bounce
        let dropDuration = 700; // ms
        let now = performance.now();
        let dropT = 1;
        if (pad.animating && pad.appearTime) {
            dropT = Math.min(1, (now - pad.appearTime) / dropDuration);
            // Ease-out bounce
            let easeT = dropT < 1 ? (1 - Math.pow(1 - dropT, 2.5)) : 1;
            let bounce = dropT < 1 ? Math.abs(Math.sin(Math.PI * easeT * 2.2) * (1 - easeT) * 8) : 0;
            var drawY = pad.startY + (pad.y - pad.startY) * easeT + bounce;
            if (dropT >= 1) pad.animating = false;
        } else {
            var drawY = pad.y;
        }
        ctx.translate(floatX, drawY);
        // Perspective skew: compress Y, skew X by a small amount
        ctx.transform(1, 0, pad.skew, 0.65, 0, 0); // [a, b, c, d, e, f]
        ctx.rotate(pad.rot + Math.sin(t * 0.1 + pad.x * 0.01) * 0.08);
        // Radial gradient for shading/highlight
        let grad = ctx.createRadialGradient(0, 0, pad.w * 0.1, 0, 0, pad.w);
        grad.addColorStop(0, 'rgba(255,255,255,0.18)');
        grad.addColorStop(0.5, pad.color);
        grad.addColorStop(1, 'rgba(40,80,30,0.7)');
        ctx.beginPath();
        ctx.ellipse(0, 0, pad.w, pad.h, 0, 0, Math.PI * 2);
        // Notch
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, pad.w, -Math.PI / 8, Math.PI / 8, false);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.82;
        ctx.shadowColor = '#1a3a1a';
        ctx.shadowBlur = 8;
        ctx.fill();

        // Draw veins: subtle curved lines from center to edge, with random group direction
        ctx.save();
        // Apply the same skew and scale as the pad body
        ctx.transform(1, 0, pad.skew, 0.65, 0, 0);
        ctx.rotate(pad.veinBaseAngle || 0);
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = '#eaf7d0';
        ctx.lineWidth = 1.1;
        let nVeins = 5 + Math.floor(pad.w / 12);
        for (let i = 0; i < nVeins; i++) {
            let angle = -Math.PI / 7 + (i / (nVeins - 1)) * (Math.PI / 3.5);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Main control point: fixed for all veins
            let cpR = pad.w * 0.45;
            let cpA = angle;
            // End point: edge of pad
            let endR = pad.w * 0.97;
            let endA = angle;
            ctx.bezierCurveTo(
                Math.cos(cpA) * cpR, Math.sin(cpA) * cpR * 0.7,
                Math.cos(cpA) * cpR * 0.7, Math.sin(cpA) * cpR * 0.5,
                Math.cos(endA) * endR, Math.sin(endA) * endR * 0.7
            );
            ctx.lineWidth = 1.1 - 0.5 * (i === Math.floor(nVeins / 2) ? 0 : Math.abs(i - nVeins / 2) / nVeins); // center vein thicker
            ctx.globalAlpha = 0.22 - 0.08 * Math.abs(i - nVeins / 2) / nVeins;
            ctx.stroke();
        }
        // Draw bug or flower if present
        if (pad.hasBug) {
            ctx.save();
            // Place bug near edge, random angle
            let bugA = Math.PI / 2 + Math.sin(pad.x) * 1.2;
            let bugR = pad.w * 0.68;
            let bx = Math.cos(bugA) * bugR;
            let by = Math.sin(bugA) * bugR * 0.7;
            ctx.translate(bx, by);
            ctx.rotate(bugA + Math.PI / 2);
            if (pad.bugType === 'ladybug') {
                // Ladybug: red oval with black spots
                ctx.beginPath();
                ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#d22';
                ctx.globalAlpha = 0.95;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, -2, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#222';
                ctx.fill();
                // Spots
                ctx.beginPath(); ctx.arc(-2, 0, 0.7, 0, Math.PI * 2); ctx.arc(2, 0, 0.7, 0, Math.PI * 2);
                ctx.fillStyle = '#222'; ctx.fill();
            } else if (pad.bugType === 'bee') {
                // Bee: yellow oval with black stripes
                ctx.beginPath();
                ctx.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#ffb800';
                ctx.globalAlpha = 0.95;
                ctx.fill();
                // Stripes
                ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-2, 2);
                ctx.moveTo(0, -2.5); ctx.lineTo(0, 2.5);
                ctx.moveTo(2, -2); ctx.lineTo(2, 2);
                ctx.strokeStyle = '#222'; ctx.lineWidth = 1.1; ctx.stroke();
                // Head
                ctx.beginPath(); ctx.arc(0, -2.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill();
                ctx.save();
                ctx.globalAlpha = 0.22;
                ctx.strokeStyle = '#eaf7d0';
                ctx.lineWidth = 1.1;
                let nVeins = 2 + Math.floor(pad.w / 20);
                for (let i = 0; i < nVeins; i++) {
                    let angle = -Math.PI / 7 + (i / (nVeins - 1)) * (Math.PI / 3.5);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    // Main control point: slightly wobbly, for organic look
                    let cpR = pad.w * (0.38 + 0.13 * Math.sin(i * 1.2 + t * 0.1 + pad.x * 0.03));
                    let cpA = angle + Math.sin(i + t * 0.13 + pad.x * 0.02) * 0.13;
                    // End point: edge of pad
                    let endR = pad.w * (0.97 + 0.02 * Math.cos(i * 1.7 + t * 0.09 + pad.x * 0.01));
                    let endA = angle + Math.sin(i * 1.5 + t * 0.11 + pad.x * 0.01) * 0.07;
                    ctx.bezierCurveTo(
                        Math.cos(cpA) * cpR, Math.sin(cpA) * cpR * 0.7,
                        Math.cos(cpA) * cpR * 0.7, Math.sin(cpA) * cpR * 0.5,
                        Math.cos(endA) * endR, Math.sin(endA) * endR * 0.7
                    );
                    ctx.lineWidth = 1.1 - 0.5 * (i === Math.floor(nVeins / 2) ? 0 : Math.abs(i - nVeins / 2) / nVeins); // center vein thicker
                    ctx.globalAlpha = 0.22 - 0.08 * Math.abs(i - nVeins / 2) / nVeins;
                    ctx.stroke();
                }
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffe066';
            ctx.globalAlpha = 0.98;
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
        ctx.restore();
    }
}