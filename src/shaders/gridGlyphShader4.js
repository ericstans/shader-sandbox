// --- UI: Glyph Generation Style Dropdown ---
let glyphStyleSelect = null;
let glyphStyleDropdownContainer = null;
function ensureGlyphStyleDropdown(canvas) {
    if (glyphStyleDropdownContainer) return;
    // Create container
    glyphStyleDropdownContainer = document.createElement('div');
    glyphStyleDropdownContainer.id = 'glyph-style-dropdown-container';
    glyphStyleDropdownContainer.style.position = 'absolute';
    glyphStyleDropdownContainer.style.top = '16px';
    glyphStyleDropdownContainer.style.right = '16px';
    glyphStyleDropdownContainer.style.zIndex = '10';
    glyphStyleDropdownContainer.style.background = 'rgba(30,30,30,0.92)';
    glyphStyleDropdownContainer.style.borderRadius = '8px';
    glyphStyleDropdownContainer.style.padding = '6px 12px';
    glyphStyleDropdownContainer.style.boxShadow = '0 2px 8px #0003';
    // Label
    const label = document.createElement('label');
    label.htmlFor = 'glyph-style-select';
    label.style.color = '#fff';
    label.style.fontSize = '1em';
    label.textContent = 'Glyph Style: ';
    glyphStyleDropdownContainer.appendChild(label);
    // Select
    glyphStyleSelect = document.createElement('select');
    glyphStyleSelect.id = 'glyph-style-select';
    glyphStyleSelect.style.fontSize = '1em';
    glyphStyleSelect.style.padding = '2px 8px';
    const styles = [
        { value: 'original', label: 'Original' },
        { value: 'arabic', label: 'Arabic' },
        { value: 'devanagari', label: 'Devanagari' },
        { value: 'chinese', label: 'Chinese' },
        { value: 'japanese', label: 'Japanese' },
        { value: 'hebrew', label: 'Hebrew' },
        { value: 'latin-cursive', label: 'Latin Cursive' },
        { value: 'greek', label: 'Greek' },
        { value: 'cyrillic', label: 'Cyrillic' },
        { value: 'hangul', label: 'Hangul' },
        { value: 'graffiti', label: 'Graffiti' },
    ];
    styles.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.value;
        opt.textContent = s.label;
        glyphStyleSelect.appendChild(opt);
    });
    glyphStyleDropdownContainer.appendChild(glyphStyleSelect);
    // Set default and event
    window.currentGlyphStyle = 'original';
    glyphStyleSelect.value = 'original';
    glyphStyleSelect.addEventListener('change', () => {
        window.currentGlyphStyle = glyphStyleSelect.value;
        // Force glyphs to regenerate
        glyphs = [];
    });
    // Attach to canvas parent (assume parent is relative/absolute)
    if (canvas && canvas.parentNode) {
        canvas.parentNode.style.position = 'relative';
        canvas.parentNode.appendChild(glyphStyleDropdownContainer);
    }
}

function removeGlyphStyleDropdown() {
    if (glyphStyleDropdownContainer && glyphStyleDropdownContainer.parentNode) {
        glyphStyleDropdownContainer.parentNode.removeChild(glyphStyleDropdownContainer);
    }
    glyphStyleDropdownContainer = null;
    glyphStyleSelect = null;
}
// Chinese-inspired glyph generator
function randomChineseGlyph(width, height, leftNeighborType = null) {
    // Chinese: dynamic brushwork, thick/thin, dots, hooks, sweeping curves, grid-based structure
    const glyph = emptyGlyph(width, height);
    const w = width, h = height;
    // 2-4 main strokes: horizontal, vertical, diagonal, hook, dot
    let nStrokes = 2 + Math.floor(Math.random()*3);
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
        let thickness = 2 + Math.floor(Math.random()*3);
        if (type < 0.25) {
            // Horizontal stroke
            let y = Math.floor(h*0.2) + Math.floor(Math.random()*(h*0.6));
            for (let x = Math.floor(w*0.1); x < w-Math.floor(w*0.1); x++) {
                for (let t = -thickness; t <= thickness; t++) {
                    let yy = y + t;
                    if (yy >= 0 && yy < h) glyph[yy][x] = 1;
                }
            }
        } else if (type < 0.5) {
            // Vertical stroke
            let x = Math.floor(w*0.2) + Math.floor(Math.random()*(w*0.6));
            for (let y = Math.floor(h*0.1); y < h-Math.floor(h*0.1); y++) {
                for (let t = -thickness; t <= thickness; t++) {
                    let xx = x + t;
                    if (xx >= 0 && xx < w) glyph[y][xx] = 1;
                }
            }
        } else if (type < 0.7) {
            // Diagonal stroke
            let dir = Math.random() < 0.5 ? 1 : -1;
            let x0 = Math.floor(w*0.2), y0 = Math.floor(h*0.2);
            let len = Math.floor(Math.min(w, h)*0.6);
            for (let i = 0; i < len; i++) {
                let x = x0 + i*dir;
                let y = y0 + i;
                for (let t = -thickness; t <= thickness; t++) {
                    let xx = x + t*dir, yy = y + t;
                    if (xx >= 0 && xx < w && yy >= 0 && yy < h) glyph[yy][xx] = 1;
                }
            }
        } else if (type < 0.85) {
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
function randomDevanagariGlyph(width, height, leftNeighborType = null) {
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
        let thickness = 2 + Math.floor(Math.random()*2);
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
            let steps = Math.max(8, Math.floor(r*2.5));
            for (let i = 0; i < steps; i++) {
                let a = startA + (endA-startA)*i/(steps-1);
                let x = Math.round(cx + r*Math.cos(a));
                let y = Math.round(cy + r*Math.sin(a));
                for (let t = -thickness; t <= thickness; t++) {
                    let xx = x + t;
                    if (xx >= 0 && xx < w && y >= 0 && y < h) glyph[y][xx] = 1;
                }
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
function randomArabicGlyph(width, height, leftNeighborType = null) {
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
// gridGlyphShader4.js
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
    // Calligraphic dot with padding check and gestural jitter
    function calligraphicDot(x, y, thickness, angleRad, jitter=0) {
        // Draw an ellipse at (x, y) with given thickness and angle
        let a = Math.max(1, Math.round(thickness));
        let b = Math.max(1, Math.round(thickness * 0.5));
        let cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
        // Add jitter to simulate hand-drawn imperfection
        let jx = 0, jy = 0;
        if (jitter > 0) {
            jx = Math.round((Math.random()-0.5)*jitter);
            jy = Math.round((Math.random()-0.5)*jitter);
        }
        for (let dx = -a; dx <= a; dx++) {
            for (let dy = -b; dy <= b; dy++) {
                // Ellipse equation
                let ex = dx * cosA - dy * sinA;
                let ey = dx * sinA + dy * cosA;
                let px = x + dx + jx, py = y + dy + jy;
                if ((ex*ex)/(a*a) + (ey*ey)/(b*b) <= 1
                    && px >= padLeft && px < w - padRight
                    && py >= padTop && py < h - padBot) {
                    glyph[py][px] = 1;
                }
            }
        }
    }

    // Helper for organic jitter for all stroke types
    function jitterPt(x, y, amount=1.2) {
        return [x + (Math.random()-0.5)*amount, y + (Math.random()-0.5)*amount];
    }

    // Helper to blend a value into the glyph with alpha (0..1)
    function blendGlyph(glyph, x, y, alpha) {
        x = Math.round(x); y = Math.round(y);
        if (x >= 0 && x < w && y >= 0 && y < h) {
            glyph[y][x] = glyph[y][x] ? Math.max(glyph[y][x], alpha) : alpha;
        }
    }
    // Sinuous and expressive, with jitter and pressure variation
    if (type === 'sCurve') {
        for (let y = padTop; y < h-padBot; y++) {
            let tNorm = (y-padTop)/Math.max(1,(h-padTop-padBot-1));
            let x = Math.floor(w/2) + Math.round(Math.sin(tNorm*Math.PI*1.5 + Math.random()*0.2) * (w/4 + Math.random()*2));
            let thickness = thick + 1 + Math.sin(tNorm*Math.PI) * 1.5 + (Math.random()-0.5)*0.7;
            let angle = Math.PI/6 + Math.sin(tNorm*Math.PI*1.5) * Math.PI/8 + (Math.random()-0.5)*0.3;
            calligraphicDot(x, y, thickness, angle, 1.5);
        }
    } else if (type === 'waveH') {
        let yBase = Math.floor((padTop + h - padBot) / 2);
        for (let x = padLeft; x < w-padRight; x++) {
            let tNorm = (x-padLeft)/Math.max(1,(w-padLeft-padRight-1));
            let y = yBase + Math.round(Math.sin(tNorm*Math.PI*2 + Math.random()*0.2) * (h/8 + Math.random()*2));
            let thickness = thick + 1 + Math.cos(tNorm*Math.PI*2) * 1.2 + (Math.random()-0.5)*0.7;
            let angle = Math.PI/4 + Math.cos(tNorm*Math.PI*2) * Math.PI/10 + (Math.random()-0.5)*0.3;
            calligraphicDot(x, y, thickness, angle, 1.5);
        }
    } else if (type === 'spiral') {
        let cx = Math.floor((padLeft + w - padRight) / 2), cy = Math.floor((padTop + h - padBot) / 2);
        let maxR = Math.min(w-padLeft-padRight, h-padTop-padBot) / 2 - 2;
        let turns = 1.5 + Math.random()*0.5;
        let points = Math.floor(maxR * 8);
        for (let i = 0; i < points; i++) {
            let tNorm = i / points;
            let theta = tNorm * Math.PI * 2 * turns + (Math.random()-0.5)*0.1;
            let r = tNorm * maxR + (Math.random()-0.5)*1.2;
            let x = Math.round(cx + r * Math.cos(theta));
            let y = Math.round(cy + r * Math.sin(theta));
            let thickness = thick + 1 + Math.sin(theta*2) * 1.2 + (Math.random()-0.5)*0.7;
            let angle = theta + Math.PI/4 + (Math.random()-0.5)*0.3;
            calligraphicDot(x, y, thickness, angle, 1.5);
        }
    }
    // Additional strokes for more variety
    // For all strokes, fade in at start and fade out at end (alpha 0.3..1..0.3)
    function strokeAlpha(idx, len) {
        let t = idx / (len-1);
        if (t < 0.15) return 0.3 + 0.7 * (t/0.15); // fade in
        if (t > 0.85) return 1 - 0.7 * ((t-0.85)/0.15); // fade out
        return 1;
    }

    if (type === 'arcTL') { // top-left arc (like a, d, q)
        for (let t = 0; t < thick; t++) {
            for (let i = 0; i < minLen; i++) {
                let [x, y] = jitterPt(2+t + Math.cos(Math.PI/2 * (i/minLen)) * (minLen-1), 2+t + i);
                let alpha = strokeAlpha(i, minLen);
                blendGlyph(glyph, x, y, alpha);
            }
        }
    } else if (type === 'arcTR') { // top-right arc
        for (let t = 0; t < thick; t++) {
            for (let i = 0; i < minLen; i++) {
                let [x, y] = jitterPt(w-3-t - Math.cos(Math.PI/2 * (i/minLen)) * (minLen-1), 2+t + i);
                let alpha = strokeAlpha(i, minLen);
                blendGlyph(glyph, x, y, alpha);
            }
        }
    } else if (type === 'arcBL') { // bottom-left arc
        for (let t = 0; t < thick; t++) {
            for (let i = 0; i < minLen; i++) {
                let [x, y] = jitterPt(2+t + Math.cos(Math.PI/2 * (i/minLen)) * (minLen-1), h-3-t - i);
                let alpha = strokeAlpha(i, minLen);
                blendGlyph(glyph, x, y, alpha);
            }
        }
    } else if (type === 'arcBR') { // bottom-right arc
        for (let t = 0; t < thick; t++) {
            for (let i = 0; i < minLen; i++) {
                let [x, y] = jitterPt(w-3-t - Math.cos(Math.PI/2 * (i/minLen)) * (minLen-1), h-3-t - i);
                let alpha = strokeAlpha(i, minLen);
                blendGlyph(glyph, x, y, alpha);
            }
        }
    } else if (type === 'zigzagH') { // horizontal zigzag
        for (let t = 0; t < thick; t++) {
            let y = Math.floor(h/2)+t-1;
            let len = w-2-t - (2+t);
            for (let x = 2+t, idx=0; x < w-2-t; x++, idx++) {
                let [jx, jy] = jitterPt(x, y);
                let alpha = strokeAlpha(idx, len);
                if (((x-2-t) % 4) < 2) blendGlyph(glyph, jx, jy, alpha);
            }
        }
    } else if (type === 'zigzagV') { // vertical zigzag
        for (let t = 0; t < thick; t++) {
            let x = Math.floor(w/2)+t-1;
            let len = h-2-t - (2+t);
            for (let y = 2+t, idx=0; y < h-2-t; y++, idx++) {
                let [jx, jy] = jitterPt(x, y);
                let alpha = strokeAlpha(idx, len);
                if (((y-2-t) % 4) < 2) blendGlyph(glyph, jx, jy, alpha);
            }
        }
    } else if (type === 'crossbar') { // crossbar (like A, H)
        let y = Math.floor(h*0.7);
        for (let t = 0; t < thick; t++) {
            let len = w-2-t - (2+t);
            for (let x = 2+t, idx=0; x < w-2-t; x++, idx++) {
                let [jx, jy] = jitterPt(x, y+t);
                let alpha = strokeAlpha(idx, len);
                blendGlyph(glyph, jx, jy, alpha);
            }
        }
    } else if (type === 'Ttop') { // T shape top
        let y = 2;
        for (let t = 0; t < thick; t++) {
            let len = w-2-t - (2+t);
            for (let x = 2+t, idx=0; x < w-2-t; x++, idx++) {
                let [jx, jy] = jitterPt(x, y+t);
                let alpha = strokeAlpha(idx, len);
                blendGlyph(glyph, jx, jy, alpha);
            }
            let cx = Math.floor(w/2)+t-1;
            let vlen = h-2 - y;
            for (let yy = y, idx=0; yy < h-2; yy++, idx++) {
                let [jx, jy] = jitterPt(cx, yy);
                let alpha = strokeAlpha(idx, vlen);
                blendGlyph(glyph, jx, jy, alpha);
            }
        }
    } else if (type === 'Cleft') { // C shape left
        for (let t = 0; t < thick; t++) {
            let vlen = h-2-t - (2+t);
            for (let y = 2+t, idx=0; y < h-2-t; y++, idx++) {
                let [jx, jy] = jitterPt(2+t, y);
                let alpha = strokeAlpha(idx, vlen);
                blendGlyph(glyph, jx, jy, alpha);
            }
            let hlen = w-2-t - (2+t);
            for (let x = 2+t, idx=0; x < w-2-t; x++, idx++) {
                let [jx, jy] = jitterPt(x, 2+t);
                let alpha = strokeAlpha(idx, hlen);
                blendGlyph(glyph, jx, jy, alpha);
                [jx, jy] = jitterPt(x, h-3-t);
                blendGlyph(glyph, jx, jy, alpha);
            }
        }
    } else if (type === 'Eleft') { // E shape left
        for (let t = 0; t < thick; t++) {
            let vlen = h-2-t - (2+t);
            for (let y = 2+t, idx=0; y < h-2-t; y++, idx++) {
                let [jx, jy] = jitterPt(2+t, y);
                let alpha = strokeAlpha(idx, vlen);
                blendGlyph(glyph, jx, jy, alpha);
            }
            let hlen = w-2-t - (2+t);
            for (let x = 2+t, idx=0; x < w-2-t; x++, idx++) {
                let [jx, jy] = jitterPt(x, 2+t);
                let alpha = strokeAlpha(idx, hlen);
                blendGlyph(glyph, jx, jy, alpha);
                [jx, jy] = jitterPt(x, Math.floor(h/2)+t-1);
                blendGlyph(glyph, jx, jy, alpha);
                [jx, jy] = jitterPt(x, h-3-t);
                blendGlyph(glyph, jx, jy, alpha);
            }
        }
    } else if (type === 'Fleft') { // F shape left
        for (let t = 0; t < thick; t++) {
            let vlen = h-2-t - (2+t);
            for (let y = 2+t, idx=0; y < h-2-t; y++, idx++) {
                let [jx, jy] = jitterPt(2+t, y);
                let alpha = strokeAlpha(idx, vlen);
                blendGlyph(glyph, jx, jy, alpha);
            }
            let hlen = w-2-t - (2+t);
            for (let x = 2+t, idx=0; x < w-2-t; x++, idx++) {
                let [jx, jy] = jitterPt(x, 2+t);
                let alpha = strokeAlpha(idx, hlen);
                blendGlyph(glyph, jx, jy, alpha);
                [jx, jy] = jitterPt(x, Math.floor(h/2)+t-1);
                blendGlyph(glyph, jx, jy, alpha);
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

// Contextual influence: leftNeighborType biases first stroke
function randomBaseGlyph(width, height, leftNeighborType = null) {
    if (typeof window !== 'undefined' && window.currentGlyphStyle === 'chinese') {
        return { glyph: randomChineseGlyph(width, height, leftNeighborType), lastStrokeType: 'chinese' };
    }
    // Style switch: Arabic
    if (typeof window !== 'undefined' && window.currentGlyphStyle === 'arabic') {
        // Always return {glyph, lastStrokeType} for compatibility
        return { glyph: randomArabicGlyph(width, height, leftNeighborType), lastStrokeType: 'arabic' };
    }
    if (typeof window !== 'undefined' && window.currentGlyphStyle === 'devanagari') {
        return { glyph: randomDevanagariGlyph(width, height, leftNeighborType), lastStrokeType: 'devanagari' };
    }
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
    // Rhythm/density: sometimes cluster, sometimes sparse
    let n;
    let densityRoll = Math.random();
    if (densityRoll < 0.18) {
        // Sparse: 1-2 strokes
        n = 1 + Math.floor(Math.random()*2);
    } else if (densityRoll > 0.82) {
        // Dense: 4-6 strokes
        n = 4 + Math.floor(Math.random()*3);
    } else {
        // Normal: 2-4 strokes
        n = 2 + Math.floor(Math.random()*3);
    }
    let chosen = [];
    let used = new Set();
    // If left neighbor exists, bias first stroke to echo its last stroke
    if (leftNeighborType && strokes.includes(leftNeighborType)) {
        chosen.push(leftNeighborType);
        used.add(leftNeighborType);
    }
    while (chosen.length < n && used.size < strokes.length) {
        let t = strokes[Math.floor(Math.random()*strokes.length)];
        if (!used.has(t)) {
            used.add(t);
            chosen.push(t);
        }
    }
    // Shuffle order for more layering variety, but keep first stroke if neighbor-influenced
    if (chosen.length > 1 && leftNeighborType && chosen[0] === leftNeighborType) {
        let rest = chosen.slice(1);
        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        chosen = [chosen[0], ...rest];
    } else {
        for (let i = chosen.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
        }
    }
    // Optionally cluster strokes (shift center for some)
    let cluster = Math.random() < 0.4;
    let clusterDx = 0, clusterDy = 0;
    if (cluster) {
        clusterDx = Math.floor((Math.random()-0.5)*width*0.3);
        clusterDy = Math.floor((Math.random()-0.5)*height*0.3);
    }
    for (let i=0; i<chosen.length; i++) {
        let temp = emptyGlyph(width, height);
        // If clustering, offset some strokes
        if (cluster && i > 0) {
            let origDrawStroke = drawStroke;
            drawStroke = function(g, t) {
                origDrawStroke(g, t, clusterDx, clusterDy);
            };
            drawStroke(temp, chosen[i]);
            drawStroke = origDrawStroke;
        } else {
            drawStroke(temp, chosen[i]);
        }
        for (let y=0; y<height; y++) for (let x=0; x<width; x++) {
            if (temp[y][x]) {
                if (glyph[y][x]) glyph[y][x] = 1;
                else glyph[y][x] = Math.random() < 0.8 ? 1 : 0;
            }
        }
    }
    // Return both the glyph and the last stroke type for neighbor influence
    return {glyph, lastStrokeType: chosen[chosen.length-1]};
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
let glyphWs = [], glyphH = 60;
let glyphCount = 0;
let gridStartOffset = 0;

function resetGlyphs(width, height) {
    // Randomize glyph height
    glyphH = 40 + Math.floor(Math.random() * 41); // 40-80

    // Estimate max glyph width for grid calculation
    let maxGlyphW = glyphH;
    let minGlyphW = 10;
    let space = 6;
    let scale = 2; // use max scale for estimate
    let cols = Math.ceil(width / ((maxGlyphW + space) * scale));
    let rows = Math.ceil(height / ((glyphH + space) * scale));
    glyphCount = cols * rows;
    glyphs = [];
    glyphWs = [];
    // Contextual influence: build grid row by row, passing last stroke type to next glyph
    let lastStrokeGrid = [];
    for (let row = 0; row < rows; row++) {
        lastStrokeGrid[row] = [];
        for (let col = 0; col < cols; col++) {
            // Randomize width for each glyph
            let glyphW = minGlyphW + Math.floor(Math.random() * (glyphH - minGlyphW + 1));
            let leftType = col > 0 ? lastStrokeGrid[row][col-1] : null;
            let {glyph, lastStrokeType} = randomBaseGlyph(glyphW, glyphH, leftType);
            glyphs.push(glyph);
            glyphWs.push(glyphW);
            lastStrokeGrid[row][col] = lastStrokeType;
        }
    }
    // Shuffle glyphs and widths together to reduce repetition
    for (let i = glyphs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [glyphs[i], glyphs[j]] = [glyphs[j], glyphs[i]];
        [glyphWs[i], glyphWs[j]] = [glyphWs[j], glyphWs[i]];
    }
    // Randomize grid start offset for extra randomness
    gridStartOffset = Math.floor(Math.random() * glyphs.length);
    // Store cols/rows for use in animate
    resetGlyphs._cols = cols;
    resetGlyphs._rows = rows;
}

// Ink/brush simulation: ink bleed and dry-brush effects
// Precompute dry-brush/bleed mask for each glyph instance at display time
const glyphInstanceMaskCache = new WeakMap();
function getGlyphInstanceKey(glyph, x, y, scale) {
    // Use a unique object per instance (not just glyph array)
    // We use a WeakMap keyed by a wrapper object for each instance
    // But since we can't guarantee unique objects for each instance, use a Map-of-Maps fallback
    // For now, just use a global Map keyed by a stringified key
    return `${glyph}_${x}_${y}_${scale}`;
}
const glyphInstanceMaskMap = new Map();
function drawGlyph(ctx, glyph, x, y, scale = 1) {
    if (!glyph) return;
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
    ensureGlyphStyleDropdown(ctx.canvas);

    if (!glyphs.length || ctx._glyphW !== width || ctx._glyphH !== height) {
        resetGlyphs(width, height);
        ctx._glyphW = width;
        ctx._glyphH = height;
    }
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    let space = 6; // space between glyphs in pixels
    let scale = Math.floor(Math.min(width / ((glyphH + space) * 8), height / ((glyphH + space) * 8), 2));
    if (scale < 1) scale = 1;
    let cols = resetGlyphs._cols;
    let rows = resetGlyphs._rows;
    // Compute per-row X offsets for variable width
    let xOffsets = [];
    for (let row = 0; row < rows; row++) {
        xOffsets[row] = [];
        let x = 0;
        for (let col = 0; col < cols; col++) {
            let idx = (row * cols + col + gridStartOffset) % glyphs.length;
            let w = glyphWs[idx] || 20;
            xOffsets[row][col] = x;
            x += w * scale + space;
        }
    }
    // Compute grid size
    let gridW = 0;
    for (let col = 0; col < cols; col++) {
        let idx = (0 * cols + col + gridStartOffset) % glyphs.length;
        gridW += (glyphWs[idx] || 20) * scale + space;
    }
    gridW -= space;
    const gridH = rows * (glyphH * scale + space) - space;
    // Compute zoom factor to fill canvas
    let zoom = Math.min(width / gridW, height / gridH);
    // Center the grid after zoom
    const offsetX = Math.floor((width - gridW * zoom) / 2);
    const offsetY = Math.floor((height - gridH * zoom) / 2);
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);
    // Draw the shuffled glyphs as a static grid with variable width and sometimes nonlinear baselines
    // Decide which rows get a wavy baseline
    let baselineAmp = Math.floor(glyphH * 0.18 * scale); // amplitude of baseline wave
    let baselineFreq = 2 * Math.PI / Math.max(3, cols); // frequency of baseline wave
    // Randomly decide for each row if it gets a wavy baseline (fixed for this render)
    if (!animate._rowWaves || animate._rowWaves.length !== rows) {
        animate._rowWaves = Array.from({length: rows}, () => Math.random() < 0.2);
    }
    for (let row = 0; row < rows; row++) {
        let useWave = animate._rowWaves[row];
        for (let col = 0; col < cols; col++) {
            let idx = (row * cols + col + gridStartOffset) % glyphs.length;
            let baselineY = 0;
            if (useWave) {
                baselineY = Math.round(
                    baselineAmp * Math.sin(baselineFreq * col + row * 0.7)
                );
            }
            drawGlyph(
                ctx,
                glyphs[idx],
                xOffsets[row][col],
                row * (glyphH * scale + space) + baselineY,
                scale
            );
        }
    }
    ctx.restore();
}

// Called by main app when switching away from this shader
function onDeactivate() {
    removeGlyphStyleDropdown();
}

export default {
    name: 'Grid Glyphs 4',
    animate,
    resetState: resetGlyphs,
    onResize: resetGlyphs,
    onClick: function(e, { canvas, ctx, width, height }) {
        resetGlyphs(width, height);
        // Force redraw by clearing glyphs so animate will regenerate
        glyphs = [];
    },
    onDeactivate
};
