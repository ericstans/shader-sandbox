// Shader 12: Pipes 95 4 (single continuous pipe, never disappears, covers the screen)
export function pipes95_4Shader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Parameters
    const pipeRadius = 13;
    const step = 2; // even smaller step for smoothness
    const color = '#43aa8b';
    // Camera: skewed for more visible 3D
    const cam = { x: -80, y: 60, z: -320, fov: 700, tilt: Math.PI/8 };
    // Static state for the single pipe
    if (!pipes95_4Shader.pipe) {
        // Start in the center
        pipes95_4Shader.pipe = [{x: 0, y: 0, z: 0}];
        pipes95_4Shader.dir = Math.floor(Math.random()*6);
        pipes95_4Shader.lastTurn = t;
    }
    const pipe = pipes95_4Shader.pipe;
    // Animate pipe: grow at a continuous rate, smoothly bend
    let head = pipe[pipe.length-1];
    // Occasionally change direction, but interpolate smoothly
    if (!pipes95_4Shader.targetDir || pipes95_4Shader.dirChangeTime === undefined) {
        pipes95_4Shader.targetDir = pipes95_4Shader.dir;
        pipes95_4Shader.dirChangeTime = t;
    }
    if (Math.random() < 0.01 && t - pipes95_4Shader.dirChangeTime > 0.7) {
        let turn = Math.floor(Math.random()*5)+1;
        pipes95_4Shader.targetDir = (pipes95_4Shader.dir + turn) % 6;
        pipes95_4Shader.dirChangeTime = t;
    }
    // Interpolate direction for smooth bends
    let interp = Math.min(1, (t - pipes95_4Shader.dirChangeTime) / 0.5);
    let curDir = pipes95_4Shader.dir;
    let nextDir = pipes95_4Shader.targetDir;
    // Convert dir to vector
    function dirToVec(d) {
        if (d === 0) return [1,0,0];
        if (d === 1) return [-1,0,0];
        if (d === 2) return [0,1,0];
        if (d === 3) return [0,-1,0];
        if (d === 4) return [0,0,1];
        if (d === 5) return [0,0,-1];
    }
    let v1 = dirToVec(curDir);
    let v2 = dirToVec(nextDir);
    // Slerp for smooth direction change
    function slerp(a, b, t) {
        let dot = a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
        dot = Math.max(-1, Math.min(1, dot));
        let theta = Math.acos(dot) * t;
        let rel = [b[0]-a[0]*dot, b[1]-a[1]*dot, b[2]-a[2]*dot];
        let relLen = Math.sqrt(rel[0]*rel[0]+rel[1]*rel[1]+rel[2]*rel[2]);
        if (relLen < 1e-6) return a;
        rel = [rel[0]/relLen, rel[1]/relLen, rel[2]/relLen];
        return [
            a[0]*Math.cos(theta)+rel[0]*Math.sin(theta),
            a[1]*Math.cos(theta)+rel[1]*Math.sin(theta),
            a[2]*Math.cos(theta)+rel[2]*Math.sin(theta)
        ];
    }
    let dirVec = slerp(v1, v2, interp);
    // Grow the pipe at a continuous rate based on time delta
    if (!pipes95_4Shader.lastTime) pipes95_4Shader.lastTime = t;
    let dt = Math.max(0.001, t - pipes95_4Shader.lastTime);
    pipes95_4Shader.lastTime = t;
    const growSpeed = 180; // pixels per second (faster)
    let growDist = growSpeed * dt;
    let growSteps = Math.floor(growDist / step);
    for (let s = 0; s < growSteps; ++s) {
        let nx = head.x + dirVec[0]*step;
        let ny = head.y + dirVec[1]*step;
        let nz = head.z + dirVec[2]*step;
        // Wrap in a 3D box
        const box = 260;
        if (nx < -box) nx = box;
        if (nx > box) nx = -box;
        if (ny < -box) ny = box;
        if (ny > box) ny = -box;
        if (nz < -box) nz = box;
        if (nz > box) nz = -box;
        pipe.push({x: nx, y: ny, z: nz});
        head = {x: nx, y: ny, z: nz};
    }
    // When interpolation is done, commit to the new direction
    if (interp >= 1) pipes95_4Shader.dir = pipes95_4Shader.targetDir;
    // Never remove points: the pipe grows forever
    // Draw pipe (project 3D to 2D)
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = pipeRadius * 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < pipe.length; ++i) {
        const pt = pipe[i];
        // Skewed perspective projection with tilt
        // Rotate around X axis for tilt
        let x = pt.x - cam.x;
        let y = pt.y - cam.y;
        let z = pt.z - cam.z;
        let y2 = y * Math.cos(cam.tilt) - z * Math.sin(cam.tilt);
        let z2 = y * Math.sin(cam.tilt) + z * Math.cos(cam.tilt);
        const px = width/2 + x * (cam.fov / (cam.fov + z2));
        const py = height/2 + y2 * (cam.fov / (cam.fov + z2));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Draw pipe core (inner shadow)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = pipeRadius * 1.1;
    ctx.beginPath();
    for (let i = 0; i < pipe.length; ++i) {
        const pt = pipe[i];
        let x = pt.x - cam.x;
        let y = pt.y - cam.y;
        let z = pt.z - cam.z;
        let y2 = y * Math.cos(cam.tilt) - z * Math.sin(cam.tilt);
        let z2 = y * Math.sin(cam.tilt) + z * Math.cos(cam.tilt);
        const px = width/2 + x * (cam.fov / (cam.fov + z2));
        const py = height/2 + y2 * (cam.fov / (cam.fov + z2));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
}
