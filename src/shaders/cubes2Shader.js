import { drawCubesBase } from './cubeUtils.js';
// Shader 4: Cubes 2 (hex grid, z-rotation, pastel colors, wave motion)
export function cubes2Shader(ctx, t) {
    drawCubesBase(ctx, t, {
        layout: 'hex',
        rotation: 'z',
        palette: [
            [180,200,255], [255,200,220], [200,255,220], [255,255,200], [220,200,255], [200,255,255]
        ],
        oscFunc: (t, row, col) => Math.sin(t * 1.5 + row * 0.8 + col * 1.1) * 30,
        cubeSize: 44,
    });
}
