// --- Particle explosion utility ---
function spawnExplosion(x, y, t, color) {
    if (!window._pongExplosions) window._pongExplosions = [];
    let particles = [];
    for (let i = 0; i < 60; i++) {
        let angle = Math.random() * 2 * Math.PI;
        let speed = 3 + Math.random() * 3;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 40 + Math.random() * 20,
            color: color || `hsl(${Math.floor(Math.random()*360)},100%,60%)`
        });
    }
    window._pongExplosions.push({ particles, start: t });
}
// --- Sound effect utility ---
function playPongSound(type) {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!playPongSound.ctx) playPongSound.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = playPongSound.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    let freq = 440, dur = 0.07, gain = 0.06;
    if (type === 'paddle') { freq = 440 + Math.random()*60; dur = 0.07; gain = 0.065; }
    if (type === 'wall')   { freq = 220 + Math.random()*40; dur = 0.09; gain = 0.05; }
    if (type === 'score')  { freq = 120; dur = 0.22; gain = 0.09; }
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
}
// plasmaPongShader.js
// A modular shader inspired by Plasma Pong: dynamic, colorful, fluid-like plasma with paddle and ball interaction.


function animate(ctx, t, width, height) {
    // --- Goal delay state ---
    if (this.goalDelay === undefined) this.goalDelay = 0;
    // (Explosion rendering moved below, after plasma trail)
    // --- Draw and update particle explosions (after plasma, before paddles/ball/score) ---
    if (!window._pongExplosions) window._pongExplosions = [];
    for (let e = 0; e < window._pongExplosions.length; e++) {
        let exp = window._pongExplosions[e];
        for (let p of exp.particles) {
            if (p.life < p.maxLife) {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.97;
                p.vy *= 0.97;
                p.life++;
                let alpha = 1 - p.life / p.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha * 0.7;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6 * alpha + 2, 0, 2 * Math.PI);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 16 * alpha;
                ctx.fill();
                ctx.restore();
            }
        }
    }
    // Remove finished explosions
    window._pongExplosions = window._pongExplosions.filter(e => e.particles.some(p => p.life < p.maxLife));
    if (!this.t) this.t = 0;
    this.t += 0.016;
    if (!this.width || !this.height) {
        this.width = width;
        this.height = height;
        this.paddleY = height / 2; // Left paddle
        this.paddle2Y = height / 2; // Right paddle
        this.paddleHeight = 80;
        this.paddleSpeed = 0;
        this.paddle2Speed = 0;
        this.ball = { x: width / 2, y: height / 2, vx: 5, vy: 3.5 };
        this.ballBaseSpeed = 2.5;
        this.ballSpeedup = 1.0;
        this.mouseY = this.paddleY;
        if (!this.plasmaSeed) this.plasmaSeed = Math.random() * 1000;
        this.score = [0, 0];
    }
    // --- Ball trail logic ---
    if (!this.trail) this.trail = [];
    // Add current ball position to trail
    this.trail.push({ x: this.ball.x, y: this.ball.y, t: this.t });
    // Keep only the last 40 positions
    if (this.trail.length > 40) this.trail.shift();

    // --- Black background ---
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // --- Plasma texture only for ball trail (vibrant) ---
    let img = ctx.createImageData(width, height);
    let d = img.data;
    for (let i = 0; i < this.trail.length; i++) {
        let p = this.trail[i];
        let minX = Math.max(0, Math.floor(p.x - 15));
        let maxX = Math.min(width - 1, Math.ceil(p.x + 15));
        let minY = Math.max(0, Math.floor(p.y - 15));
        let maxY = Math.min(height - 1, Math.ceil(p.y + 15));
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                let dx = x - p.x, dy = y - p.y;
                let dist2 = dx*dx + dy*dy;
                if (dist2 < 225) {
                    let idx = (y * width + x) * 4;
                    if (d[idx+3] > 0) continue;
                    // Nonlinear fade for more vibrant color
                    let fade = Math.pow((1 - dist2/225) * ((i + 1) / this.trail.length), 0.6);
                    // More saturated and bright plasma
                    let v = Math.sin(x * 0.035 + this.t) + Math.sin(y * 0.045 - this.t * 0.7);
                    let base = 180 + 75 * Math.sin(v + this.plasmaSeed);
                    let r = base;
                    let g = 180 + 75 * Math.sin(v + 2.0);
                    let b = 180 + 75 * Math.sin(v + 4.0);
                    // Boost color vibrancy
                    r = Math.min(255, r * 1.2);
                    g = Math.min(255, g * 1.2);
                    b = Math.min(255, b * 1.2);
                    d[idx] = r * fade;
                    d[idx+1] = g * fade;
                    d[idx+2] = b * fade;
                    d[idx+3] = 255 * fade;
                }
            }
        }
    }
    ctx.putImageData(img, 0, 0);

    // --- AI Paddle Movement (with fuzziness) ---
    // Add random offset and delayed reaction to make AI imperfect
    if (!this.paddleFuzz) this.paddleFuzz = { left: 0, right: 0 };
    if (!this.paddleFuzzTimer) this.paddleFuzzTimer = { left: 0, right: 0 };
    // Occasionally change the fuzz offset
    if (--this.paddleFuzzTimer.left < 0) {
        this.paddleFuzz.left = (Math.random() - 0.5) * 80; // up to +/-40px
        this.paddleFuzzTimer.left = 20 + Math.random() * 40;
    }
    if (--this.paddleFuzzTimer.right < 0) {
        this.paddleFuzz.right = (Math.random() - 0.5) * 80;
        this.paddleFuzzTimer.right = 20 + Math.random() * 40;
    }
    // Left paddle AI: track ball with lag and fuzz
    let targetY = this.ball.y + this.paddleFuzz.left;
    let aiLag = 0.13 + Math.random() * 0.07; // add a little lag randomness
    this.paddleY += (targetY - this.paddleY) * aiLag;
    // Right paddle AI: track ball with lag, fuzz, and wobble
    let target2Y = this.ball.y + Math.sin(this.t * 0.7) * 20 + this.paddleFuzz.right;
    let ai2Lag = 0.11 + Math.random() * 0.07;
    this.paddle2Y += (target2Y - this.paddle2Y) * ai2Lag;

    // Draw left paddle
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(20, this.paddleY - this.paddleHeight/2, 12, this.paddleHeight);
    ctx.restore();
    // Draw right paddle
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(width - 32, this.paddle2Y - this.paddleHeight/2, 12, this.paddleHeight);
    ctx.restore();

    // --- Ball ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();

    // --- Ball speedup ---
    if (!this.ballBaseSpeed) this.ballBaseSpeed = 3.5;
    if (!this.ballSpeedup) this.ballSpeedup = 0.5;
    // Gradually increase speed multiplier
    this.ballSpeedup *= 1.002;
    // Clamp to prevent infinite speed
    if (this.ballSpeedup > 2.5) this.ballSpeedup = 2.5;
    // Normalize velocity and apply speedup
    let speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
    let vxNorm = this.ball.vx / (speed || 1);
    let vyNorm = this.ball.vy / (speed || 1);
    let newSpeed = this.ballBaseSpeed * this.ballSpeedup;
    this.ball.vx = vxNorm * newSpeed;
    this.ball.vy = vyNorm * newSpeed;
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    // Bounce off top/bottom
    if (this.ball.y < 12 || this.ball.y > height - 12) {
        this.ball.vy *= -1;
        this.ball.y = Math.max(12, Math.min(height - 12, this.ball.y));
        playPongSound('wall');
    }
    // Bounce off left paddle
    if (this.ball.x < 32 && this.ball.y > this.paddleY - this.paddleHeight/2 && this.ball.y < this.paddleY + this.paddleHeight/2 && this.ball.vx < 0) {
        playPongSound('paddle');
        // Calculate hit position: -1 (top) to 1 (bottom)
        let rel = (this.ball.y - this.paddleY) / (this.paddleHeight/2);
        rel = Math.max(-1, Math.min(1, rel));
        // Angle: -45deg (top) to +45deg (bottom)
        let angle = rel * Math.PI/4;
        let speed = Math.sqrt(this.ball.vx*this.ball.vx + this.ball.vy*this.ball.vy) * 1.05;
        this.ball.vx = Math.abs(speed * Math.cos(angle));
        this.ball.vy = speed * Math.sin(angle);
        this.ball.x = 32;
        // Add some plasma effect to ball velocity
        this.ball.vy += (Math.random() - 0.5) * 2;
    }
    // Bounce off right paddle
    if (this.ball.x > width - 32 && this.ball.y > this.paddle2Y - this.paddleHeight/2 && this.ball.y < this.paddle2Y + this.paddleHeight/2 && this.ball.vx > 0) {
        playPongSound('paddle');
        let rel = (this.ball.y - this.paddle2Y) / (this.paddleHeight/2);
        rel = Math.max(-1, Math.min(1, rel));
        // Angle: +135deg (top) to +225deg (bottom)
        let angle = Math.PI - rel * Math.PI/4;
        let speed = Math.sqrt(this.ball.vx*this.ball.vx + this.ball.vy*this.ball.vy) * 1.05;
        this.ball.vx = -Math.abs(speed * Math.cos(angle));
        this.ball.vy = speed * Math.sin(angle);
        this.ball.x = width - 32;
        this.ball.vy += (Math.random() - 0.5) * 2;
    }
    // Scorekeeping
    if (this.goalDelay <= 0) {
        if (this.ball.x < -20) {
            playPongSound('score');
            spawnExplosion(this.ball.x, this.ball.y, this.t, 'cyan');
            this.score[1] += 1; // Right player scores
            this.ball.x = width / 2;
            this.ball.y = height / 2;
            this.ballSpeedup = 1.0;
            let angle = Math.random() * Math.PI / 2 - Math.PI / 4;
            this.ball.vx = this.ballBaseSpeed * Math.cos(angle);
            this.ball.vy = this.ballBaseSpeed * Math.sin(angle);
            this.goalDelay = 60; // 1 second at 60fps
        } else if (this.ball.x > width + 20) {
            playPongSound('score');
            spawnExplosion(this.ball.x, this.ball.y, this.t, 'magenta');
            this.score[0] += 1; // Left player scores
            this.ball.x = width / 2;
            this.ball.y = height / 2;
            this.ballSpeedup = 1.0;
            let angle = Math.PI + Math.random() * Math.PI / 2 - Math.PI / 4;
            this.ball.vx = this.ballBaseSpeed * Math.cos(angle);
            this.ball.vy = this.ballBaseSpeed * Math.sin(angle);
            this.goalDelay = 60;
        }
    }
    // During goal delay, skip ball and paddle updates, but continue rendering everything else
    if (this.goalDelay > 0) {
        this.goalDelay--;
        // Render particle explosions during goal delay
        if (window._pongExplosions) {
            for (let e = 0; e < window._pongExplosions.length; e++) {
                let exp = window._pongExplosions[e];
                for (let p of exp.particles) {
                    if (p.life < p.maxLife) {
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vx *= 0.97;
                        p.vy *= 0.97;
                        p.life++;
                        let alpha = 1 - p.life / p.maxLife;
                        ctx.save();
                        ctx.globalAlpha = alpha * 0.7;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 6 * alpha + 2, 0, 2 * Math.PI);
                        ctx.fillStyle = p.color;
                        ctx.shadowColor = p.color;
                        ctx.shadowBlur = 16 * alpha;
                        ctx.fill();
                        ctx.restore();
                    }
                }
            }
            // Remove finished explosions
            window._pongExplosions = window._pongExplosions.filter(e => e.particles.some(p => p.life < p.maxLife));
        }
        // Skip ball/paddle movement and collision, but still render everything
        // (No return statement here)
        // Optionally, you could gray out paddles/ball or show a countdown here
        // But for now, just freeze their positions
        // (All rendering below continues as normal)
        return;
    }
    // --- Draw score ---
    ctx.save();
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(this.score[0], width * 0.25, 48);
    ctx.fillText(this.score[1], width * 0.75, 48);
    ctx.restore();
}

export default {
    name: "Plasma Pong",
    description: "Dynamic plasma with interactive pong paddles and ball.",
    author: "GitHub Copilot",
    // No need for init, but keep mouse tracking for paddle
    init(canvas, ctx) {
        if (!this.mouseHandler) {
            this.mouseHandler = (e) => {
                const rect = canvas.getBoundingClientRect();
                this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
            };
            canvas.addEventListener('mousemove', this.mouseHandler);
        }
    },
    animate,
    render: animate,
};
