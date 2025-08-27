import { MAX_LILY_PADS, LILY_PAD_SPAWN_CHANCE } from "./constants.js";
// Lily pad spawning, animation, and drawing for fish tank simulation

export function spawnLilyPads(lilyPads, width, WALL_WIDTH) {
    //if (!lilyPads) lilyPads = [];
    if (lilyPads.length < MAX_LILY_PADS && Math.random() < LILY_PAD_SPAWN_CHANCE) {
        // Spawn a lily pad at a random X, floating at the top, with drop-in animation
        let padW = 38 + Math.random() * 22;
        let padH = padW * (0.7 + Math.random() * 0.2);
        let padX = WALL_WIDTH + padW / 2 + Math.random() * (width - 2 * WALL_WIDTH - padW);
        let padY = WALL_WIDTH + padH / 2 + Math.random() * 8;
        let rot = Math.random() * Math.PI * 0.2 - 0.4;
        let color = 'hsl(' + (90 + Math.random() * 30) + ', 60%, 38%)';
        let skew = Math.random() * 0.2 - 0.1;
        let veinBaseAngle = Math.random() * Math.PI * 2;
        // 20% chance for a bug, 10% for a flower, mutually exclusive
        let hasBug = Math.random() < 0.2;
        let hasFlower = !hasBug && Math.random() < 0.1;
        let bugType = hasBug ? (Math.random() < 0.5 ? 'ladybug' : 'bee') : null;
        // Drop-in animation: start above, animate to padY
        let appearTime = performance.now();
        let startY = padY - 60 - Math.random() * 40;
        lilyPads.push({ x: padX, y: padY, w: padW, h: padH, rot, color, skew, veinBaseAngle, hasBug, hasFlower, bugType, appearTime, startY, animating: true });
    }
    return lilyPads;
}