// Shader: Planet with O'Neill Cylinder (low-poly, 3D)
export function oneillShader(ctx, t, width = 1000, height = 1000) {
    // Track highlighted faces by (i,j) index to avoid duplicate beeps
    if (!oneillShader.prevHighlights) oneillShader.prevHighlights = new Set();
    const newHighlights = new Set();
    // --- In-canvas slider state ---
    if (!oneillShader.slider) {
        oneillShader.slider = {
            value: 1.0, // default speed multiplier
            dragging: false,
            x: 0, // will be set below
            y: 0,
            w: 180,
            h: 24
        };
        // Mouse events for slider
        const canvas = ctx.canvas;
        canvas.addEventListener('mousedown', e => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const s = oneillShader.slider;
            if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) {
                s.dragging = true;
                s.dragOffset = mx - (s.x + (s.value - 0.2) / 1.8 * s.w);
            }
        });
        window.addEventListener('mousemove', e => {
            if (oneillShader.slider.dragging) {
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                let v = (mx - oneillShader.slider.x - oneillShader.slider.dragOffset) / oneillShader.slider.w;
                v = Math.max(0, Math.min(1, v));
                oneillShader.slider.value = 0.2 + v * 1.8; // range 0.2 to 2.0
            }
        });
        window.addEventListener('mouseup', () => {
            oneillShader.slider.dragging = false;
        });
    }
    // Position slider at bottom of canvas
    const slider = oneillShader.slider;
    slider.x = width/2 - slider.w/2;
    slider.y = height - slider.h - 12;
    // Track if a beep should be played this frame
    let culledThisFrame = false;
    // Camera and scene setup
    const cx = width / 2;
    const cy = height / 2;
    const fov = 600;
    // Planet parameters
    const planetRadius = width * 0.22;
    const planetSegs = 18; // low poly

    // --- Camera interaction state (persistent) ---
    if (!oneillShader.camState) {
        oneillShader.camState = {
            dragging: false,
            lastX: 0,
            lastY: 0,
            rotY: 0,
            rotX: 0
        };
        // Mouse event listeners (only add once)
        const canvas = ctx.canvas;
        canvas.addEventListener('mousedown', e => {
            oneillShader.camState.dragging = true;
            oneillShader.camState.lastX = e.clientX;
            oneillShader.camState.lastY = e.clientY;
        });
        window.addEventListener('mousemove', e => {
            if (oneillShader.camState.dragging) {
                const dx = e.clientX - oneillShader.camState.lastX;
                const dy = e.clientY - oneillShader.camState.lastY;
                oneillShader.camState.rotY += dx * 0.012;
                oneillShader.camState.rotX += dy * 0.012;
                oneillShader.camState.rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, oneillShader.camState.rotX));
                oneillShader.camState.lastX = e.clientX;
                oneillShader.camState.lastY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => {
            oneillShader.camState.dragging = false;
        });
    }
    const rotY = oneillShader.camState.rotY;
    const rotX = oneillShader.camState.rotX;
    // --- End camera interaction state ---

    // Object rotation (planet spins slowly)
    // Use slider value for rotation speed
    const objSpin = t * 0.12 * slider.value;
    // --- Draw slider ---
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#222';
    ctx.fillRect(slider.x, slider.y, slider.w, slider.h);
    // Track
    ctx.fillStyle = '#444';
    ctx.fillRect(slider.x + 8, slider.y + slider.h/2 - 3, slider.w - 16, 6);
    // Thumb
    const thumbX = slider.x + 8 + (slider.value - 0.2) / 1.8 * (slider.w - 16);
    ctx.beginPath();
    ctx.arc(thumbX, slider.y + slider.h/2, 10, 0, 2*Math.PI);
    ctx.fillStyle = slider.dragging ? '#fff' : '#bbb';
    ctx.fill();
    // Label
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#eee';
    ctx.textAlign = 'center';
    ctx.fillText('Rotation Speed', slider.x + slider.w/2, slider.y + slider.h/2 - 16);
    ctx.font = '12px monospace';
    ctx.fillText(slider.value.toFixed(2) + 'x', slider.x + slider.w/2, slider.y + slider.h/2 + 22);
    ctx.restore();
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
            // Backface culling: compute face normal in view space
            const v0 = ptsObj[0], v1 = ptsObj[1], v2 = ptsObj[2];
            const ux = v1[0] - v0[0], uy = v1[1] - v0[1], uz = v1[2] - v0[2];
            const vx = v2[0] - v0[0], vy = v2[1] - v0[1], vz = v2[2] - v0[2];
            const nx = uy * vz - uz * vy;
            const ny = uz * vx - ux * vz;
            const nz = ux * vy - uy * vx;
            // Only draw if normal faces camera (z > 0)
            if (nz > 0) {
                // Project to 2D
                const poly = ptsObj.map(([x, y, z]) => proj3d(x, y, z + fov));
                // Simple Lambertian shading
                const normal = sphNormal(theta0, phi0);
                const light = [0.7, -0.5, 1.0];
                const nl = Math.max(0, dot(normal, light));
                // Determine if face is on the "outside" (silhouette) from camera perspective
                // If the angle between the face normal and the view vector is close to 90deg, it's a silhouette
                // Camera is at (0,0,-fov) in object space, so view vector from face center to camera:
                const faceCenter = [
                    (ptsObj[0][0] + ptsObj[1][0] + ptsObj[2][0] + ptsObj[3][0]) / 4,
                    (ptsObj[0][1] + ptsObj[1][1] + ptsObj[2][1] + ptsObj[3][1]) / 4,
                    (ptsObj[0][2] + ptsObj[1][2] + ptsObj[2][2] + ptsObj[3][2]) / 4
                ];
                const viewVec = [0 - faceCenter[0], 0 - faceCenter[1], -fov - faceCenter[2]];
                // Normalize both
                const normLen = Math.sqrt(normal[0]**2 + normal[1]**2 + normal[2]**2);
                const viewLen = Math.sqrt(viewVec[0]**2 + viewVec[1]**2 + viewVec[2]**2);
                const nDotV = (normal[0]*viewVec[0] + normal[1]*viewVec[1] + normal[2]*viewVec[2]) / (normLen * viewLen);
                // nDotV near 0 means silhouette, near 1 means facing camera, near -1 means facing away
                let highlight = 0;
                if (Math.abs(nDotV) < 0.25) highlight = 1; // silhouette band
                else if (nDotV > 0.25 && nDotV < 0.55) highlight = 0.5; // soft highlight for glancing faces
                // Play beep for highlighted faces (once per frame, pitch by position)
                if (highlight > 0) {
                    const faceKey = `${i},${j}`;
                    newHighlights.add(faceKey);
                    if (!oneillShader.prevHighlights.has(faceKey)) {
                    if (!oneillShader.highlightBeepQueue) oneillShader.highlightBeepQueue = [];
                    // Map theta0 (0..PI) and phi0 (0..2PI) to a frequency range, e.g. 440Hz to 1760Hz
                    const minFreq = 440, maxFreq = 1760;
                    const thetaNorm = theta0 / Math.PI; // 0 (north pole) to 1 (south pole)
                    const phiNorm = phi0 / (2 * Math.PI); // 0 to 1 around the sphere
                    const freq = minFreq + (maxFreq - minFreq) * (0.5 * thetaNorm + 0.5 * phiNorm);
                    oneillShader.highlightBeepQueue.push(freq);
                    }
                }
                // Color logic
                let base = [60, 120, 220];
                if (highlight > 0) {
                    // Lighter blue for silhouette
                    base = [120, 180, 255];
                }
                // Blend highlight
                const color = `rgb(${Math.floor(base[0] + 60 * nl * (1 - 0.5 * highlight))},${Math.floor(base[1] + 60 * nl * (1 - 0.5 * highlight))},${Math.floor(base[2] + 40 * nl * (1 - 0.5 * highlight))})`;
                ctx.beginPath();
                ctx.moveTo(poly[0][0], poly[0][1]);
                for (let k = 1; k < 4; ++k) ctx.lineTo(poly[k][0], poly[k][1]);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.98;
                ctx.fill();
    // Update prevHighlights for next frame
    oneillShader.prevHighlights = newHighlights;
            } else {
                // Vary pitch by theta0 and phi0 (latitude and longitude)
                if (!oneillShader.culledBeepQueue) oneillShader.culledBeepQueue = [];
                // Map theta0 (0..PI) and phi0 (0..2PI) to a frequency range, e.g. 440Hz to 1760Hz
                const minFreq = 440, maxFreq = 1760;
                const thetaNorm = theta0 / Math.PI; // 0 (north pole) to 1 (south pole)
                const phiNorm = phi0 / (2 * Math.PI); // 0 to 1 around the sphere
                // Use both for more variety
                const freq = minFreq + (maxFreq - minFreq) * (0.5 * thetaNorm + 0.5 * phiNorm);
                oneillShader.culledBeepQueue.push(freq);
            }
    // Play beep(s) for all newly highlighted faces, up to 4 per frame
    if (oneillShader.highlightBeepQueue && oneillShader.highlightBeepQueue.length > 0) {
        const maxBeeps = 8;
        for (let i = 0; i < Math.min(maxBeeps, oneillShader.highlightBeepQueue.length); ++i) {
            playBeep(oneillShader.highlightBeepQueue[i]);
        }
        oneillShader.highlightBeepQueue = [];
    }

    // --- Sine beep function ---
    function playBeep(freq) {
        if (typeof window === 'undefined' || !window.AudioContext) return;
        if (!oneillShader.audioCtx) {
            oneillShader.audioCtx = new window.AudioContext();
        }
        const ctx = oneillShader.audioCtx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq || 880;
        g.gain.value = 0.08;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.07);
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.07);
    }
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
