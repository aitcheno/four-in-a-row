const ROWS = 6;
const COLS = 7;

let board = [];
let currentPlayer = 'red';

const boardEl = document.getElementById('board');
const turnCoinEl = document.getElementById('turn-coin');
const turnTextEl = document.getElementById('turn-text');

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  currentPlayer = 'red';
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

      // right click triggers pop out instead of browser context menu
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
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      targetRow = r;
      break;
    }
  }
  if (targetRow === -1) return;

  board[targetRow][col] = currentPlayer;
  switchPlayer();
  renderBoard();
}

function handlePopOut(row, col) {
  const opponent = currentPlayer === 'red' ? 'yellow' : 'red';

  // only allow popping out the opponent's coins
  if (board[row][col] !== opponent) return;

  // gravity: shift every coin above the removed one down by one row
  // start from the popped row and work upwards
  for (let r = row; r > 0; r--) {
    board[r][col] = board[r - 1][col];
  }
  board[0][col] = null;

  switchPlayer();
  renderBoard();
}

function handleMouseEnter(row, col) {
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

initBoard();