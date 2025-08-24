// gridGlyphShader2.js
// Shader: Randomly generated glyphs tiled to fill the screen


// Stroke-based glyph generation
function emptyGlyph(width, height) {
    return Array.from({length: height}, () => Array(width).fill(0));
}

function drawStroke(glyph, type) {
    // Padding logic for all strokes
    // Most strokes will not touch the outer edge, but sometimes (ascender/descender) they will
    let pad = 3 + Math.floor(Math.random()*2); // 3 or 4 px padding by default
    let allowAscDesc = Math.random() < 0.18; // ~18% chance to violate padding
    let padTop = pad, padBot = pad, padLeft = pad, padRight = pad;
    if (allowAscDesc) {
        // Randomly pick which edge to violate
        let edge = Math.floor(Math.random()*4);
        if (edge === 0) padTop = 0;
        else if (edge === 1) padBot = 0;
        else if (edge === 2) padLeft = 0;
        else padRight = 0;
    }
    // Calligraphic dot with padding check
    function calligraphicDot(x, y, thickness, angleRad) {
        // Draw an ellipse at (x, y) with given thickness and angle
        let a = Math.max(1, Math.round(thickness));
        let b = Math.max(1, Math.round(thickness * 0.5));
        let cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
        for (let dx = -a; dx <= a; dx++) {
            for (let dy = -b; dy <= b; dy++) {
                // Ellipse equation
                let ex = dx * cosA - dy * sinA;
                let ey = dx * sinA + dy * cosA;
                let px = x + dx, py = y + dy;
                if ((ex*ex)/(a*a) + (ey*ey)/(b*b) <= 1
                    && px >= padLeft && px < w - padRight
                    && py >= padTop && py < h - padBot) {
                    glyph[py][px] = 1;
                }
            }
        }
    }
    if (type === 'sCurve') {
        // S-curve from top to bottom, calligraphic, with padding
        for (let y = padTop; y < h-padBot; y++) {
            let tNorm = (y-padTop)/Math.max(1,(h-padTop-padBot-1));
            let x = Math.floor(w/2) + Math.round(Math.sin(tNorm*Math.PI*1.5) * (w/4));
            let thickness = thick + 1 + Math.sin(tNorm*Math.PI) * 1.5;
            let angle = Math.PI/6 + Math.sin(tNorm*Math.PI*1.5) * Math.PI/8;
            calligraphicDot(x, y, thickness, angle);
        }
    } else if (type === 'waveH') {
        // Horizontal wave, calligraphic, with padding
        let yBase = Math.floor((padTop + h - padBot) / 2);
        for (let x = padLeft; x < w-padRight; x++) {
            let tNorm = (x-padLeft)/Math.max(1,(w-padLeft-padRight-1));
            let y = yBase + Math.round(Math.sin(tNorm*Math.PI*2) * (h/8));
            let thickness = thick + 1 + Math.cos(tNorm*Math.PI*2) * 1.2;
            let angle = Math.PI/4 + Math.cos(tNorm*Math.PI*2) * Math.PI/10;
            calligraphicDot(x, y, thickness, angle);
        }
    } else if (type === 'spiral') {
        // Spiral from center out, calligraphic, with padding
        let cx = Math.floor((padLeft + w - padRight) / 2), cy = Math.floor((padTop + h - padBot) / 2);
        let maxR = Math.min(w-padLeft-padRight, h-padTop-padBot) / 2 - 2;
        let turns = 1.5;
        let points = Math.floor(maxR * 8);
        for (let i = 0; i < points; i++) {
            let tNorm = i / points;
            let theta = tNorm * Math.PI * 2 * turns;
            let r = tNorm * maxR;
            let x = Math.round(cx + r * Math.cos(theta));
            let y = Math.round(cy + r * Math.sin(theta));
            let thickness = thick + 1 + Math.sin(theta*2) * 1.2;
            let angle = theta + Math.PI/4;
            calligraphicDot(x, y, thickness, angle);
        }
    }
    // Additional strokes for more variety
    if (type === 'arcTL') { // top-left arc (like a, d, q)
        for (let t = 0; t < thick; t++) {
            for (let i = 0; i < minLen; i++) {
                let x = 2+t + Math.round(Math.cos(Math.PI/2 * (i/minLen)) * (minLen-1));
                let y = 2+t + i;
                if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
            }
        }
    } else if (type === 'arcTR') { // top-right arc
        for (let t = 0; t < thick; t++) {
            for (let i = 0; i < minLen; i++) {
                let x = w-3-t - Math.round(Math.cos(Math.PI/2 * (i/minLen)) * (minLen-1));
                let y = 2+t + i;
                if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
            }
        }
    } else if (type === 'arcBL') { // bottom-left arc
        for (let t = 0; t < thick; t++) {
            for (let i = 0; i < minLen; i++) {
                let x = 2+t + Math.round(Math.cos(Math.PI/2 * (i/minLen)) * (minLen-1));
                let y = h-3-t - i;
                if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
            }
        }
    } else if (type === 'arcBR') { // bottom-right arc
        for (let t = 0; t < thick; t++) {
            for (let i = 0; i < minLen; i++) {
                let x = w-3-t - Math.round(Math.cos(Math.PI/2 * (i/minLen)) * (minLen-1));
                let y = h-3-t - i;
                if (x >= 0 && x < w && y >= 0 && y < h) glyph[y][x] = 1;
            }
        }
    } else if (type === 'zigzagH') { // horizontal zigzag
        for (let t = 0; t < thick; t++) {
            let y = Math.floor(h/2)+t-1;
            for (let x = 2+t; x < w-2-t; x++) {
                if (((x-2-t) % 4) < 2) glyph[y][x] = 1;
            }
        }
    } else if (type === 'zigzagV') { // vertical zigzag
        for (let t = 0; t < thick; t++) {
            let x = Math.floor(w/2)+t-1;
            for (let y = 2+t; y < h-2-t; y++) {
                if (((y-2-t) % 4) < 2) glyph[y][x] = 1;
            }
        }
    } else if (type === 'crossbar') { // crossbar (like A, H)
        let y = Math.floor(h*0.7);
        for (let t = 0; t < thick; t++) {
            for (let x = 2+t; x < w-2-t; x++) glyph[y+t][x] = 1;
        }
    } else if (type === 'Ttop') { // T shape top
        let y = 2;
        for (let t = 0; t < thick; t++) {
            for (let x = 2+t; x < w-2-t; x++) glyph[y+t][x] = 1;
            let cx = Math.floor(w/2)+t-1;
            for (let yy = y; yy < h-2; yy++) glyph[yy][cx] = 1;
        }
    } else if (type === 'Cleft') { // C shape left
        for (let t = 0; t < thick; t++) {
            for (let y = 2+t; y < h-2-t; y++) glyph[y][2+t] = 1;
            for (let x = 2+t; x < w-2-t; x++) {
                glyph[2+t][x] = 1;
                glyph[h-3-t][x] = 1;
            }
        }
    } else if (type === 'Eleft') { // E shape left
        for (let t = 0; t < thick; t++) {
            for (let y = 2+t; y < h-2-t; y++) glyph[y][2+t] = 1;
            for (let x = 2+t; x < w-2-t; x++) {
                glyph[2+t][x] = 1;
                glyph[Math.floor(h/2)+t-1][x] = 1;
                glyph[h-3-t][x] = 1;
            }
        }
    } else if (type === 'Fleft') { // F shape left
        for (let t = 0; t < thick; t++) {
            for (let y = 2+t; y < h-2-t; y++) glyph[y][2+t] = 1;
            for (let x = 2+t; x < w-2-t; x++) {
                glyph[2+t][x] = 1;
                glyph[Math.floor(h/2)+t-1][x] = 1;
            }
        }
    }
    const w = glyph[0].length, h = glyph.length;
    const minLen = Math.floor(Math.min(w, h) * 0.5); // minimum stroke length: half grid size
    const thick = 2; // stroke thickness
    if (type === 'vert') {
        // vertical bar
        const x = Math.floor(w/2) + (Math.random()<0.5 ? 0 : (Math.random()<0.5?-1:1));
        for (let dx = -Math.floor(thick/2); dx <= Math.floor((thick-1)/2); dx++) {
            for (let y = 1; y < h-1-minLen+1; y++) {
                for (let l = 0; l < minLen; l++) {
                    if (x+dx >= 0 && x+dx < w && y+l < h-1) glyph[y+l][x+dx] = 1;
                }
            }
        }
    } else if (type === 'horiz') {
        // horizontal bar
        const y = Math.floor(h/2) + (Math.random()<0.5 ? 0 : (Math.random()<0.5?-1:1));
        for (let dy = -Math.floor(thick/2); dy <= Math.floor((thick-1)/2); dy++) {
            for (let x = 1; x < w-1-minLen+1; x++) {
                for (let l = 0; l < minLen; l++) {
                    if (y+dy >= 0 && y+dy < h && x+l < w-1) glyph[y+dy][x+l] = 1;
                }
            }
        }
    } else if (type === 'diag1') {
        // \\ diagonal
        for (let d = -Math.floor(thick/2); d <= Math.floor((thick-1)/2); d++) {
            for (let i = 1; i < Math.min(w,h)-1-minLen+1; i++) {
                for (let l = 0; l < minLen; l++) {
                    let x = i+l, y = i+l+d;
                    if (x < w-1 && y > 0 && y < h-1) glyph[y][x] = 1;
                }
            }
        }
    } else if (type === 'diag2') {
        // / diagonal
        for (let d = -Math.floor(thick/2); d <= Math.floor((thick-1)/2); d++) {
            for (let i = 1; i < Math.min(w,h)-1-minLen+1; i++) {
                for (let l = 0; l < minLen; l++) {
                    let x = w-1-(i+l), y = i+l+d;
                    if (x > 0 && y > 0 && y < h-1) glyph[y][x] = 1;
                }
            }
        }
    } else if (type === 'dot') {
        // center dot, make it a 3x3 block (thicker)
        let dotSize = thick + 1; // 3 if thick=2
        for (let dy = 0; dy < dotSize; dy++) for (let dx = 0; dx < dotSize; dx++) {
            let cy = Math.floor(h/2)+dy-Math.floor(dotSize/2), cx = Math.floor(w/2)+dx-Math.floor(dotSize/2);
            if (cy >= 0 && cy < h && cx >= 0 && cx < w) glyph[cy][cx] = 1;
        }
    } else if (type === 'rect') {
        // rectangle, thick border
        for (let t = 0; t < thick; t++) {
            for (let x = 2+t; x < w-2-t; x++) {
                glyph[2+t][x] = 1;
                glyph[h-3-t][x] = 1;
            }
            for (let y = 2+t; y < h-2-t; y++) {
                glyph[y][2+t] = 1;
                glyph[y][w-3-t] = 1;
            }
        }
    }
    // New: add more varied strokes inspired by letterforms
    else if (type === 'curveL') {
        // left-side curve (like C, G, S, U)
        for (let t = 0; t < thick; t++) {
            for (let y = 2+t; y < h-2-t; y++) {
                let x = 2+t + Math.round(Math.sin((y-2-t)/(h-4-2*t)*Math.PI)*2);
                if (x >= 0 && x < w) glyph[y][x] = 1;
            }
        }
    } else if (type === 'curveR') {
        // right-side curve (like D, J, P)
        for (let t = 0; t < thick; t++) {
            for (let y = 2+t; y < h-2-t; y++) {
                let x = w-3-t - Math.round(Math.sin((y-2-t)/(h-4-2*t)*Math.PI)*2);
                if (x >= 0 && x < w) glyph[y][x] = 1;
            }
        }
    } else if (type === 'hookT') {
        // top hook (like f, t, r)
        for (let t = 0; t < thick; t++) {
            let y = 2+t;
            for (let x = 2+t; x < w-2-t; x++) glyph[y][x] = 1;
            for (let l = 0; l < minLen; l++) {
                let x = 2+t+l;
                if (x < w-2-t) glyph[y+1][x] = 1;
            }
        }
    } else if (type === 'hookB') {
        // bottom hook (like J, g)
        for (let t = 0; t < thick; t++) {
            let y = h-3-t;
            for (let x = 2+t; x < w-2-t; x++) glyph[y][x] = 1;
            for (let l = 0; l < minLen; l++) {
                let x = w-3-t-l;
                if (x > 2+t) glyph[y-1][x] = 1;
            }
        }
    } else if (type === 'cornerTL') {
        // top-left corner (like 7, r)
        for (let t = 0; t < thick; t++) {
            let y = 2+t;
            for (let x = 2+t; x < 2+t+minLen; x++) glyph[y][x] = 1;
            for (let y2 = 2+t; y2 < 2+t+minLen; y2++) glyph[y2][2+t] = 1;
        }
    } else if (type === 'cornerTR') {
        // top-right corner (like 2, 5)
        for (let t = 0; t < thick; t++) {
            let y = 2+t;
            for (let x = w-3-t; x > w-3-t-minLen; x--) glyph[y][x] = 1;
            for (let y2 = 2+t; y2 < 2+t+minLen; y2++) glyph[y2][w-3-t] = 1;
        }
    } else if (type === 'cornerBL') {
        // bottom-left corner (like L)
        for (let t = 0; t < thick; t++) {
            let y = h-3-t;
            for (let x = 2+t; x < 2+t+minLen; x++) glyph[y][x] = 1;
            for (let y2 = h-3-t; y2 > h-3-t-minLen; y2--) glyph[y2][2+t] = 1;
        }
    } else if (type === 'cornerBR') {
        // bottom-right corner
        for (let t = 0; t < thick; t++) {
            let y = h-3-t;
            for (let x = w-3-t; x > w-3-t-minLen; x--) glyph[y][x] = 1;
            for (let y2 = h-3-t; y2 > h-3-t-minLen; y2--) glyph[y2][w-3-t] = 1;
        }
    }
}

function randomBaseGlyph(width, height) {
    const glyph = emptyGlyph(width, height);
    // 2-4 strokes, always connected/overlapping, centered
    const strokes = [
        'vert','horiz','diag1','diag2','dot',
        'curveL','curveR','hookT','hookB',
        'cornerTL','cornerTR','cornerBL','cornerBR',
        'arcTL','arcTR','arcBL','arcBR',
        'zigzagH','zigzagV','crossbar','Ttop','Cleft','Eleft','Fleft',
        'sCurve','waveH','spiral'
    ];
    // Always start with a main stroke
    let used = new Set();
    let mainType = strokes[Math.floor(Math.random()*strokes.length)];
    used.add(mainType);
    drawStroke(glyph, mainType);
    // Add 1-3 more strokes (2-4 total), always overlapping/centered
    let n = 1 + Math.floor(Math.random()*3); // 1-3 additional strokes
    for (let i=0; i<n; i++) {
        let compatible = strokes.filter(s => !used.has(s));
        if (compatible.length === 0) break;
        let nextType = compatible[Math.floor(Math.random()*compatible.length)];
        used.add(nextType);
        drawStroke(glyph, nextType);
    }
    // No random noise, no toggling
    return glyph;
}

function mutateGlyph(glyph) {
    // Copy
    const h = glyph.length, w = glyph[0].length;
    let newGlyph = glyph.map(row => row.slice());
    // Randomly flip
    if (Math.random()<0.5) newGlyph = newGlyph.map(row => row.slice().reverse());
    if (Math.random()<0.5) newGlyph = newGlyph.slice().reverse();
    // Randomly shift
    if (Math.random()<0.5) {
        let shift = Math.floor(Math.random()*3)-1;
        if (shift) newGlyph = newGlyph.map(row => {
            let r = row.slice();
            if (shift>0) for(let i=0;i<shift;i++) r.unshift(r.pop());
            else for(let i=0;i<-shift;i++) r.push(r.shift());
            return r;
        });
    }
    // Randomly toggle a few pixels
    // for (let i=0; i<Math.floor(w*h*0.03); i++) {
    //     let x = Math.floor(Math.random()*w), y = Math.floor(Math.random()*h);
    //     newGlyph[y][x] = newGlyph[y][x] ? 0 : 1;
    // }
    return newGlyph;
}

let glyphs = [];
let glyphW = 30, glyphH = 60;
let glyphCount = 0;
let gridStartOffset = 0;

function resetGlyphs(width, height) {
    // Randomize glyph dimensions, width <= height
    glyphH = 40 + Math.floor(Math.random() * 41); // 40-80
    glyphW = 10 + Math.floor(Math.random() * (glyphH - 9)); // 10 to glyphH

    // Calculate grid after glyph size is set
    let space = 6;
    let scale = 2; // use max scale for estimate
    let cols = Math.ceil(width / ((glyphW + space) * scale));
    let rows = Math.ceil(height / ((glyphH + space) * scale));
    glyphCount = cols * rows;
    glyphs = [];
    // Generate a larger set of base glyphs (at least 1/4 of total)
    let baseCount = Math.max(10, Math.floor(glyphCount / 4));
    let baseGlyphs = [];
    for (let i=0; i<baseCount; i++) baseGlyphs.push(randomBaseGlyph(glyphW, glyphH));
    // Fill out the rest by mutation
    for (let i=0; i<glyphCount; i++) {
        let g = baseGlyphs[i%baseCount];
        if (i<baseCount) glyphs.push(g);
        else glyphs.push(mutateGlyph(g));
    }
    // Shuffle glyphs to reduce repetition
    for (let i = glyphs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [glyphs[i], glyphs[j]] = [glyphs[j], glyphs[i]];
    }
    // Randomize grid start offset for extra randomness
    gridStartOffset = Math.floor(Math.random() * glyphs.length);
    // Store cols/rows for use in animate
    resetGlyphs._cols = cols;
    resetGlyphs._rows = rows;
}

function drawGlyph(ctx, glyph, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#fff';
    for (let gy = 0; gy < glyph.length; gy++) {
        for (let gx = 0; gx < glyph[0].length; gx++) {
            if (glyph[gy][gx]) {
                ctx.fillRect(gx * scale, gy * scale, scale, scale);
            }
        }
    }
    ctx.restore();
}

function animate(ctx, t, width, height) {
    if (!glyphs.length || ctx._glyphW !== width || ctx._glyphH !== height) {
        resetGlyphs(width, height);
        ctx._glyphW = width;
        ctx._glyphH = height;
    }
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    let space = 6; // space between glyphs in pixels
    // Dynamically compute cols/rows based on current glyph size and canvas dimensions
    let scale = Math.floor(Math.min(width / ((glyphW + space) * 8), height / ((glyphH + space) * 8), 2));
    if (scale < 1) scale = 1;
    let cols = Math.max(1, Math.floor(width / (glyphW * scale + space)));
    let rows = Math.max(1, Math.floor(height / (glyphH * scale + space)));
    // Center the grid in the canvas
    const gridW = cols * (glyphW * scale + space) - space;
    const gridH = rows * (glyphH * scale + space) - space;
    const offsetX = Math.floor((width - gridW) / 2);
    const offsetY = Math.floor((height - gridH) / 2);
    // No animation: just draw the shuffled glyphs as a static grid
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let idx = (row * cols + col + gridStartOffset) % glyphs.length;
            drawGlyph(
                ctx,
                glyphs[idx],
                offsetX + col * (glyphW * scale + space),
                offsetY + row * (glyphH * scale + space),
                scale
            );
        }
    }
}

export default {
    name: 'Grid Glyphs 2',
    animate,
    resetState: resetGlyphs,
    onResize: resetGlyphs,
    onClick: function(e, { canvas, ctx, width, height }) {
        resetGlyphs(width, height);
        // Force redraw by clearing glyphs so animate will regenerate
        glyphs = [];
    }
};
