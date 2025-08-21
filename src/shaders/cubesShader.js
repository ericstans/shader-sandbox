import { drawCubesBase } from './cubeUtils.js';
// Shader 3: Cubes (many solid 3D cubes with lighting, oblique projection, oscillating)
export function cubesShader(ctx, t) {
    drawCubesBase(ctx, t, {
        layout: 'grid',
        rotation: 'xy',
        palette: [
            [255,85,85], [85,255,85], [85,85,255], [255,255,85], [255,85,255], [85,255,255]
        ],
        oscFunc: (t, row, col) => Math.sin(t * 1.2 + row * 0.5 + col * 0.7) * 20,
        cubeSize: 50,
    });
}
