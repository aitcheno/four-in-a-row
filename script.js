const ROWS = 6;
const COLS = 7;

let board = [];
let currentPlayer = 'red';

const boardEl = document.getElementById('board');
const turnCoinEl = document.getElementById('turn-coin');
const turnTextEl = document.getElementById('turn-text');

function initBoard() {
  // 2d array to track coin positions, null means empty
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

      // render a coin inside the cell if one exists at this position
      if (board[r][c]) {
        const coin = document.createElement('div');
        coin.classList.add('coin', board[r][c]);
        cell.appendChild(coin);
      }

      // clicking any cell in a column drops into that column
      cell.addEventListener('click', () => handleDrop(c));

      boardEl.appendChild(cell);
    }
  }
}

function handleDrop(col) {
  // find the lowest empty row by scanning from the bottom up
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      targetRow = r;
      break;
    }
  }

  // if no empty row found, column is full
  if (targetRow === -1) return;

  board[targetRow][col] = currentPlayer;
  switchPlayer();
  renderBoard();
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