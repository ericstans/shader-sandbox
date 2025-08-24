
// Shader 2: Radial/spiral plasma
export function plasma2(x, y, t, width, height) {
    if (typeof width !== 'number' || typeof height !== 'number') {
        width = 1000;
        height = 1000;
    }
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

// Animate function for plasma2
function animate(ctx, t, width, height) {
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let v = plasma2(x, y, t, width, height);
            let c = Math.floor(128 + 127 * Math.sin(v));
            let idx = (y * width + x) * 4;
            data[idx] = 80 + (c >> 2);
            data[idx + 1] = c;
            data[idx + 2] = 255 - c;
            data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

export default {
    displayName: 'Demo Scene 2',
    animate
};
