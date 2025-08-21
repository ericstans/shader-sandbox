// Shader 5: Cubes 3 (spiral layout, rainbow, cubes scale/pulse, wild rotation)
import { drawCubesBase, drawSolidCubeCustom } from './cubeUtils.js';
// HSL to RGB helper for Cubes 3
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.floor(r*255), Math.floor(g*255), Math.floor(b*255)];
}
export function cubes3Shader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Spiral layout
    const n = 120;
    const cx = width/2, cy = height/2;
    for (let i = 0; i < n; ++i) {
        const angle = i * 0.32 + t * 0.7;
        const radius = 120 + i * 6 + Math.sin(t + i) * 18;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        // Rainbow color
        const hue = (i * 3 + t * 40) % 360;
        const rgb = hslToRgb(hue/360, 0.7, 0.55);
        // Pulse/scale
        const scale = 0.7 + 0.4 * Math.sin(t * 2 + i * 0.5);
        // Wild rotation
    drawSolidCubeCustom(ctx, x, y, 0, 36 * scale, rgb, i * 0.2 + t * 1.5, 'xyz', t);
    }
}
