// Shader: Low-Poly 3D Spheres Bouncing Off Angled Plane
// Renders several low-poly spheres bouncing off a flat, angled plane using simple 3D projection.

export function lowPolySpheresShader(ctx, t, width = 1000, height = 1000) {
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    // Camera parameters
    const cam = { x: 0, y: 2, z: 8 };
    const look = { x: 0, y: 0.5, z: 0 };
    const fov = Math.PI / 3;
    const aspect = width / height;
    // Plane parameters
    const plane = { normal: { x: 0, y: 1, z: -0.5 }, d: 0 };
    // Spheres
    const spheres = [];
    const numSpheres = 4;
    for (let i = 0; i < numSpheres; ++i) {
        // Animate position and velocity
        let phase = t * 0.7 + i * 1.7;
        let px = Math.sin(phase) * 1.7 + (i - 1.5) * 1.7;
        let py = 2 + Math.abs(Math.sin(phase * 1.2 + i)) * 2.2;
        let pz = Math.cos(phase * 0.8) * 1.7;
        // Bounce off plane
        if (py < planeHeightAt(px, pz, plane)) py = planeHeightAt(px, pz, plane) + 0.1;
        spheres.push({ x: px, y: py, z: pz, color: pastel(i) });
    }
    // Draw plane (as a big quad)
    drawPlane(ctx, cam, look, fov, aspect, plane, width, height);
    // Draw spheres
    for (const s of spheres) {
        drawLowPolySphere(ctx, cam, look, fov, aspect, s, width, height);
    }
    ctx.restore();
}

function planeHeightAt(x, z, plane) {
    // Plane: normal.x * X + normal.y * Y + normal.z * Z + d = 0
    // Solve for Y
    return -(plane.normal.x * x + plane.normal.z * z + plane.d) / plane.normal.y;
}

function project3D(pt, cam, look, fov, aspect, width, height) {
    // Simple camera: look-at, perspective
    let dx = pt.x - cam.x, dy = pt.y - cam.y, dz = pt.z - cam.z;
    // Camera rotation (Y only)
    let theta = Math.atan2(look.x - cam.x, look.z - cam.z);
    let ct = Math.cos(theta), st = Math.sin(theta);
    let xz = ct * dx - st * dz;
    let zz = st * dx + ct * dz;
    let yy = dy;
    // Perspective
    let f = 0.5 * height / Math.tan(fov / 2);
    let px = width / 2 + xz * f / zz;
    let py = height / 2 - yy * f / zz;
    return { x: px, y: py, z: zz };
}

function drawPlane(ctx, cam, look, fov, aspect, plane, width, height) {
    // Draw a large quad for the plane
    const size = 8;
    const verts = [
        { x: -size, y: planeHeightAt(-size, -size, plane), z: -size },
        { x: size, y: planeHeightAt(size, -size, plane), z: -size },
        { x: size, y: planeHeightAt(size, size, plane), z: size },
        { x: -size, y: planeHeightAt(-size, size, plane), z: size }
    ];
    ctx.beginPath();
    for (let i = 0; i < verts.length; ++i) {
        const p = project3D(verts[i], cam, look, fov, aspect, width, height);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#444';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawLowPolySphere(ctx, cam, look, fov, aspect, sphere, width, height) {
    // Draw a low-poly sphere as a set of polygons
    const latSteps = 7, lonSteps = 10, r = 0.7;
    let points = [];
    for (let i = 0; i <= latSteps; ++i) {
        let theta = Math.PI * i / latSteps;
        for (let j = 0; j <= lonSteps; ++j) {
            let phi = 2 * Math.PI * j / lonSteps;
            let x = sphere.x + r * Math.sin(theta) * Math.cos(phi);
            let y = sphere.y + r * Math.cos(theta);
            let z = sphere.z + r * Math.sin(theta) * Math.sin(phi);
            points.push(project3D({ x, y, z }, cam, look, fov, aspect, width, height));
        }
    }
    // Draw polygons (quads)
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < latSteps; ++i) {
        for (let j = 0; j < lonSteps; ++j) {
            let idx = i * (lonSteps + 1) + j;
            let p1 = points[idx];
            let p2 = points[idx + 1];
            let p3 = points[idx + lonSteps + 2];
            let p4 = points[idx + lonSteps + 1];
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.fillStyle = sphere.color;
            ctx.fill();
            ctx.stroke();
        }
    }
    ctx.restore();
}

function pastel(i) {
    const colors = [
        '#ffb3ba', '#bae1ff', '#baffc9', '#ffffba', '#ffdfba', '#e2baff', '#baffea', '#ffd6ba'
    ];
    return colors[i % colors.length];
}
