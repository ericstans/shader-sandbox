import { drawCubesBase } from './cubeUtils.js';
// Shader 6: Cubes 4 (fabric/water surface deformed by hidden cubes)
export function cubes4Shader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Use a randomized, sparser grid for more natural look
    const cubeSize = 50;
    const cols = Math.floor(width / cubeSize);
    const rows = Math.floor(height / cubeSize);
    // Reduce number of cubes by half
    const totalCubes = Math.floor((cols * rows) / 2);
    // Seeded random for consistent animation per frame
    function seededRandom(seed) {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    let cubeTops = [];
    for (let i = 0; i < totalCubes; ++i) {
        // Randomly scatter cubes within the grid
        const row = Math.floor(i / cols * 2); // spread out vertically
        const col = i % cols;
        // Add random offset within each cell
        const randSeed = i * 1234;
        const rx = seededRandom(randSeed) * cubeSize * 0.6 - cubeSize * 0.3;
        const ry = seededRandom(randSeed + 999) * cubeSize * 0.6 - cubeSize * 0.3;
        const x = col * cubeSize + cubeSize / 2 + rx;
        const y = row * cubeSize + cubeSize / 2 + ry;
        const osc = Math.sin(t * 1.2 + row * 0.5 + col * 0.7) * 20;
        cubeTops.push({x, y: y + osc});
    }
    // Draw a water/fabric surface as a heightmap
    const gridStep = 6;
    for (let gy = 0; gy < height; gy += gridStep) {
        for (let gx = 0; gx < width; gx += gridStep) {
            // Find the influence of all cubes on this point
            let h = 0;
            for (let i = 0; i < cubeTops.length; ++i) {
                const dx = gx - cubeTops[i].x;
                const dy = gy - cubeTops[i].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                // Each cube top creates a bump (gaussian falloff)
                h += Math.exp(-dist*dist/1200) * 22;
            }
            // Add a slow global wave for realism
            h += Math.sin(t + gx*0.01 + gy*0.012) * 4;
            // Color: blueish with shading by height
            const base = 120 + h*2;
            const r = Math.max(0, Math.min(255, base - h*1.2));
            const g = Math.max(0, Math.min(255, base + h*0.5));
            const b = Math.max(0, Math.min(255, 200 + h*2));
            ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
            ctx.fillRect(gx, gy, gridStep+1, gridStep+1);
        }
    }
}
