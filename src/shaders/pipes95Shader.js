// Shader 9: Pipes 95 (Windows 95 Pipes screensaver inspired)
function pipes95Shader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Parameters
    const numPipes = 7;
    const pipeLen = 120;
    const pipeRadius = 13;
    const step = 18;
    const colors = ['#e63946', '#457b9d', '#ffbe0b', '#43aa8b', '#8338ec', '#3a86ff', '#ff006e'];
    // Static state for pipes
    if (!pipes95Shader.pipes) {
        pipes95Shader.pipes = [];
        for (let i = 0; i < numPipes; ++i) {
            // Each pipe: array of points, direction, color
            const angle = Math.random() * Math.PI * 2;
            const x = width/2 + Math.cos(angle) * width*0.2;
            const y = height/2 + Math.sin(angle) * height*0.2;
            pipes95Shader.pipes.push({
                points: [{x, y}],
                dir: Math.floor(Math.random()*4), // 0=right,1=down,2=left,3=up
                color: colors[i % colors.length],
                lastTurn: t,
            });
        }
    }
    // Animate pipes
    for (let p = 0; p < pipes95Shader.pipes.length; ++p) {
        const pipe = pipes95Shader.pipes[p];
        // Move head
        let head = pipe.points[pipe.points.length-1];
        // Occasionally turn
        if (Math.random() < 0.04 && t - pipe.lastTurn > 0.2) {
            pipe.dir = (pipe.dir + (Math.random()<0.5?1:3)) % 4;
            pipe.lastTurn = t;
        }
        // Step in direction
        let nx = head.x, ny = head.y;
        if (pipe.dir === 0) nx += step;
        if (pipe.dir === 1) ny += step;
        if (pipe.dir === 2) nx -= step;
        if (pipe.dir === 3) ny -= step;
        // Wrap around edges
        if (nx < 0) nx = width;
        if (nx > width) nx = 0;
        if (ny < 0) ny = height;
        if (ny > height) ny = 0;
        pipe.points.push({x: nx, y: ny});
        // Limit length
        while (pipe.points.length > pipeLen) pipe.points.shift();
        // Draw pipe
        ctx.save();
        ctx.strokeStyle = pipe.color;
        ctx.lineWidth = pipeRadius * 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < pipe.points.length; ++i) {
            const pt = pipe.points[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        // Draw pipe core (inner shadow)
        ctx.strokeStyle = '#222';
        ctx.lineWidth = pipeRadius * 1.1;
        ctx.beginPath();
        for (let i = 0; i < pipe.points.length; ++i) {
            const pt = pipe.points[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
    }
}
export default pipes95Shader;
