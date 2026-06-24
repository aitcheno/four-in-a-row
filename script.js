const ROWS = 6;
const COLS = 7;
const CELL_SIZE = 72;
const GAP = 8;
const BOARD_PADDING = 16;
const PREVIEW_HEIGHT = 96;

// audio manager
// files needed:
//   shrink.mp3
//   plop1.mp3
//   plop2.mp3
//   victory.mp3
const AudioManager = (() => {
  const clips = {
    shrink:  'audio/shrink.mp3',
    plop1:   'audio/plop1.mp3',
    plop2:   'audio/plop2.mp3',
    victory: 'audio/victory.mp3',
  };

  const cache = {};

  function play(name) {
    const src = clips[name];
    if (!src) return;

    // lazy load
    if (!cache[name]) {
      cache[name] = new Audio(src);
    }

    // rewind, play
    const audio = cache[name];
    audio.currentTime = 0;
    audio.play().catch(() => {
      // suppress autoplay
    });
  }

  return { play };
})();

// game state
let board = [];
let currentPlayer = 'red';
let gameOver = false;

// dom refs
const boardEl = document.getElementById('board');
const boardWrapper = document.querySelector('.board-wrapper');
const turnCoinEl = document.getElementById('turn-coin');
const turnTextEl = document.getElementById('turn-text');
const winnerBanner = document.getElementById('winner-banner');
const winnerText = document.getElementById('winner-text');
const restartBtn = document.getElementById('restart-btn');
const previewCoin = document.getElementById('preview-coin');

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  currentPlayer = 'red';
  gameOver = false;
  winnerBanner.classList.add('hidden');
  hidePreviewCoin();
  updateTurnIndicator();
  renderBoard();
}

function renderBoard() {
  boardEl.innerHTML = '';

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;

      // render coin
      if (board[r][c]) {
        const coin = document.createElement('div');
        coin.classList.add('coin', board[r][c]);
        cell.appendChild(coin);
      }

      // bind events
      cell.addEventListener('click', () => handleDrop(c));
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handlePopOut(r, c);
      });
      cell.addEventListener('mouseenter', () => handleMouseEnter(r, c));
      cell.addEventListener('mouseleave', () => handleMouseLeave());

      boardEl.appendChild(cell);
    }
  }
}

function handleDrop(col) {
  if (gameOver) return;

  // find bottom
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) { targetRow = r; break; }
  }
  if (targetRow === -1) return;

  board[targetRow][col] = currentPlayer;
  const droppingPlayer = currentPlayer;

  // place sound
  AudioManager.play(droppingPlayer === 'red' ? 'plop1' : 'plop2');

  const winningCells = checkWin(targetRow, col);
  if (winningCells) {
    animateFly(col, targetRow, droppingPlayer, () => {
      renderBoard();
      highlightWinners(winningCells);
      showWinner();
    });
    return;
  }

  switchPlayer();
  animateFly(col, targetRow, droppingPlayer, () => {
    renderBoard();
    updatePreviewCoin(col);
  });
}

function animateFly(col, targetRow, player, onComplete) {
  const colLeft = BOARD_PADDING + col * (CELL_SIZE + GAP);
  const flyFrom = PREVIEW_HEIGHT + BOARD_PADDING;
  const flyTo = PREVIEW_HEIGHT + BOARD_PADDING + targetRow * (CELL_SIZE + GAP);
  const duration = 150 + (targetRow + 1) * 80;

  const flyer = document.createElement('div');
  flyer.classList.add('flying-coin', player);
  flyer.style.setProperty('--fly-from', `${flyFrom}px`);
  flyer.style.setProperty('--fly-to', `${flyTo}px`);
  flyer.style.setProperty('--fly-duration', `${duration}ms`);
  flyer.style.left = `${colLeft}px`;

  boardWrapper.appendChild(flyer);

  flyer.addEventListener('animationend', () => {
    flyer.remove();
    onComplete();
  }, { once: true });
}

function handlePopOut(row, col) {
  if (gameOver) return;

  const opponent = currentPlayer === 'red' ? 'yellow' : 'red';
  if (board[row][col] !== opponent) return;

  const cells = boardEl.querySelectorAll('.cell');
  const targetCell = cells[row * COLS + col];
  const coin = targetCell.querySelector('.coin');

  if (coin) {
    // shrink sound
    AudioManager.play('shrink');

    coin.classList.add('popping');
    coin.addEventListener('animationend', () => {
      applyPopOut(row, col);
    }, { once: true });
  } else {
    applyPopOut(row, col);
  }
}

function applyPopOut(row, col) {
  // shift down
  for (let r = row; r > 0; r--) {
    board[r][col] = board[r - 1][col];
  }
  board[0][col] = null;

  const winningCells = checkWin(row, col);
  if (winningCells) {
    renderBoard();
    highlightWinners(winningCells);
    showWinner();
    return;
  }

  switchPlayer();
  renderBoard();
}

function handleMouseEnter(row, col) {
  if (gameOver) return;

  const opponent = currentPlayer === 'red' ? 'yellow' : 'red';
  const cells = boardEl.querySelectorAll('.cell');

  cells.forEach(cell => {
    const c = parseInt(cell.dataset.col);
    const r = parseInt(cell.dataset.row);

    // highlight column
    if (c === col) cell.classList.add('col-hover');

    // glow opponent
    if (c === col && board[r][c] === opponent) {
      const coin = cell.querySelector('.coin');
      if (coin) coin.classList.add('opponent-hover');
    }
  });

  updatePreviewCoin(col);
}

function handleMouseLeave() {
  // clear all
  boardEl.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('col-hover');
    const coin = cell.querySelector('.coin');
    if (coin) coin.classList.remove('opponent-hover');
  });
  hidePreviewCoin();
}

function updatePreviewCoin(col) {
  // align above
  const offset = BOARD_PADDING + col * (CELL_SIZE + GAP);
  previewCoin.style.left = `${offset}px`;
  previewCoin.className = `preview-coin ${currentPlayer} visible`;
}

function hidePreviewCoin() {
  previewCoin.classList.remove('visible');
}

function switchPlayer() {
  currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
  updateTurnIndicator();
}

function updateTurnIndicator() {
  const playerName = currentPlayer === 'red' ? 'Player 1' : 'Player 2';
  turnTextEl.textContent = `${playerName}'s turn`;
  turnCoinEl.className = 'turn-coin';
  if (currentPlayer === 'yellow') turnCoinEl.classList.add('yellow');
}

// returns winning coords or null
function checkWin(row, col) {
  const player = board[row][col];
  if (!player) return null;

  // four directions
  const directions = [[0,1],[1,0],[1,1],[1,-1]];

  for (const [dr, dc] of directions) {
    const cells = [[row, col]];

    // positive direction
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      cells.push([r, c]); r += dr; c += dc;
    }

    // negative direction
    r = row - dr; c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      cells.push([r, c]); r -= dr; c -= dc;
    }

    if (cells.length >= 4) return cells;
  }

  return null;
}

// flash winning coins
function highlightWinners(cells) {
  const allCells = boardEl.querySelectorAll('.cell');
  cells.forEach(([r, c]) => {
    const cell = allCells[r * COLS + c];
    const coin = cell && cell.querySelector('.coin');
    if (coin) coin.classList.add('winner');
  });
}

function showWinner() {
  gameOver = true;
  hidePreviewCoin();

  // victory sound
  AudioManager.play('victory');

  const playerName = currentPlayer === 'red' ? 'Player 1' : 'Player 2';
  winnerText.textContent = `${playerName} wins!`;
  winnerBanner.classList.remove('hidden');
}

restartBtn.addEventListener('click', initBoard);

// board exit
boardEl.addEventListener('mouseleave', hidePreviewCoin);

initBoard();