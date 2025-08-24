// Cascading Shimmer Shader: Animated blue/green pixel layers
// Exports: { displayName, animate, onResize }

const displayName = 'Cascading Shimmer';


let startTime = null;
let disruptions = [];

function animate(ctx, t, width, height) {
    if (!startTime) startTime = performance.now();
    let elapsed = (performance.now() - startTime) / 1000;
    ctx.clearRect(0, 0, width, height);

    // Remove old disruptions (older than 2.5s)
    disruptions = disruptions.filter(d => elapsed - d.time < 2.5);

    // Parameters
    const numLayers = 6;
    const pxSize = Math.max(2, Math.floor(Math.min(width, height) / 60));
    const layerH = Math.floor(height / numLayers);
    const shimmerSpeed = 1.2;

    for (let layer = 0; layer < numLayers; layer++) {
        let y0 = layer * layerH;
        let y1 = (layer + 1) * layerH;
        let baseHue = 170 + 30 * Math.sin(layer * 0.7 + elapsed * 0.3);
        let baseSat = 60 + 20 * Math.cos(layer * 0.5 + elapsed * 0.2);
        let baseLum = 38 + 10 * Math.sin(layer * 0.9 + elapsed * 0.4);
        let shimmerPhase = elapsed * shimmerSpeed + layer * 0.7;
        for (let y = y0; y < y1; y += pxSize) {
            for (let x = 0; x < width; x += pxSize) {
                // Shimmering offset and color
                let offset = Math.sin(shimmerPhase + x * 0.04 + y * 0.07) * 0.5 + 0.5;
                // Disruption effect from clicks
                let disruption = 0;
                for (let d of disruptions) {
                    let dx = x + pxSize/2 - d.x;
                    let dy = y + pxSize/2 - d.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    let dt = elapsed - d.time;
                    // Outward propagating wave
                    let wavefront = dt * 180; // pixels from center after dt seconds
                    let thickness = 32 + dt * 18; // thickness of the wave
                    let edge = Math.abs(dist - wavefront);
                    let amp = Math.max(0, 1 - edge / thickness);
                    let osc = Math.sin(dist/14 - dt*7);
                    let wave = amp * osc * Math.exp(-dt*0.7);
                    disruption += wave * 1.1;
                }
                let hue = baseHue + 20 * (offset + disruption);
                let sat = baseSat + 20 * (offset + disruption);
                let lum = baseLum + 22 * (offset + disruption);
                ctx.fillStyle = `hsl(${hue},${sat}%,${lum}%)`;
                // Cascading vertical movement
                let yShift = Math.sin(elapsed * 0.7 + x * 0.03 + layer * 0.8) * 8 * (offset + disruption) + layer * 2;
                ctx.globalAlpha = 0.7 + 0.3 * (offset + disruption);
                ctx.fillRect(x, y + yShift, pxSize, pxSize);
            }
        }
    }
    ctx.globalAlpha = 1;
}

function onResize({ canvas, ctx, width, height }) {
    startTime = null;
}



function onClick(ev, { width, height, canvas }) {
    // Get mouse position relative to canvas
    let rect = canvas.getBoundingClientRect();
    let x = (ev.clientX - rect.left) * (width / rect.width);
    let y = (ev.clientY - rect.top) * (height / rect.height);
    let elapsed = (performance.now() - (startTime || 0)) / 1000;
    disruptions.push({ x, y, time: elapsed });

    // Play droplet sound, pitch varies by Y
    try {
        const ctx = window._audioCtx || (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // Map y to pitch: top = high, bottom = low
        const minFreq = 320, maxFreq = 1200;
        const freq = maxFreq - (maxFreq - minFreq) * (y / height);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.18;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        // Short, droplet envelope
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(freq * 0.7, ctx.currentTime + 0.18);
        osc.stop(ctx.currentTime + 0.22);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (e) {}
}

export default {
    displayName,
    animate,
    onResize,
    onClick
};
