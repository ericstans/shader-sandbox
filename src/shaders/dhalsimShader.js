// Dhalsim Shader: Animated portrait of Dhalsim from Street Fighter
// Exports: { displayName, animate, onResize }

const displayName = 'Dhalsim (Street Fighter)';

let startTime = null;

function animate(ctx, t, width, height) {
    // White mustache (above mouth, stylized)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-18, 54);
    ctx.quadraticCurveTo(-8, 44, 0, 54);
    ctx.quadraticCurveTo(8, 44, 18, 54);
    ctx.quadraticCurveTo(0, 60, -18, 54);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#eee';
    ctx.shadowBlur = 6;
    ctx.fill();
    // Mustache lines for texture
    ctx.strokeStyle = '#dde';
    ctx.lineWidth = 1.6;
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 4, 54);
        ctx.quadraticCurveTo(i * 2, 48, 0, 56);
        ctx.stroke();
    }
    ctx.restore();
    // ...existing code...
    // After mouth and necklace, before fire: draw white beard
    // White beard (below mouth, stylized)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-18, 68);
    ctx.bezierCurveTo(-10, 110, 10, 110, 18, 68);
    ctx.quadraticCurveTo(0, 120, -18, 68);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#eee';
    ctx.shadowBlur = 8;
    ctx.fill();
    // Beard lines for texture
    ctx.strokeStyle = '#dde';
    ctx.lineWidth = 2.2;
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 5, 75);
        ctx.quadraticCurveTo(i * 2, 105, 0, 115);
        ctx.stroke();
    }
    ctx.restore();
    // ...existing code...
    if (!startTime) startTime = performance.now();
    let elapsed = (performance.now() - startTime) / 1000;
    ctx.clearRect(0, 0, width, height);

    // Center and scale
    const cx = width / 2;
    // Center lower to account for long arms/legs
    const cy = height / 2 - 40 * (Math.min(width, height) / 400);
    const scale = Math.min(width, height) / 400;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Animate arms and legs with a slow, wavy motion
    let armWave = Math.sin(elapsed * 1.2) * 30;
    let armLift = Math.cos(elapsed * 0.8) * 18;
    let legWave = Math.sin(elapsed * 1.1) * 32;
    let legLift = Math.cos(elapsed * 0.7) * 22;

    // Long arms (crossed, stylized, animated)
    ctx.save();
    ctx.strokeStyle = '#a97c50';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    // Left arm
    ctx.beginPath();
    ctx.moveTo(-40, 70);
    ctx.bezierCurveTo(-120 + armWave, 160 + armLift, -80 + armWave, 260 + armLift, 0, 180);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(40, 70);
    ctx.bezierCurveTo(120 - armWave, 160 + armLift, 80 - armWave, 260 + armLift, 0, 180);
    ctx.stroke();
    ctx.restore();

    // Long legs (lotus pose, stylized, animated)
    ctx.save();
    ctx.strokeStyle = '#a97c50';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    // Left leg
    ctx.beginPath();
    ctx.moveTo(-20, 160);
    ctx.bezierCurveTo(-80 + legWave, 320 + legLift, 0, 340 + legLift, 40, 220);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(20, 160);
    ctx.bezierCurveTo(80 - legWave, 320 + legLift, 0, 340 + legLift, -40, 220);
    ctx.stroke();
    ctx.restore();

    // ...existing code...
    // Head (bald, brown)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 80, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#a97c50';
    ctx.shadowColor = '#000a';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    // Red paint stripes
    ctx.save();
    ctx.strokeStyle = '#d32b2b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-25, -30);
    ctx.lineTo(-10, 10);
    ctx.moveTo(0, -35);
    ctx.lineTo(0, 10);
    ctx.moveTo(25, -30);
    ctx.lineTo(10, 10);
    ctx.stroke();
    ctx.restore();

    // Eyes (closed, meditating)
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-20, 10, 12, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.arc(20, 10, 12, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.stroke();
    ctx.restore();

    // Nose
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, 35);
    ctx.strokeStyle = '#7a5632';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();


    // Mouth (gentle smile)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 50, 18, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.strokeStyle = '#7a5632';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // White mustache (above mouth, stylized, now bigger)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-28, 56);
    ctx.quadraticCurveTo(-18, 36, 0, 56);
    ctx.quadraticCurveTo(18, 36, 28, 56);
    ctx.quadraticCurveTo(0, 70, -28, 56);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#eee';
    ctx.shadowBlur = 10;
    ctx.fill();
    // Mustache lines for texture
    ctx.strokeStyle = '#dde';
    ctx.lineWidth = 2.2;
    for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 7, 56);
        ctx.quadraticCurveTo(i * 3, 42, 0, 66);
        ctx.stroke();
    }
    ctx.restore();

    // White beard (below mouth, stylized, now bigger)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-28, 68);
    ctx.bezierCurveTo(-18, 140, 18, 140, 28, 68);
    ctx.quadraticCurveTo(0, 180, -28, 68);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#eee';
    ctx.shadowBlur = 12;
    ctx.fill();
    // Beard lines for texture
    ctx.strokeStyle = '#dde';
    ctx.lineWidth = 2.6;
    for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 7, 85);
        ctx.quadraticCurveTo(i * 3, 150, 0, 170);
        ctx.stroke();
    }
    ctx.restore();

    // Ears
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-55, 0, 12, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(55, 0, 12, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#a97c50';
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.restore();

    // Skull necklace (animated bob)
    let bob = Math.sin(elapsed * 2) * 6;
    for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(i * 28, 90 + bob, 16, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f6e7c1';
        ctx.shadowColor = '#0006';
        ctx.shadowBlur = 4;
        ctx.fill();
        // Eyes on skulls
        ctx.beginPath();
        ctx.arc(i * 28 - 5, 90 + bob - 2, 2, 0, Math.PI * 2);
        ctx.arc(i * 28 + 5, 90 + bob - 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.restore();
    }

    // Shoulders and chest (orange wrap)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-60, 80);
    ctx.bezierCurveTo(-90, 160, 90, 160, 60, 80);
    ctx.lineTo(60, 120);
    ctx.bezierCurveTo(40, 170, -40, 170, -60, 120);
    ctx.closePath();
    ctx.fillStyle = '#e67e22';
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#0004';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    // Fire breath (animated, drawn last so it's in front)
    let firePhase = (elapsed * 2) % (Math.PI * 2);
    let fireActive = Math.sin(firePhase) > -0.7; // periodic bursts
    if (fireActive) {
        ctx.save();
        // Fire base position (mouth)
        let fx = 0;
        let fy = 62;
        // Animate fire shape
        let flameLen = 120 + Math.sin(elapsed * 3) * 18;
        let flameW = 38 + Math.cos(elapsed * 2.2) * 10;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(elapsed * 2);
        // Outer flame
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        for (let i = 0; i <= 12; i++) {
            let t = i / 12;
            let angle = -Math.PI / 2 + (t - 0.5) * 0.5;
            let r = flameLen * (0.7 + 0.3 * Math.sin(elapsed * 4 + t * 8));
            let x = fx + Math.sin(angle) * flameW * (1 - t * 0.7);
            let y = fy - t * r + Math.sin(elapsed * 6 + t * 10) * 6 * (1 - t);
            ctx.lineTo(x, y);
        }
        ctx.lineTo(fx, fy);
        let grad = ctx.createLinearGradient(fx, fy, fx, fy - flameLen);
        grad.addColorStop(0, '#fff8');
        grad.addColorStop(0.2, '#ffe066');
        grad.addColorStop(0.5, '#ff9800');
        grad.addColorStop(0.8, '#e25822');
        grad.addColorStop(1, '#a22');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#ffb';
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}

function onResize({ canvas, ctx, width, height }) {
    startTime = null;
}

function onClick() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utter = new window.SpeechSynthesisUtterance('Yoga fire');
        utter.rate = 0.7; // slower for older effect
        utter.pitch = 0.7; // lower pitch for old man
        utter.lang = 'en-US';
        // Try to select an old/male/English voice if available
        const voices = window.speechSynthesis.getVoices();
        let selected = null;
        for (let v of voices) {
            const name = v.name.toLowerCase();
            const desc = (v.voiceURI + ' ' + v.lang + ' ' + v.name).toLowerCase();
            if ((desc.includes('old') || desc.includes('male') || desc.includes('english')) && v.lang.startsWith('en')) {
                selected = v;
                break;
            }
        }
        if (selected) utter.voice = selected;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
    }
}

export default {
    displayName,
    animate,
    onResize,
    onClick
};
