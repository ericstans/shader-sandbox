// Shader: Pastel Planet (no moon, pastel cycling faces)
function pastelPlanetShader(ctx, t, width = 1000, height = 1000) {
    // Camera and scene setup
    const cx = width / 2;
    const cy = height / 2;
    const fov = 600;
    // Planet parameters
    const planetRadius = width * 0.22;
    const planetSegs = 10; // lower poly for performance

    // --- Camera interaction state (persistent) ---
    if (!pastelPlanetShader.camState) {
        pastelPlanetShader.camState = {
            dragging: false,
            lastX: 0,
            lastY: 0,
            rotY: 0,
            rotX: 0
        };
        // Mouse event listeners (only add once)
        const canvas = ctx.canvas;
        canvas.addEventListener('mousedown', e => {
            pastelPlanetShader.camState.dragging = true;
            pastelPlanetShader.camState.lastX = e.clientX;
            pastelPlanetShader.camState.lastY = e.clientY;
        });
        window.addEventListener('mousemove', e => {
            if (pastelPlanetShader.camState.dragging) {
                const dx = e.clientX - pastelPlanetShader.camState.lastX;
                const dy = e.clientY - pastelPlanetShader.camState.lastY;
                pastelPlanetShader.camState.rotY += dx * 0.012;
                pastelPlanetShader.camState.rotX += dy * 0.012;
                pastelPlanetShader.camState.rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, pastelPlanetShader.camState.rotX));
                pastelPlanetShader.camState.lastX = e.clientX;
                pastelPlanetShader.camState.lastY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => {
            pastelPlanetShader.camState.dragging = false;
        });
    }
    const rotY = pastelPlanetShader.camState.rotY;
    const rotX = pastelPlanetShader.camState.rotX;
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
    ctx.fillStyle = '#f8f8ff';
    ctx.fillRect(0, 0, width, height);
    // Draw planet (low-poly sphere)
    const objMat = objectMatrix();
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
                    i,
                    j,
                    avgZ
                });
            }
        }
    }
    // Sort faces by avgZ (furthest first)
    faces.sort((a, b) => a.avgZ - b.avgZ);
    // Draw faces with pastel cycling
    for (const face of faces) {
        const { ptsObj, theta0, phi0, i, j } = face;
        // Project to 2D
        const poly = ptsObj.map(([x, y, z]) => proj3d(x, y, z + fov));
        // Pastel color cycling
        // Use i, j, t to create a unique color for each face that cycles over time
        const hue = ((i * 0.13 + j * 0.07 + t * 0.18) % 1.0) * 360;
        const sat = 0.55 + 0.25 * Math.sin(i + t * 0.3);
        const light = 0.78 + 0.12 * Math.cos(j + t * 0.2);
        const color = `hsl(${hue.toFixed(1)},${(sat*100).toFixed(1)}%,${(light*100).toFixed(1)}%)`;
        ctx.beginPath();
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let k = 1; k < 4; ++k) ctx.lineTo(poly[k][0], poly[k][1]);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 1.0;
        ctx.fill();
    }
    // --- Helper functions ---
    function sph(r, theta, phi) {
        return [
            r * Math.sin(theta) * Math.cos(phi),
            r * Math.cos(theta),
            r * Math.sin(theta) * Math.sin(phi)
        ];
    }
    function proj3d(x, y, z) {
        const scale = fov / (z);
        return [cx + x * scale, cy + y * scale];
    }
    function applyMat(v, m) {
        // 3x3 matrix
        return [
            v[0]*m[0][0] + v[1]*m[0][1] + v[2]*m[0][2],
            v[0]*m[1][0] + v[1]*m[1][1] + v[2]*m[1][2],
            v[0]*m[2][0] + v[1]*m[2][1] + v[2]*m[2][2]
        ];
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
export default pastelPlanetShader;
