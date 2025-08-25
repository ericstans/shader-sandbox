// tetrisShader.js
// Tetris shader: falling blocks, DAS, soft drop, line clears

const displayName = 'Tetris';

// Tetris constants
let COLS = 10;
let ROWS = 20;
const BLOCK_SIZE = 24;
let BOARD_W = COLS * BLOCK_SIZE;
let BOARD_H = ROWS * BLOCK_SIZE;
const DAS_DELAY = 2; // frames before auto-shift (even faster)
const DAS_REPEAT = 1; // frames between auto-shift moves (faster)
const SOFT_DROP_SPEED = 1; // frames per cell (faster)

const COLORS = [
  '#222', // empty
  '#0ff', // I
  '#ff0', // O
  '#f0f', // T
  '#0f0', // S
  '#f00', // Z
  '#00f', // J
  '#fa0', // L
];

const SHAPES = [
  [], // empty
  [[1,1,1,1]], // I
  [[2,2],[2,2]], // O
  [[0,3,0],[3,3,3]], // T
  [[0,4,4],[4,4,0]], // S
  [[5,5,0],[0,5,5]], // Z
  [[6,0,0],[6,6,6]], // J
  [[0,0,7],[7,7,7]], // L
];

function randomPiece() {
  const type = 1 + Math.floor(Math.random()*7);
  const shape = SHAPES[type];
  // Center the piece horizontally
  const x = Math.floor((COLS - shape[0].length) / 2);
  return {
    type,
    shape,
    x,
    y: 0,
    rot: 0,
    dasDir: 0,
    dasTimer: 0,
    dasRepeat: 0,
    softDrop: false,
  };
}

function rotate(shape) {
  // Rotate 90deg clockwise
  const w = shape[0].length, h = shape.length;
  let out = [];
  for (let x = 0; x < w; x++) {
    let row = [];
    for (let y = h-1; y >= 0; y--) row.push(shape[y][x]);
    out.push(row);
  }
  return out;
}

function collides(board, piece, ox=0, oy=0, shapeOverride) {
  const shape = shapeOverride || piece.shape;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[0].length; x++) {
      if (!shape[y][x]) continue;
      let px = piece.x + x + ox;
      let py = piece.y + y + oy;
      if (px < 0 || px >= COLS || py >= ROWS) return true;
      if (py >= 0 && board[py][px]) return true;
    }
  }
  return false;
}

function merge(board, piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[0].length; x++) {
      if (piece.shape[y][x]) {
        let px = piece.x + x;
        let py = piece.y + y;
        if (py >= 0 && py < ROWS && px >= 0 && px < COLS)
          board[py][px] = piece.type;
      }
    }
  }
}

function clearLines(board) {
  let lines = 0;
  for (let y = ROWS-1; y >= 0; y--) {
    if (board[y].every(cell => cell)) {
      board.splice(y,1);
      board.unshift(Array(COLS).fill(0));
      lines++;
      y++;
    }
  }
  return lines;
}

let state = null;

function reset() {
  state = {
    board: Array.from({length: ROWS}, () => Array(COLS).fill(0)),
    piece: randomPiece(),
    next: randomPiece(),
    frame: 0,
    dropTimer: 0,
    dasDir: 0,
    dasTimer: 0,
    dasRepeat: 0,
    softDrop: false,
    lines: 0,
    gameOver: false,
  };
}

function tryMove(dx, dy, rot) {
  if (!state || state.gameOver) return;
  let newShape = state.piece.shape;
  let newRot = state.piece.rot;
  if (rot) {
    newRot = (state.piece.rot + rot + 4) % 4;
    newShape = state.piece.shape;
    for (let i = 0; i < rot; i++) newShape = rotate(newShape);
  }
  if (!collides(state.board, state.piece, dx, dy, newShape)) {
    state.piece.x += dx;
    state.piece.y += dy;
    state.piece.shape = newShape;
    state.piece.rot = newRot;
    return true;
  }
  return false;
}

function hardDrop() {
  if (!state || state.gameOver) return;
  while (!collides(state.board, state.piece, 0, 1)) {
    state.piece.y++;
  }
  lockPiece();
}

function lockPiece() {
  merge(state.board, state.piece);
  clearLines(state.board);
  state.piece = state.next;
  state.next = randomPiece();
  if (collides(state.board, state.piece)) state.gameOver = true;
}

function animate(ctx, t, width, height) {
  // Dynamically set COLS and ROWS to fill the canvas
  COLS = Math.floor(width / BLOCK_SIZE);
  ROWS = Math.floor(height / BLOCK_SIZE);
  BOARD_W = COLS * BLOCK_SIZE;
  BOARD_H = ROWS * BLOCK_SIZE;
  if (!state || ctx._tetrisW !== width || ctx._tetrisH !== height) {
    reset();
    ctx._tetrisW = width;
    ctx._tetrisH = height;
  }
  state.frame++;

  // --- AI Logic for self-playing Tetris ---
  if (state.gameOver) {
    reset();
    return;
  }
  if (!state.piece._aiTarget) {
    // Find all possible placements (x, rot) for the current piece, prioritizing gap avoidance
    let best = null;
    let bestScore = -Infinity;
    for (let rot = 0; rot < 4; rot++) {
      let shape = state.piece.shape;
      for (let r = 0; r < rot; r++) shape = rotate(shape);
      let w = shape[0].length;
      for (let x = -2; x <= COLS - w + 2; x++) {
        // Simulate dropping the piece at (x, rot)
        let testPiece = {
          x: x,
          y: 0,
          shape: shape,
          type: state.piece.type,
          rot: (state.piece.rot + rot) % 4
        };
        if (collides(state.board, testPiece)) continue;
        // Drop down
        let y = 0;
        while (!collides(state.board, testPiece, 0, y+1)) y++;
        // Clone board and merge piece
        let testBoard = state.board.map(row => row.slice());
        let tempPiece = Object.assign({}, testPiece, { y });
        merge(testBoard, tempPiece);
        // Evaluate board: count overhangs only if blocked on at least one side
        let gaps = 0;
        for (let col = 0; col < COLS; col++) {
          let foundBlock = false;
          for (let row = 0; row < ROWS; row++) {
            if (testBoard[row][col]) {
              foundBlock = true;
            } else if (foundBlock) {
              // Only count as a gap if at least one horizontal neighbor is a block
              let leftBlocked = col > 0 && testBoard[row][col-1];
              let rightBlocked = col < COLS-1 && testBoard[row][col+1];
              if (leftBlocked || rightBlocked) {
                gaps++;
              }
            }
          }
        }
        // After gap logic, count 'I-only wells': columns with a 1-wide, unbroken vertical gap, filled on both sides for the entire height
        let iWells = 0;
        for (let col = 0; col < COLS; col++) {
          // Find the first filled cell in this column
          let top = 0;
          while (top < ROWS && !testBoard[top][col]) top++;
          // If the well starts at the top (no blocks above), check if it's a 1-wide well
          if (top < ROWS) {
            let wellStart = top;
            // Find the bottom of the well (first empty cell below top)
            let wellEnd = top;
            while (wellEnd < ROWS && !testBoard[wellEnd][col]) wellEnd++;
            // Check if the well is 1-wide and surrounded by blocks on both sides for its entire height
            let isIWell = true;
            if (wellEnd - wellStart > 0) {
              for (let row = wellStart; row < wellEnd; row++) {
                let leftFilled = col === 0 || testBoard[row][col-1];
                let rightFilled = col === COLS-1 || testBoard[row][col+1];
                if (!leftFilled || !rightFilled) {
                  isIWell = false;
                  break;
                }
              }
              if (isIWell) iWells++;
            }
          }
        }
        // Prefer fewer gaps, then lower placement, then penalize >1 I-only well
        let score = -gaps * 1000 + y - (iWells > 1 ? (iWells-1) * 2000 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = { x, rot, y };
        }
      }
    }
    if (best) {
      state.piece._aiTarget = best;
      state.piece._aiRotProgress = 0;
    }
  }
  // Move piece incrementally toward target
  if (state.piece._aiTarget) {
    let target = state.piece._aiTarget;
    // Rotate if needed
    let rotDiff = (target.rot - state.piece.rot + 4) % 4;
    if (rotDiff !== 0) {
      tryMove(0,0,1);
    } else if (state.piece.x < target.x) {
      tryMove(1,0,0);
    } else if (state.piece.x > target.x) {
      tryMove(-1,0,0);
    } else {
      // At target x/rot, soft drop
      state.softDrop = true;
    }
  }
  // Soft drop if AI says so
  let dropSpeed = state.softDrop ? SOFT_DROP_SPEED : 2;
  if (++state.dropTimer >= dropSpeed) {
    if (!tryMove(0,1,0)) {
      state.softDrop = false;
      if (state.piece._aiTarget) delete state.piece._aiTarget;
      lockPiece();
    }
    state.dropTimer = 0;
  }
  // Draw board
  ctx.save();
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,width,height);
  ctx.translate((width-BOARD_W)/2, (height-BOARD_H)/2);
  // Draw placed blocks
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (state.board[y][x]) {
        ctx.fillStyle = COLORS[state.board[y][x]];
        ctx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, BLOCK_SIZE-2, BLOCK_SIZE-2);
      }
    }
  }
  // Draw current piece
  for (let y = 0; y < state.piece.shape.length; y++) {
    for (let x = 0; x < state.piece.shape[0].length; x++) {
      if (state.piece.shape[y][x]) {
        ctx.fillStyle = COLORS[state.piece.type];
        ctx.fillRect((state.piece.x+x)*BLOCK_SIZE, (state.piece.y+y)*BLOCK_SIZE, BLOCK_SIZE-2, BLOCK_SIZE-2);
      }
    }
  }
  // Draw next piece
  ctx.save();
  ctx.translate(BOARD_W+24, 0);
  ctx.font = '16px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Next:', 0, 18);
  for (let y = 0; y < state.next.shape.length; y++) {
    for (let x = 0; x < state.next.shape[0].length; x++) {
      if (state.next.shape[y][x]) {
        ctx.fillStyle = COLORS[state.next.type];
        ctx.fillRect(x*BLOCK_SIZE, 32+y*BLOCK_SIZE, BLOCK_SIZE-2, BLOCK_SIZE-2);
      }
    }
  }
  ctx.restore();
  // Draw lines/score
  // ctx.font = 'bold 20px monospace';
  // ctx.fillStyle = '#fff';
  // ctx.fillText('Lines: '+state.lines, BOARD_W+24, 120);
  ctx.restore();
}

export default {
  displayName,
  animate,
};
