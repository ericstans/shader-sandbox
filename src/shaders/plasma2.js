// Shader 2: Radial/spiral plasma
export function plasma2(x, y, t, width, height) {
    // Always use the actual width/height for centering if provided
    if (typeof width !== 'number' || typeof height !== 'number') {
        width = 1000;
        height = 1000;
    }
    // Center based on the actual canvas size
    const cx = width / 2;
    const cy = height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    let v = 0;
    v += Math.sin(dist * 0.07 - t);
    v += Math.cos(angle * 3 + t * 0.7);
    v += Math.sin((x * 0.03 + y * 0.03) + t * 1.2);
    return v;
}
