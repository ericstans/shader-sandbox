import { WALL_WIDTH, EGG_LAYING_PROBABILITY } from './constants.js';
import { layEggs, updateAndDrawEggs } from './eggs.js';
import { drawFish } from './drawFish.js';

// Fish behavior and state update logic for the fish tank simulation
// Exports: updateFishBehavior(fish, foodPellets, eggs, width, height, WALL_WIDTH, EGG_LAYING_PROBABILITY, layEggs)

/**
 * Update all fish behaviors, movement, and handle predation and egg laying.
 * @param {Array} fish - fish array
 * @param {Array} foodPellets - food pellets array
 * @param {Array} eggs - eggs array
 * @param {number} width - tank width
 * @param {number} height - tank height
 * @returns {Set} fishToRemove - indices of fish to remove (eaten)
 */
export function updateFishBehavior(fish, fishToRemove, eggs, foodPellets, width, height, ctx, t) {
    for (let i = 0; i < fish.length; i++) {
        let f = fish[i];
        // If in lookForFood mode and has a pellet target, update target position to follow pellet
        if (f.behavior === 'lookForFood' && f.target && f.target.pellet && !f.target.pellet.eaten) {
            f.target.x = f.target.pellet.x;
            f.target.y = f.target.pellet.y;
        }

        // Sturgeon predation: eat other fish they encounter
        if (f.species && f.species.name === 'Sturgeon' && f.behavior === 'lookForFood') {
            let ateFish = false;
            for (let j = 0; j < fish.length; j++) {
                if (i === j) continue;
                let prey = fish[j];
                // Don't eat other sturgeons or already eaten fish
                if (prey.species && prey.species.name === 'Sturgeon') continue;
                if (fishToRemove.has(j)) continue;
                // Only eat if close enough and sturgeon is bigger
                let dx = f.x - prey.x;
                let dy = f.y - prey.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let eatRadius = Math.max(f.size * 0.7, 32);
                if (dist < eatRadius && f.size > prey.size * 0.7) {
                    fishToRemove.add(j);
                    ateFish = true;
                }
            }
            if (ateFish) {
                f.behavior = 'float';
                f.behaviorTimer = 60 + Math.random() * 120;
                f.target = null;
            }
        }
        // Behavior timer
        f.behaviorTimer--;
        if (f.behaviorTimer <= 0) {
            // Rare chance: lay eggs (unless 1000 or more fish)
            if (fish.length < 1000 && Math.random() < EGG_LAYING_PROBABILITY) {
                let isEyeball = f.species && f.species.name === 'Eyeball Fish';
                let isSturgeon = f.species && f.species.name === 'Sturgeon';
                let numEggs;
                if (isEyeball) {
                    numEggs = 18 + Math.floor(Math.random() * 10);
                } else if (isSturgeon) {
                    numEggs = 1 + Math.floor(Math.random() * 2);
                } else {
                    numEggs = 2 + Math.floor(Math.random() * 4);
                }
                layEggs(eggs, f, numEggs);
            }
            // Pick a new behavior
            let behaviors = ['float', 'swim', 'explore', 'lookForFood'];
            let next = behaviors[Math.floor(Math.random() * behaviors.length)];
            f.behaviorTimer--;
            // If in lookForFood, stay in that behavior as long as there are uneaten pellets
            if (f.behavior === 'lookForFood') {
                if (!foodPellets.some(p => !p.eaten)) {
                    // No more food, switch to another behavior
                    let behaviors = ['float', 'swim', 'explore'];
                    let next = behaviors[Math.floor(Math.random() * behaviors.length)];
                    f.behavior = next;
                    f.behaviorTimer = 60 + Math.random() * 1200;
                } else {
                    // Stay in lookForFood until a pellet is eaten
                    f.behaviorTimer = 30; // keep resetting timer to prevent random change
                }
            } else if (f.behaviorTimer <= 0) {
                // Pick a new behavior
                let canEatPellets = foodPellets.some(p => !p.eaten);
                let isSturgeon = f.species && f.species.name === 'Sturgeon';
                let canEatFish = isSturgeon && fish.some(other => other !== f && other.species && other.species.name !== 'Sturgeon');
                let behaviors = ['float', 'swim', 'explore'];
                if ((canEatPellets) || canEatFish) {
                    behaviors.push('lookForFood');
                }
                let next = behaviors[Math.floor(Math.random() * behaviors.length)];
                f.behavior = next;
                if (next === 'lookForFood') {
                    if (canEatPellets) {
                        // Target nearest pellet
                        let nearest = null, minDist = 1e9;
                        for (let pellet of foodPellets) {
                            if (pellet.eaten) continue;
                            let dx = pellet.x - f.x, dy = pellet.y - f.y;
                            let dist = dx * dx + dy * dy;
                            if (dist < minDist) { minDist = dist; nearest = pellet; }
                        }
                        if (nearest) f.target = { pellet: nearest };
                    } else if (canEatFish) {
                        // Sturgeon: target nearest non-sturgeon fish
                        let nearest = null, minDist = 1e9;
                        for (let other of fish) {
                            if (other === f) continue;
                            if (!other.species || other.species.name === 'Sturgeon') continue;
                            let dx = other.x - f.x, dy = other.y - f.y;
                            let dist = dx * dx + dy * dy;
                            if (dist < minDist) { minDist = dist; nearest = other; }
                        }
                        if (nearest) f.target = { fish: nearest };
                    }
                }
                if (next === 'float') {
                    f.behaviorTimer = 30 + Math.random() * 1200;
                } else {
                    f.behaviorTimer = 60 + Math.random() * 1200;
                }
                // fallback to random target if not lookForFood
                if (next === 'explore') {
                    // Pick a random target in tank
                    // use imported WALL_WIDTH
                    f.target = {
                        x: WALL_WIDTH + f.size * 0.7 + Math.random() * (width - 2 * WALL_WIDTH - f.size * 1.4),
                        y: WALL_WIDTH + f.size * 0.5 + Math.random() * (height - 2 * WALL_WIDTH - f.size)
                    };
                } else if (next !== 'lookForFood') {
                    f.target = null;
                }
            }
        }
        // Draw and update eggs
        updateAndDrawEggs(ctx, eggs, t, width, height, WALL_WIDTH, fish);
        // Behavior logic
        let vx = f.vx, vy = f.vy;
        if (f.behavior === 'sleep') {
            vx = 0;
            vy = 0;
        } else if (f.behavior === 'float') {
            vx = 0.05 * (Math.random() - 0.5);
            vy = 0.05 * (Math.random() - 0.5);
        } else if (f.behavior === 'swim') {
            // Swim back and forth
            vx = (Math.abs(f.vx) + 0.1) * (f.flip ? -1 : 1);
            vy = 0.1 * Math.sin(t * 0.1 + f.x * 0.01);
        } else if (f.behavior === 'explore' && f.target) {
            // Move toward target with deadzone
            let dx = f.target.x - f.x;
            let dy = f.target.y - f.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let deadzone = 6; // pixels
            if (dist > deadzone) {
                vx = 0.7 * dx / dist;
                vy = 0.4 * dy / dist;
                f.flip = vx < 0;
            } else {
                vx = 0; vy = 0;
            }
        } else if (f.behavior === 'lookForFood' && f.target) {
            // Move toward target pellet, slower, with more jitter, and deadzone
            let dx = f.target.x - f.x;
            let dy = f.target.y - f.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let eatRadius = (f.size * 0.7) + (f.target.pellet ? f.target.pellet.r : 6) + 8; // larger eat radius
            let deadzone = 6; // pixels
            if (dist > Math.max(eatRadius, deadzone)) {
                vx = 0.3 * dx / dist + 0.08 * (Math.random() - 0.5);
                vy = 0.2 * dy / dist + 0.08 * (Math.random() - 0.5);
                f.flip = vx < 0;
            } else {
                vx = 0; vy = 0;
                // If close to pellet, mark as eaten
                if (f.target.pellet && !f.target.pellet.eaten) {
                    f.target.pellet.eaten = true;
                }
            }
        }
        // Swim backwards = moving in direction of tail
        let swimmingBackwards = (vx > 0 && f.flip) || (vx < 0 && !f.flip);
        if (swimmingBackwards) vx *= 0.25;
        f.x += vx;
        f.y += vy + (f.behavior === 'sleep' ? 0 : Math.sin(t * 0.08 + f.x * 0.01) * 0.2);
        drawFish(ctx, f, t);
        // Prevent fish from leaving tank (bounce off tank walls)
        const minX = WALL_WIDTH + f.size * 0.7;
        const maxX = width - WALL_WIDTH - f.size * 0.7;
        const minY = WALL_WIDTH + f.size * 0.5;
        const maxY = height - WALL_WIDTH - f.size * 0.5;
        if (f.x < minX) { f.x = minX; f.vx = Math.abs(f.vx); f.flip = false; }
        if (f.x > maxX) { f.x = maxX; f.vx = -Math.abs(f.vx); f.flip = true; }
        if (f.y < minY) { f.y = minY; f.vy = Math.abs(f.vy); }
        if (f.y > maxY) { f.y = maxY; f.vy = -Math.abs(f.vy); }
    }
}