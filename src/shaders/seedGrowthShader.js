// Seed Growth Shader: Animated seed sprouting roots and branches
// Exports: { displayName, animate, onResize }

const displayName = 'Seed Growth';

let growthStart = null;
let growthDuration = 40000; // ms (40 seconds)

function animate(ctx, t, width, height) {
    if (!growthStart) growthStart = performance.now();
    let elapsed = Math.min(performance.now() - growthStart, growthDuration);
    let progress = elapsed / growthDuration;

    // Split ground: top = above, bottom = below
    const groundY = Math.floor(height * 0.55);
    ctx.clearRect(0, 0, width, height);

    // Draw below-ground (soil)
    ctx.save();
    ctx.fillStyle = '#6b4e2e';
    ctx.fillRect(0, groundY, width, height - groundY);
    // Soil texture
    for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        let rx = Math.random() * width;
        let ry = groundY + Math.random() * (height - groundY);
        ctx.arc(rx, ry, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,60,30,${0.08 + Math.random() * 0.12})`;
        ctx.fill();
    }
    ctx.restore();

    // Draw above-ground (sky)
    ctx.save();
    let skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#b8e6ff');
    skyGrad.addColorStop(1, '#eaffd0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);
    ctx.restore();

    // Draw surface line
    ctx.save();
    ctx.strokeStyle = '#a97c50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
    ctx.restore();

    // Seed position
    const seedX = width / 2;
    const seedY = groundY - 2;

    // Draw seed
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(seedX, seedY, 13, 8, Math.PI * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#b98c3a';
    ctx.shadowColor = '#fff8';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    // Roots animation (first 40% of progress)
    let rootProgress = Math.min(1, progress / 0.4);
    let nRoots = 3 + Math.floor(rootProgress * 4);
    for (let i = 0; i < nRoots; i++) {
        let frac = i / (nRoots - 1);
        let angle = Math.PI * (0.7 + 0.6 * (frac - 0.5));
        let rootLen = (height - groundY - 18) * rootProgress * (0.7 + Math.random() * 0.3);
        ctx.save();
        ctx.strokeStyle = '#e0d0a0';
        ctx.lineWidth = 3.2 - 1.5 * rootProgress;
        ctx.beginPath();
        ctx.moveTo(seedX, seedY + 4);
        let cx = seedX + Math.cos(angle) * rootLen * 0.4;
        let cy = seedY + 4 + Math.sin(angle) * rootLen * 0.5;
        let ex = seedX + Math.cos(angle) * rootLen;
        let ey = seedY + 4 + Math.sin(angle) * rootLen;
        ctx.bezierCurveTo(cx, cy, cx, cy, ex, ey);
        ctx.globalAlpha = 0.7 + 0.3 * rootProgress;
        ctx.stroke();
        ctx.restore();
    }

    // Stem and branches (after 20% progress)
    if (progress > 0.2) {
        let stemProgress = Math.min(1, (progress - 0.2) / 0.5);
        let stemLen = (groundY - 40) * stemProgress;
        ctx.save();
        ctx.strokeStyle = '#3a7c2a';
        ctx.lineWidth = 6 - 3 * stemProgress;
        ctx.beginPath();
        ctx.moveTo(seedX, seedY - 2);
        ctx.lineTo(seedX, seedY - 2 - stemLen);
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.restore();

        // Branches (after 40% progress)
        if (progress > 0.4) {
            let branchProgress = Math.min(1, (progress - 0.4) / 0.4);
            let nBranches = 2 + Math.floor(branchProgress * 4);
            for (let i = 0; i < nBranches; i++) {
                let frac = i / (nBranches - 1);
                let angle = -Math.PI / 2 + (Math.PI / 3) * (frac - 0.5);
                let branchLen = 60 + 40 * branchProgress * (0.7 + Math.random() * 0.3);
                let bx0 = seedX;
                let by0 = seedY - 2 - stemLen * (0.3 + 0.5 * frac);
                let bx1 = bx0 + Math.cos(angle) * branchLen * 0.5;
                let by1 = by0 + Math.sin(angle) * branchLen * 0.3;
                let bx2 = bx0 + Math.cos(angle) * branchLen;
                let by2 = by0 + Math.sin(angle) * branchLen;
                ctx.save();
                ctx.strokeStyle = '#3a7c2a';
                ctx.lineWidth = 3.2 - 1.5 * branchProgress;
                ctx.beginPath();
                ctx.moveTo(bx0, by0);
                ctx.bezierCurveTo(bx1, by1, bx1, by1, bx2, by2);
                ctx.globalAlpha = 0.7 + 0.3 * branchProgress;
                ctx.stroke();
                ctx.restore();

                // Leaves (after 60% progress)
                if (progress > 0.6) {
                    let leafProgress = Math.min(1, (progress - 0.6) / 0.4);
                    let leafLen = 18 + 18 * leafProgress;
                    let leafAngle = angle + (Math.random() - 0.5) * 0.3;
                    let lx = bx2 + Math.cos(leafAngle) * 8;
                    let ly = by2 + Math.sin(leafAngle) * 8;
                    ctx.save();
                    ctx.beginPath();
                    ctx.ellipse(lx, ly, leafLen * 0.5, leafLen * 0.18, leafAngle, 0, Math.PI * 2);
                    ctx.fillStyle = `hsl(${100 + Math.random() * 30}, 60%, ${60 + Math.random() * 20}%)`;
                    ctx.globalAlpha = 0.7 + 0.3 * leafProgress;
                    ctx.shadowColor = '#fff8';
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
    }
}

function onResize({ canvas, ctx, width, height }) {
    growthStart = null;
}

export default {
    displayName,
    animate,
    onResize
};
