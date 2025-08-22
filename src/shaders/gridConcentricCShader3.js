import { playPop, playPop2 } from '../popSound.js';
// gridConcentricCShader3.js
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
            if (radii.length) cells.push({ x: gx, y: gy, radii, ci, ri, cols, rows });
        }
    }
    return cells;
}



// --- State for this shader ---
let cellRotations = [];
let cellTargetRotations = [];
let cells = [];
let glowTimers = [];

function resetState(width, height) {
    cells = getGridCells(width, height);
    cellRotations = [];
    cellTargetRotations = [];
    glowTimers = [];
    chainDepthMap = {};
    for (let i = 0; i < cells.length; i++) {
        // Random initial rotation: 0, 90, 180, or 270 degrees
        const angle = (Math.floor(Math.random() * 4) * Math.PI) / 2;
        cellRotations[i] = angle;
        cellTargetRotations[i] = angle;
        glowTimers[i] = 0;
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
        // Glow effect if active
        if (glowTimers[i] > 0) {
            ctx.save();
            ctx.shadowColor = '#fff8a0';
            ctx.shadowBlur = 18 * glowTimers[i];
        }
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
        if (glowTimers[i] > 0) ctx.restore();
        ctx.restore();
    }
}

function onClick(e, {canvas, width, height}) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    let triggered = false;
    for (let i = 0; i < cells.length; i++) {
        const { x, y, radii } = cells[i];
        // Use the largest radius for hit detection
        const r = radii[radii.length - 1];
        const dx = mx - x, dy = my - y;
        if (dx * dx + dy * dy <= r * r) {
            triggerChain(i);
            triggered = true;
            break;
        }
    }
    if (triggered) playPop();
}

// Helper: returns the direction (0=RIGHT,1=DOWN,2=LEFT,3=UP) the red section is facing for a given rotation
function getRedSectionDir(rotation) {
    // Red section is centered at 0 (facing right) and rotates with the cell
    // Each 90 deg (π/2) is a direction
    const dir = Math.round(((rotation % (2 * Math.PI)) / (Math.PI / 2))) % 4;
    return (dir + 4) % 4; // ensure positive
}

// Helper: get neighbor indices and their direction (0=right,1=down,2=left,3=up)
function getNeighborIndicesWithDir(idx) {
    const { ci, ri, cols, rows } = cells[idx];
    const neighbors = [];
    for (const [dci, dri, dir] of [[1,0,0],[0,1,1],[-1,0,2],[0,-1,3]]) {
        const nci = ci + dci;
        const nri = ri + dri;
        if (nci >= 0 && nci < cols && nri >= 0 && nri < rows) {
            // Find the cell with matching ci, ri
            const nIdx = cells.findIndex(c => c.ci === nci && c.ri === nri);
            if (nIdx !== -1) neighbors.push({ idx: nIdx, dir });
        }
    }
    return neighbors;
}

// Helper: get all adjacent (including diagonals) indices
function getAllAdjacentIndices(idx) {
    const { ci, ri, cols, rows } = cells[idx];
    const neighbors = [];
    for (let dci = -1; dci <= 1; dci++) {
        for (let dri = -1; dri <= 1; dri++) {
            if (dci === 0 && dri === 0) continue;
            const nci = ci + dci;
            const nri = ri + dri;
            if (nci >= 0 && nci < cols && nri >= 0 && nri < rows) {
                const nIdx = cells.findIndex(c => c.ci === nci && c.ri === nri);
                if (nIdx !== -1) neighbors.push(nIdx);
            }
        }
    }
    return neighbors;
}

// Track pending chain reactions: {fromIdx, toIdx, dir}
let pendingChain = [];
let chainDepthMap = {};

// Called when a cell finishes its rotation
function checkChain(idx, chainDepth = 1) {
    // If this is the 3rd trigger in a chain, activate all adjacent (including diagonals) and glow
    if (chainDepth === 3) {
        glowTimers[idx] = 1.0;
        for (const nIdx of getAllAdjacentIndices(idx)) {
            if (Math.abs(cellTargetRotations[nIdx] - cellRotations[nIdx]) < 0.001) {
                cellTargetRotations[nIdx] += Math.PI / 2;
                pendingChain.push(nIdx);
                chainDepthMap[nIdx] = 1; // Start new chain for these
                playPop2();
            }
        }
        return;
    }
    // For each neighbor, only trigger if directions are exactly opposite
    for (const { idx: nIdx, dir } of getNeighborIndicesWithDir(idx)) {
        const myDir = getRedSectionDir(cellRotations[idx]);
        const neighborDir = getRedSectionDir(cellRotations[nIdx]);
        if (myDir === dir && neighborDir === (dir + 2) % 4) {
            if (Math.abs(cellTargetRotations[nIdx] - cellRotations[nIdx]) < 0.001) {
                cellTargetRotations[nIdx] += Math.PI / 2;
                pendingChain.push(nIdx);
                chainDepthMap[nIdx] = (chainDepthMap[idx] || 1) + 1;
                playPop2();
            }
        }
    }
}

function triggerChain(idx) {
    cellTargetRotations[idx] += Math.PI / 2;
    pendingChain = [idx];
    chainDepthMap = {};
}

function animate(ctx, t, width, height) {
    let anyFinished = false;
    for (let i = 0; i < cellRotations.length; i++) {
        const target = cellTargetRotations[i] || 0;
        let rot = cellRotations[i] || 0;
        if (Math.abs(target - rot) > 0.001) {
            rot += (target - rot) * 0.15;
            if (Math.abs(target - rot) < 0.002) {
                rot = target;
                anyFinished = true;
            }
            cellRotations[i] = rot;
        }
        // Animate glow
        if (glowTimers[i] > 0) {
            glowTimers[i] -= 0.08;
            if (glowTimers[i] < 0) glowTimers[i] = 0;
        }
    }
    // After all rotations, check for finished cells in the chain
    if (pendingChain.length && anyFinished) {
        let nextChain = [];
        for (const idx of pendingChain) {
            if (Math.abs(cellTargetRotations[idx] - cellRotations[idx]) < 0.002) {
                checkChain(idx, (chainDepthMap[idx] || 1));
            } else {
                nextChain.push(idx);
            }
        }
        pendingChain = nextChain;
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
