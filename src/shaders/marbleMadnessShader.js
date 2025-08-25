// Shader: Marble Madness (1970s Arcade Inspired)
// A tribute to the isometric marble maze game: rolling marble, ramps, slopes, and obstacles.

function marbleMadnessShader(ctx, t, width = 1000, height = 1000) {
    ctx.save();
    // Background gradient (sky)
    let grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#b3e0ff');
    grad.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Camera follows marble
    const zOffset = 60;
    if (!marbleMadnessShader.marble) {
        // Spawn directly above the first tile (centered)
        const firstTile = {x: 1, y: 0, w: 6, h: 2, z: 0 + zOffset};
        const spawnX = firstTile.x + firstTile.w/2;
        const spawnY = firstTile.y + firstTile.h/2;
        const spawnZ = firstTile.z + 16; // spawn above, will fall onto tile
        marbleMadnessShader.marble = { x: spawnX, y: spawnY, z: spawnZ, vx: 0, vy: 0, vz: 0 };
    }
    let marble = marbleMadnessShader.marble;
    // Camera offset (center on marble, smooth follow)
    if (!marbleMadnessShader.cam) {
        marbleMadnessShader.cam = { x: marble.x, y: marble.y };
    }
    let cam = marbleMadnessShader.cam;
    cam.x += (marble.x - cam.x) * 0.08;
    cam.y += (marble.y - cam.y) * 0.08;
    // Isometric projection helpers with camera
    function isoX(x, y) { return width/2 + ((x - cam.x) - (y - cam.y)) * width/18; }
    function isoY(x, y, z=0) { return height*0.18 + ((x - cam.x) + (y - cam.y)) * width/36 - z; }

    // Maze layout (new design: S-curve with platforms under spawn, lowered)
    const tiles = [
        // Start platform under spawn
        {x: 1, y: 0, w: 6, h: 2, z: 0 + zOffset},
        // S-curve path
        {x: 2, y: 2, w: 6, h: 2, z: 20 + zOffset},
        {x: 1, y: 4, w: 6, h: 2, z: 40 + zOffset},
        {x: 2, y: 6, w: 6, h: 2, z: 60 + zOffset},
        {x: 1, y: 8, w: 6, h: 2, z: 80 + zOffset},
        // End platform
        {x: 2, y: 10, w: 6, h: 2, z: 100 + zOffset},
    ];

    // Draw maze tiles
    for (const tile of tiles) {
        ctx.beginPath();
        ctx.moveTo(isoX(tile.x, tile.y), isoY(tile.x, tile.y, tile.z));
        ctx.lineTo(isoX(tile.x+tile.w, tile.y), isoY(tile.x+tile.w, tile.y, tile.z));
        ctx.lineTo(isoX(tile.x+tile.w, tile.y+tile.h), isoY(tile.x+tile.w, tile.y+tile.h, tile.z));
        ctx.lineTo(isoX(tile.x, tile.y+tile.h), isoY(tile.x, tile.y+tile.h, tile.z));
        ctx.closePath();
        ctx.fillStyle = '#b0b0b0';
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
    }

    // Draw obstacles (simple cones)
    for (let i = 0; i < tiles.length; ++i) {
        let tile = tiles[i];
        if (i % 2 === 1) {
            let cx = tile.x + tile.w/2;
            let cy = tile.y + tile.h/2;
            let cz = tile.z + 10;
            let x = isoX(cx, cy), y = isoY(cx, cy, cz);
            ctx.beginPath();
            ctx.arc(x, y, width/40, 0, 2*Math.PI);
            ctx.fillStyle = '#d8a030';
            ctx.fill();
            ctx.strokeStyle = '#a07020';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Simple gravity and movement
    let g = 0.008 * width;
    // Move marble along the path
    let tileIdx = -1;
    let onPlatform = false;
    for (let i = 0; i < tiles.length; ++i) {
        let tile = tiles[i];
        // Check if marble is over this tile (x/y bounds)
        if (
            marble.x >= tile.x && marble.x <= tile.x + tile.w &&
            marble.y >= tile.y && marble.y <= tile.y + tile.h
        ) {
            tileIdx = i;
            // Platform collision: if marble is below or at platform, clamp to platform
            if (marble.z <= tile.z + 1) {
                marble.z = tile.z + 1;
                if (marble.vz < 0) marble.vz = 0;
                onPlatform = true;
            }
            break;
        }
    }
    if (onPlatform) {
        // Add gentle slope to keep marble moving
        marble.vx += 0.01;
        marble.vy += 0.01;
    } else {
        marble.vz -= g;
    }
    marble.x += marble.vx;
    marble.y += marble.vy;
    marble.z += marble.vz;
    // Collision with obstacles (reset if hit)
    for (let i = 0; i < tiles.length; ++i) {
        let tile = tiles[i];
        if (i % 2 === 1) {
            let cx = tile.x + tile.w/2;
            let cy = tile.y + tile.h/2;
            let cz = tile.z + 10;
            let dx = marble.x - cx, dy = marble.y - cy, dz = marble.z - cz;
            let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < 0.7) {
                marble.x = 2; marble.y = 0.5; marble.z = 30; marble.vx = 0; marble.vy = 0; marble.vz = 0;
            }
        }
    }
    // Draw marble
    let mx = isoX(marble.x, marble.y), my = isoY(marble.x, marble.y, marble.z);
    let marbleRad = width/32;
    let grad2 = ctx.createRadialGradient(mx-marbleRad/3, my-marbleRad/3, marbleRad/6, mx, my, marbleRad);
    grad2.addColorStop(0, '#fff');
    grad2.addColorStop(0.5, '#b0d0ff');
    grad2.addColorStop(1, '#4060a0');
    ctx.beginPath();
    ctx.arc(mx, my, marbleRad, 0, 2*Math.PI);
    ctx.fillStyle = grad2;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#204080';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}
export default marbleMadnessShader;
