// Shader 1: Classic plasma
export function plasma1(x, y, t) {
    let v = 0;
    v += Math.sin(x * 0.06 + t);
    v += Math.sin((y * 0.06 + t) / 2);
    v += Math.sin((x * 0.04 + y * 0.04 + t) / 2);
    v += Math.sin(Math.sqrt(x * x + y * y) * 0.03 + t);
    return v;
}
