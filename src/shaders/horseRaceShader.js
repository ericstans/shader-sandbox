// Shader: Horse Race
// Animated emoji horses run from left to right, new horses spawn as old ones leave.
function horseRaceShader(ctx, t, width = 1000, height = 1000) {
    // --- Persistent state ---
    if (!horseRaceShader.horses) {
        horseRaceShader.horses = [];
        horseRaceShader.lastSpawn = 0;
    }
    const horses = horseRaceShader.horses;
    const now = t;
    // Parameters
    const emoji = '🐎'; // Use left-facing horse emoji if available, else fallback
    const nTracks = 6;
    const trackHeight = Math.floor(width / (nTracks + 1));
    const minSpeed = width / 5; // px/sec
    const maxSpeed = width / 2.5;
    const fontSize = Math.floor(trackHeight * 0.7);
    // Clear background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    // Spawn new horses if needed
    if (horses.length < nTracks || (now - horseRaceShader.lastSpawn > 0.7 && horses.length < nTracks * 2)) {
        // Find open tracks
        const usedTracks = new Set(horses.map(h => h.track));
        for (let i = 0; i < nTracks; ++i) {
            if (!usedTracks.has(i)) {
                // Each time a horse is spawned, assign a new random speed
                horses.push({
                    x: width + fontSize,
                    track: i,
                    speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
                    born: now + Math.random() * 0.2
                });
                horseRaceShader.lastSpawn = now;
                break;
            }
        }
    }
    // --- Draw large justified text behind the horses ---
    const lines = [
        "HORSES DON'T",
        'STOP THEY',
        "KEEP GOIN'"
    ];
    const fontPx = Math.floor(width/8);
    const impactFont = `bold ${fontPx}px Impact, Arial Black, sans-serif`;
    ctx.font = impactFont;
    // Use actual font bounding box for line height
    let metrics = ctx.measureText('M');
    let fontHeight = (metrics.actualBoundingBoxAscent || fontPx) + (metrics.actualBoundingBoxDescent || 0);
    const lineHeight = fontHeight * 1.25; // 25% extra padding
    const blockHeight = lineHeight * lines.length;
    const textYStart = (height - blockHeight) / 2;
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(4, width/100);
    for (let li = 0; li < lines.length; ++li) {
        const text = lines[li];
        ctx.font = impactFont;
        // Justify: measure each letter, spread across width
        const chars = text.split('');
        const totalWidth = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
        const extra = width - totalWidth;
        const spacing = chars.length > 1 ? extra / (chars.length - 1) : 0;
        let x = 0;
        const y = textYStart + li * lineHeight;
        for (let ci = 0; ci < chars.length; ++ci) {
            const ch = chars[ci];
            // Stroke for outline
            ctx.strokeText(ch, x, y);
            ctx.fillText(ch, x, y);
            x += ctx.measureText(ch).width + spacing;
        }
    }
    ctx.restore();

    // Animate and draw horses (in front of the text)
    ctx.font = `${fontSize}px serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (const horse of horses) {
        // Animate
        if (now > horse.born) {
            horse.x -= horse.speed * 0.016; // move left
        }
        const y = trackHeight * (horse.track + 1);
        ctx.fillText(emoji, horse.x, y);
    }
    // Remove horses that have left the screen
    for (let i = horses.length - 1; i >= 0; --i) {
        if (horses[i].x < -fontSize) {
            horses.splice(i, 1);
        }
    }
}
export default horseRaceShader;
