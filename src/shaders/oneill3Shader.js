// Shader: Planet with O'Neill Cylinder (low-poly, 3D)
function oneill3Shader(ctx, t, width = 1000, height = 1000) {
    // Camera and scene setup
    const cx = width / 2;
    const cy = height / 2;
    const fov = 600;
    // Planet parameters
    const planetRadius = width * 0.22;
    const planetSegs = 10; // lower poly for performance

    // --- Camera interaction state (persistent) ---
    if (!oneill3Shader.camState) {
        oneill3Shader.camState = {
            dragging: false,
            lastX: 0,
            lastY: 0,
            rotY: 0,
            rotX: 0
        };
        // Mouse event listeners (only add once)
        const canvas = ctx.canvas;
        canvas.addEventListener('mousedown', e => {
            oneill3Shader.camState.dragging = true;
            oneill3Shader.camState.lastX = e.clientX;
            oneill3Shader.camState.lastY = e.clientY;
        });
        window.addEventListener('mousemove', e => {
            if (oneill3Shader.camState.dragging) {
                const dx = e.clientX - oneill3Shader.camState.lastX;
                const dy = e.clientY - oneill3Shader.camState.lastY;
                oneill3Shader.camState.rotY += dx * 0.012;
                oneill3Shader.camState.rotX += dy * 0.012;
                oneill3Shader.camState.rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, oneill3Shader.camState.rotX));
                oneill3Shader.camState.lastX = e.clientX;
                oneill3Shader.camState.lastY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => {
            oneill3Shader.camState.dragging = false;
        });
    }
    const rotY = oneill3Shader.camState.rotY;
    const rotX = oneill3Shader.camState.rotX;
    // --- End camera interaction state ---

    // Object rotation (planet spins slowly)
    const objSpin = t * 0.12;
    function objectMatrix() {
        // Yaw (user), Pitch (user), then slow spin (Y)
        const cy = Math.cos(rotY), sy = Math.sin(rotY);
        const cx = Math.cos(rotX), sx = Math.sin(rotX);
        const cz = Math.cos(objSpin), sz = Math.sin(objSpin);
        // Yaw (Y axis)
        const yaw = [
            [cy, 0, sy],
            [0, 1, 0],
            [-sy, 0, cy]
        ];
        // Pitch (X axis)
        const pitch = [
            [1, 0, 0],
            [0, cx, -sx],
            [0, sx, cx]
        ];
        // Slow spin (Z axis)
        const spin = [
            [cz, -sz, 0],
            [sz, cz, 0],
            [0, 0, 1]
        ];
        // Combined: yaw * pitch * spin
        return matMul(yaw, matMul(pitch, spin));
    }
    // Draw background (space)
    ctx.fillStyle = '#070b1a';
    ctx.fillRect(0, 0, width, height);
    // Draw planet (low-poly sphere)
    const objMat = objectMatrix();
    // --- Collect faces for painter's algorithm (depth sort) ---
    let faces = [];
    for (let i = 0; i < planetSegs; ++i) {
        const theta0 = Math.PI * i / planetSegs;
        const theta1 = Math.PI * (i + 1) / planetSegs;
        for (let j = 0; j < planetSegs * 2; ++j) {
            const phi0 = 2 * Math.PI * j / (planetSegs * 2);
            const phi1 = 2 * Math.PI * (j + 1) / (planetSegs * 2);
            // 4 corners of quad
            const pts = [
                sph(planetRadius, theta0, phi0),
                sph(planetRadius, theta0, phi1),
                sph(planetRadius, theta1, phi1),
                sph(planetRadius, theta1, phi0)
            ];
            // Apply object rotation (user + spin)
            const ptsObj = pts.map(p => applyMat(p, objMat));
            // Backface culling: only cull if ALL vertices are behind the camera (z+fov < 0)
            const allBehind = ptsObj.every(([x, y, z]) => (z + fov) < 0);
            if (!allBehind) {
                // Compute average depth for sorting
                const avgZ = ptsObj.reduce((sum, p) => sum + p[2], 0) / ptsObj.length;
                faces.push({
                    ptsObj,
                    theta0,
                    phi0,
                    avgZ
                });
            }
        }
    }
    // Sort faces by avgZ (furthest first)
    faces.sort((a, b) => a.avgZ - b.avgZ);
    // Draw faces
    for (const face of faces) {
        const { ptsObj, theta0, phi0 } = face;
        // Project to 2D
        const poly = ptsObj.map(([x, y, z]) => proj3d(x, y, z + fov));
        // Simple Lambertian shading
        const normal = sphNormal(theta0, phi0);
        const light = [0.7, -0.5, 1.0];
        const nl = Math.max(0, dot(normal, light));
        // Pastel color cycling: use HSL, vary hue by face position and time
        const hue = ((theta0 / Math.PI) * 180 + (phi0 / (2 * Math.PI)) * 180 + t * 60) % 360;
        const sat = 0.55;
        const lum = 0.78 + 0.13 * nl; // pastel, but a bit brighter on lit faces
        // HSL to RGB conversion
        function hslToRgb(h, s, l) {
            h = h / 360;
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
        const [r, g, b] = hslToRgb(hue, sat, lum);
        const color = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let k = 1; k < 4; ++k) ctx.lineTo(poly[k][0], poly[k][1]);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 1.0;
        ctx.fill();
    // --- Draw moon ---
    // 3D moon parameters
    const moonOrbitR = planetRadius * 1.45;
    const moonRadius = planetRadius * 0.22;
    const moonAngle = t * 0.55;
    // Moon 3D position (in planet's orbital plane)
    const moonX = Math.cos(moonAngle) * moonOrbitR;
    const moonY = Math.sin(moonAngle) * moonOrbitR;
    const moonZ = 0;
    // Project moon center to 2D for painter's algorithm
    // We'll render the moon as a low-poly sphere, similar to the planet
    const moonSegs = 6;
    // Build faces for the moon
    let moonFaces = [];
    // Moon uses same lighting direction as planet
    for (let i = 0; i < moonSegs; ++i) {
        const theta0 = Math.PI * i / moonSegs;
        const theta1 = Math.PI * (i + 1) / moonSegs;
        for (let j = 0; j < moonSegs * 2; ++j) {
            const phi0 = 2 * Math.PI * j / (moonSegs * 2);
            const phi1 = 2 * Math.PI * (j + 1) / (moonSegs * 2);
            // 4 corners of quad
            const pts = [
                sph(moonRadius, theta0, phi0),
                sph(moonRadius, theta0, phi1),
                sph(moonRadius, theta1, phi1),
                sph(moonRadius, theta1, phi0)
            ];
            // Offset by moon's 3D position
            const ptsObj = pts.map(([x, y, z]) => [x + moonX, y + moonY, z + moonZ]);
            // Backface culling: only cull if ALL vertices are behind the camera (z+fov < 0)
            const allBehind = ptsObj.every(([x, y, z]) => (z + fov) < 0);
            if (!allBehind) {
                // Compute average depth for sorting
                const avgZ = ptsObj.reduce((sum, p) => sum + p[2], 0) / ptsObj.length;
                moonFaces.push({
                    ptsObj,
                    theta0,
                    phi0,
                    avgZ
                });
            }
        }
    }
    // Sort moon faces by avgZ (furthest first)
    moonFaces.sort((a, b) => a.avgZ - b.avgZ);
    // Draw moon faces
    for (const face of moonFaces) {
        const { ptsObj, theta0, phi0 } = face;
        // Project to 2D (use same camera as planet)
        const poly = ptsObj.map(([x, y, z]) => proj3d(x, y, z + fov));
        // Simple Lambertian shading
        const normal = sphNormal(theta0, phi0);
        const light = [0.7, -0.5, 1.0];
        const nl = Math.max(0, dot(normal, light));
        // Pastel color cycling for moon: desaturated, darker
    const hue = ((theta0 / Math.PI) * 180 + (phi0 / (2 * Math.PI)) * 180 + t * 60) % 360;
    const sat = 0.22; // lower saturation for moon
    const lum = 0.19 + 0.10 * nl; // much darker, but a bit brighter on lit faces
        // HSL to RGB conversion (reuse from above)
        function hslToRgb(h, s, l) {
            h = h / 360;
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
        const [r, g, b] = hslToRgb(hue, sat, lum);
        const color = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let k = 1; k < 4; ++k) ctx.lineTo(poly[k][0], poly[k][1]);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 1.0;
        ctx.fill();
    }
    }
    // --- Helper functions ---
    function sph(r, theta, phi) {
        return [
            r * Math.sin(theta) * Math.cos(phi),
            r * Math.cos(theta),
            r * Math.sin(theta) * Math.sin(phi)
        ];
    }
    function sphNormal(theta, phi) {
        return [
            Math.sin(theta) * Math.cos(phi),
            Math.cos(theta),
            Math.sin(theta) * Math.sin(phi)
        ];
    }
    function cyl(theta, z) {
        return [
            Math.cos(theta) * cylRadius,
            Math.sin(theta) * cylRadius,
            z
        ];
    }
    function cylNormal(theta) {
        return [
            Math.cos(theta),
            Math.sin(theta),
            0
        ];
    }
    function proj3d(x, y, z) {
        const scale = fov / (z);
        return [cx + x * scale, cy + y * scale];
    }
    function dot(a, b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    }
    function applyMat(v, m) {
        // 3x3 matrix
        return [
            v[0]*m[0][0] + v[1]*m[0][1] + v[2]*m[0][2],
            v[0]*m[1][0] + v[1]*m[1][1] + v[2]*m[1][2],
            v[0]*m[2][0] + v[1]*m[2][1] + v[2]*m[2][2]
        ];
    }
    function orientMatrix(yawAngle, tilt) {
        // Yaw (around Y), then tilt (around X)
        const ca = Math.cos(yawAngle), sa = Math.sin(yawAngle);
        const ct = Math.cos(tilt), st = Math.sin(tilt);
        // Yaw
        const yaw = [
            [ca, 0, sa],
            [0, 1, 0],
            [-sa, 0, ca]
        ];
        // Tilt
        const tiltM = [
            [1, 0, 0],
            [0, ct, -st],
            [0, st, ct]
        ];
        // Multiply tilt * yaw
        return matMul(tiltM, yaw);
    }
    function matMul(a, b) {
        // 3x3 * 3x3
        let r = [];
        for (let i = 0; i < 3; ++i) {
            r[i] = [];
            for (let j = 0; j < 3; ++j) {
                r[i][j] = 0;
                for (let k = 0; k < 3; ++k) r[i][j] += a[i][k] * b[k][j];
            }
        }
        return r;
    }
}
export default oneill3Shader;
