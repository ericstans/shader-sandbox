// Egg logic for the fish tank simulation
// Handles egg creation, animation, drawing, and hatching

/**
 * Add eggs for a fish at a given position.
 * @param {Array} eggs - The eggs array to add to
 * @param {Object} fish - The parent fish object
 * @param {number} numEggs - Number of eggs to lay
 */
export function layEggs(eggs, fish, numEggs) {
    for (let i = 0; i < numEggs; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = 10 + Math.random() * 18;
        let spreadV = 0.12 + Math.random() * 0.18;
        eggs.push({
            x: fish.x + Math.cos(angle) * dist,
            y: fish.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * (0.7 + spreadV * dist / 18) + (Math.random() - 0.5) * 0.5,
            vy: Math.sin(angle) * (0.7 + spreadV * dist / 18) + (Math.random() - 0.5) * 0.5,
            r: 4 + Math.random() * 2,
            hatchTimer: 1000 + Math.random() * 6000,
            species: fish.species
        });
    }
}

/**
 * Animate and draw eggs, and handle hatching.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} eggs
 * @param {number} t - time
 * @param {number} width
 * @param {number} height
 * @param {number} WALL_WIDTH
 * @param {Array} fish - fish array to add hatched fish to
 */
export function updateAndDrawEggs(ctx, eggs, t, width, height, WALL_WIDTH, fish) {
    for (let i = eggs.length - 1; i >= 0; i--) {
        let egg = eggs[i];
        // Draw egg
        ctx.save();
        ctx.beginPath();
        ctx.arc(egg.x, egg.y, egg.r, 0, Math.PI * 2);
        ctx.fillStyle = egg.species ? egg.species.color() : '#fff';
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 0.2 + egg.x * 0.01);
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
        // Animate egg
        egg.x += egg.vx;
        egg.y += egg.vy;
        egg.vx *= 0.96;
        egg.vy *= 0.96;
        // Gravity (sink to bottom)
        const bottom = height - WALL_WIDTH - egg.r;
        if (egg.y > bottom) { egg.y = bottom; egg.vy *= -0.3; }
        // Hatch timer
        egg.hatchTimer--;
        if (egg.hatchTimer <= 0) {
            // Hatch: add new fish of same species
            fish.push({
                x: egg.x,
                y: egg.y,
                vx: (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? -1 : 1),
                vy: (Math.random() - 0.5) * 0.2,
                size: 18 + Math.random() * 18,
                color: egg.species.color(),
                flip: Math.random() < 0.5,
                behavior: 'float',
                behaviorTimer: 60 + Math.random() * 120,
                target: null,
                species: egg.species
            });
            eggs.splice(i, 1);
        }
    }
}
