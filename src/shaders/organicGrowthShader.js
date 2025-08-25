// Organic Growth Shader: Animated branching growth from a central point
// Exports: { displayName, animate, onResize }

const displayName = 'Organic Growth (Elise)';

let growthStart = null;
let growthDuration = 40000; // ms (40 seconds)
let cachedGrowth = null;

function animate(ctx, t, width, height) {
    if (!growthStart) growthStart = performance.now();
    let elapsed = Math.min(performance.now() - growthStart, growthDuration);
    let progress = elapsed / growthDuration;

    // Cache random growth structure
    if (!cachedGrowth || cachedGrowth.width !== width || cachedGrowth.height !== height) {
        // Central origin
        let origin = { x: width / 2, y: height / 2 };
        // Generate main branches
        let nMain = 5 + Math.floor(Math.random() * 3);
        let mainBranches = [];
        for (let i = 0; i < nMain; i++) {
            let angle = Math.PI * 2 * (i / nMain) + (Math.random() - 0.5) * 0.3;
            let len = (Math.min(width, height) * 0.28) * (0.8 + Math.random() * 0.4);
            // Each main branch can have sub-branches
            let nSubs = 2 + Math.floor(Math.random() * 3);
            let subBranches = [];
            for (let j = 0; j < nSubs; j++) {
                let frac = (j + 1) / (nSubs + 1);
                let subAngle = angle + (Math.random() - 0.5) * 0.7;
                let subLen = len * (0.4 + Math.random() * 0.3);
                subBranches.push({ frac, subAngle, subLen });
            }
            mainBranches.push({ angle, len, subBranches });
        }
        cachedGrowth = { width, height, origin, mainBranches };
    }

    // Draw background
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    let grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)*0.7);
    grad.addColorStop(0, '#f8fff0');
    grad.addColorStop(1, '#d0e0c0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Add global wobble (rotation) to the whole structure
    let wobble = Math.sin(t * 0.7) * 0.18 + Math.sin(t * 0.23) * 0.07;

    // Helper for branch sway: returns angle offset for a given branch and position
    function branchSway(baseAngle, frac, swayMag=0.22, freq=1.2) {
        // Sway is stronger further from the base
        return Math.sin(t * freq + baseAngle * 2 + frac * 3 + wobble * 2) * swayMag * frac;
    }
    // Draw central body (head)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cachedGrowth.origin.x, cachedGrowth.origin.y, 38, 32, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,180,200,0.92)';
    ctx.shadowColor = '#bff';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    // Draw eyes
    let eyeOffset = 14, eyeY = 8;
    for (let s = -1; s <= 1; s += 2) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cachedGrowth.origin.x + s * eyeOffset, cachedGrowth.origin.y - eyeY, 7, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cachedGrowth.origin.x + s * eyeOffset, cachedGrowth.origin.y - eyeY + 2, 3.2, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#234';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();
    }

    // Draw main tentacles (branches)
    for (let b of cachedGrowth.mainBranches) {
        let branchProgress = Math.min(1, progress / 0.5); // main branches grow in first 50%
        // Sway the main branch
        let angleWobble = b.angle + wobble;
        let swayEnd = branchSway(b.angle, 1.0, 0.22, 1.2);
        let swayMid = branchSway(b.angle, 0.5, 0.13, 1.2);
        // Draw as a bezier for wavy effect
        let bx = cachedGrowth.origin.x + Math.cos(angleWobble + swayEnd) * b.len * branchProgress;
        let by = cachedGrowth.origin.y + Math.sin(angleWobble + swayEnd) * b.len * branchProgress;
        let mx = cachedGrowth.origin.x + Math.cos(angleWobble + swayMid) * b.len * 0.5 * branchProgress;
        let my = cachedGrowth.origin.y + Math.sin(angleWobble + swayMid) * b.len * 0.5 * branchProgress;
    ctx.save();
    // Tentacle color: blue-green gradient
    let tentacleGrad = ctx.createLinearGradient(cachedGrowth.origin.x, cachedGrowth.origin.y, bx, by);
    tentacleGrad.addColorStop(0, '#7ee');
    tentacleGrad.addColorStop(1, '#1a6e8a');
    ctx.strokeStyle = tentacleGrad;
    ctx.lineWidth = 10 - 7 * branchProgress;
    ctx.beginPath();
    ctx.moveTo(cachedGrowth.origin.x, cachedGrowth.origin.y);
    ctx.quadraticCurveTo(mx, my, bx, by);
    ctx.globalAlpha = 0.82;
    ctx.shadowColor = '#bff';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // Draw sub-branches (smaller tentacle filaments)
    for (let sb of b.subBranches) {
            // Sub-branches start after main branch is part grown
            let subStart = 0.2 + 0.5 * sb.frac;
            let subProgress = Math.max(0, Math.min(1, (progress - subStart) / 0.3));
            if (subProgress <= 0) continue;
            // Sway the sub-branch
            let subFrac = sb.frac;
            let subOriginX = cachedGrowth.origin.x + Math.cos(angleWobble + branchSway(b.angle, subFrac, 0.22, 1.2)) * b.len * subFrac * branchProgress;
            let subOriginY = cachedGrowth.origin.y + Math.sin(angleWobble + branchSway(b.angle, subFrac, 0.22, 1.2)) * b.len * subFrac * branchProgress;
            let subSwayEnd = branchSway(sb.subAngle, 1.0, 0.18, 1.7);
            let subSwayMid = branchSway(sb.subAngle, 0.5, 0.09, 1.7);
            let subAngleWobble = sb.subAngle + wobble;
            let subEndX = subOriginX + Math.cos(subAngleWobble + subSwayEnd) * sb.subLen * subProgress;
            let subEndY = subOriginY + Math.sin(subAngleWobble + subSwayEnd) * sb.subLen * subProgress;
            let subMidX = subOriginX + Math.cos(subAngleWobble + subSwayMid) * sb.subLen * 0.5 * subProgress;
            let subMidY = subOriginY + Math.sin(subAngleWobble + subSwayMid) * sb.subLen * 0.5 * subProgress;
            ctx.save();
            // Filament color: lighter blue
            let filamentGrad = ctx.createLinearGradient(subOriginX, subOriginY, subEndX, subEndY);
            filamentGrad.addColorStop(0, '#bff');
            filamentGrad.addColorStop(1, '#6be');
            ctx.strokeStyle = filamentGrad;
            ctx.lineWidth = 3.2 - 2 * subProgress;
            ctx.beginPath();
            ctx.moveTo(subOriginX, subOriginY);
            ctx.quadraticCurveTo(subMidX, subMidY, subEndX, subEndY);
            ctx.globalAlpha = 0.7 + 0.3 * subProgress;
            ctx.shadowColor = '#bff';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.restore();
            // Optionally, draw a glowing tip at the end
            if (progress > 0.7 && subProgress > 0.8) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(subEndX, subEndY, 7, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(180,255,255,0.18)';
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 16;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(subEndX, subEndY, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#bff';
                ctx.shadowBlur = 0;
                ctx.fill();
                ctx.restore();
            }
        }
    }
}

function onResize({ canvas, ctx, width, height }) {
    growthStart = null;
    cachedGrowth = null;
}

export default {
    displayName,
    animate,
    onResize
};
