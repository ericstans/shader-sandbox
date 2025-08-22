// Second pop sound for chain reaction
export function playPop2() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (!buffer2) buffer2 = createPopBuffer2(ctx);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    source.buffer = buffer2;
    // Add a lowpass filter for a softer, lower sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
}

let buffer2;
function createPopBuffer2(ctx) {
    const duration = 0.13;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        // Envelope: slightly slower attack/decay
        const env = Math.pow(Math.sin((i / length) * Math.PI), 1.7) * Math.exp(-5 * i / length);
        // Sine pop, lower freq, less randomization
        const freq = 320 + Math.random() * 40;
        data[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * env;
    }
    return buffer;
}
// popSound.js
// Simple pop sound using Web Audio API

let ctx;
let buffer;

export function playPop() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (!buffer) buffer = createPopBuffer(ctx);
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = 0.18; // Lower volume
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
}

function createPopBuffer(ctx) {
    const duration = 0.08;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        // Envelope: slower attack, slower decay for softer pop
        const env = Math.pow(Math.sin((i / length) * Math.PI), 1.5) * Math.exp(-7 * i / length);
        // Sine pop, slightly randomized freq
        const freq = 400 + Math.random() * 80;
        data[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * env;
    }
    return buffer;
}
