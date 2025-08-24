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
    // Graffiti: bold, angular, overlapping strokes, arrows, drips, highlights
    const pad = cellSize * 0.12 + Math.random() * cellSize * 0.06;
    const lw = opts.lineWidth || (cellSize * (0.13 + Math.random() * 0.07));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = opts.color || '#fff';
    ctx.lineWidth = lw;

    // Main strokes: 2-4 bold, angular lines
    let nStrokes = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < nStrokes; i++) {
        let angle = Math.random() * Math.PI * 2;
        let len = cellSize * (0.5 + Math.random() * 0.35);
        let cx = x + pad + Math.random() * (cellSize - 2 * pad);
        let cy = y + pad + Math.random() * (cellSize - 2 * pad);
        let ex = cx + Math.cos(angle) * len * (0.5 + Math.random()*0.5);
        let ey = cy + Math.sin(angle) * len * (0.5 + Math.random()*0.5);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Occasionally add an arrowhead
        if (Math.random() < 0.4) {
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

        // Occasionally add a drip
        if (Math.random() < 0.25) {
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
    }

    // Add highlights (thin, bright lines)
    if (Math.random() < 0.7) {
        ctx.save();
        ctx.strokeStyle = opts.highlightColor || '#fffb';
        ctx.lineWidth = lw * 0.32;
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