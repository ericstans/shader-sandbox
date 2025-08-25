// puyoShader.js
// Puyo Puyo inspired self-playing shader

const displayName = 'Puyo Puyo';

const COLS = 6;
const ROWS = 12;
const BLOCK_SIZE = 32;
const COLORS = [null, '#f44', '#4f4', '#44f', '#ff4', '#f4f']; // 1-indexed
const NUM_COLORS = 4;

function randomPiece() {
  // A piece is two vertically stacked puyos of random color
  return {
    x: Math.floor(COLS/2),
    y: 0,
    rot: 0, // 0=vertical, 1=right, 2=down, 3=left
    colors: [1+Math.floor(Math.random()*NUM_COLORS), 1+Math.floor(Math.random()*NUM_COLORS)]
  };
}

function rotatePiece(piece) {
  piece.rot = (piece.rot + 1) % 4;
}

function getPieceCells(piece) {
  // Returns [{x,y,color}, ...] for the two puyos
  const [c1, c2] = piece.colors;
  let cells = [{x: piece.x, y: piece.y, color: c1}];
  if (piece.rot === 0) cells.push({x: piece.x, y: piece.y+1, color: c2});
  else if (piece.rot === 1) cells.push({x: piece.x+1, y: piece.y, color: c2});
  else if (piece.rot === 2) cells.push({x: piece.x, y: piece.y-1, color: c2});
  else if (piece.rot === 3) cells.push({x: piece.x-1, y: piece.y, color: c2});
  return cells;
}

function collides(board, piece, dx=0, dy=0, rotOffset=0) {
  let test = {...piece, x: piece.x+dx, y: piece.y+dy, rot: (piece.rot+rotOffset)%4};
  for (const cell of getPieceCells(test)) {
    if (cell.x < 0 || cell.x >= COLS || cell.y < 0 || cell.y >= ROWS) return true;
    if (board[cell.y][cell.x]) return true;
  }
  return false;
}

function merge(board, piece) {
  for (const cell of getPieceCells(piece)) {
    if (cell.y >= 0 && cell.y < ROWS && cell.x >= 0 && cell.x < COLS)
      board[cell.y][cell.x] = cell.color;
  }
}


// Store clearing state for fade effect and falling animation
let clearingCells = [];
let clearingAnim = 0;
let fallingAnims = [];

function clearGroups(board) {
  // Find all groups of 3+ connected same-color puyos, then clear the entire connected region for each group
  let visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
  let toClear = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] && !visited[y][x]) {
        let color = board[y][x];
        let group = [];
        let stack = [[x, y]];
        while (stack.length) {
          let [cx, cy] = stack.pop();
          if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
          if (visited[cy][cx] || board[cy][cx] !== color) continue;
          visited[cy][cx] = true;
          group.push([cx, cy, color]);
          stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
        }
        if (group.length >= 3) {
          // Mark all connected puyos of this color for clearing (not just the group)
          toClear.push(...group);
        }
      }
    }
  }
  // Remove duplicates (in case of overlap)
  if (toClear.length > 0) {
    const key = (x, y) => `${x},${y}`;
    const seen = new Set();
    const unique = [];
    for (const [x, y, color] of toClear) {
      const k = key(x, y);
      if (!seen.has(k)) {
        seen.add(k);
        unique.push([x, y, color]);
      }
    }
    clearingCells = unique;
    clearingAnim = 0;
    return true;
  }
  return false;
}

function applyGravity(board) {
  // Track falling animations: {fromY, toY, x, color, progress}
  fallingAnims.length = 0;
  for (let x = 0; x < COLS; x++) {
    for (let y = ROWS-2; y >= 0; y--) {
      if (board[y][x] && !board[y+1][x]) {
        let ny = y;
        while (ny+1 < ROWS && !board[ny+1][x]) ny++;
        // Animate from y to ny
        fallingAnims.push({fromY: y, toY: ny, x, color: board[y][x], progress: 0});
        board[ny][x] = board[y][x];
        board[y][x] = 0;
      }
    }
  }
}

let state = null;

function reset() {
  state = {
    board: Array.from({length: ROWS}, () => Array(COLS).fill(0)),
    piece: randomPiece(),
    next: randomPiece(),
    frame: 0,
    dropTimer: 0,
    chain: 0,
    gameOver: false,
    clearing: false,
    clearAnim: 0
  };
}

function lockPiece() {
  merge(state.board, state.piece);
  // Wait before clearing to allow the new piece to settle visually
  state.clearing = true;
  state.clearAnim = -10; // negative value = delay before clear
}

function aiMove() {
  // Improved AI: try all positions/rotations, prefer clears, then setups for chains, then spreading colors, then edges
  let best = null;
  let bestScore = -Infinity;
  for (let rot = 0; rot < 4; rot++) {
    for (let x = 0; x < COLS; x++) {
      let test = {x, y: 0, rot, colors: state.piece.colors};
      // Drop down
      let y = 0;
      while (!collides(state.board, test, 0, y+1)) y++;
      test.y = y;
      if (collides(state.board, test)) continue;
      // Simulate merge and clear
      let testBoard = state.board.map(row => row.slice());
      merge(testBoard, test);
      // 1. Check if this move will clear
      let willClear = false;
      let chainPotential = 0;
      let visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
      for (let yy = 0; yy < ROWS; yy++) {
        for (let xx = 0; xx < COLS; xx++) {
          if (testBoard[yy][xx] && !visited[yy][xx]) {
            let color = testBoard[yy][xx];
            let group = [];
            let stack = [[xx, yy]];
            while (stack.length) {
              let [cx, cy] = stack.pop();
              if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) continue;
              if (visited[cy][cx] || testBoard[cy][cx] !== color) continue;
              visited[cy][cx] = true;
              group.push([cx, cy]);
              stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
            }
            if (group.length >= 3) {
              willClear = true;
              chainPotential += group.length;
            }
          }
        }
      }
      // 2. Prefer placements that extend existing groups (setups for chains)
      let setupScore = 0;
      for (let i = 0; i < 2; i++) {
        let cell = getPieceCells(test)[i];
        let adj = 0;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          let nx = cell.x + dx, ny = cell.y + dy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && testBoard[ny][nx] === cell.color) adj++;
        }
        setupScore += adj;
      }
      // 3. Prefer spreading out (avoid stacking in the center)
      let spreadScore = -Math.abs(x - (COLS-1)/2);
      // 4. Prefer lower placements
      let heightScore = y;
      // 5. Prefer edges for variety
      let edgeScore = (x === 0 || x === COLS-1) ? 1 : 0;
      // Final score
      let score = 0;
      if (willClear) score += 1000 + chainPotential * 10;
      score += setupScore * 20;
      score += spreadScore * 5;
      score += heightScore * 2;
      score += edgeScore * 10;
      if (score > bestScore) {
        bestScore = score;
        best = {x, rot};
      }
    }
  }
  if (best) {
    state.piece._aiTarget = best;
  }
}

function animate(ctx, t, width, height) {
  if (!state || ctx._puyoW !== width || ctx._puyoH !== height) {
    reset();
    ctx._puyoW = width;
    ctx._puyoH = height;
  }
  state.frame++;
  if (state.gameOver) {
    reset();
    return;
  }
  // AI move selection
  if (!state.piece._aiTarget) aiMove();
  // Move piece toward target (horizontal/rotation)
  let aligned = false;
  if (state.piece._aiTarget) {
    let target = state.piece._aiTarget;
    if (state.piece.rot !== target.rot) rotatePiece(state.piece);
    else if (state.piece.x < target.x) state.piece.x++;
    else if (state.piece.x > target.x) state.piece.x--;
    else aligned = true;
  }
  // Drop piece at a visible speed if aligned
  const DROP_INTERVAL = 5;
  if (aligned && !state.clearing) {
    if (++state.dropTimer >= DROP_INTERVAL) {
      if (!collides(state.board, state.piece, 0, 1)) {
        state.piece.y++;
      } else {
        lockPiece();
        delete state.piece._aiTarget;
      }
      state.dropTimer = 0;
    }
  } else {
    state.dropTimer = 0;
  }
  // Clearing animation and logic
  if (state.clearing) {
    if (state.clearAnim < 0) {
      // Wait before starting clear
      state.clearAnim++;
      return;
    }
    if (clearingCells.length > 0) {
      // Animate fade for clearing cells
      clearingAnim++;
      if (clearingAnim > 15) {
        // Actually clear the cells after the effect
        for (const [x, y] of clearingCells) {
          state.board[y][x] = 0;
        }
        clearingCells = [];
        clearingAnim = 0;
        applyGravity(state.board);
        state.chain++;
        state.clearAnim = 0;
      }
    } else if (fallingAnims.length > 0) {
      // Animate falling pieces
      let allDone = true;
      for (const anim of fallingAnims) {
        if (anim.progress < 1) {
          anim.progress += 0.2;
          if (anim.progress < 1) allDone = false;
        }
      }
      if (allDone) {
        fallingAnims.length = 0;
      }
    } else if (++state.clearAnim > 10) {
      let anyCleared = clearGroups(state.board);
      if (!anyCleared) {
        state.clearing = false;
        state.chain = 0;
        state.piece = state.next;
        state.next = randomPiece();
        if (collides(state.board, state.piece)) state.gameOver = true;
        delete state.piece._aiTarget;
      }
    }
  }
  // Draw
  ctx.save();
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,width,height);
  ctx.translate((width - COLS*BLOCK_SIZE)/2, (height - ROWS*BLOCK_SIZE)/2);
  // Draw board
  // Draw falling animations first
  for (const anim of fallingAnims) {
    let py = anim.fromY + (anim.toY - anim.fromY) * Math.min(anim.progress, 1);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS[anim.color];
    ctx.beginPath();
    ctx.arc(anim.x*BLOCK_SIZE+BLOCK_SIZE/2, py*BLOCK_SIZE+BLOCK_SIZE/2, BLOCK_SIZE/2-2, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  }
  // Draw static and clearing cells
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // Don't draw if this cell is being animated as falling
      let isFalling = fallingAnims.some(anim => anim.x === x && Math.round(anim.toY) === y && anim.progress < 1);
      if (isFalling) continue;
      let isClearing = false;
      let clearAlpha = 1;
      for (const [cx, cy, color] of clearingCells) {
        if (cx === x && cy === y) {
          isClearing = true;
          clearAlpha = 1 - clearingAnim / 15;
          ctx.save();
          ctx.globalAlpha = clearAlpha;
          ctx.fillStyle = COLORS[color];
          ctx.beginPath();
          ctx.arc(x*BLOCK_SIZE+BLOCK_SIZE/2, y*BLOCK_SIZE+BLOCK_SIZE/2, BLOCK_SIZE/2-2 + 6 * (1-clearAlpha), 0, 2*Math.PI);
          ctx.fill();
          ctx.restore();
          break;
        }
      }
      if (!isClearing && state.board[y][x]) {
        ctx.fillStyle = COLORS[state.board[y][x]];
        ctx.beginPath();
        ctx.arc(x*BLOCK_SIZE+BLOCK_SIZE/2, y*BLOCK_SIZE+BLOCK_SIZE/2, BLOCK_SIZE/2-2, 0, 2*Math.PI);
        ctx.fill();
      }
    }
  }
  // Draw current piece
  for (const cell of getPieceCells(state.piece)) {
    ctx.fillStyle = COLORS[cell.color];
    ctx.beginPath();
    ctx.arc((cell.x)*BLOCK_SIZE+BLOCK_SIZE/2, (cell.y)*BLOCK_SIZE+BLOCK_SIZE/2, BLOCK_SIZE/2-2, 0, 2*Math.PI);
    ctx.fill();
  }
  // Draw next piece
  ctx.save();
  ctx.translate(COLS*BLOCK_SIZE+16, 0);
  ctx.font = '16px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Next:', 0, 18);
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = COLORS[state.next.colors[i]];
    ctx.beginPath();
    ctx.arc(BLOCK_SIZE/2, 32+i*BLOCK_SIZE, BLOCK_SIZE/2-2, 0, 2*Math.PI);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

export default {
  displayName,
  animate,
};
