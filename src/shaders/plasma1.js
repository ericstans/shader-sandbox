
// Shader 1: Classic plasma
export function plasma1(x, y, t) {
    let v = 0;
    v += Math.sin(x * 0.06 + t);
    v += Math.sin((y * 0.06 + t) / 2);
    v += Math.sin((x * 0.04 + y * 0.04 + t) / 2);
    v += Math.sin(Math.sqrt(x * x + y * y) * 0.03 + t);
    return v;
}

// Animate function for plasma1
function animate(ctx, t, width, height) {
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let v = plasma1(x, y, t);
            let c = Math.floor(128 + 127 * Math.sin(v));
            let idx = (y * width + x) * 4;
            data[idx] = c;
            data[idx + 1] = 80 + (c >> 2);
            data[idx + 2] = 255 - c;
            data[idx + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

export default {
    displayName: 'Demo Scene 1',
    animate
};
