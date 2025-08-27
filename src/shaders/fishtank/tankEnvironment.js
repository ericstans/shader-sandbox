// Tank environment drawing and logic for fish tank simulation

export function drawPlants(ctx, plants, t) {
    for (let p of plants) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p.x, p.baseY);
        let sway = Math.sin(t * 1.3 + p.x * 0.06) * 5;
        ctx.bezierCurveTo(p.x + sway, p.baseY - p.h * 0.3, p.x - sway * 0.5, p.baseY - p.h * 0.7, p.x + sway * 0.2, p.baseY - p.h);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lw;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();
    }
}

export function drawRocks(ctx, rocks) {
    for (let r of rocks) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.rx, r.ry, r.rot, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.globalAlpha = r.alpha;
        ctx.shadowColor = '#222';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
    }
}

export function drawCaustics(ctx, width, height, t) {
    ctx.save();
    ctx.globalAlpha = 0.13;
    for (let i = 0; i < 18; i++) {
        let phase = t * 0.12 + i * 0.7;
        let amp = 18 + Math.sin(phase * 1.2 + i) * 8;
        let y = (height / 18) * i + Math.sin(phase) * 8;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 4) {
            let yoff = Math.sin(phase + x * 0.03 + Math.sin(x * 0.01 + phase) * 0.7) * amp * 0.08;
            ctx.lineTo(x, y + yoff);
        }
        ctx.strokeStyle = `rgba(180,220,255,0.18)`;
        ctx.lineWidth = 2.2 + Math.sin(phase * 1.3) * 0.7;
        ctx.stroke();
    }
    ctx.restore();
}

export function drawBubbles(ctx, bubbles, t, width, height) {
    for (let b of bubbles) {
        ctx.save();
        ctx.globalAlpha = 0.18 + Math.sin(t * 0.7 + b.x * 0.01 + b.y * 0.01) * 0.12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
        b.y -= b.vy;
        if (b.y < -b.r) {
            b.x = Math.random() * width;
            b.y = height + b.r + Math.random() * 20;
            b.r = 3 + Math.random() * 4;
            b.vy = 0.5 + Math.random() * 0.7;
        }
    }
}
