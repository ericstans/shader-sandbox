// gridGlyphShader.js
// Shader: Randomly generated glyphs tiled to fill the screen


// Stroke-based glyph generation
function emptyGlyph(width, height) {
    return Array.from({length: height}, () => Array(width).fill(0));
}

function drawStroke(glyph, type) {
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
        // center dot, make it a 2x2 block
        for (let dy = 0; dy < thick; dy++) for (let dx = 0; dx < thick; dx++) {
            let cy = Math.floor(h/2)+dy-1, cx = Math.floor(w/2)+dx-1;
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
    // 1-2 random strokes (max)
    const strokes = [
        'vert','horiz','diag1','diag2','dot',
        'curveL','curveR','hookT','hookB',
        'cornerTL','cornerTR','cornerBL','cornerBR',
        'arcTL','arcTR','arcBL','arcBR',
        'zigzagH','zigzagV','crossbar','Ttop','Cleft','Eleft','Fleft'
    ];
    const n = 1 + Math.floor(Math.random()*2); // max 2
    let used = new Set();
    for (let i=0; i<n; i++) {
        let type;
        do { type = strokes[Math.floor(Math.random()*strokes.length)]; } while (used.has(type));
        used.add(type);
        drawStroke(glyph, type);
    }
    // Sparse random noise
    // for (let i=0; i<Math.floor(width*height*0.05); i++) {
    //     let x = Math.floor(Math.random()*width), y = Math.floor(Math.random()*height);
    //     glyph[y][x] = 1;
    // }
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

function resetGlyphs(width, height) {
    glyphCount = 10 + Math.floor(Math.random() * 41); // 10-50
    glyphs = [];
        // Generate a larger set of base glyphs (10-15)
        let baseCount = 10 + Math.floor(Math.random()*6); // 10-15
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
    let scale = Math.floor(Math.min(width / ((glyphW + space) * 8), height / ((glyphH + space) * 8), 2));
    let cols = Math.ceil(width / ((glyphW + space) * scale));
    let rows = Math.ceil(height / ((glyphH + space) * scale));
    // Add a random offset per frame to break up visible repetition
    let offset = Math.floor((t * 60) % glyphs.length);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let idx = (row * cols + col + offset) % glyphs.length;
            drawGlyph(
                ctx,
                glyphs[idx],
                col * (glyphW * scale + space),
                row * (glyphH * scale + space),
                scale
            );
        }
    }
}

export default {
    name: 'Grid Glyphs',
    animate,
    resetState: resetGlyphs,
    onResize: resetGlyphs,
    onClick: function(e, { canvas, ctx, width, height }) {
        resetGlyphs(width, height);
    }
};
