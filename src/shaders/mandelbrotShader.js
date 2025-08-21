// Mandelbrot Explorer Shader
export function mandelbrotShader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const maxIter = 64;
    ctx.clearRect(0, 0, width, height);
    // Zoom and pan animation
    const zoom = 1.5 + Math.sin(t * 0.15) * 1.2;
    const centerX = -0.7 + Math.cos(t * 0.11) * 0.2;
    const centerY = 0.0 + Math.sin(t * 0.13) * 0.2;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let py = 0; py < height; ++py) {
        for (let px = 0; px < width; ++px) {
            let x0 = (px - width / 2) / (0.5 * zoom * width) + centerX;
            let y0 = (py - height / 2) / (0.5 * zoom * height) + centerY;
            let x = 0, y = 0, iter = 0;
            while (x * x + y * y <= 4 && iter < maxIter) {
                let xtemp = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xtemp;
                iter++;
            }
            const idx = 4 * (py * width + px);
            if (iter === maxIter) {
                data[idx] = data[idx+1] = data[idx+2] = 0;
            } else {
                const c = 255 - Math.floor(255 * iter / maxIter);
                data[idx] = c;
                data[idx+1] = (c * 2) % 255;
                data[idx+2] = 255 - c;
            }
            data[idx+3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}
