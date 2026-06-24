const ROWS = 6;
const COLS = 7;

let board = [];
let currentPlayer = 'red';
let gameOver = false;

const boardEl = document.getElementById('board');
const turnCoinEl = document.getElementById('turn-coin');
const turnTextEl = document.getElementById('turn-text');
const winnerBanner = document.getElementById('winner-banner');
const winnerText = document.getElementById('winner-text');
const restartBtn = document.getElementById('restart-btn');

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  currentPlayer = 'red';
  gameOver = false;
  winnerBanner.classList.add('hidden');
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

      if (board[r][c]) {
        const coin = document.createElement('div');
        coin.classList.add('coin', board[r][c]);
        cell.appendChild(coin);
      }

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

  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      targetRow = r;
      break;
    }
  }
  if (targetRow === -1) return;

  board[targetRow][col] = currentPlayer;

  // check win after every drop before switching turns
  if (checkWin(targetRow, col)) {
    renderBoard();
    showWinner();
    return;
  }

  switchPlayer();
  renderBoard();
}

function handlePopOut(row, col) {
  if (gameOver) return;

  const opponent = currentPlayer === 'red' ? 'yellow' : 'red';
  if (board[row][col] !== opponent) return;

  for (let r = row; r > 0; r--) {
    board[r][col] = board[r - 1][col];
  }
  board[0][col] = null;

  // a pop out could also create a win, so check here too
  if (checkWin(row, col)) {
    renderBoard();
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
    if (c === col) cell.classList.add('col-hover');
    if (c === col && board[r][c] === opponent) {
      const coin = cell.querySelector('.coin');
      if (coin) coin.classList.add('opponent-hover');
    }
  });
}

function handleMouseLeave() {
  boardEl.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('col-hover');
    const coin = cell.querySelector('.coin');
    if (coin) coin.classList.remove('opponent-hover');
  });
}

// check all 4 directions from the last placed coin
// counts matching coins in both directions along each axis
function checkWin(row, col) {
  const player = board[row][col];
  if (!player) return false;

  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1]   // diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    let r = row + dr, c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count >= 4) return true;
  }

  return false;
}

function showWinner() {
  gameOver = true;
  const playerName = currentPlayer === 'red' ? 'Player 1' : 'Player 2';
  winnerText.textContent = `${playerName} wins!`;
  winnerBanner.classList.remove('hidden');
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

restartBtn.addEventListener('click', initBoard);

initBoard();