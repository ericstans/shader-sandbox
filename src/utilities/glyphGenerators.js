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
        let thick = 1 + Math.floor(Math.random()*2); // 1 or 2
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
    const MIN_THICKNESS = 0;
    const MAX_THICKNESS = 1;
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
        let thickness = 2 + Math.floor(Math.random()*2);
        thickness = Math.max(MIN_THICKNESS, Math.min(MAX_THICKNESS, thickness));
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
    const MIN_THICKNESS = 1;
    const MAX_THICKNESS = 2;
    for (let s = 0; s < nStrokes; s++) {
        let type = Math.random();
        let thickness = 2 + Math.floor(Math.random()*3);
        thickness = Math.max(MIN_THICKNESS, Math.min(MAX_THICKNESS, thickness));
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
export function emptyGlyph(width, height) {
    return Array.from({length: height}, () => Array(width).fill(0));
}