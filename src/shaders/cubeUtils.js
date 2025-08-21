// Shared cube drawing logic for all cube shaders
export function drawCubesBase(ctx, t, opts) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    const projAngle = Math.PI / 6;
    const projScale = 0.5;
    const lightDir = [0.5, -1, 1];
    const lightLen = Math.sqrt(lightDir[0]**2 + lightDir[1]**2 + lightDir[2]**2);
    const light = lightDir.map(v => v / lightLen);
    const cubeSize = opts.cubeSize;
    let cols, rows, positions = [];
    if (opts.layout === 'grid') {
        cols = Math.floor(width / cubeSize);
        rows = Math.floor(height / cubeSize);
        for (let row = 0; row < rows; ++row) {
            for (let col = 0; col < cols; ++col) {
                positions.push({row, col,
                    x: col * cubeSize + cubeSize/2,
                    y: row * cubeSize + cubeSize/2 + opts.oscFunc(t, row, col)
                });
            }
        }
    } else if (opts.layout === 'hex') {
        const hexH = cubeSize * 0.87;
        cols = Math.floor(width / (cubeSize * 0.87));
        rows = Math.floor(height / (cubeSize * 0.75));
        for (let row = 0; row < rows; ++row) {
            for (let col = 0; col < cols; ++col) {
                const x = col * hexH + (row % 2) * (hexH/2) + cubeSize/2;
                const y = row * cubeSize * 0.75 + cubeSize/2 + opts.oscFunc(t, row, col);
                positions.push({row, col, x, y});
            }
        }
    }
    let phase = 0;
    for (let i = 0; i < positions.length; ++i) {
        const {x, y, row, col} = positions[i];
        const rgb = opts.palette[(row * (cols||1) + col) % opts.palette.length];
        let rot = 0, rotX = 0, rotY = 0, rotZ = 0;
        if (opts.rotation === 'xy') {
            rotY = Math.sin(t * 0.7 + phase) * 0.7;
            rotX = Math.cos(t * 0.5 + phase) * 0.5;
        } else if (opts.rotation === 'z') {
            rotZ = t * 1.2 + phase;
        }
    drawSolidCubeCustom(ctx, x, y, 0, cubeSize * 0.9, rgb, phase, opts.rotation, t, rotX, rotY, rotZ);
        phase += 0.13;
    }
}

// Draw a solid cube with custom rotation
export function drawSolidCubeCustom(ctx, cx, cy, cz, size, rgb, phase, rotation, t, rotX=0, rotY=0, rotZ=0) {
    const projAngle = Math.PI / 6;
    const projScale = 0.5;
    const lightDir = [0.5, -1, 1];
    const lightLen = Math.sqrt(lightDir[0]**2 + lightDir[1]**2 + lightDir[2]**2);
    const light = lightDir.map(v => v / lightLen);
    const s = size / 2;
    let verts = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s],
    ];
    // Rotation
    if (rotation === 'xy') {
        rotY = Math.sin(t * 0.7 + phase) * 0.7;
        rotX = Math.cos(t * 0.5 + phase) * 0.5;
    } else if (rotation === 'z') {
        rotZ = t * 1.2 + phase;
    } else if (rotation === 'xyz') {
        rotX = Math.sin(t * 1.1 + phase) * 1.2;
        rotY = Math.cos(t * 0.9 + phase) * 1.2;
        rotZ = t * 2.2 + phase;
    }
    verts = verts.map(([x, y, z]) => {
        // Z rotation
        let x0 = x * Math.cos(rotZ) - y * Math.sin(rotZ);
        let y0 = x * Math.sin(rotZ) + y * Math.cos(rotZ);
        // Y rotation
        let x1 = x0 * Math.cos(rotY) - z * Math.sin(rotY);
        let z1 = x0 * Math.sin(rotY) + z * Math.cos(rotY);
        // X rotation
        let y1 = y0 * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y0 * Math.sin(rotX) + z1 * Math.cos(rotX);
        return [cx + x1, cy + y1, cz + z2];
    });
    // Projected points
    const pts = verts.map(([x, y, z]) => ({
        x: x + projScale * z * Math.cos(projAngle),
        y: y - projScale * z * Math.sin(projAngle),
    }));
    // Each face: [indices, normal]
    const faces = [
        [[0,1,2,3], [0,0,-1]], // back
        [[4,5,6,7], [0,0,1]],  // front
        [[0,1,5,4], [0,-1,0]], // bottom
        [[2,3,7,6], [0,1,0]],  // top
        [[1,2,6,5], [1,0,0]],  // right
        [[0,3,7,4], [-1,0,0]], // left
    ];
    // Draw faces
    for (let f = 0; f < faces.length; ++f) {
        const [idxs, normal] = faces[f];
        // Transform normal
        let [nx, ny, nz] = normal;
        // Z rotation
        let nx0 = nx * Math.cos(rotZ) - ny * Math.sin(rotZ);
        let ny0 = nx * Math.sin(rotZ) + ny * Math.cos(rotZ);
        // Y rotation
        let nx1 = nx0 * Math.cos(rotY) - nz * Math.sin(rotY);
        let nz1 = nx0 * Math.sin(rotY) + nz * Math.cos(rotY);
        // X rotation
        let ny1 = ny0 * Math.cos(rotX) - nz1 * Math.sin(rotX);
        let nz2 = ny0 * Math.sin(rotX) + nz1 * Math.cos(rotX);
        // Lighting (dot with light)
        let dot = nx1 * light[0] + ny1 * light[1] + nz2 * light[2];
        dot = Math.max(0.15, dot); // ambient
        // Face color
        const [r, g, b] = rgb;
        ctx.beginPath();
        ctx.moveTo(pts[idxs[0]].x, pts[idxs[0]].y);
        for (let j = 1; j < 4; ++j) {
            ctx.lineTo(pts[idxs[j]].x, pts[idxs[j]].y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgb(${Math.floor(r*dot)},${Math.floor(g*dot)},${Math.floor(b*dot)})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}
