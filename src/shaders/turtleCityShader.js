// Giant Turtle City Shader: A giant turtle with a city on its back
// Exports: { displayName, animate, onResize }

const displayName = 'Turtle City (Berto)';


let startTime = null;
let cachedCity = null;

function animate(ctx, t, width, height) {
    if (!startTime) startTime = performance.now();
    let elapsed = (performance.now() - startTime) / 1000;
    ctx.clearRect(0, 0, width, height);

    // Turtle body parameters (front view)
    const centerX = width / 2;
    const baseY = height * 0.7;
    const shellW = width * 0.48;
    const shellH = height * 0.28;
    const headR = shellW * 0.18;
    const legW = shellW * 0.18;
    const legH = shellH * 0.7;


    // Generate city layout and cache it only if needed
    if (!cachedCity || cachedCity.width !== width || cachedCity.height !== height) {
        let nBuildings = 8 + Math.floor(Math.random() * 4);
    let cityW = shellW * 0.82;
        let buildings = [];
        for (let i = 0; i < nBuildings; i++) {
            if (i == 0 || i == nBuildings-1){
                continue; //skip first and last building
            }
            let frac = i / (nBuildings - 1);
            let bx = centerX - cityW / 2 + frac * cityW;
            let bH = shellH * (0.28 + Math.random() * 1);
            let bW = shellW * (0.09 + Math.random() * 0.08);
            // Curve the baseline to match the shell's arch (ellipse), but move up so bottoms are hidden
            let normX = (bx - centerX) / (shellW * 0.48); // tighter arch
            let arch = Math.sqrt(Math.max(0, 1 - normX * normX));
            let cityBaseY = baseY - shellH * arch * 0.68; // slightly higher
            let by = cityBaseY - bH;
            let color = `hsl(${180 + Math.random() * 40}, 18%, ${60 + Math.random() * 20}%)`;
            let domeColor = `hsl(${180 + Math.random() * 40}, 28%, ${70 + Math.random() * 20}%)`;
            buildings.push({ bx, by, bW, bH, color, domeColor });
        }
        cachedCity = { width, height, cityW, buildings };
    }

    // Draw city buildings and domes first (unmasked, so they can extend above the shell)
    for (let i = 0; i < cachedCity.buildings.length; i++) {
        let b = cachedCity.buildings[i];
        ctx.save();
        ctx.beginPath();
        ctx.rect(b.bx - b.bW / 2, b.by, b.bW, b.bH);
        ctx.fillStyle = b.color;
        ctx.shadowColor = '#fff8';
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        // Windows
        let nWin = 2 + Math.floor(b.bH / 18);
        for (let w = 0; w < nWin; w++) {
            let wy = b.by + 6 + w * (b.bH - 12) / nWin;
            ctx.beginPath();
            ctx.rect(b.bx - b.bW / 4, wy, b.bW / 2, 5);
            ctx.fillStyle = '#ffe';
            ctx.globalAlpha = 0.7 + 0.2 * Math.sin(elapsed * 2 + i + w);
            ctx.fill();
        }
        ctx.restore();
    }
    for (let i = 0; i < cachedCity.buildings.length; i++) {
        let b = cachedCity.buildings[i];
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(b.bx, b.by, b.bW * 0.5, b.bW * 0.32, 0, 0, Math.PI * 2);
        ctx.fillStyle = b.domeColor;
        ctx.globalAlpha = 0.7;
        ctx.shadowColor = '#fff8';
        ctx.shadowBlur = 6;
        ctx.fill();
        // Spire
        ctx.beginPath();
        ctx.moveTo(b.bx, b.by - b.bW * 0.32);
        ctx.lineTo(b.bx, b.by - b.bW * 0.32 - b.bH * 0.22);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#bcd';
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.restore();
    }

    // Draw turtle body (shell, legs, head, tail) every frame
    // Shell
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, baseY, shellW / 2, shellH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3a5c3a';
    ctx.shadowColor = '#000a';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    // Shell pattern
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, baseY, shellW * 0.38, shellH * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5e8c5e';
    ctx.globalAlpha = 0.7;
    ctx.shadowColor = '#fff4';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    // Legs (front view, animated)
    for (let i = 0; i < 4; i++) {
        let side = i % 2 === 0 ? -1 : 1;
        let front = i < 2 ? 1 : -1;
        let legPhase = elapsed * 1.5 + i * Math.PI / 2;
        let legSwing = Math.sin(legPhase) * shellH * 0.13 * front;
        let lx = centerX + side * shellW * 0.32;
        let ly = baseY + shellH * 0.7 + legSwing;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(lx, ly, legW * 0.5, legH, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#4a6c4a';
        ctx.shadowColor = '#000a';
        ctx.shadowBlur = 6;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.restore();
    }

    // Head (front view, animated up/down)
    let headBob = Math.sin(elapsed * 1.2) * shellH * 0.13;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, baseY - shellH * 0.95 + headBob, headR, headR * 1.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4a6c4a';
    ctx.shadowColor = '#000a';
    ctx.shadowBlur = 8;
    ctx.fill();
    // Eyes
    ctx.beginPath();
    ctx.ellipse(centerX - headR * 0.38, baseY - shellH * 0.98 + headBob, headR * 0.13, headR * 0.18, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + headR * 0.38, baseY - shellH * 0.98 + headBob, headR * 0.13, headR * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.restore();

    // Tail (centered, behind shell)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, baseY + shellH * 1.08, shellW * 0.08, shellH * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4a6c4a';
    ctx.globalAlpha = 0.7;
    ctx.shadowColor = '#000a';
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.restore();

}

function onResize({ canvas, ctx, width, height }) {
    startTime = null;
    cachedCity = null;
}

// Add click-to-clear-cached-city handler (idempotent)
if (typeof window !== 'undefined' && window.plasma_canvas_city_clear !== true) {
    const canvas = document.getElementById('plasma-canvas');
    if (canvas) {
        canvas.addEventListener('click', () => {
            cachedCity = null;
            startTime = null;
        });
        window.plasma_canvas_city_clear = true;
    }
}

export default {
    displayName,
    animate,
    onResize
};
