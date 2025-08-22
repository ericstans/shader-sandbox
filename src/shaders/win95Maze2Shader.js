
// Windows 95 Maze Screensaver: 3D Raycasting version
// Features: 3D first-person, textured walls/floor/ceiling, animated camera, random maze, objects
// (Textures are procedural for now; can be replaced with images for more accuracy)

export function win95Maze2Shader(ctx, t, width = 1000, height = 1000) {
    // --- Maze parameters ---
    const cols = 15, rows = 15;
    if (!win95Maze2Shader.maze) {
        win95Maze2Shader.maze = generateMaze3D(cols, rows);
        win95Maze2Shader.path = solveMaze3D(win95Maze2Shader.maze, cols, rows);
        win95Maze2Shader.cameraIdx = 0;
        win95Maze2Shader.lastT = 0;
        win95Maze2Shader.turning = false;
        win95Maze2Shader.angle = 0;
        win95Maze2Shader.dir = 0; // 0=E,1=S,2=W,3=N
    }
    // Camera movement (smooth, with smooth turning)
    const speed = 0.6; // cells/sec (slower)
    const path = win95Maze2Shader.path;
    if (win95Maze2Shader.lastT === undefined) win95Maze2Shader.lastT = t;
    if (win95Maze2Shader.cameraIdx === undefined) win95Maze2Shader.cameraIdx = 0;
    if (win95Maze2Shader.progress === undefined) win95Maze2Shader.progress = 0;
    if (win95Maze2Shader.angle === undefined) win95Maze2Shader.angle = 0;
    if (win95Maze2Shader.targetAngle === undefined) win95Maze2Shader.targetAngle = 0;
    let dt = t - win95Maze2Shader.lastT;
    win95Maze2Shader.lastT = t;
    win95Maze2Shader.progress += dt * speed;
    let turning = false;
    while (win95Maze2Shader.progress > 1) {
        win95Maze2Shader.progress -= 1;
        win95Maze2Shader.cameraIdx = (win95Maze2Shader.cameraIdx + 1) % path.length;
        // Turn logic (simulate 90deg turns at corners)
        const prev = path[(win95Maze2Shader.cameraIdx - 1 + path.length) % path.length];
        const curr = path[win95Maze2Shader.cameraIdx];
        let newDir = win95Maze2Shader.dir;
        if (prev.x !== curr.x || prev.y !== curr.y) {
            if (curr.x > prev.x) newDir = 0;
            else if (curr.y > prev.y) newDir = 1;
            else if (curr.x < prev.x) newDir = 2;
            else if (curr.y < prev.y) newDir = 3;
        }
        // If direction changed, set targetAngle for smooth turn
        if (newDir !== win95Maze2Shader.dir) {
            win95Maze2Shader.prevDir = win95Maze2Shader.dir;
            win95Maze2Shader.dir = newDir;
            win95Maze2Shader.angle = win95Maze2Shader.targetAngle || 0;
            win95Maze2Shader.targetAngle = [0, Math.PI/2, Math.PI, -Math.PI/2][newDir];
            turning = true;
        }
    }
    // Interpolate camera position
    const idx0 = (win95Maze2Shader.cameraIdx - 1 + path.length) % path.length;
    const idx1 = win95Maze2Shader.cameraIdx;
    const prev = path[idx0];
    const curr = path[idx1];
    const frac = win95Maze2Shader.progress;
    const cam = {
        x: prev.x + (curr.x - prev.x) * frac,
        y: prev.y + (curr.y - prev.y) * frac
    };
    // Interpolate camera angle for smooth turning
    let angle = win95Maze2Shader.angle;
    let targetAngle = win95Maze2Shader.targetAngle;
    // Normalize angles to [-PI, PI]
    function norm(a) { while (a < -Math.PI) a += 2*Math.PI; while (a > Math.PI) a -= 2*Math.PI; return a; }
    let delta = norm(targetAngle - angle);
    if (Math.abs(delta) > 0.01) {
        angle += delta * Math.min(1, dt * 3); // Smoothly interpolate angle
        win95Maze2Shader.angle = angle;
    } else {
        win95Maze2Shader.angle = targetAngle;
    }
    // --- 3D Raycasting ---
    renderMaze3D(ctx, win95Maze2Shader.maze, cols, rows, cam, angle, width, height, t);
}

// --- 3D Maze Generation ---
function generateMaze3D(cols, rows) {
    // Same as before, but for 3D
    const maze = [];
    for (let y = 0; y < rows; ++y) {
        maze[y] = [];
        for (let x = 0; x < cols; ++x) {
            maze[y][x] = { n: true, e: true, s: true, w: true, visited: false };
        }
    }
    const stack = [{ x: 0, y: 0 }];
    maze[0][0].visited = true;
    while (stack.length) {
        const { x, y } = stack[stack.length - 1];
        const neighbors = [];
        if (y > 0 && !maze[y - 1][x].visited) neighbors.push({ x, y: y - 1, dir: 'n', opp: 's' });
        if (x < cols - 1 && !maze[y][x + 1].visited) neighbors.push({ x: x + 1, y, dir: 'e', opp: 'w' });
        if (y < rows - 1 && !maze[y + 1][x].visited) neighbors.push({ x, y: y + 1, dir: 's', opp: 'n' });
        if (x > 0 && !maze[y][x - 1].visited) neighbors.push({ x: x - 1, y, dir: 'w', opp: 'e' });
        if (neighbors.length) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            maze[y][x][next.dir] = false;
            maze[next.y][next.x][next.opp] = false;
            maze[next.y][next.x].visited = true;
            stack.push({ x: next.x, y: next.y });
        } else {
            stack.pop();
        }
    }
    for (let y = 0; y < rows; ++y) for (let x = 0; x < cols; ++x) delete maze[y][x].visited;
    return maze;
}

// --- 3D Maze Solver ---
function solveMaze3D(maze, cols, rows) {
    // Same as before
    const queue = [{ x: 0, y: 0, path: [] }];
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    while (queue.length) {
        const { x, y, path } = queue.shift();
        if (x === cols - 1 && y === rows - 1) return [...path, { x, y }];
        visited[y][x] = true;
        const moves = [];
        if (!maze[y][x].n && !visited[y - 1]?.[x]) moves.push({ x, y: y - 1 });
        if (!maze[y][x].e && !visited[y]?.[x + 1]) moves.push({ x: x + 1, y });
        if (!maze[y][x].s && !visited[y + 1]?.[x]) moves.push({ x, y: y + 1 });
        if (!maze[y][x].w && !visited[y]?.[x - 1]) moves.push({ x: x - 1, y });
        for (const move of moves) {
            queue.push({ x: move.x, y: move.y, path: [...path, { x, y }] });
        }
    }
    return [{ x: 0, y: 0 }];
}

// --- 3D Raycasting Renderer ---
function renderMaze3D(ctx, maze, cols, rows, cam, angle, width, height, t) {
    // Simple raycasting: for each vertical slice, cast a ray and draw a wall/floor/ceiling
    const fov = Math.PI /2;
    const numRays = width;
    // Move camera slightly backward from the actual position
    const backOffset = 0.28;
    const camX = cam.x + 0.5 - Math.cos(angle) * backOffset;
    const camY = cam.y + 0.5 - Math.sin(angle) * backOffset;
    // --- Walls and ceiling (as before) ---
    const wallTops = new Array(width).fill(height);
    for (let x = 0; x < numRays; ++x) {
        const rayAngle = angle - fov/2 + (x/numRays)*fov;
        let rayX = camX, rayY = camY;
        const dx = Math.cos(rayAngle) * 0.02;
        const dy = Math.sin(rayAngle) * 0.02;
        let dist = 0;
        let hit = false;
        let wallDir = null;
        while (!hit && dist < 20) {
            rayX += dx;
            rayY += dy;
            dist += 0.02;
            const mx = Math.floor(rayX);
            const my = Math.floor(rayY);
            if (mx < 0 || my < 0 || mx >= cols || my >= rows) break;
            const cell = maze[my][mx];
            if (cell) {
                if (cell.n && rayY - my < 0.01) { hit = true; wallDir = 'n'; }
                if (cell.s && rayY - my > 0.99) { hit = true; wallDir = 's'; }
                if (cell.w && rayX - mx < 0.01) { hit = true; wallDir = 'w'; }
                if (cell.e && rayX - mx > 0.99) { hit = true; wallDir = 'e'; }
            }
        }
        if (hit) {
            const wallHeight = Math.min(height, (1 / dist) * 400);
            const y1 = Math.floor((height - wallHeight) / 2);
            const y2 = Math.floor((height + wallHeight) / 2);
            wallTops[x] = y2;
            ctx.beginPath();
            ctx.strokeStyle = wallTextureColor(wallDir, x, t);
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();
            // Ceiling
            ctx.beginPath();
            ctx.strokeStyle = ceilingTextureColor(x, y1, t);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, y1);
            ctx.stroke();
        }
    }

    // --- Simple perspective checkerboard floor ---
    for (let y = Math.floor(height/2); y < height; ++y) {
        // Perspective distance to floor at this row
        const p = (y - height/2) / (height/2);
        const floorDist = 1.0 / (p + 0.01); // avoid div by zero
        for (let x = 0; x < width; ++x) {
            if (y < wallTops[x]) continue; // don't draw over walls
            // World position of floor pixel
            const rayAngle = angle - fov/2 + (x/width)*fov;
            const fx = camX + Math.cos(rayAngle) * floorDist;
            const fy = camY + Math.sin(rayAngle) * floorDist;
            // Checkerboard pattern
            const tile = (Math.floor(fx) + Math.floor(fy)) % 2;
            ctx.fillStyle = tile ? '#bbb' : '#666';
            ctx.fillRect(x, y, 1, 1);
        }
    }
    // Optionally: draw objects (e.g., Windows logo, rat) at random intervals
    // (Stub: draw a logo at the exit)
    const exit = { x: cols-1, y: rows-1 };
    if (Math.abs(cam.x - exit.x) + Math.abs(cam.y - exit.y) < 2) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#0f0';
        ctx.font = `${Math.floor(width/8)}px Arial Black, Impact, sans-serif`;
        ctx.fillText('🪟', width/2-40, height/2-40);
        ctx.restore();
    }
}

// --- Procedural Textures ---
function wallTextureColor(dir, x, t) {
    // Simulate brick, tile, etc.
    if (dir === 'n' || dir === 's') {
        return `rgb(${120+40*Math.sin(x/8+t)},${80+40*Math.cos(x/8)},${120})`;
    } else {
        return `rgb(${80},${120+40*Math.sin(x/8)},${80+40*Math.cos(x/8+t)})`;
    }
}
function floorTextureColor(x, y, t) {
    // Simulate checkerboard
    return ((Math.floor(x/32)+Math.floor(y/32))%2===0)?'#bbb':'#666';
}
function ceilingTextureColor(x, y, t) {
    // Simulate sky/ceiling
    return `rgb(${180+40*Math.sin(x/32+t)},${220},${255})`;
}
