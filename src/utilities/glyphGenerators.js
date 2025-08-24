// Space Invaders-esque sprite glyph generator
export function randomSpaceInvaderGlyph(width, height, leftNeighborType = null) {
    // Use recognizable templates for classic invader types, with minor randomization
    const glyph = emptyGlyph(width, height);
    const cols = Math.floor(width/2);
    const rows = height;
    // Helper: set pixel and its mirror
    function setSym(x, y) {
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            glyph[y][x] = 1;
            glyph[y][width-1-x] = 1;
        }
    }
    // Define templates (0=crab, 1=squid, 2=UFO, 3=bug, 4=rocket)
    const templates = [
        // Crab
        [
            '0011100',
            '0111110',
            '1111111',
            '1101111',
            '0111110',
            '1011101',
            '0100010',
        ],
        // Squid
        [
            '0011100',
            '0111110',
            '1111111',
            '1011101',
            '0011100',
            '0101010',
            '1010001',
        ],
        // UFO
        [
            '0001000',
            '0011100',
            '0111110',
            '1111111',
            '0111110',
            '0011100',
            '0100010',
        ],
        // Bug
        [
            '0011100',
            '0111110',
            '1111111',
            '1011101',
            '1111111',
            '0101010',
            '1010001',
        ],
        // Rocket/ship
        [
            '0001000',
            '0011100',
            '0111110',
            '1111111',
            '0011100',
            '0011100',
            '0111110',
        ],
    ];
    // Pick a template
    const tIdx = Math.floor(Math.random()*templates.length);
    const t = templates[tIdx];
    // Scale up by 3x
    const scale = 3;
    let tRows = t.length;
    let tCols = t[0].length;
    // Variation: randomly mirror horizontally
    const mirror = Math.random() < 0.5;
    // Variation: randomly shift rows or columns
    let tVar = t.map(row => row.split(''));
    // Row shift: randomly shift some rows left/right
    for (let i = 0; i < tRows; i++) {
        if (Math.random() < 0.4) {
            let shift = Math.floor(Math.random()*3)-1; // -1, 0, or 1
            if (shift !== 0) {
                tVar[i] = shift > 0
                    ? Array(shift).fill('0').concat(tVar[i].slice(0, tCols-shift))
                    : tVar[i].slice(-shift).concat(Array(-shift).fill('0'));
            }
        }
    }
    // Column shift: randomly shift some columns up/down
    if (Math.random() < 0.5) {
        let col = Math.floor(Math.random()*tCols);
        let shift = Math.floor(Math.random()*3)-1;
        if (shift !== 0) {
            let colVals = tVar.map(row => row[col]);
            if (shift > 0) {
                colVals = Array(shift).fill('0').concat(colVals.slice(0, tRows-shift));
            } else {
                colVals = colVals.slice(-shift).concat(Array(-shift).fill('0'));
            }
            for (let i = 0; i < tRows; i++) tVar[i][col] = colVals[i];
        }
    }
    // Optionally mirror
    function getVal(tx, ty) {
        if (mirror) tx = tCols-1-tx;
        return tVar[ty][tx];
    }
    const y0 = Math.floor((rows - tRows * scale) / 2);
    const x0 = Math.floor((cols - tCols * scale) / 2);
    // Draw template with new variation
    for (let ty = 0; ty < tRows; ty++) {
        for (let tx = 0; tx < tCols; tx++) {
            if (getVal(tx, ty) === '1') {
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        setSym(x0 + tx*scale + sx, y0 + ty*scale + sy);
                    }
                }
            }
        }
    }
    // Optionally add a central dot or extra features
    if (Math.random() < 0.3) setSym(Math.floor(cols/2), Math.floor(rows/2));
    return glyph;
}
// Cat Face glyph generator: draws a simple cat face with ears, eyes, nose, mouth, and whiskers
export function randomCatFaceGlyph(width, height, leftNeighborType = null) {
    const glyph = emptyGlyph(width, height);
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    // Add more variation: face roundness, ear angle, eye size/pos, mouth shape, whisker angle
    const faceR = Math.floor(Math.min(width, height) * (0.28 + Math.random()*0.12) + Math.random()*2);
    const faceSquash = 0.88 + Math.random()*0.18; // 0.88..1.06
    const earAngle = (Math.random()-0.5) * Math.PI/6; // -15..+15 deg
    const earLen = 0.6 + Math.random()*0.5; // 0.6..1.1
    const earTipSpread = 0.8 + Math.random()*0.5; // 0.8..1.3
    const eyeSize = 1 + Math.floor(Math.random()*2);
    const eyeYShift = Math.floor((Math.random()-0.5)*faceR*0.18);
    const eyeXSpread = Math.floor(faceR * (0.38 + Math.random()*0.18));
    const mouthType = Math.random(); // 0..1
    const whiskerAngle = (Math.random()-0.5)*0.5; // -0.25..+0.25 rad
    const hasMuzzleSpots = Math.random() < 0.5;
    const hasForeheadMark = Math.random() < 0.3;
    // Draw face outline (ellipse for squash)
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 32) {
        let x = Math.round(cx + faceR * Math.cos(a));
        let y = Math.round(cy + faceR * Math.sin(a) * faceSquash);
        if (x >= 0 && x < width && y >= 0 && y < height) glyph[y][x] = 1;
    }
    // Draw ears (two triangles using lines)
    function drawLine(x0, y0, x1, y1) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy, e2;
        while (true) {
            if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) glyph[y0][x0] = 1;
            if (x0 === x1 && y0 === y1) break;
            e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }
    // Left ear points (poke out from behind the face)
    let lx0 = cx - Math.floor(faceR * 0.7); // farther out
    let ly0 = cy - Math.floor(faceR * 0.85 * faceSquash); // higher up
    let ltipx = cx - Math.floor(faceR * 1.15 * earTipSpread * Math.cos(earAngle));
    let ltipy = cy - faceR - Math.floor(faceR * (earLen+0.2) * Math.sin(earAngle));
    let lx1 = cx - Math.floor(faceR * 0.25);
    let ly1 = cy - faceR + Math.floor(faceR * 0.18 * faceSquash);
    drawLine(lx0, ly0, ltipx, ltipy);
    drawLine(ltipx, ltipy, lx1, ly1);
    drawLine(lx1, ly1, lx0, ly0);
    // Right ear points (poke out from behind the face)
    let rx0 = cx + Math.floor(faceR * 0.7);
    let ry0 = cy - Math.floor(faceR * 0.85 * faceSquash);
    let rtipx = cx + Math.floor(faceR * 1.15 * earTipSpread * Math.cos(-earAngle));
    let rtipy = cy - faceR - Math.floor(faceR * (earLen+0.2) * Math.sin(-earAngle));
    let rx1 = cx + Math.floor(faceR * 0.25);
    let ry1 = cy - faceR + Math.floor(faceR * 0.18 * faceSquash);
    drawLine(rx0, ry0, rtipx, rtipy);
    drawLine(rtipx, rtipy, rx1, ry1);
    drawLine(rx1, ry1, rx0, ry0);
    // Eyes (dots, with size/position variation)
    let eyeY = cy - Math.floor(faceR * 0.2) + eyeYShift;
    for (let dx of [-eyeXSpread, eyeXSpread]) {
        let ex = cx + dx, ey = eyeY;
        for (let i = -eyeSize; i <= eyeSize; i++) {
            for (let j = -eyeSize; j <= eyeSize; j++) {
                if (ex+i >= 0 && ex+i < width && ey+j >= 0 && ey+j < height && i*i+j*j <= eyeSize*eyeSize) {
                    glyph[ey+j][ex+i] = 1;
                }
            }
        }
    }
    // Nose (small triangle, with vertical offset)
    let noseY = cy + Math.floor(faceR * 0.1) + Math.floor((Math.random()-0.5)*2);
    for (let i = 0; i < 2; i++) {
        for (let x = cx - i; x <= cx + i; x++) {
            let y = noseY + i;
            if (x >= 0 && x < width && y >= 0 && y < height) glyph[y][x] = 1;
        }
    }
    // Mouth (:3 shape)
    let mouthY = noseY + 2;
    if (mouthY < height) {
        // Left curve of :3
        glyph[mouthY][cx-2] = 1;
        glyph[mouthY+1 < height ? mouthY+1 : mouthY][cx-1] = 1;
        // Right curve of :3
        glyph[mouthY][cx+2] = 1;
        glyph[mouthY+1 < height ? mouthY+1 : mouthY][cx+1] = 1;
    }
    // Improved whiskers: longer, more curved, more organic
    function drawWhisker(x0, y0, dir, curve, len) {
        // dir: -1 for left, 1 for right
        for (let t = 0; t <= 1; t += 0.08) {
            // Quadratic Bezier-like: start, control, end
            let x = x0 + dir * len * t;
            let y = y0 + curve * Math.pow(t, 1.5) * dir * 2 + (Math.random()-0.5)*0.2;
            let ix = Math.round(x), iy = Math.round(y);
            if (ix >= 0 && ix < width && iy >= 0 && iy < height) glyph[iy][ix] = 1;
        }
    }
    let whiskerBaseY = cy + Math.floor(faceR * 0.1);
    let whiskerLen = Math.floor(faceR * 1.1 + Math.random()*2);
    for (let i = -1; i <= 1; i++) {
        let wy = whiskerBaseY + i * 2;
        let curve = (i === 0 ? 0.5 : 1.2) * (0.7 + Math.random()*0.5);
        drawWhisker(cx-1, wy, -1, -curve, whiskerLen);
        drawWhisker(cx+1, wy, 1, curve, whiskerLen);
    }
    // Muzzle spots (optional)
    if (hasMuzzleSpots) {
        for (let dx of [-2,2]) {
            let mx = cx+dx, my = noseY+2;
            if (mx >= 0 && mx < width && my >= 0 && my < height) glyph[my][mx] = 1;
        }
    }
    // Forehead mark (optional)
    if (hasForeheadMark) {
        let markY = cy - Math.floor(faceR * 0.45);
        for (let i = -1; i <= 1; i++) {
            let mx = cx + i;
            if (mx >= 0 && mx < width && markY >= 0 && markY < height) glyph[markY][mx] = 1;
        }
    }
    return glyph;
}
// Continuous Squiggle glyph generator: one unbroken, looping line like an ampersand
export function randomSquiggleGlyph(width, height, leftNeighborType = null) {
    // Create an empty glyph grid
    const glyph = emptyGlyph(width, height);
    // Parameters for the squiggle
    const cx = width / 2;
    const cy = height / 2;
    const a = 0.32 + Math.random() * 0.18; // amplitude as fraction of cell
    const freq = 1.5 + Math.random() * 0.7; // number of loops
    const phase = Math.random() * Math.PI * 2;
    const squiggleLength = Math.PI * 2 * freq;
    const thickness = 1;
    // Draw a parametric squiggle (like a lissajous/ampersand)
    for (let t = 0; t < squiggleLength; t += 0.02) {
        // Lissajous/ampersand-like parametric curve
        let x = cx + (width * a) * Math.sin(t + phase) * Math.cos(t * 0.5 + phase * 0.7);
        let y = cy + (height * a) * Math.sin(t * 0.5 + phase * 0.3) * Math.cos(t + phase * 0.2);
        // Optionally add a little noise for organic feel
        x += (Math.random() - 0.5) * 0.5;
        y += (Math.random() - 0.5) * 0.5;
        // Draw thickness
        for (let dx = -thickness; dx <= thickness; dx++) {
            for (let dy = -thickness; dy <= thickness; dy++) {
                let px = Math.round(x + dx);
                let py = Math.round(y + dy);
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    glyph[py][px] = 1;
                }
            }
        }
    }
    // Optionally, close the loop for a more ampersand-like look
    // Connect start and end
    let x0 = cx + (width * a) * Math.sin(phase) * Math.cos(phase * 0.5 + phase * 0.7);
    let y0 = cy + (height * a) * Math.sin(phase * 0.5 + phase * 0.3) * Math.cos(phase + phase * 0.2);
    let x1 = cx + (width * a) * Math.sin(squiggleLength + phase) * Math.cos((squiggleLength) * 0.5 + phase * 0.7);
    let y1 = cy + (height * a) * Math.sin((squiggleLength) * 0.5 + phase * 0.3) * Math.cos(squiggleLength + phase * 0.2);
    // Simple Bresenham to connect start/end
    function drawLine(x0, y0, x1, y1) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy, e2;
        while (true) {
            if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) glyph[y0][x0] = 1;
            if (x0 === x1 && y0 === y1) break;
            e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }
    drawLine(x0, y0, x1, y1);
    return glyph;
}
// Compound Hieroglyphic glyph generator: combines 2-3 simple hieroglyphic motifs
export function randomCompoundHieroglyphicGlyph(width, height, leftNeighborType = null) {
    // Use the motifs from randomHieroglyphicGlyph, but combine 2-3 in one glyph
    const glyph = emptyGlyph(width, height);
    // Helper: draw a motif at a given offset and scale
    function drawMotif(motif, dx, dy, scale) {
        // Motif: 0=ankh, 1=reed, 2=water, 3=sun, 4=bird, 5=rect
        const w = width, h = height;
        if (motif === 0) {
            // Ankh
            let cx = Math.floor(w/2+dx), cy = Math.floor(h*0.38*scale+dy);
            let r = Math.floor(Math.min(w,h)*0.18*scale);
            for (let a = 0; a < Math.PI*2; a += Math.PI/16) {
                let x = Math.round(cx + r*Math.cos(a));
                let y = Math.round(cy + r*Math.sin(a));
                if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
            }
            for (let y = cy; y < cy+Math.floor(h*0.37*scale); y++) if (y >= 0 && y < h) glyph[y][cx] = 1;
            for (let x = cx-Math.floor(w*0.09*scale); x <= cx+Math.floor(w*0.09*scale); x++) if (x >= 0 && x < w) glyph[cy+Math.floor(h*0.24*scale)][x] = 1;
        } else if (motif === 1) {
            // Reed
            let cx = Math.floor(w/2+dx);
            for (let y = Math.floor(h*0.18*scale+dy); y < h-Math.floor(h*0.18*scale-dy); y++) if (y >= 0 && y < h) glyph[y][cx] = 1;
            for (let i = 0; i < 4; i++) {
                let x = cx + i - 2;
                let y = Math.floor(h*0.18*scale+dy) - i;
                if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
            }
        } else if (motif === 2) {
            // Water
            let y = Math.floor(h*0.7*scale+dy);
            for (let x = Math.floor(w*0.18*scale+dx); x < w-Math.floor(w*0.18*scale-dx); x++) {
                let offset = Math.round(Math.sin((x/w)*Math.PI*4)*2*scale);
                let yy = y + offset;
                if (yy >= 0 && yy < h) glyph[yy][x] = 1;
            }
        } else if (motif === 3) {
            // Sun
            let cx = Math.floor(w/2+dx), cy = Math.floor(h/2+dy);
            let r = Math.floor(Math.min(w,h)*0.22*scale);
            for (let a = 0; a < Math.PI*2; a += Math.PI/16) {
                let x = Math.round(cx + r*Math.cos(a));
                let y = Math.round(cy + r*Math.sin(a));
                if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
            }
            for (let dy2 = -1; dy2 <= 1; dy2++) for (let dx2 = -1; dx2 <= 1; dx2++) {
                let dist = Math.sqrt(dx2*dx2 + dy2*dy2);
                if (dist <= 1.2) {
                    let px = cx+dx2, py = cy+dy2;
                    if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
                }
            }
        } else if (motif === 4) {
            // Bird
            let cy = Math.floor(h*0.38*scale+dy);
            let left = Math.floor(w*0.28*scale+dx), right = w - Math.floor(w*0.28*scale-dx);
            for (let i = 0; i < 7; i++) {
                let xL = left + i, xR = right - i, y = cy + i;
                if (xL >= 0 && xL < w && y >= 0 && y < h) glyph[y][xL] = 1;
                if (xR >= 0 && xR < w && y >= 0 && y < h) glyph[y][xR] = 1;
            }
            // Beak
            let bx = Math.floor(w/2+dx), by = cy+7;
            for (let i = 0; i < 3; i++) if (by+i < h) glyph[by+i][bx] = 1;
        } else if (motif === 5) {
            // Rectangle
            let x0 = Math.floor(w*0.22*scale+dx), x1 = w - Math.floor(w*0.22*scale-dx);
            let y0 = Math.floor(h*0.22*scale+dy), y1 = h - Math.floor(h*0.22*scale-dy);
            for (let x = x0; x <= x1; x++) {
                if (y0 >= 0 && y0 < h) glyph[y0][x] = 1;
                if (y1 >= 0 && y1 < h) glyph[y1][x] = 1;
            }
            for (let y = y0; y <= y1; y++) {
                if (x0 >= 0 && x0 < w) glyph[y][x0] = 1;
                if (x1 >= 0 && x1 < w) glyph[y][x1] = 1;
            }
        }
    }
    // Pick 2-3 motifs, randomize position/scale for each
    let motifs = [0,1,2,3,4,5];
    let n = 2 + Math.floor(Math.random()*2);
    for (let i = 0; i < n; i++) {
        let motif = motifs[Math.floor(Math.random()*motifs.length)];
        let dx = (Math.random()-0.5)*width*0.25;
        let dy = (Math.random()-0.5)*height*0.25;
        let scale = 0.7 + Math.random()*0.4;
        drawMotif(motif, dx, dy, scale);
    }
    return glyph;
}
// Hieroglyphic glyph generator: inspired by ancient Egyptian hieroglyphics
export function randomHieroglyphicGlyph(width, height, leftNeighborType = null) {
    // Hieroglyphic: pictorial, geometric, animal/plant/human motifs, simple shapes
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    let type = Math.random();
    if (type < 0.18) {
        // Ankh (cross with loop)
        let cx = Math.floor(w/2), cy = Math.floor(h*0.38);
        let r = Math.floor(Math.min(w,h)*0.18);
        for (let a = 0; a < Math.PI*2; a += Math.PI/16) {
            let x = Math.round(cx + r*Math.cos(a));
            let y = Math.round(cy + r*Math.sin(a));
            if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
        }
        for (let y = cy; y < h*0.75; y++) if (y >= 0 && y < h) glyph[y][cx] = 1;
        for (let x = cx-Math.floor(w*0.09); x <= cx+Math.floor(w*0.09); x++) if (x >= 0 && x < w) glyph[Math.floor(h*0.62)][x] = 1;
    } else if (type < 0.36) {
        // Reed leaf (vertical line with angled top)
        let cx = Math.floor(w/2);
        for (let y = Math.floor(h*0.18); y < h-Math.floor(h*0.18); y++) if (y >= 0 && y < h) glyph[y][cx] = 1;
        for (let i = 0; i < 4; i++) {
            let x = cx + i - 2;
            let y = Math.floor(h*0.18) - i;
            if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
        }
    } else if (type < 0.54) {
        // Water ripple (horizontal zigzag)
        let y = Math.floor(h*0.7);
        for (let x = Math.floor(w*0.18); x < w-Math.floor(w*0.18); x++) {
            let offset = Math.round(Math.sin((x/w)*Math.PI*4)*2);
            let yy = y + offset;
            if (yy >= 0 && yy < h) glyph[yy][x] = 1;
        }
    } else if (type < 0.72) {
        // Sun disk (circle with dot)
        let cx = Math.floor(w/2), cy = Math.floor(h/2);
        let r = Math.floor(Math.min(w,h)*0.22);
        for (let a = 0; a < Math.PI*2; a += Math.PI/16) {
            let x = Math.round(cx + r*Math.cos(a));
            let y = Math.round(cy + r*Math.sin(a));
            if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
        }
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= 1.2) {
                let px = cx+dx, py = cy+dy;
                if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
            }
        }
    } else if (type < 0.84) {
        // Bird (V shape with beak)
        let cy = Math.floor(h*0.38);
        let left = Math.floor(w*0.28), right = w - Math.floor(w*0.28);
        for (let i = 0; i < 7; i++) {
            let xL = left + i, xR = right - i, y = cy + i;
            if (xL >= 0 && xL < w && y >= 0 && y < h) glyph[y][xL] = 1;
            if (xR >= 0 && xR < w && y >= 0 && y < h) glyph[y][xR] = 1;
        }
        // Beak
        let bx = Math.floor(w/2), by = cy+7;
        for (let i = 0; i < 3; i++) if (by+i < h) glyph[by+i][bx] = 1;
    } else {
        // Rectangle (house, enclosure, or throne)
        let x0 = Math.floor(w*0.22), x1 = w - Math.floor(w*0.22);
        let y0 = Math.floor(h*0.22), y1 = h - Math.floor(h*0.22);
        for (let x = x0; x <= x1; x++) {
            if (y0 >= 0 && y0 < h) glyph[y0][x] = 1;
            if (y1 >= 0 && y1 < h) glyph[y1][x] = 1;
        }
        for (let y = y0; y <= y1; y++) {
            if (x0 >= 0 && x0 < w) glyph[y][x0] = 1;
            if (x1 >= 0 && x1 < w) glyph[y][x1] = 1;
        }
    }
    return glyph;
}
// Op Art glyph generator: geometric, high-contrast, moiré, visual illusions, not based on any script
export function randomOpArtGlyph(width, height, leftNeighborType = null) {
    // Op Art: geometric, high-contrast, moiré, visual illusions
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // Choose a pattern type: stripes, checker, concentric, or moiré
    let type = Math.random();
    if (type < 0.25) {
        // Stripes (vertical, horizontal, or diagonal)
        let dir = Math.floor(Math.random()*3);
        let freq = 2 + Math.floor(Math.random()*4);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let v = 0;
                if (dir === 0) v = Math.floor(x/(w/freq)); // vertical
                else if (dir === 1) v = Math.floor(y/(h/freq)); // horizontal
                else v = Math.floor((x+y)/(w/freq)); // diagonal
                if (v % 2 === 0) glyph[y][x] = 1;
            }
        }
    } else if (type < 0.5) {
        // Checkerboard
        let freq = 2 + Math.floor(Math.random()*4);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let v = (Math.floor(x/(w/freq)) + Math.floor(y/(h/freq))) % 2;
                if (v === 0) glyph[y][x] = 1;
            }
        }
    } else if (type < 0.75) {
        // Concentric circles or ellipses
        let cx = w/2, cy = h/2;
        let nRings = 2 + Math.floor(Math.random()*4);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let dx = (x-cx)/(w/2), dy = (y-cy)/(h/2);
                let r = Math.sqrt(dx*dx + dy*dy);
                let ring = Math.floor(r*nRings);
                if (ring % 2 === 0 && r < 1) glyph[y][x] = 1;
            }
        }
    } else {
        // Moiré: overlay two grids at an angle
        let freq1 = 2 + Math.floor(Math.random()*3);
        let freq2 = freq1 + 1 + Math.floor(Math.random()*2);
        let angle = Math.PI/8 + Math.random()*Math.PI/4;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let v1 = Math.floor(x/(w/freq1));
                let x2 = (x - w/2)*Math.cos(angle) - (y - h/2)*Math.sin(angle) + w/2;
                let v2 = Math.floor(x2/(w/freq2));
                if ((v1+v2)%2 === 0) glyph[y][x] = 1;
            }
        }
    }
    // Occasionally add a dot or bar for visual accent
    if (Math.random() < 0.5) {
        let cx = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.3);
        let cy = Math.floor(h*0.5 + (Math.random()-0.5)*h*0.3);
        if (Math.random() < 0.5) {
            // Dot
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= 2.2) {
                    let px = cx+dx, py = cy+dy;
                    if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
                }
            }
        } else {
            // Bar
            let horiz = Math.random() < 0.5;
            for (let i = -3; i <= 3; i++) {
                let px = horiz ? cx+i : cx;
                let py = horiz ? cy : cy+i;
                if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
            }
        }
    }
    return glyph;
}
// Bio-Mechanical glyph generator: organic, mechanical, not based on any real script
export function randomBioMechanicalGlyph(width, height, leftNeighborType = null) {
    // Abstract: flowing, organic, with tubes, nodes, and mechanical joints
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // Place 2-3 organic nodes (blobs)
    let nNodes = 2 + Math.floor(Math.random()*2);
    let nodes = [];
    for (let i = 0; i < nNodes; i++) {
        let nx = Math.floor(w*0.18 + Math.random()*w*0.64);
        let ny = Math.floor(h*0.18 + Math.random()*h*0.64);
        nodes.push([nx, ny]);
        // Draw node (blobby ellipse)
        for (let a = 0; a < Math.PI*2; a += Math.PI/10) {
            let rx = Math.round(nx + Math.cos(a)*(2+Math.random()*1.5));
            let ry = Math.round(ny + Math.sin(a)*(2+Math.random()*1.5));
            if (rx >= 0 && rx < w && ry >= 0 && ry < h) glyph[ry][rx] = 1;
        }
    }
    // Connect nodes with organic tubes (curved lines)
    for (let i = 0; i < nNodes-1; i++) {
        let [x0, y0] = nodes[i];
        let [x1, y1] = nodes[i+1];
        // Use a quadratic Bezier for organic tube
        let cx = Math.floor((x0+x1)/2 + (Math.random()-0.5)*w*0.2);
        let cy = Math.floor((y0+y1)/2 + (Math.random()-0.5)*h*0.2);
        let steps = 18;
        for (let t = 0; t <= steps; t++) {
            let tt = t/steps;
            let xt = Math.round((1-tt)*(1-tt)*x0 + 2*(1-tt)*tt*cx + tt*tt*x1);
            let yt = Math.round((1-tt)*(1-tt)*y0 + 2*(1-tt)*tt*cy + tt*tt*y1);
            if (xt >= 0 && xt < w && yt >= 0 && yt < h) glyph[yt][xt] = 1;
        }
    }
    // Add 1-2 mechanical joints (small squares or crosses)
    let nJoints = 1 + Math.floor(Math.random()*2);
    for (let j = 0; j < nJoints; j++) {
        let jx = Math.floor(w*0.18 + Math.random()*w*0.64);
        let jy = Math.floor(h*0.18 + Math.random()*h*0.64);
        if (Math.random() < 0.5) {
            // Square
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (jx+dx >= 0 && jx+dx < w && jy+dy >= 0 && jy+dy < h) glyph[jy+dy][jx+dx] = 1;
                }
            }
        } else {
            // Cross
            for (let d = -1; d <= 1; d++) {
                if (jx+d >= 0 && jx+d < w) glyph[jy][jx+d] = 1;
                if (jy+d >= 0 && jy+d < h) glyph[jy+d][jx] = 1;
            }
        }
    }
    // Add 0-2 random tendrils (wavy lines)
    let nTendrils = Math.floor(Math.random()*3);
    for (let t = 0; t < nTendrils; t++) {
        let sx = Math.floor(w*0.18 + Math.random()*w*0.64);
        let sy = Math.floor(h*0.18 + Math.random()*h*0.64);
        let len = 6 + Math.floor(Math.random()*6);
        let angle = Math.random()*Math.PI*2;
        for (let i = 0; i < len; i++) {
            let r = i;
            let tx = Math.round(sx + Math.cos(angle)*r + Math.sin(i*0.7)*2);
            let ty = Math.round(sy + Math.sin(angle)*r + Math.cos(i*0.7)*2);
            if (tx >= 0 && tx < w && ty >= 0 && ty < h) glyph[ty][tx] = 1;
        }
    }
    return glyph;
}
// Alien Circuit glyph generator: abstract, geometric, not based on any real script
export function randomAlienCircuitGlyph(width, height, leftNeighborType = null) {
    // Abstract: geometric, circuit-like, with nodes, lines, arcs, and occasional symbols
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // Place 2-4 nodes (circles)
    let nNodes = 2 + Math.floor(Math.random()*3);
    let nodes = [];
    for (let i = 0; i < nNodes; i++) {
        let nx = Math.floor(w*0.18 + Math.random()*w*0.64);
        let ny = Math.floor(h*0.18 + Math.random()*h*0.64);
        nodes.push([nx, ny]);
        // Draw node (circle)
        for (let a = 0; a < Math.PI*2; a += Math.PI/8) {
            let rx = Math.round(nx + Math.cos(a)*2);
            let ry = Math.round(ny + Math.sin(a)*2);
            if (rx >= 0 && rx < w && ry >= 0 && ry < h) glyph[ry][rx] = 1;
        }
    }
    // Connect nodes with lines (like wires)
    for (let i = 0; i < nNodes-1; i++) {
        let [x0, y0] = nodes[i];
        let [x1, y1] = nodes[i+1];
        let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy, e2;
        let xx = x0, yy = y0;
        while (true) {
            if (xx >= 0 && xx < w && yy >= 0 && yy < h) glyph[yy][xx] = 1;
            if (xx === x1 && yy === y1) break;
            e2 = 2 * err;
            if (e2 >= dy) { err += dy; xx += sx; }
            if (e2 <= dx) { err += dx; yy += sy; }
        }
    }
    // Add 1-2 random arcs (like circuit traces)
    let nArcs = 1 + Math.floor(Math.random()*2);
    for (let a = 0; a < nArcs; a++) {
        let cx = Math.floor(w*0.3 + Math.random()*w*0.4);
        let cy = Math.floor(h*0.3 + Math.random()*h*0.4);
        let r = Math.floor(Math.min(w,h)*0.18 + Math.random()*Math.min(w,h)*0.12);
        let startA = Math.random()*Math.PI*2;
        let endA = startA + Math.PI*(0.7 + Math.random()*0.8);
        for (let t = 0; t < 18; t++) {
            let aRad = startA + (endA-startA)*t/17;
            let x = Math.round(cx + r*Math.cos(aRad));
            let y = Math.round(cy + r*Math.sin(aRad));
            if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
        }
    }
    // Add 0-2 random symbols (cross, triangle, or square)
    let nSymbols = Math.floor(Math.random()*3);
    for (let s = 0; s < nSymbols; s++) {
        let sx = Math.floor(w*0.18 + Math.random()*w*0.64);
        let sy = Math.floor(h*0.18 + Math.random()*h*0.64);
        let type = Math.random();
        if (type < 0.33) {
            // Cross
            for (let d = -2; d <= 2; d++) {
                if (sx+d >= 0 && sx+d < w) glyph[sy][sx+d] = 1;
                if (sy+d >= 0 && sy+d < h) glyph[sy+d][sx] = 1;
            }
        } else if (type < 0.66) {
            // Triangle
            for (let dx = -2; dx <= 2; dx++) {
                let y1 = sy + 2;
                let y2 = sy - 2;
                if (sy+2 < h && sx+dx >= 0 && sx+dx < w) glyph[sy+2][sx+dx] = 1;
                if (sy-2 >= 0 && sx+dx >= 0 && sx+dx < w) glyph[sy-2][sx+dx] = 1;
            }
            if (sy >= 0 && sy < h) {
                if (sx-2 >= 0) glyph[sy][sx-2] = 1;
                if (sx+2 < w) glyph[sy][sx+2] = 1;
            }
        } else {
            // Square
            for (let dx = -2; dx <= 2; dx++) {
                if (sx+dx >= 0 && sx+dx < w) {
                    if (sy-2 >= 0) glyph[sy-2][sx+dx] = 1;
                    if (sy+2 < h) glyph[sy+2][sx+dx] = 1;
                }
            }
            for (let dy = -2; dy <= 2; dy++) {
                if (sy+dy >= 0 && sy+dy < h) {
                    if (sx-2 >= 0) glyph[sy+dy][sx-2] = 1;
                    if (sx+2 < w) glyph[sy+dy][sx+2] = 1;
                }
            }
        }
    }
    return glyph;
}
// Alternate Arabic glyph generator for "Arabic 2" style (if not already present)
// You may replace this with your preferred alternate logic or import from _randomArabicGlyph_original.js
export function randomArabicGlyph(width, height, leftNeighborType = null) {
    // Arabic: flowing, looping, interlaced, strong thick/thin contrast, dots/diacritics
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // Main baseline: horizontal, slightly below center
    let baseY = Math.floor(h * (0.65 + (Math.random()-0.5)*0.08));
    let nStrokes = 1 + Math.floor(Math.random()*2); // 1 or 2 main strokes
    for (let s = 0; s < nStrokes; s++) {
        // Each stroke: a sinuous, rightward curve (Arabic is right-to-left, but for visual effect, curve right)
        let startX = Math.floor(w*0.15) + Math.floor(Math.random()*2);
        let endX = w - Math.floor(w*0.15) - Math.floor(Math.random()*2);
        let amp = (h/4) * (0.7 + Math.random()*0.6); // amplitude
        let freq = 1.2 + Math.random()*0.7;
        let thicknessBase = 2.5 + Math.random()*2.5;
        for (let x = startX; x < endX; x++) {
            let t = (x-startX)/(endX-startX);
            let y = baseY + Math.sin(t*Math.PI*freq + s*0.7) * amp * (0.7 + Math.sin(t*Math.PI)*0.3);
            // Simulate thick/thin: pressure varies with curve
            let thick = thicknessBase + Math.sin(t*Math.PI*freq + 0.5)*2.5;
            let angle = Math.atan2(
                Math.cos(t*Math.PI*freq + s*0.7) * amp * freq * Math.PI / (endX-startX),
                1
            );
            // Add calligraphic dot (ellipse) at each point
            for (let d = 0; d < 2; d++) {
                let jitterX = x + (Math.random()-0.5)*0.7;
                let jitterY = y + (Math.random()-0.5)*0.7;
                let tthick = thick * (0.8 + Math.random()*0.4);
                let tangle = angle + (Math.random()-0.5)*0.3;
                for (let dy = -Math.floor(tthick/2); dy <= Math.floor(tthick/2); dy++) {
                    for (let dx = -Math.floor(tthick/1.5); dx <= Math.floor(tthick/1.5); dx++) {
                        let px = Math.round(jitterX + dx*Math.cos(tangle) - dy*Math.sin(tangle));
                        let py = Math.round(jitterY + dx*Math.sin(tangle) + dy*Math.cos(tangle));
                        if (px >= 1 && px < w-1 && py >= 1 && py < h-1) {
                            glyph[py][px] = 1;
                        }
                    }
                }
            }
        }
    }
    return glyph;
}
// Hebrew-inspired glyph generator
export function randomHebrewGlyph(width, height, leftNeighborType = null) {
    // Enhanced Hebrew: open-bottom forms, middle horizontals, serifs/tails, variable thickness, ligature diagonals
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    let nStrokes = 2 + Math.floor(Math.random()*2);
    let usedTopBar = false;
    let usedDescender = false;
    let usedOpenBottom = false;
    let usedMiddleBar = false;
    let usedLigature = false;
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
    // Randomize stroke thickness for each stroke
    let thick = 1; // Max thickness now 1
        if (!usedTopBar && type < 0.4) {
            // Strong top horizontal bar
            let y = Math.floor(h*0.18 + Math.random()*h*0.08);
            let xStart = Math.floor(w*0.18);
            let xEnd = w - Math.floor(w*0.08 + Math.random()*w*0.08);
            for (let x = xStart; x < xEnd; x++) {
                for (let t = -thick; t <= thick; t++) {
                    let yy = y + t;
                    if (yy >= 0 && yy < h) glyph[yy][x] = 1;
                }
            }
            // Occasionally add a small serif/tail to the left end
            if (Math.random() < 0.5) {
                for (let t = 0; t < 2; t++) {
                    let xx = xStart - t;
                    let yy = y + t;
                    if (xx >= 0 && yy >= 0 && yy < h) glyph[yy][xx] = 1;
                }
            }
            usedTopBar = true;
        } else if (!usedMiddleBar && type < 0.55) {
            // Middle horizontal bar (like ה, ת, מ)
            let y = Math.floor(h*0.5 + Math.random()*h*0.1 - h*0.05);
            let xStart = Math.floor(w*0.22);
            let xEnd = w - Math.floor(w*0.18);
            for (let x = xStart; x < xEnd; x++) {
                for (let t = -thick; t <= thick; t++) {
                    let yy = y + t;
                    if (yy >= 0 && yy < h) glyph[yy][x] = 1;
                }
            }
            usedMiddleBar = true;
        } else if (!usedOpenBottom && type < 0.7) {
            // Open-bottom form (like ג, נ, ר): right vertical, no bottom bar
            let x = w - 1 - Math.floor(w*0.12 + Math.random()*w*0.08);
            let yStart = Math.floor(h*0.22);
            let yEnd = h - Math.floor(h*0.18 + Math.random()*h*0.08);
            for (let y = yStart; y < yEnd; y++) {
                for (let t = -thick; t <= thick; t++) {
                    let xx = x + t;
                    if (xx >= 0 && xx < w) glyph[y][xx] = 1;
                }
            }
            // Occasionally add a leftward hook at the bottom
            if (Math.random() < 0.5) {
                let hookLen = 2 + Math.floor(Math.random()*2);
                for (let dx = 0; dx < hookLen; dx++) {
                    let xx = x - dx;
                    let yy = yEnd + dx;
                    if (xx >= 0 && xx < w && yy >= 0 && yy < h) glyph[yy][xx] = 1;
                }
            }
            usedOpenBottom = true;
        } else if (!usedDescender && Math.random() < 0.5) {
            // Descender (final forms)
            let x = w - 1 - Math.floor(w*0.18 + Math.random()*w*0.08);
            let yStart = h - Math.floor(h*0.22);
            let yEnd = h - 1;
            for (let y = yStart; y < yEnd; y++) {
                for (let t = -thick; t <= thick; t++) {
                    let xx = x + t;
                    if (xx >= 0 && xx < w) glyph[y][xx] = 1;
                }
            }
            // Add a small leftward tail at the bottom
            if (Math.random() < 0.7) {
                for (let dx = 0; dx < 3; dx++) {
                    let xx = x - dx;
                    let yy = yEnd + dx;
                    if (xx >= 0 && xx < w && yy >= 0 && yy < h) glyph[yy][xx] = 1;
                }
            }
            usedDescender = true;
        } else if (!usedLigature && Math.random() < 0.5) {
            // Ligature-like diagonal (connect top bar to left vertical)
            let x0 = w - 1 - Math.floor(w*0.18);
            let y0 = Math.floor(h*0.18 + Math.random()*h*0.08);
            let x1 = Math.floor(w*0.18);
            let y1 = Math.floor(h*0.5 + Math.random()*h*0.2);
            let steps = Math.max(4, Math.abs(x1-x0));
            for (let i = 0; i <= steps; i++) {
                let xx = Math.round(x0 + (x1-x0)*i/steps);
                let yy = Math.round(y0 + (y1-y0)*i/steps);
                for (let t = -thick; t <= thick; t++) {
                    let px = xx;
                    let py = yy + t;
                    if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
                }
            }
            usedLigature = true;
        }
    }
    // Occasionally add a dagesh (center dot) or shin/sin dot (top left/right)
    if (Math.random() < 0.4) {
        // Dagesh (center dot)
        let cx = w - Math.floor(w*0.5);
        let cy = Math.floor(h*0.5);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= 1.2) {
                let px = cx+dx, py = cy+dy;
                if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
            }
        }
    } else if (Math.random() < 0.3) {
        // Shin/sin dot (top left or right)
        let left = Math.random() < 0.5;
        let cx = left ? Math.floor(w*0.18) : w - 1 - Math.floor(w*0.18);
        let cy = Math.floor(h*0.18);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= 1.2) {
                let px = cx+dx, py = cy+dy;
                if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
            }
        }
    }
    return glyph;
}
// Japanese-inspired glyph generator
export function randomJapaneseGlyph(width, height, leftNeighborType = null) {
    // Japanese: expressive brushwork, unique stroke endings (harai, tome, hane), minimal/dynamic forms
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // 2-14 main strokes: horizontal, vertical, diagonal, hook, dot, with expressive endings
    let nStrokes = 2 + Math.floor(Math.random()*13);
    // Use global thickness for all glyphs
    let thickness = (typeof window !== 'undefined' && window.japaneseGlyphThickness !== undefined)
        ? window.japaneseGlyphThickness
        : 1;
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
        let harai = Math.random() < 0.5; // sweeping ending
        let hane = !harai && Math.random() < 0.5; // upward flick
        if (type < 0.2) {
            // Horizontal stroke with expressive ending, more likely to terminate on collision
            let y = Math.floor(h*0.2) + Math.floor(Math.random()*(h*0.6));
            let margin = Math.floor(w*0.18 + Math.random()*w*0.12); // 18-30% margin
            let xStart = margin;
            let xEnd = w - margin;
            if (xEnd - xStart < 4) { xStart = Math.floor(w*0.2); xEnd = w - Math.floor(w*0.2); }
            let terminated = false;
            for (let x = xStart; x < xEnd && !terminated; x++) {
                let t = (x-xStart)/(xEnd-xStart);
                let yOffset = 0;
                if (harai) yOffset = Math.sin(t*Math.PI)*Math.random()*4;
                if (hane && t > 0.7) yOffset = -Math.pow((t-0.7)/0.3, 1.5)*6;
                for (let tt = -thickness; tt <= thickness; tt++) {
                    let yy = y + tt + Math.round(yOffset);
                    if (yy >= 0 && yy < h) {
                        if (glyph[yy][x]) {
                            if (Math.random() < 0.5) { terminated = true; break; }
                        }
                        glyph[yy][x] = 1;
                    }
                }
            }
        } else if (type < 0.4) {
            // Vertical stroke with expressive ending, more likely to terminate on collision
            let x = Math.floor(w*0.2) + Math.floor(Math.random()*(w*0.6));
            let margin = Math.floor(h*0.18 + Math.random()*h*0.12); // 18-30% margin
            let yStart = margin;
            let yEnd = h - margin;
            if (yEnd - yStart < 4) { yStart = Math.floor(h*0.2); yEnd = h - Math.floor(h*0.2); }
            let terminated = false;
            for (let y = yStart; y < yEnd && !terminated; y++) {
                let t = (y-yStart)/(yEnd-yStart);
                let xOffset = 0;
                if (harai) xOffset = Math.sin(t*Math.PI)*Math.random()*4;
                if (hane && t > 0.7) xOffset = -Math.pow((t-0.7)/0.3, 1.5)*6;
                for (let tt = -thickness; tt <= thickness; tt++) {
                    let xx = x + tt + Math.round(xOffset);
                    if (xx >= 0 && xx < w) {
                        if (glyph[y][xx]) {
                            if (Math.random() < 0.5) { terminated = true; break; }
                        }
                        glyph[y][xx] = 1;
                    }
                }
            }
        } else if (type < 0.6) {
            // Diagonal stroke, more likely to terminate on collision
            let dir = Math.random() < 0.5 ? 1 : -1;
            let x0 = Math.floor(w*0.2), y0 = Math.floor(h*0.2);
            let len = Math.floor(Math.min(w, h)*0.6);
            let terminated = false;
            for (let i = 0; i < len && !terminated; i++) {
                let x = x0 + i*dir;
                let y = y0 + i;
                let t = i/len;
                let endFlick = (harai && t > 0.7) ? Math.sin((t-0.7)/0.3*Math.PI)*6 : 0;
                for (let tt = -thickness; tt <= thickness; tt++) {
                    let xx = x + tt;
                    let yy = y + Math.round(endFlick);
                    if (xx >= 0 && xx < w && yy >= 0 && yy < h) {
                        if (glyph[yy][xx]) {
                            if (Math.random() < 0.5) { terminated = true; break; }
                        }
                        glyph[yy][xx] = 1;
                    }
                }
            }
        } else if (type < 0.8) {
            // Hook stroke (like a J)
            let x = Math.floor(w*0.2) + Math.floor(Math.random()*(w*0.6));
            let y = Math.floor(h*0.6) + Math.floor(Math.random()*(h*0.2));
            let len = Math.floor(h*0.18 + Math.random()*h*0.12);
            for (let i = 0; i < len; i++) {
                let yy = y + i;
                let xx = x + Math.round(Math.sin(i/len*Math.PI)*len*0.4);
                let t = i/len;
                let endFlick = (harai && t > 0.7) ? Math.sin((t-0.7)/0.3*Math.PI)*6 : 0;
                for (let tt = -thickness; tt <= thickness; tt++) {
                    let xxx = xx + tt;
                    let yyy = yy + Math.round(endFlick);
                    if (xxx >= 0 && xxx < w && yyy >= 0 && yyy < h) glyph[yyy][xxx] = 1;
                }
            }
        } else {
            // Dot stroke (tome)
            let cx = Math.floor(w*0.2) + Math.floor(Math.random()*(w*0.6));
            let cy = Math.floor(h*0.2) + Math.floor(Math.random()*(h*0.6));
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= 2.2) {
                    let px = cx+dx, py = cy+dy;
                    if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
                }
            }
        }
    }
    return glyph;
}
// Chinese-inspired glyph generator
export function randomChineseGlyph(width, height, leftNeighborType = null) {
    // Chinese: dynamic brushwork, thick/thin, dots, hooks, sweeping curves, grid-based structure
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // 2-16 main strokes: horizontal, vertical, diagonal, hook, dot
    let nStrokes = 2 + Math.floor(Math.random()*15);
    // Use global thickness for all glyphs
    let thickness = (typeof window !== 'undefined' && window.chineseGlyphThickness !== undefined)
        ? window.chineseGlyphThickness
        : 1;
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();

        if (type < 0.25) {
            // Horizontal stroke, more likely to terminate on collision
            let y = Math.floor(h*0.2) + Math.floor(Math.random()*(h*0.6));
            let margin = Math.floor(w*0.18 + Math.random()*w*0.12); // 18-30% margin
            let xStart = margin;
            let xEnd = w - margin;
            if (xEnd - xStart < 4) { xStart = Math.floor(w*0.2); xEnd = w - Math.floor(w*0.2); }
            let terminated = false;
            for (let x = xStart; x < xEnd && !terminated; x++) {
                for (let t = -thickness; t <= thickness; t++) {
                    let yy = y + t;
                    if (yy >= 0 && yy < h) {
                        if (glyph[yy][x]) {
                            if (Math.random() < 0.5) { terminated = true; break; }
                        }
                        glyph[yy][x] = 1;
                    }
                }
            }
        } else if (type < 0.5) {
            // Vertical stroke, more likely to terminate on collision
            let x = Math.floor(w*0.2) + Math.floor(Math.random()*(w*0.6));
            let margin = Math.floor(h*0.18 + Math.random()*h*0.12); // 18-30% margin
            let yStart = margin;
            let yEnd = h - margin;
            if (yEnd - yStart < 4) { yStart = Math.floor(h*0.2); yEnd = h - Math.floor(h*0.2); }
            let terminated = false;
            for (let y = yStart; y < yEnd && !terminated; y++) {
                for (let t = -thickness; t <= thickness; t++) {
                    let xx = x + t;
                    if (xx >= 0 && xx < w) {
                        if (glyph[y][xx]) {
                            if (Math.random() < 0.5) { terminated = true; break; }
                        }
                        glyph[y][xx] = 1;
                    }
                }
            }
        } else if (type < 0.7) {
            // Hook stroke (like a J)
            let x = Math.floor(w*0.2) + Math.floor(Math.random()*(w*0.6));
            let y = Math.floor(h*0.6) + Math.floor(Math.random()*(h*0.2));
            let len = Math.floor(h*0.18 + Math.random()*h*0.12);
            for (let i = 0; i < len; i++) {
                let yy = y + i;
                let xx = x + Math.round(Math.sin(i/len*Math.PI)*len*0.4);
                for (let t = -thickness; t <= thickness; t++) {
                    let xxx = xx + t;
                    if (xxx >= 0 && xxx < w && yy >= 0 && yy < h) glyph[yy][xxx] = 1;
                }
            }
        } else {
            // Dot stroke
            let cx = Math.floor(w*0.2) + Math.floor(Math.random()*(w*0.6));
            let cy = Math.floor(h*0.2) + Math.floor(Math.random()*(h*0.6));
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= 2.2) {
                    let px = cx+dx, py = cy+dy;
                    if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
                }
            }
        }
    }
    return glyph;
}
// Devanagari-inspired glyph generator
export function randomDevanagariGlyph(width, height, leftNeighborType = null) {
    // Devanagari: horizontal shirorekha (headline), vertical/diagonal strokes, rounded forms, stacked ligatures
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // Draw shirorekha (headline) at the top
    let headY = Math.floor(h * (0.18 + Math.random()*0.06));
    for (let x = Math.floor(w*0.08); x < w-Math.floor(w*0.08); x++) {
        for (let t = -1; t <= 1; t++) {
            let y = headY + t;
            if (y >= 0 && y < h) glyph[y][x] = 1;
        }
    }
    // 1-3 main vertical/diagonal/rounded strokes below the headline
    let nStrokes = 1 + Math.floor(Math.random()*3);
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
        let baseX = Math.floor(w*0.2) + Math.floor(Math.random()*(w*0.6));
        let baseY = headY + 2 + Math.floor(Math.random()*3);
        let len = Math.floor(h*0.45 + Math.random()*h*0.22);
    let thickness = 1;
        if (type < 0.4) {
            // Vertical stroke
            for (let y = baseY; y < Math.min(h-2, baseY+len); y++) {
                for (let t = -thickness; t <= thickness; t++) {
                    let x = baseX + t;
                    if (x >= 0 && x < w) glyph[y][x] = 1;
                }
            }
        } else if (type < 0.7) {
            // Diagonal stroke
            let dir = Math.random() < 0.5 ? 1 : -1;
            for (let i = 0; i < len; i++) {
                let x = baseX + Math.round(i*0.4*dir);
                let y = baseY + i;
                for (let t = -thickness; t <= thickness; t++) {
                    let xx = x + t;
                    if (xx >= 0 && xx < w && y < h) glyph[y][xx] = 1;
                }
            }
        } else {
            // Rounded/loop stroke (like a hook or ligature)
            let r = Math.floor(len*0.5);
            let cx = baseX, cy = baseY + r;
            let startA = Math.PI*0.7 + Math.random()*0.4;
            let endA = Math.PI*2.1 + Math.random()*0.4;
            let steps = Math.max(18, Math.floor(r*4.5));
            let prevX = null, prevY = null;
            for (let i = 0; i < steps; i++) {
                let a = startA + (endA-startA)*i/(steps-1);
                let x = Math.round(cx + r*Math.cos(a));
                let y = Math.round(cy + r*Math.sin(a));
                if (prevX !== null && prevY !== null) {
                    // Bresenham's line algorithm to fill between previous and current point
                    let dx = Math.abs(x - prevX), sx = prevX < x ? 1 : -1;
                    let dy = -Math.abs(y - prevY), sy = prevY < y ? 1 : -1;
                    let err = dx + dy, e2;
                    let px = prevX, py = prevY;
                    while (true) {
                        for (let t = -thickness; t <= thickness; t++) {
                            let xx = px + t;
                            if (xx >= 0 && xx < w && py >= 0 && py < h) glyph[py][xx] = 1;
                        }
                        if (px === x && py === y) break;
                        e2 = 2 * err;
                        if (e2 >= dy) { err += dy; px += sx; }
                        if (e2 <= dx) { err += dx; py += sy; }
                    }
                } else {
                    for (let t = -thickness; t <= thickness; t++) {
                        let xx = x + t;
                        if (xx >= 0 && xx < w && y >= 0 && y < h) glyph[y][xx] = 1;
                    }
                }
                prevX = x;
                prevY = y;
            }
        }
    }
    // Optionally add a small dot/diacritic above or below
    if (Math.random() < 0.5) {
        let dotX = Math.floor(w*0.3) + Math.floor(Math.random()*(w*0.4));
        let above = Math.random() < 0.5;
        let dotY = above ? headY - 2 : h - 3;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            let px = dotX+dx, py = dotY+dy;
            if (px >= 1 && px < w-1 && py >= 1 && py < h-1) glyph[py][px] = 1;
        }
    }
    return glyph;
}

// Arabic-inspired glyph generator
export function randomArabicGlyph2(width, height, leftNeighborType = null) {
    // Arabic: flowing, looping, interlaced, strong thick/thin contrast, dots/diacritics
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    let baseY = Math.floor(h * (0.65 + (Math.random()-0.5)*0.08));
    let nStrokes = 1 + Math.floor(Math.random()*3); // 1-3 main strokes
    for (let s = 0; s < nStrokes; s++) {
        let strokeType = Math.random();
        if (strokeType < 0.45) {
            // Swoop/curve (classic)
            let startX = Math.floor(w*0.15) + Math.floor(Math.random()*2);
            let endX = w - Math.floor(w*0.15) - Math.floor(Math.random()*2);
            let amp = (h/4) * (0.7 + Math.random()*0.6);
            let freq = 1.2 + Math.random()*1.2;
            let phase = Math.random()*Math.PI*2;
            let thicknessBase = 2.5 + Math.random()*2.5;
            for (let x = startX; x < endX; x++) {
                let t = (x-startX)/(endX-startX);
                let y = baseY + Math.sin(t*Math.PI*freq + s*0.7 + phase) * amp * (0.7 + Math.sin(t*Math.PI)*0.3);
                let thick = thicknessBase + Math.sin(t*Math.PI*freq + 0.5)*2.5;
                let angle = Math.atan2(
                    Math.cos(t*Math.PI*freq + s*0.7 + phase) * amp * freq * Math.PI / (endX-startX),
                    1
                );
                for (let d = 0; d < 2; d++) {
                    let jitterX = x + (Math.random()-0.5)*0.7;
                    let jitterY = y + (Math.random()-0.5)*0.7;
                    let tthick = thick * (0.8 + Math.random()*0.4);
                    let tangle = angle + (Math.random()-0.5)*0.3;
                    for (let dy = -Math.floor(tthick/2); dy <= Math.floor(tthick/2); dy++) {
                        for (let dx = -Math.floor(tthick/1.5); dx <= Math.floor(tthick/1.5); dx++) {
                            let px = Math.round(jitterX + dx*Math.cos(tangle) - dy*Math.sin(tangle));
                            let py = Math.round(jitterY + dx*Math.sin(tangle) + dy*Math.cos(tangle));
                            if (px >= 1 && px < w-1 && py >= 1 && py < h-1) {
                                glyph[py][px] = 1;
                            }
                        }
                    }
                }
            }
        } else if (strokeType < 0.65) {
            // Horizontal or diagonal stroke
            let y = baseY + Math.floor((Math.random()-0.5)*h*0.18);
            let x0 = Math.floor(w*0.15);
            let x1 = w - Math.floor(w*0.15);
            if (Math.random() < 0.5) {
                // Horizontal
                for (let x = x0; x < x1; x++) {
                    for (let t = -2; t <= 2; t++) {
                        let px = x, py = y + t;
                        if (px >= 1 && px < w-1 && py >= 1 && py < h-1) glyph[py][px] = 1;
                    }
                }
            } else {
                // Diagonal
                let dir = Math.random() < 0.5 ? 1 : -1;
                for (let i = 0; i < x1-x0; i++) {
                    let x = x0 + i;
                    let yDiag = y + Math.round(i*0.3*dir);
                    for (let t = -2; t <= 2; t++) {
                        let px = x, py = yDiag + t;
                        if (px >= 1 && px < w-1 && py >= 1 && py < h-1) glyph[py][px] = 1;
                    }
                }
            }
        } else if (strokeType < 0.85) {
            // Loop or teardrop
            let cx = Math.floor(w*0.3 + Math.random()*w*0.4);
            let cy = baseY - Math.floor(h*0.12) + Math.floor(Math.random()*h*0.24);
            let rx = Math.floor(w*0.13 + Math.random()*w*0.09);
            let ry = Math.floor(h*0.13 + Math.random()*h*0.09);
            let startA = Math.PI*0.7 + Math.random()*0.4;
            let endA = Math.PI*2.1 + Math.random()*0.4;
            let steps = Math.max(8, Math.floor(rx*1.5));
            let prevX = null, prevY = null;
            for (let i = 0; i < steps; i++) {
                let a = startA + (endA-startA)*i/(steps-1);
                let x = Math.round(cx + rx*Math.cos(a));
                let y = Math.round(cy + ry*Math.sin(a));
                if (prevX !== null && prevY !== null) {
                    // Bresenham's line algorithm to fill between previous and current point
                    let dx = Math.abs(x - prevX), sx = prevX < x ? 1 : -1;
                    let dy = -Math.abs(y - prevY), sy = prevY < y ? 1 : -1;
                    let err = dx + dy, e2;
                    let px = prevX, py = prevY;
                    while (true) {
                        for (let t = -2; t <= 2; t++) {
                            let xx = px + t;
                            if (xx >= 1 && xx < w-1 && py >= 1 && py < h-1) glyph[py][xx] = 1;
                        }
                        if (px === x && py === y) break;
                        e2 = 2 * err;
                        if (e2 >= dy) { err += dy; px += sx; }
                        if (e2 <= dx) { err += dx; py += sy; }
                    }
                } else {
                    for (let t = -2; t <= 2; t++) {
                        let xx = x + t;
                        if (xx >= 1 && xx < w-1 && y >= 1 && y < h-1) glyph[y][xx] = 1;
                    }
                }
                prevX = x;
                prevY = y;
            }
        } else {
            // Short vertical
            let x = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.3);
            let y0 = baseY - Math.floor(h*0.12);
            let y1 = baseY + Math.floor(h*0.12);
            for (let y = y0; y < y1; y++) {
                for (let t = -2; t <= 2; t++) {
                    let px = x + t;
                    if (px >= 1 && px < w-1 && y >= 1 && y < h-1) glyph[y][px] = 1;
                }
            }
        }
    }
    // Add 0-2 diacritic dots above or below
    let nDots = Math.random() < 0.5 ? 0 : (1 + Math.floor(Math.random()*2));
    for (let d = 0; d < nDots; d++) {
        let dotX = Math.floor(w*0.3) + Math.floor(Math.random()*(w*0.4));
        let above = Math.random() < 0.5;
        let dotY = baseY + (above ? -Math.floor(h*0.22) : Math.floor(h*0.22)) + Math.floor((Math.random()-0.5)*2);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            let px = dotX+dx, py = dotY+dy;
            if (px >= 1 && px < w-1 && py >= 1 && py < h-1) glyph[py][px] = 1;
        }
    }
    return glyph;
}
// Latin Cursive-inspired glyph generator
export function randomLatinCursiveGlyph(width, height, leftNeighborType = null) {
    // Latin Cursive: flowing, connected, slanted, loops, ascenders/descenders, variable thickness
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // 2-5 main strokes: curves, loops, connectors, dots
    let nStrokes = 2 + Math.floor(Math.random()*4);
    let baseline = Math.floor(h*0.7 + Math.random()*h*0.1 - h*0.05);
    let slant = Math.random()*0.4 + 0.2; // rightward slant
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
    let thick = 1;
        if (type < 0.25) {
            // Main curve (like a, c, e, o) with Bresenham's line algorithm
            let cx = Math.floor(w*0.5), cy = baseline;
            let rx = Math.floor(w*0.28 + Math.random()*w*0.12);
            let ry = Math.floor(h*0.18 + Math.random()*h*0.08);
            let startA = Math.PI*0.9 + Math.random()*0.2;
            let endA = Math.PI*2.1 + Math.random()*0.2;
            let steps = Math.max(8, Math.floor(rx*1.5));
            let prevX = null, prevY = null;
            for (let i = 0; i < steps; i++) {
                let a = startA + (endA-startA)*i/(steps-1);
                let x = Math.round(cx + rx*Math.cos(a) + (cy-baseline)*slant);
                let y = Math.round(cy + ry*Math.sin(a));
                if (prevX !== null && prevY !== null) {
                    // Bresenham's line algorithm to fill between previous and current point
                    let dx = Math.abs(x - prevX), sx = prevX < x ? 1 : -1;
                    let dy = -Math.abs(y - prevY), sy = prevY < y ? 1 : -1;
                    let err = dx + dy, e2;
                    let px = prevX, py = prevY;
                    while (true) {
                        for (let t = -thick; t <= thick; t++) {
                            let xx = px + t;
                            if (xx >= 0 && xx < w && py >= 0 && py < h) glyph[py][xx] = 1;
                        }
                        if (px === x && py === y) break;
                        e2 = 2 * err;
                        if (e2 >= dy) { err += dy; px += sx; }
                        if (e2 <= dx) { err += dx; py += sy; }
                    }
                } else {
                    for (let t = -thick; t <= thick; t++) {
                        let xx = x + t;
                        if (xx >= 0 && xx < w && y >= 0 && y < h) glyph[y][xx] = 1;
                    }
                }
                prevX = x;
                prevY = y;
            }
        } else if (type < 0.5) {
            // Ascender/descender (like b, d, f, g, j, p, q, y)
            let up = Math.random() < 0.5;
            let x = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.2);
            let yStart = up ? baseline - Math.floor(h*0.3 + Math.random()*h*0.18) : baseline;
            let yEnd = up ? baseline : baseline + Math.floor(h*0.3 + Math.random()*h*0.18);
            let terminated = false;
            for (let y = yStart; y < yEnd && !terminated; y++) {
                let xx = x + Math.round((y-baseline)*slant);
                for (let t = -thick; t <= thick; t++) {
                    let px = xx + t;
                    if (px >= 0 && px < w && y >= 0 && y < h) {
                        if (glyph[y][px] && Math.random() < 0.5) { terminated = true; break; }
                        glyph[y][px] = 1;
                    }
                }
            }
        } else if (type < 0.7) {
            // Loop (like l, e, f, g) with Bresenham's line algorithm
            let cx = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.2);
            let cy = baseline - Math.floor(h*0.18 + Math.random()*h*0.12);
            let r = Math.floor(Math.min(w,h)*0.18 + Math.random()*Math.min(w,h)*0.08);
            let startA = Math.PI*0.7 + Math.random()*0.2;
            let endA = Math.PI*2.3 + Math.random()*0.2;
            let steps = Math.max(8, Math.floor(r*1.5));
            let prevX = null, prevY = null;
            for (let i = 0; i < steps; i++) {
                let a = startA + (endA-startA)*i/(steps-1);
                let x = Math.round(cx + r*Math.cos(a) + (cy-baseline)*slant);
                let y = Math.round(cy + r*Math.sin(a));
                if (prevX !== null && prevY !== null) {
                    // Bresenham's line algorithm to fill between previous and current point
                    let dx = Math.abs(x - prevX), sx = prevX < x ? 1 : -1;
                    let dy = -Math.abs(y - prevY), sy = prevY < y ? 1 : -1;
                    let err = dx + dy, e2;
                    let px = prevX, py = prevY;
                    while (true) {
                        for (let t = -thick; t <= thick; t++) {
                            let xx = px + t;
                            if (xx >= 0 && xx < w && py >= 0 && py < h) glyph[py][xx] = 1;
                        }
                        if (px === x && py === y) break;
                        e2 = 2 * err;
                        if (e2 >= dy) { err += dy; px += sx; }
                        if (e2 <= dx) { err += dx; py += sy; }
                    }
                } else {
                    for (let t = -thick; t <= thick; t++) {
                        let xx = x + t;
                        if (xx >= 0 && xx < w && y >= 0 && y < h) glyph[y][xx] = 1;
                    }
                }
                prevX = x;
                prevY = y;
            }
        } else if (type < 0.85) {
            // Connector (slanted line, like joining letters)
            let x0 = Math.floor(w*0.1 + Math.random()*w*0.2);
            let y0 = baseline - Math.floor(h*0.08 + Math.random()*h*0.08);
            let x1 = Math.floor(w*0.7 + Math.random()*w*0.2);
            let y1 = baseline + Math.floor(h*0.08 + Math.random()*h*0.08);
            let steps = Math.max(4, Math.abs(x1-x0));
            let terminated = false;
            for (let i = 0; i <= steps && !terminated; i++) {
                let x = Math.round(x0 + (x1-x0)*i/steps);
                let y = Math.round(y0 + (y1-y0)*i/steps);
                for (let t = -thick; t <= thick; t++) {
                    let px = x + t;
                    if (px >= 0 && px < w && y >= 0 && y < h) {
                        if (glyph[y][px] && Math.random() < 0.5) { terminated = true; break; }
                        glyph[y][px] = 1;
                    }
                }
            }
        } else {
            // Dot (like i, j)
            let cx = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.3);
            let cy = baseline - Math.floor(h*0.28 + Math.random()*h*0.12);
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= 1.2) {
                    let px = cx+dx, py = cy+dy;
                    if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
                }
            }
        }
    }
    return glyph;
}
// Cyrillic-inspired glyph generator
export function randomCyrillicGlyph(width, height, leftNeighborType = null) {
    // Cyrillic: emphasize angular, boxy, structural forms, crossbars, ticks, and verticals
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    let nStrokes = 2 + Math.floor(Math.random()*2); // 2-3 main strokes
    let usedCrossbar = false;
    let usedDiagonal = false;
    let usedBowl = false;
    let usedVertical = false;
    let usedHorizontal = false;
    let usedTick = false;
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
        let thick = 1;
        if (!usedHorizontal && type < 0.22) {
            // Horizontal bar (like in E, Tse, Che, П, Ш)
            let y = Math.floor(h*0.2 + Math.random()*h*0.6);
            let xStart = Math.floor(w*0.12);
            let xEnd = w - Math.floor(w*0.12);
            for (let x = xStart; x < xEnd; x++) {
                for (let t = -thick; t <= thick; t++) {
                    let yy = y + t;
                    if (yy >= 0 && yy < h) glyph[yy][x] = 1;
                }
            }
            usedHorizontal = true;
        } else if (!usedVertical && type < 0.45) {
            // Double verticals (like in П, Ш, Щ)
            let xL = Math.floor(w*0.12);
            let xR = w - Math.floor(w*0.12);
            let yStart = Math.floor(h*0.12);
            let yEnd = h - Math.floor(h*0.12);
            for (let y = yStart; y < yEnd; y++) {
                for (let t = -thick; t <= thick; t++) {
                    let xxL = xL + t;
                    let xxR = xR + t;
                    if (xxL >= 0 && xxL < w) glyph[y][xxL] = 1;
                    if (xxR >= 0 && xxR < w) glyph[y][xxR] = 1;
                }
            }
            usedVertical = true;
        } else if (!usedDiagonal && type < 0.6) {
            // Diagonal (like in Ж, Ч, З, but more angular)
            let left = Math.random() < 0.5;
            let x0 = left ? Math.floor(w*0.12) : w - Math.floor(w*0.12);
            let y0 = Math.floor(h*0.12);
            let x1 = left ? w - Math.floor(w*0.12) : Math.floor(w*0.12);
            let y1 = h - Math.floor(h*0.12);
            // Bresenham's line algorithm
            let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
            let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
            let err = dx + dy, e2;
            let xx = x0, yy = y0;
            while (true) {
                for (let t = -thick; t <= thick; t++) {
                    let px = xx + t;
                    if (px >= 0 && px < w && yy >= 0 && yy < h) glyph[yy][px] = 1;
                }
                if (xx === x1 && yy === y1) break;
                e2 = 2 * err;
                if (e2 >= dy) { err += dy; xx += sx; }
                if (e2 <= dx) { err += dx; yy += sy; }
            }
            usedDiagonal = true;
        } else if (!usedBowl && type < 0.8) {
            // Boxy open bowl (like in Д, З, Щ)
            let xL = Math.floor(w*0.12), xR = w - Math.floor(w*0.12);
            let yT = Math.floor(h*0.5), yB = h - Math.floor(h*0.12);
            for (let x = xL; x <= xR; x++) {
                for (let t = -thick; t <= thick; t++) {
                    let yy = yB + t;
                    if (yy >= 0 && yy < h) glyph[yy][x] = 1;
                }
            }
            for (let y = yT; y <= yB; y++) {
                for (let t = -thick; t <= thick; t++) {
                    let xxL = xL + t;
                    let xxR = xR + t;
                    if (xxL >= 0 && xxL < w) glyph[y][xxL] = 1;
                    if (xxR >= 0 && xxR < w) glyph[y][xxR] = 1;
                }
            }
            usedBowl = true;
        } else if (!usedCrossbar) {
            // Crossbar (like in Д, Ж, Ч, З)
            let y = Math.floor(h*0.5 + Math.random()*h*0.1 - h*0.05);
            let xStart = Math.floor(w*0.18);
            let xEnd = w - Math.floor(w*0.18);
            for (let x = xStart; x < xEnd; x++) {
                for (let t = -thick; t <= thick; t++) {
                    let yy = y + t;
                    if (yy >= 0 && yy < h) glyph[yy][x] = 1;
                }
            }
            usedCrossbar = true;
        } else if (!usedTick) {
            // Occasional tick/diacritic (for Й, Ё, Й, Ї)
            let cx = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.3);
            let cy = Math.floor(h*0.12);
            for (let dy = 0; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                let px = cx+dx, py = cy+dy;
                if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
            }
            usedTick = true;
        }
    }
    // Occasionally add a dot (like diacritic or soft sign)
    if (Math.random() < 0.3) {
        let cx = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.3);
        let cy = Math.floor(h*0.15 + Math.random()*h*0.2);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= 1.2) {
                let px = cx+dx, py = cy+dy;
                if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
            }
        }
    }
    return glyph;
}
// Greek-inspired glyph generator
export function randomGreekGlyph(width, height, leftNeighborType = null) {
    // Greek: emphasize curvilinear, open, smooth forms, bowls, and diagonals
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    let nStrokes = 2 + Math.floor(Math.random()*2); // 2-3 main strokes
    let usedCrossbar = false;
    let usedDiagonal = false;
    let usedBowl = false;
    let usedVertical = false;
    let usedHorizontal = false;
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
        let thick = 1;
        if (!usedHorizontal && type < 0.18) {
            // Horizontal bar (like in Pi, Sigma, Epsilon)
            let y = Math.floor(h*0.2 + Math.random()*h*0.6);
            let xStart = Math.floor(w*0.15);
            let xEnd = w - Math.floor(w*0.15);
            for (let x = xStart; x < xEnd; x++) {
                for (let t = -thick; t <= thick; t++) {
                    let yy = y + t;
                    if (yy >= 0 && yy < h) glyph[yy][x] = 1;
                }
            }
            usedHorizontal = true;
        } else if (!usedVertical && type < 0.32) {
            // Single vertical (like in Pi, Lambda)
            let x = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.2);
            let yStart = Math.floor(h*0.15);
            let yEnd = h - Math.floor(h*0.15);
            for (let y = yStart; y < yEnd; y++) {
                for (let t = -thick; t <= thick; t++) {
                    let xx = x + t;
                    if (xx >= 0 && xx < w) glyph[y][xx] = 1;
                }
            }
            usedVertical = true;
        } else if (!usedDiagonal && type < 0.6) {
            // Diagonal (like in Lambda, Chi, Psi) with more curve
            let left = Math.random() < 0.5;
            let x0 = left ? Math.floor(w*0.15) : w - Math.floor(w*0.15);
            let y0 = Math.floor(h*0.15);
            let x1 = left ? w - Math.floor(w*0.15) : Math.floor(w*0.15);
            let y1 = h - Math.floor(h*0.15);
            let steps = Math.max(8, Math.abs(x1-x0));
            let prevX = null, prevY = null;
            for (let i = 0; i <= steps; i++) {
                // Add a slight curve to the diagonal
                let t = i/steps;
                let curve = Math.sin(t*Math.PI) * (w/8);
                let xx = Math.round(x0 + (x1-x0)*t + (left ? curve : -curve));
                let yy = Math.round(y0 + (y1-y0)*t);
                for (let tt = -thick; tt <= thick; tt++) {
                    let px = xx + tt;
                    if (px >= 0 && px < w && yy >= 0 && yy < h) glyph[yy][px] = 1;
                }
                prevX = xx;
                prevY = yy;
            }
            usedDiagonal = true;
        } else if (!usedBowl && type < 0.9) {
            // Open bowl (like in Omega, Sigma, Theta)
            let cx = Math.floor(w*0.5);
            let cy = Math.floor(h*0.6);
            let rx = Math.floor(w*0.28 + Math.random()*w*0.12);
            let ry = Math.floor(h*0.18 + Math.random()*h*0.08);
            let startA = Math.PI*0.2 + Math.random()*0.2;
            let endA = Math.PI*1.8 + Math.random()*0.2;
            let steps = Math.max(12, Math.floor(rx*1.7));
            let prevX = null, prevY = null;
            for (let i = 0; i < steps; i++) {
                let a = startA + (endA-startA)*i/(steps-1);
                let x = Math.round(cx + rx*Math.cos(a));
                let y = Math.round(cy + ry*Math.sin(a));
                if (prevX !== null && prevY !== null) {
                    // Connect points for smoothness
                    let dx = Math.abs(x - prevX), sx = prevX < x ? 1 : -1;
                    let dy = -Math.abs(y - prevY), sy = prevY < y ? 1 : -1;
                    let err = dx + dy, e2;
                    let px = prevX, py = prevY;
                    while (true) {
                        for (let t = -thick; t <= thick; t++) {
                            let xx = px + t;
                            if (xx >= 0 && xx < w && py >= 0 && py < h) glyph[py][xx] = 1;
                        }
                        if (px === x && py === y) break;
                        e2 = 2 * err;
                        if (e2 >= dy) { err += dy; px += sx; }
                        if (e2 <= dx) { err += dx; py += sy; }
                    }
                } else {
                    for (let t = -thick; t <= thick; t++) {
                        let xx = x + t;
                        if (xx >= 0 && xx < w && y >= 0 && y < h) glyph[y][xx] = 1;
                    }
                }
                prevX = x;
                prevY = y;
            }
            usedBowl = true;
        } else if (!usedCrossbar) {
            // Crossbar (like in Theta, Pi, Xi)
            let y = Math.floor(h*0.5 + Math.random()*h*0.1 - h*0.05);
            let xStart = Math.floor(w*0.25);
            let xEnd = w - Math.floor(w*0.25);
            for (let x = xStart; x < xEnd; x++) {
                for (let t = -thick; t <= thick; t++) {
                    let yy = y + t;
                    if (yy >= 0 && yy < h) glyph[yy][x] = 1;
                }
            }
            usedCrossbar = true;
        }
    }
    // Occasionally add a dot (like iota subscript or diacritic)
    if (Math.random() < 0.3) {
        let cx = Math.floor(w*0.5 + (Math.random()-0.5)*w*0.3);
        let cy = Math.floor(h*0.15 + Math.random()*h*0.2);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= 1.2) {
                let px = cx+dx, py = cy+dy;
                if (px >= 0 && px < w && py >= 0 && py < h) glyph[py][px] = 1;
            }
        }
    }
    return glyph;
}
// gridGlyphShader4.js
// Shader: Randomly generated glyphs tiled to fill the screen


// Stroke-based glyph generation
export function emptyGlyph(width, height) {
    return Array.from({length: height}, () => Array(width).fill(0));
}

// Utility to randomize and set global thickness for Japanese and Chinese glyphs
export function randomizeGlyphLineWeights() {
    if (typeof window !== 'undefined') {
        window.japaneseGlyphThickness = 1 + Math.floor(Math.random()*2); // 1 or 2
        window.chineseGlyphThickness = 1 + Math.floor(Math.random()*2); // 1 or 2
    }
}

// Hangul-inspired glyph generator
export function randomHangulGlyph(ctx, x, y, cellSize, opts = {}) {
    // Authentic Hangul: Compose a block from randomized jamo (choseong, jungseong, optional jongseong)
    const pad = cellSize * 0.12;
    const blockW = cellSize - pad * 2;
    const blockH = cellSize - pad * 2;
    const lw = opts.lineWidth || (cellSize * 0.09);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = opts.color || '#111';
    ctx.lineWidth = lw;

    // --- Choseong (initial consonant) ---
    const choseongTypes = [
        // vertical bar (ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.18, by + bh * 0.18);
            ctx.lineTo(bx + bw * 0.18, by + bh * 0.82);
            ctx.stroke();
        },
        // corner (ㄱ, ㄷ, ㄹ)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.18, by + bh * 0.18);
            ctx.lineTo(bx + bw * 0.82, by + bh * 0.18);
            ctx.lineTo(bx + bw * 0.82, by + bh * 0.5);
            ctx.stroke();
        },
        // circle (ㅇ, ㅎ)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.arc(bx + bw * 0.5, by + bh * 0.35, bw * 0.18, 0, 2 * Math.PI);
            ctx.stroke();
        },
        // double vertical (ㅃ, ㅆ, ㅉ)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.32, by + bh * 0.18);
            ctx.lineTo(bx + bw * 0.32, by + bh * 0.82);
            ctx.moveTo(bx + bw * 0.52, by + bh * 0.18);
            ctx.lineTo(bx + bw * 0.52, by + bh * 0.82);
            ctx.stroke();
        }
    ];
    // --- Jungseong (vowel) ---
    const jungseongTypes = [
        // vertical (ㅣ)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.7, by + bh * 0.18);
            ctx.lineTo(bx + bw * 0.7, by + bh * 0.82);
            ctx.stroke();
        },
        // horizontal (ㅡ)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.18, by + bh * 0.7);
            ctx.lineTo(bx + bw * 0.82, by + bh * 0.7);
            ctx.stroke();
        },
        // diphthong (ㅢ, ㅚ, ㅟ, etc.)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.7, by + bh * 0.18);
            ctx.lineTo(bx + bw * 0.7, by + bh * 0.82);
            ctx.moveTo(bx + bw * 0.18, by + bh * 0.7);
            ctx.lineTo(bx + bw * 0.82, by + bh * 0.7);
            ctx.stroke();
        },
        // dot (ㆍ, old vowel)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.arc(bx + bw * 0.7, by + bh * 0.5, bw * 0.06, 0, 2 * Math.PI);
            ctx.stroke();
        }
    ];
    // --- Jongseong (final consonant, optional) ---
    const jongseongTypes = [
        // short horizontal (ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.32, by + bh * 0.82);
            ctx.lineTo(bx + bw * 0.68, by + bh * 0.82);
            ctx.stroke();
        },
        // dot (for ㄱ, ㅅ, etc. as a final)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.arc(bx + bw * 0.5, by + bh * 0.82, bw * 0.06, 0, 2 * Math.PI);
            ctx.stroke();
        },
        // corner (ㄹ, ㄴ)
        (ctx, bx, by, bw, bh) => {
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.32, by + bh * 0.82);
            ctx.lineTo(bx + bw * 0.32, by + bh * 0.68);
            ctx.lineTo(bx + bw * 0.68, by + bh * 0.82);
            ctx.stroke();
        }
    ];

    // Draw choseong (top left)
    const choseong = choseongTypes[Math.floor(Math.random() * choseongTypes.length)];
    choseong(ctx, x + pad, y + pad, blockW, blockH);

    // Draw jungseong (right or below, depending on type)
    const jungseong = jungseongTypes[Math.floor(Math.random() * jungseongTypes.length)];
    jungseong(ctx, x + pad, y + pad, blockW, blockH);

    // Optionally draw jongseong (bottom)
    if (Math.random() < 0.7) {
        const jongseong = jongseongTypes[Math.floor(Math.random() * jongseongTypes.length)];
        jongseong(ctx, x + pad, y + pad, blockW, blockH);
    }

    ctx.restore();
}

// Graffiti-inspired glyph generator
export function randomGraffitiGlyph(ctx, x, y, cellSize, opts = {}) {
    // Graffiti: dynamic, overlapping, angular, with arrows, underlines, stars, bubbles, drips, and a tag effect
    const pad = cellSize * 0.10 + Math.random() * cellSize * 0.08;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';

    // 1. Main strokes: 2-4 bold, angular, overlapping lines
    let nStrokes = 2 + Math.floor(Math.random() * 3);
    let centerX = x + cellSize/2, centerY = y + cellSize/2;
    let baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < nStrokes; i++) {
        let angle = baseAngle + (Math.random()-0.5)*Math.PI*0.7 + i*Math.PI/3;
        let len = cellSize * (0.45 + Math.random() * 0.38);
        let cx = centerX + Math.cos(angle+Math.PI/2)*cellSize*0.13*(Math.random()-0.5);
        let cy = centerY + Math.sin(angle+Math.PI/2)*cellSize*0.13*(Math.random()-0.5);
        let ex = cx + Math.cos(angle) * len * (0.7 + Math.random()*0.5);
        let ey = cy + Math.sin(angle) * len * (0.7 + Math.random()*0.5);
        let lw = opts.lineWidth || (cellSize * (0.13 + Math.random() * 0.13));
        ctx.save();
        ctx.strokeStyle = opts.color || (Math.random()<0.5 ? '#fff' : '#fffa');
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // Add arrowhead
        if (Math.random() < 0.6) {
            let ahLen = lw * (1.7 + Math.random()*0.7);
            let ahAngle = Math.PI/7 + Math.random()*Math.PI/7;
            for (let dir of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(
                    ex - Math.cos(angle + dir*ahAngle) * ahLen,
                    ey - Math.sin(angle + dir*ahAngle) * ahLen
                );
                ctx.stroke();
            }
        }
        // Add star or bubble at end
        if (Math.random() < 0.18) {
            if (Math.random() < 0.5) {
                // Star
                ctx.save();
                ctx.strokeStyle = opts.highlightColor || '#ff0';
                ctx.lineWidth = lw*0.7;
                ctx.beginPath();
                let r = lw*1.1;
                for (let j = 0; j < 5; j++) {
                    let a = Math.PI*2*j/5;
                    let sx = ex + Math.cos(a)*r;
                    let sy = ey + Math.sin(a)*r;
                    if (j === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            } else {
                // Bubble
                ctx.save();
                ctx.strokeStyle = opts.highlightColor || '#0ffb';
                ctx.lineWidth = lw*0.5;
                ctx.beginPath();
                ctx.arc(ex, ey, lw*1.1, 0, 2*Math.PI);
                ctx.stroke();
                ctx.restore();
            }
        }
        // Add drip
        if (Math.random() < 0.22) {
            let dripLen = cellSize * (0.12 + Math.random()*0.08);
            ctx.save();
            ctx.strokeStyle = opts.color || '#fff';
            ctx.lineWidth = lw * 0.7;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex, ey + dripLen);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    // 2. Add a quick underline/tag swoosh
    if (Math.random() < 0.9) {
        ctx.save();
        ctx.strokeStyle = opts.color || '#fff';
        ctx.lineWidth = cellSize*0.09 + Math.random()*cellSize*0.06;
        let ux = x + pad + Math.random()*cellSize*0.2;
        let uy = y + cellSize*0.82 + Math.random()*cellSize*0.08;
        let uw = cellSize*0.6 + Math.random()*cellSize*0.18;
        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.bezierCurveTo(
            ux + uw*0.3, uy + cellSize*0.08*(Math.random()-0.5),
            ux + uw*0.7, uy + cellSize*0.08*(Math.random()-0.5),
            ux + uw, uy + (Math.random()-0.5)*cellSize*0.08
        );
        ctx.stroke();
        ctx.restore();
    }

    // 3. Add highlights (thin, bright lines)
    if (Math.random() < 0.8) {
        ctx.save();
        ctx.strokeStyle = opts.highlightColor || (Math.random()<0.5 ? '#fffb' : '#0ffb');
        ctx.lineWidth = cellSize * 0.03 + Math.random()*cellSize*0.02;
        let hx = x + pad + Math.random() * (cellSize - 2 * pad);
        let hy = y + pad + Math.random() * (cellSize - 2 * pad);
        let hlen = cellSize * (0.22 + Math.random()*0.18);
        let hangle = Math.random() * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + Math.cos(hangle)*hlen, hy + Math.sin(hangle)*hlen);
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
}