// Food pellet creation, update, and drawing for fish tank simulation

export function addFoodPellet(foodPellets, x, y) {
    foodPellets.push({
        x,
        y,
        r: 5 + Math.random() * 3,
        vy: -0.35 + Math.random() * 0.18,
        eaten: false
    });
}

export function drawFoodPellets(ctx, foodPellets, t, SURFACE_HEIGHT) {
    for (let pellet of foodPellets) {
        if (pellet.eaten) continue;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, pellet.r, 0, Math.PI * 2);
        ctx.fillStyle = '#c49a6c';
        ctx.shadowColor = '#7a5a2b';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
        // Pellet floats up
        pellet.y += pellet.vy;
        // Stop at surface below top of tank
        const stopY = SURFACE_HEIGHT + 10 + pellet.r;
        if (pellet.y < stopY) {
            pellet.y = stopY;
            pellet.vy = 0;
        }
    }
}
