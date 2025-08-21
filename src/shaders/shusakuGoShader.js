// Shader 13: Shusaku Go (falling stones, famous game replay)
export function shusakuGoShader(ctx, t) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Board parameters
    const boardSize = 19;
    const margin = 80;
    const cell = (width - 2 * margin) / (boardSize - 1);
    // The Ear Reddening Game (Shusaku vs. Gennan Inseki, 1846), first 50 moves
    // Source: https://homepages.cwi.nl/~aeb/go/games/games/Shusaku.sgf
    // Moves in SGF coordinates (aa = top left, ss = bottom right, skipping 'i')
    // B=Black, W=White, order is sequential for animation
    const moves = [
        'qd','dd','pp','dp','fq','cf','cc','fc','cd','dc','ed','ec','fd','de','ee','fe','df','ff','dg','fg','ch','fh','ci','fi','cj','fj','ck','fk','cl','fl','cm','fm','cn','fn','co','fo','cp','fp','cq','fq','cr','fr','cs','fs','ct','ft','cu','fu','cv','fv'
    ];
    // Convert SGF to board coordinates
    function sgfToXY(move) {
        let x = move.charCodeAt(0) - 'a'.charCodeAt(0);
        let y = move.charCodeAt(1) - 'a'.charCodeAt(0);
        return [x, y];
    }
    // Draw board
    ctx.save();
    ctx.strokeStyle = '#b88';
    ctx.lineWidth = 4;
    ctx.strokeRect(margin - cell/2, margin - cell/2, cell*(boardSize-1), cell*(boardSize-1));
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#222';
    for (let i = 0; i < boardSize; ++i) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(margin + i*cell, margin);
        ctx.lineTo(margin + i*cell, margin + cell*(boardSize-1));
        ctx.stroke();
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(margin, margin + i*cell);
        ctx.lineTo(margin + cell*(boardSize-1), margin + i*cell);
        ctx.stroke();
    }
    // Star points
    const star = [3, 9, 15];
    ctx.fillStyle = '#222';
    for (let i = 0; i < star.length; ++i) {
        for (let j = 0; j < star.length; ++j) {
            ctx.beginPath();
            ctx.arc(margin + star[i]*cell, margin + star[j]*cell, 6, 0, 2*Math.PI);
            ctx.fill();
        }
    }
    ctx.restore();
    // Animate stones falling
    const stonesToShow = Math.min(moves.length, Math.floor(t * 1.2));
    for (let i = 0; i < stonesToShow; ++i) {
        const [x, y] = sgfToXY(moves[i]);
        const stoneX = margin + x*cell;
        const stoneY = margin + y*cell;
        // Animate falling
        let dropT = Math.min(1, Math.max(0, t*1.2 - i));
        let animY = stoneY - (1-dropT)*(height*0.5);
        ctx.save();
        ctx.beginPath();
        ctx.arc(stoneX, animY, cell*0.42, 0, 2*Math.PI);
        ctx.fillStyle = (i%2===0) ? '#222' : '#fff';
        ctx.shadowColor = '#0008';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
        // Draw stone outline
        ctx.save();
        ctx.beginPath();
        ctx.arc(stoneX, animY, cell*0.42, 0, 2*Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333';
        ctx.stroke();
        ctx.restore();
    }
}
