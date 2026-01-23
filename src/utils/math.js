export const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
export const lerp = (a, b, t) => a + (b - a) * t;