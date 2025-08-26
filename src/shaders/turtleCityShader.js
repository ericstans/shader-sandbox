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
    const shellH = height * 0.1;
    const headR = shellW * 0.18;
    const legW = shellW * 0.18;
    const legH = shellH * 0.7;
    // Draw back feet (behind shell and city), offset to one side, rotated outward
    for (let i = 0; i < 2; i++) {
        let side = i === 0 ? -1 : 1;
        // Offset: one leg further left, one further right, and both slightly back
        let lx = centerX + side * shellW * 0.3 + (side === -1 ? -shellW * 0.08 : shellW * 0.12);
        let ly = baseY + shellH * 0.8;
        // Outward rotation angle (radians): left foot rotates -18deg, right foot +18deg
        let angle = -1 * side * Math.PI / 10;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(lx, ly, legW * 0.38, legH * 0.55, angle, 0, Math.PI * 2);
        ctx.fillStyle = '#3a5c3a';
        ctx.shadowColor = '#0007';
        ctx.shadowBlur = 4;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.restore();
    }
    


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
            // Default building height and width
            let maxH = shellH * 3 * 1.28;
            let bH, bW;
            // If brick, restrict height to 50% of max
            if (type === 4) {
                bH = maxH * (0.28 + Math.random() * 0.5); // up to 50% of max
                bW = shellW * (0.09 + Math.random() * 0.08);
            } else {
                bH = shellH * 3 * (0.28 + Math.random() * 1);
                bW = shellW * (0.09 + Math.random() * 0.08);
            }
            // Curve the baseline to match the shell's arch (ellipse), but move up so bottoms are hidden
            let normX = (bx - centerX) / (shellW * 0.48); // tighter arch
            let arch = Math.sqrt(Math.max(0, 1 - normX * normX));
            let cityBaseY = baseY - shellH * arch * 0.68; // slightly higher
            let by = cityBaseY - bH;
            // Plausible building material colors
            const materialColors = [
                '#bca27e', // sandstone
                '#a3b1bd', // granite
                '#d9cfc1', // limestone
                '#b0a99f', // concrete
                '#c2b280', // adobe
                '#e0d7c3', // marble
                '#b7b7b7', // cement
                '#c9b29b', // brick
                '#b5a642', // ochre stone
                '#a89f91'  // stucco
            ];
            let color, domeColor;
            // Add type: 0=rect, 1=dome, 2=spire, 3=round tower, 4=brick
            let typeRand = Math.random();
            let type = 0;
            if (typeRand < 0.25) type = 0; // normal rect
            else if (typeRand < 0.5) type = 1; // dome
            else if (typeRand < 0.7) type = 2; // tall spire
            else if (typeRand < 0.85) type = 3; // round tower
            else type = 4; // brick
            if (type === 2 || type === 3) {
                color = materialColors[Math.floor(Math.random() * materialColors.length)];
                domeColor = color;
            } else if (type === 4) {
                color = '#b55239'; // brick red
                domeColor = '#c97a5a';
            } else {
                color = `hsl(${180 + Math.random() * 40}, 18%, ${60 + Math.random() * 20}%)`;
                domeColor = `hsl(${180 + Math.random() * 40}, 28%, ${70 + Math.random() * 20}%)`;
            }
            buildings.push({ bx, by, bW, bH, color, domeColor, type });
        }
        cachedCity = { width, height, cityW, buildings };
    }

    // Sort buildings by their base y (back to front)
    let sortedBuildings = [...cachedCity.buildings].sort((a, b) => (a.by + a.bH) - (b.by + b.bH));
    for (let i = 0; i < sortedBuildings.length; i++) {
        let b = sortedBuildings[i];
        // Draw dome/ornament BEFORE building body, so it appears behind
        if (b.type === 1) {
            ctx.save();
            // Dome
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
        } else if (b.type === 2) {
            ctx.save();
            // Tall spire tip
            ctx.beginPath();
            ctx.moveTo(b.bx, b.by);
            ctx.lineTo(b.bx, b.by - b.bH * 0.7);
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = b.domeColor;
            ctx.globalAlpha = 0.8;
            ctx.stroke();
            // Spire tip
            ctx.beginPath();
            ctx.arc(b.bx, b.by - b.bH * 0.7, b.bW * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = b.domeColor;
            ctx.globalAlpha = 0.8;
            ctx.shadowColor = '#fff8';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.restore();
        } else if (b.type === 3) {
            ctx.save();
            // Round tower dome
            ctx.beginPath();
            ctx.ellipse(b.bx, b.by, b.bW * 0.5, b.bW * 0.32, 0, 0, Math.PI * 2);
            ctx.fillStyle = b.domeColor;
            ctx.globalAlpha = 0.7;
            ctx.shadowColor = '#fff8';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.restore();
        } else if (b.type === 4) {
            ctx.save();
            // Brick building: rhombus roof ornament
            ctx.beginPath();
            let rhW = b.bW * 0.32;
            let rhH = b.bW * 0.22;
            ctx.moveTo(b.bx, b.by - rhH); // top
            ctx.lineTo(b.bx + rhW, b.by); // right
            ctx.lineTo(b.bx, b.by + rhH); // bottom
            ctx.lineTo(b.bx - rhW, b.by); // left
            ctx.closePath();
            ctx.fillStyle = b.domeColor;
            ctx.globalAlpha = 0.8;
            ctx.shadowColor = '#fff8';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.restore();
        } else {
            ctx.save();
            // Default dome
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

        // Now draw the building body in front
        ctx.save();
        ctx.beginPath();
        if (b.type === 3) {
            // Round tower
            ctx.ellipse(b.bx, b.by + b.bH / 2, b.bW / 2, b.bH / 2, 0, 0, Math.PI * 2);
        } else if (b.type === 2) {
            // Tall spire (thin rect)
            ctx.rect(b.bx - b.bW * 0.18, b.by, b.bW * 0.36, b.bH * 1.2);
        } else if (b.type === 4) {
            // Brick building: always rectangular
            ctx.rect(b.bx - b.bW / 2, b.by, b.bW, b.bH);
        } else {
            ctx.rect(b.bx - b.bW / 2, b.by, b.bW, b.bH);
        }
        ctx.fillStyle = b.color;
        ctx.shadowColor = '#fff8';
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        // Brick pattern for brick buildings
        if (b.type === 4) {
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.strokeStyle = '#7a2d1b';
            let brickH = Math.max(4, b.bH / 16);
            let brickW = Math.max(8, b.bW / 6);
            for (let y = b.by; y < b.by + b.bH - 1; y += brickH) {
                let offset = ((Math.floor((y - b.by) / brickH)) % 2) * (brickW / 2);
                for (let x = b.bx - b.bW / 2 + offset; x < b.bx + b.bW / 2 - 1; x += brickW) {
                    ctx.beginPath();
                    ctx.rect(x, y, brickW, brickH);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
        // Windows (skip for spire)
        if (b.type !== 2) {
            let nWin = 2 + Math.floor(b.bH / 18);
            for (let w = 0; w < nWin; w++) {
                let wy = b.by + 6 + w * (b.bH - 12) / nWin;
                ctx.beginPath();
                if (b.type === 3) {
                    // Round tower windows
                    ctx.ellipse(b.bx, wy + 2, b.bW / 4, 3, 0, 0, Math.PI * 2);
                } else {
                    ctx.rect(b.bx - b.bW / 4, wy, b.bW / 2, 5);
                }
                ctx.fillStyle = '#ffe';
                ctx.globalAlpha = 0.7 + 0.2 * Math.sin(elapsed * 2 + i + w);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // Draw turtle body (shell, legs, head, tail) every frame
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

    // Legs (front view, animated, rotated outward)
    for (let i = 0; i < 4; i++) {
        let side = i % 2 === 0 ? -1 : 1;
        let front = i < 2 ? 1 : -1;
        let legPhase = elapsed * 1.5 + i * Math.PI / 2;
        let legSwing = Math.sin(legPhase) * shellH * 0.13 * front;
        let lx = centerX + side * shellW * 0.32;
        let ly = baseY + shellH * 0.7 + legSwing;
        // Outward rotation angle (radians): left legs -15deg, right legs +15deg
        let angle = -1 * side * Math.PI / 12;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(lx, ly, legW * 0.5, legH, angle, 0, Math.PI * 2);
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
