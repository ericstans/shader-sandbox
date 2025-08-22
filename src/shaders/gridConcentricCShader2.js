import { playPop } from '../popSound.js';
// gridConcentricCShader2.js
// Shader: Grid of concentric circles, each with a "C"-shaped color pattern
// 75% of circumference is color1, 25% (facing right) is color2



// Helper to get grid cell data (each cell has a center and an array of radii)
function getGridCells(width, height) {
    const gridSpacing = 60;
    const circleCount = 4;
    const maxR = gridSpacing / 2 - 3;
    const cols = Math.floor((width - gridSpacing) / gridSpacing) + 1;
    const rows = Math.floor((height - gridSpacing) / gridSpacing) + 1;
    const offsetX = (width - (cols - 1) * gridSpacing) / 2;
    const offsetY = (height - (rows - 1) * gridSpacing) / 2;
    const cells = [];
    for (let ci = 0; ci < cols; ci++) {
        for (let ri = 0; ri < rows; ri++) {
            const gx = offsetX + ci * gridSpacing;
            const gy = offsetY + ri * gridSpacing;
            let radii = [];
            for (let r = 10; r < maxR; r += maxR / circleCount) {
                if (
                    gx - r < 0 || gx + r > width ||
                    gy - r < 0 || gy + r > height
                ) continue;
                radii.push(r);
            }
            if (radii.length) cells.push({ x: gx, y: gy, radii });
        }
    }
    return cells;
}



// --- State for this shader ---
let cellRotations = [];
let cellTargetRotations = [];
let cells = [];

function resetState(width, height) {
    cells = getGridCells(width, height);
    cellRotations = [];
    cellTargetRotations = [];
    for (let i = 0; i < cells.length; i++) {
        // Random initial rotation between 0 and 2π
        const angle = Math.random() * Math.PI * 2;
        cellRotations[i] = angle;
        cellTargetRotations[i] = angle;
    }
}

function draw(ctx, t, width, height) {
    ctx.clearRect(0, 0, width, height);
    const color1 = '#3498db';
    const color2 = '#e74c3c';
    for (let i = 0; i < cells.length; i++) {
        const { x, y, radii } = cells[i];
        const rot = cellRotations[i] || 0;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        for (let j = 0; j < radii.length; j++) {
            const r = radii[j];
            ctx.beginPath();
            ctx.arc(0, 0, r, Math.PI * 0.125, Math.PI * 1.875, false);
            ctx.strokeStyle = color1;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r, Math.PI * 1.875, Math.PI * 2.125, false);
            ctx.strokeStyle = color2;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();
    }
}

function onClick(e, {canvas, width, height}) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    let popped = false;
    for (let i = 0; i < cells.length; i++) {
        const { x, y, radii } = cells[i];
        // Use the largest radius for hit detection
        const r = radii[radii.length - 1];
        const dx = mx - x, dy = my - y;
        if (dx * dx + dy * dy <= r * r) {
            cellTargetRotations[i] += Math.PI / 2;
            popped = true;
        }
    }
    if (popped) playPop();
}

function animate(ctx, t, width, height) {
    for (let i = 0; i < cellRotations.length; i++) {
        const target = cellTargetRotations[i] || 0;
        let rot = cellRotations[i] || 0;
        if (Math.abs(target - rot) > 0.001) {
            rot += (target - rot) * 0.15;
            if (Math.abs(target - rot) < 0.002) rot = target;
            cellRotations[i] = rot;
        }
    }
    draw(ctx, t, width, height);
}

function onResize({width, height}) {
    resetState(width, height);
}

// Export main draw for legacy use, and handlers for new system
function main(ctx, t, width, height) {
    if (!cells.length) resetState(width, height);
    draw(ctx, t, width, height);
}
main.onClick = onClick;
main.animate = animate;
main.onResize = onResize;

export default main;
