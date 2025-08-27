// Net event logic for fish tank simulation

export function startNetEvent(width, height) {
    let pivotX = Math.random() * (width * 0.7) + width * 0.15;
    let netRadius = 60 + Math.random() * 40;
    let pivotY = -height * 0.5 - 60;
    // Ensure pole (minus the net diameter) is long enough to reach the top of the canvas
    let minPoleLen = Math.abs(pivotY) - 2 * netRadius;
    minPoleLen = Math.max(minPoleLen, 0); // Clamp to non-negative
    let poleLen = minPoleLen + Math.random() * (height * 0.5);
    let netAngleStart = 0;
    let netAngleEnd = 180;
    let swingDir = Math.random() < 0.5 ? 1 : -1;
    return {
        pivotX,
        pivotY,
        poleLen,
        netRadius,
        t: 0,
        swingDir,
        netAngleStart,
        netAngleEnd,
        scooped: false
    };
}

export function drawNetEvent(ctx, netEvent, fish, NET_SPEED) {
    if (!netEvent) return;
    // Animate net swinging down
    netEvent.t++;
    let swingT = Math.min(1, netEvent.t * NET_SPEED);
    let angle = netEvent.netAngleStart + (netEvent.netAngleEnd - netEvent.netAngleStart) * swingT * netEvent.swingDir;
    // Net position at end of pole
    let netX = netEvent.pivotX + Math.cos(angle) * netEvent.poleLen;
    let netY = netEvent.pivotY + Math.sin(angle) * netEvent.poleLen;
    // Draw pole
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#a88';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(netEvent.pivotX, netEvent.pivotY);
    ctx.lineTo(netX, netY);
    ctx.stroke();
    // Draw net hoop
    ctx.save();
    ctx.translate(netX, netY);
    ctx.rotate(angle + Math.PI / 2);
    ctx.strokeStyle = '#b8b8b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, netEvent.netRadius, netEvent.netRadius * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Draw net mesh
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        let meshAngle = (Math.PI * 2 / 8) * i;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(meshAngle) * netEvent.netRadius, Math.sin(meshAngle) * netEvent.netRadius * 0.85);
    }
    ctx.strokeStyle = '#b8b8b8';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.restore();
    // Mark fish inside net ellipse as scooped and attach to net, but do not remove from fish array
    const now = performance.now();
    for (let f of fish) {
        if (f.scoopedByNet) {
            // Already scooped, update position to follow net
            f.x = netX + (Math.random() - 0.5) * netEvent.netRadius * 0.7;
            f.y = netY + (Math.random() - 0.5) * netEvent.netRadius * 1.5;
            // If not already set, mark the time scooped
            if (!f.scoopedTime) f.scoopedTime = now;
            continue;
        }
        // Transform fish position into net's local ellipse space
        let dx = f.x - netX;
        let dy = f.y - netY;
        let localX = Math.cos(-angle - Math.PI / 2) * dx - Math.sin(-angle - Math.PI / 2) * dy;
        let localY = Math.sin(-angle - Math.PI / 2) * dx + Math.cos(-angle - Math.PI / 2) * dy;
        // Ellipse: (x/a)^2 + (y/b)^2 < 1
        let a = netEvent.netRadius;
        let b = netEvent.netRadius * 2;
        let inNet = (localX * localX) / (a * a) + (localY * localY) / (b * b) < 1;
        if (inNet) {
            f.scoopedByNet = true;
            f.scoopedTime = now;
            f.x = netX + (Math.random() - 0.5) * netEvent.netRadius * 0.7;
            f.y = netY + (Math.random() - 0.5) * netEvent.netRadius * 1.5;
        }
    }
}
