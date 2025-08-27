// Shared constants and utility functions for fish tank simulation

export const WALL_WIDTH = 10;
export const SURFACE_HEIGHT = 38;
export const EGG_LAYING_PROBABILITY = 0.0002;
export const FISH_SHOW_BEHAVIOR_LABELS = true;
export const DAY_LENGTH_MS = 18000; // 18 seconds day, 18 seconds night
export const TRANSITION_MS = 1000; // 1 second transition
export const NET_PROBABILITY = 1 / 5000;
export const NET_SPEED = 1 / 30000;
export const MAX_LILY_PADS = 8;
export const LILY_PAD_SPAWN_CHANCE = 1/3; //1 / 3000; // chance per frame

// Utility: clamp a value between min and max
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Utility: get random integer in [min, max]
export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility: get random float in [min, max)
export function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}
