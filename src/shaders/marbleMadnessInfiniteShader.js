
let avgTileX = 0

    // Step 2a/2b: Add persistent targetCamX and set to avgTileX
    if (marbleMadnessInfiniteShader.targetCamX === undefined) {
        marbleMadnessInfiniteShader.targetCamX = avgTileX;
    } else {
        marbleMadnessInfiniteShader.targetCamX = avgTileX;
    }
// Shader: Marble Madness Infinite (Procedural, Scrolling)
// An endless marble madness level with a marble, panning camera, and procedural level generation.

export function marbleMadnessInfiniteShader(ctx, t, width = 1000, height = 1000) {
    ctx.save();
    // Clear the canvas each frame
    ctx.clearRect(0, 0, width, height);
    // Camera vertical offset (pans down over time, monotonic)
    if (!marbleMadnessInfiniteShader.t0) marbleMadnessInfiniteShader.t0 = t;
    const camSpeed = 1.2;
    const camY = (t - marbleMadnessInfiniteShader.t0) * camSpeed;
    // Step 2c: Smoothly interpolate camX toward targetCamX
    if (marbleMadnessInfiniteShader.camX === undefined) {
        marbleMadnessInfiniteShader.camX = marbleMadnessInfiniteShader.targetCamX || 0;
    } else {
        // Move camX 10% toward targetCamX each frame
        marbleMadnessInfiniteShader.camX += (marbleMadnessInfiniteShader.targetCamX - marbleMadnessInfiniteShader.camX) * 0.1;
    }
    const camX = marbleMadnessInfiniteShader.camX;
    // Parameters
    const tileW = 6, tileH = 2, tileZ = 20, marbleRad = width/32;
    // Isometric projection helpers
    function isoX(x, y) { return width/2 + ((x - camX) - (y - camY)) * width/18; }
    function isoY(x, y, z=0) { return height*0.18 + ((x - camX) + (y - camY)) * width/36 - z; }

    // Level state (persistent)
    if (!marbleMadnessInfiniteShader.sections) marbleMadnessInfiniteShader.sections = [];
    let sections = marbleMadnessInfiniteShader.sections;
    const maxX = 18 - tileW; // ensure tile fits in view (18 is approx. board width)

        // Respawn logic: if marble falls off the screen, respawn at center of a visible tile
        function respawnMarble() {
            // Find the first visible tile near the camera
            let camTileY = camY + (marbleMadnessInfiniteShader.marbleYOffset || 8);
            let bestTile = null;
            let minDist = Infinity;
            for (let i = 0; i < sections.length; ++i) {
                let s = sections[i];
                let dy = Math.abs(s.y + s.h/2 - camTileY);
                if (dy < minDist) {
                    minDist = dy;
                    bestTile = s;
                }
            }
            if (bestTile) {
                marble.x = bestTile.x + bestTile.w/2;
                marble.y = bestTile.y + bestTile.h/2;
                marble.z = bestTile.z + marbleRad;
                marble.vx = 0;
                marble.vy = 0;
                marble.vz = 0;
            }
        }
    // Step 1: Compute average X of last N tiles
    const avgTileCount = 8;
    let avgTileX = 0;
    if (sections.length > 0) {
        let n = Math.min(avgTileCount, sections.length);
        let sum = 0;
        for (let i = sections.length - n; i < sections.length; ++i) {
            sum += sections[i].x + sections[i].w/2;
        }
        avgTileX = sum / n;
    }
    // Always generate new sections based on camera position and visible area
    // Estimate how many tiles are needed to fill the screen vertically in isometric projection
    const isoTileHeight = width / 36 * tileH; // vertical pixel height per tile in iso
    const bufferTiles = 8; // extra tiles below the screen
    const tilesNeeded = Math.ceil(height / isoTileHeight) + bufferTiles;
    let maxY = sections.length ? sections[sections.length-1].y + tileH : 0;
    // The bottommost visible Y in tile coordinates
    let targetY = camY + tilesNeeded * tileH;
    // Persistent tile counter for color grouping
    if (marbleMadnessInfiniteShader.tileCount === undefined) marbleMadnessInfiniteShader.tileCount = 0;
    while (maxY < targetY) {
        let last = sections.length ? sections[sections.length-1] : null;
        let baseY = last ? last.y + tileH : 0;
        // Randomize width for platform variation
        let w = 4 + Math.floor(Math.random() * 5); // width: 4 to 8
        // Randomly curve left/right, with a small random offset for organic shape
        let x = last ? last.x + (Math.random()<0.5?-1:1)*2 + Math.floor((Math.random()-0.5)*2) : 4;
        x = Math.max(0, Math.min(18 - w, x));
        let y = baseY;
        // Always gently downhill: new tile is lower than or equal to previous
        let z;
        if (last) {
            z = last.z - tileZ * (0.1 + Math.random() * 0.3); // drop 0.1–0.4 tileZ
        } else {
            z = 60;
        }
        // Assign a group index for coloring
        let group = Math.floor(marbleMadnessInfiniteShader.tileCount / 10);
        sections.push({ x, y, w, h: tileH, z, createdAt: t, group });
        marbleMadnessInfiniteShader.tileCount++;
        maxY = y + tileH;
    }
    // Cull old sections (wait at least 500ms after creation)
    while (
        sections.length &&
        isoY(sections[0].x, sections[0].y, sections[0].z+tileZ) < -tileH*width/36 &&
        (t - (sections[0].createdAt || 0)) > 1.5
    ) {
        sections.shift();
    }
    // Draw maze tiles
    // Color palette for tile groups (first is grey, then cycle through others)
    const tileColors = [
        '#b0b0b0', // grey for first 10
        '#a0e0b0', '#b0d0ff', '#ffd080', '#e0a0e0', '#f0b0b0', '#b0f0e0', '#e0e0a0', '#b0b0f0', '#f0c090'
    ];
    for (let i = 0; i < sections.length; ++i) {
        const tile = sections[i];
        ctx.beginPath();
        ctx.moveTo(isoX(tile.x, tile.y), isoY(tile.x, tile.y, tile.z));
        ctx.lineTo(isoX(tile.x+tile.w, tile.y), isoY(tile.x+tile.w, tile.y, tile.z));
        ctx.lineTo(isoX(tile.x+tile.w, tile.y+tile.h), isoY(tile.x+tile.w, tile.y+tile.h, tile.z));
        ctx.lineTo(isoX(tile.x, tile.y+tile.h), isoY(tile.x, tile.y+tile.h, tile.z));
        ctx.closePath();
        let color = tileColors[tile.group % tileColors.length];
        ctx.fillStyle = color;
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
    }
    // Marble state (persistent)
    if (!marbleMadnessInfiniteShader.marble) {
        let first = sections[0];
        marbleMadnessInfiniteShader.marble = { x: first.x+tileW/2, y: first.y+tileH/2, z: first.z+marbleRad, vx: 0, vy: 0, vz: 0 };
    }
    // Gravity and movement
    let g = 0.008 * width;
    // Find the tile under the marble
    let marble = marbleMadnessInfiniteShader.marble;
    let tile = null;
    const fuzz = 0.25; // margin in tile units
    for (let i = 0; i < sections.length; ++i) {
        let s = sections[i];
        if (
            marble.x >= s.x - fuzz && marble.x <= s.x + s.w + fuzz &&
            marble.y >= s.y - fuzz && marble.y <= s.y + s.h + fuzz
        ) {
            tile = s;
            break;
        }
    }
    // Only respawn if marble is not above any tile and has fallen well below the lowest visible tile
    let outOfBounds = false;
    if (!tile) {
        // Find the lowest visible tile's z
        let minTileZ = Infinity;
        for (let i = 0; i < sections.length; ++i) {
            if (sections[i].z < minTileZ) minTileZ = sections[i].z;
        }
        // Buffer: allow marble to fall 2 marble radii below the lowest tile
        if (marble.z < minTileZ - 2 * marbleRad) {
            outOfBounds = true;
        }
    }
    if (marble.x < 0 || marble.x > maxX + tileW) {
        outOfBounds = true;
    }
    if (outOfBounds) {
        respawnMarble();
        // Recompute tile after respawn
        tile = null;
        for (let i = 0; i < sections.length; ++i) {
            let s = sections[i];
            if (
                marble.x >= s.x && marble.x <= s.x + s.w &&
                marble.y >= s.y && marble.y <= s.y + s.h
            ) {
                tile = s;
                break;
            }
        }
    }
    if (tile && marble.z <= tile.z + marbleRad) {
        marble.z = tile.z + marbleRad;
        if (marble.vz < 0) marble.vz = 0;
        // Swerve: nudge vx toward a smoothly blended center between current and next tile
        let centerX = tile.x + tile.w / 2;
        // Find the next tile in the path (if any)
        let nextTile = null;
        for (let i = 0; i < sections.length; ++i) {
            let s = sections[i];
            if (s.y > tile.y && s.x !== undefined) {
                nextTile = s;
                break;
            }
        }
        let blend = 0;
        if (nextTile) {
            // How far is the marble from the start to end of this tile in y?
            blend = (marble.y - tile.y) / tile.h;
            blend = Math.max(0, Math.min(1, blend));
            let nextCenterX = nextTile.x + nextTile.w / 2;
            centerX = centerX * (1 - blend) + nextCenterX * blend;
        }
    let dx = centerX - marble.x;
    // Target vx is proportional to dx, but capped
    let maxVx = 1.2; // max left/right speed
    let targetVx = Math.max(-maxVx, Math.min(maxVx, dx * 0.18));
    // Gently accelerate vx toward targetVx
    let accel = 0.045; // slower acceleration factor
    marble.vx += (targetVx - marble.vx) * accel;
    marble.vx *= 0.7; // friction/damping
        // Lock marble's y to camera's y plus offset
        if (marbleMadnessInfiniteShader.marbleYOffset === undefined) {
            marbleMadnessInfiniteShader.marbleYOffset = 8; // how far ahead of camY the marble should be
        }
        marble.y = camY + marbleMadnessInfiniteShader.marbleYOffset;
        marble.vy = 0;
    } else {
        marble.vz -= g;
        marble.y += marble.vy;
        marble.vx *= 0.7; // friction even if falling
    }
    // Clamp (vx, vy) so total movement per frame does not exceed camSpeed
    let vlen = Math.sqrt(marble.vx * marble.vx + marble.vy * marble.vy);
    if (vlen > camSpeed) {
        marble.vx *= camSpeed / vlen;
        marble.vy *= camSpeed / vlen;
    }
    marble.x += marble.vx;
    marble.z += marble.vz;
    // Draw marble
    let mx = isoX(marble.x, marble.y), my = isoY(marble.x, marble.y, marble.z);
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
