// Shader 11: Pipes 95 3 (slower, further apart, longer-lasting pipes)
export function pipes95_3Shader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Parameters
    const numPipes = 5;
    const pipeLen = 220; // much longer
    const pipeRadius = 13;
    const step = 44; // further apart
    const colors = ['#e63946', '#457b9d', '#ffbe0b', '#43aa8b', '#8338ec', '#3a86ff', '#ff006e'];
    // Camera
    const cam = { x: 0, y: 0, z: -320, fov: 700 };
    // Static state for pipes
    if (!pipes95_3Shader.pipes) {
        pipes95_3Shader.pipes = [];
        for (let i = 0; i < numPipes; ++i) {
            // Each pipe: array of 3D points, direction, color
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * 220;
            const y = Math.sin(angle) * 220;
            const z = Math.random() * 200 - 100;
            pipes95_3Shader.pipes.push({
                points: [{x, y, z}],
                dir: Math.floor(Math.random()*6), // 0=+x,1=-x,2=+y,3=-y,4=+z,5=-z
                color: colors[i % colors.length],
                lastTurn: t,
            });
        }
    }
    // Animate pipes
    for (let p = 0; p < pipes95_3Shader.pipes.length; ++p) {
        const pipe = pipes95_3Shader.pipes[p];
        // Move head
        let head = pipe.points[pipe.points.length-1];
        // Occasionally turn (slower)
        if (Math.random() < 0.02 && t - pipe.lastTurn > 0.5) {
            let turn = Math.floor(Math.random()*5)+1;
            pipe.dir = (pipe.dir + turn) % 6;
            pipe.lastTurn = t;
        }
        // Step in direction (slower)
        let nx = head.x, ny = head.y, nz = head.z;
        if (pipe.dir === 0) nx += step;
        if (pipe.dir === 1) nx -= step;
        if (pipe.dir === 2) ny += step;
        if (pipe.dir === 3) ny -= step;
        if (pipe.dir === 4) nz += step;
        if (pipe.dir === 5) nz -= step;
        // Wrap in a 3D box
        const box = 260;
        if (nx < -box) nx = box;
        if (nx > box) nx = -box;
        if (ny < -box) ny = box;
        if (ny > box) ny = -box;
        if (nz < -box) nz = box;
        if (nz > box) nz = -box;
        pipe.points.push({x: nx, y: ny, z: nz});
        // Limit length (longer lasting)
        while (pipe.points.length > pipeLen) pipe.points.shift();
        // Draw pipe (project 3D to 2D)
        ctx.save();
        ctx.strokeStyle = pipe.color;
        ctx.lineWidth = pipeRadius * 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < pipe.points.length; ++i) {
            const pt = pipe.points[i];
            // Simple perspective projection
            const px = width/2 + (pt.x - cam.x) * (cam.fov / (cam.fov + pt.z - cam.z));
            const py = height/2 + (pt.y - cam.y) * (cam.fov / (cam.fov + pt.z - cam.z));
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // Draw pipe core (inner shadow)
        ctx.strokeStyle = '#222';
        ctx.lineWidth = pipeRadius * 1.1;
        ctx.beginPath();
        for (let i = 0; i < pipe.points.length; ++i) {
            const pt = pipe.points[i];
            const px = width/2 + (pt.x - cam.x) * (cam.fov / (cam.fov + pt.z - cam.z));
            const py = height/2 + (pt.y - cam.y) * (cam.fov / (cam.fov + pt.z - cam.z));
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
    }
}
