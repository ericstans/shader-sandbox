// Shader 8: Outrun ASCII (moving road and trees with ASCII/Unicode art)
export function outrunAsciiShader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Parameters
    const horizon = height * 0.35;
    const roadW = 0.4; // road width at bottom (fraction)
    const roadColor = '#333';
    const grassColor = '#1a3';
    const skyColor = '#2ad';
    const treeChars = ['\u001a', '\u001b', '\u001c', '\u001d', '\u001e', '\u001f', '\u001a', '\u001b', '\u001c', '\u001d', '\u001e', '\u001f', 'Y', 'T', '♣', '♠', '¥', '¶', '§', '¶', '¥', '♣', '♠'];
    const treeColor = '#3eea2a'; // bright green for visibility
    const roadMarkColor = '#fff';
    // Draw sky
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, width, horizon);
    // Draw grass
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, horizon, width, height - horizon);
    // Draw road and trees (perspective lines)
    const nSegments = 40;
    // Tree logic: spawn trees at intervals, move them up, remove when offscreen
    // We'll keep a list of tree objects with a 'z' (depth, 0=bottom, 1=horizon)
    if (!outrunAsciiShader.trees) outrunAsciiShader.trees = [];
    const trees = outrunAsciiShader.trees;
    const treeSpeed = 0.22; // controls how fast trees move up
    // Add new trees at the bottom at regular intervals
    if (!outrunAsciiShader.lastTreeTime) outrunAsciiShader.lastTreeTime = 0;
    if (t - outrunAsciiShader.lastTreeTime > 0.18) {
        // Randomly left or right
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const charIdx = Math.floor(Math.random() * treeChars.length);
        trees.push({ z: 0, side, charIdx });
        outrunAsciiShader.lastTreeTime = t;
    }
    // Move and draw trees
    for (let i = trees.length - 1; i >= 0; --i) {
        const tree = trees[i];
        tree.z += treeSpeed * 0.016; // advance by frame (approx 60fps)
        if (tree.z > 1.05) { trees.splice(i, 1); continue; }
        // Project tree.z to screen
        const lerp = tree.z;
        const segY = horizon + (height - horizon) * Math.pow(lerp, 1.7);
        const segH = (height - horizon) / nSegments * (1.2 + 2.5 * (1 - lerp));
        const segW = width * (roadW * lerp + 0.05);
        const cx = width / 2;
        ctx.save();
        ctx.font = `${Math.floor(segH * 1.2)}px monospace`;
        ctx.fillStyle = treeColor;
        ctx.textAlign = tree.side === 'left' ? 'right' : 'left';
        ctx.textBaseline = 'bottom';
        const treeChar = treeChars[tree.charIdx];
        const x = tree.side === 'left' ? (cx - segW / 2 - 12) : (cx + segW / 2 + 12);
        ctx.fillText(treeChar, x, segY + segH * 0.9);
        ctx.restore();
    }
    // Draw road and markings
    // Animate road markings to match tree speed and direction, and fade near horizon
    const markPeriod = 0.18 / treeSpeed; // match tree spawn interval and speed
    for (let i = nSegments; i > 0; --i) {
        const lerp = i / nSegments;
        // Perspective: closer segments are larger
        const segY = horizon + (height - horizon) * Math.pow(lerp, 1.7);
        const segH = (height - horizon) / nSegments * (1.2 + 2.5 * (1 - lerp));
        // Road width tapers with distance
        const segW = width * (roadW * lerp + 0.05);
        const cx = width / 2;
        // Road
        ctx.fillStyle = roadColor;
        ctx.beginPath();
        ctx.moveTo(cx - segW / 2, segY);
        ctx.lineTo(cx + segW / 2, segY);
        ctx.lineTo(cx + segW / 2 * 1.05, segY + segH);
        ctx.lineTo(cx - segW / 2 * 1.05, segY + segH);
        ctx.closePath();
        ctx.fill();
        // Road markings
        // Compute a phase offset for the markings based on tree speed and time
        const markPhase = ((t * treeSpeed) / markPeriod) % 1;
        // Reverse the direction by subtracting the phase
        const markIdx = (i / nSegments - markPhase + 1) % 1;
        // Fade out markings near the horizon
        const fade = Math.max(0, Math.min(1, (lerp - 0.08) / 0.25));
        if (markIdx % (1/6) < (1/12) && fade > 0.01) {
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.fillStyle = roadMarkColor;
            ctx.fillRect(cx - segW * 0.04, segY + segH * 0.2, segW * 0.08, segH * 0.6);
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
    }
}
