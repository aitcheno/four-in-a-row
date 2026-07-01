/* INTERACTION FOCUS: My interaction focus was on clicking, but hover actions are also present
   My prototype explores these actions through a connect four type game with a twist of being 
   to pop out your opponents pieces

   
   CHALLENGES/FUTURE CONSIDERATIONS:
   - I had to make it a 2 player local game because I was drastically unsure 
   of how to implement a CPU/AI to play against that wasn't completely random
   and easy to beat. So this would be the future task if I were to continue 
   this project.


/* CONSTANTS FOR THE BOARD DIMENSIONS
   Keeping these as constants means any layout changes only need
   to happen in one place. They have to matchthe grid values set in the css. 
   (So if I felt like shrinking or increasing the board, I could pretty easily) */
const ROWS          = 6;    // Standard connect 4 board size
const COLS          = 7;    // Same as above
const CELL_SIZE     = 72;   // Size in pixels of the cells
const GAP           = 8;    // Gap between the cells
const BOARD_PADDING = 16;   // Paddding in the baord
const BOARD_BORDER  = 4;    // Width of the border
const PREVIEW_HEIGHT = 96;  // Height of the space where the players coin is previewed


/* AUDIO MANAGER
I designed very simple 8 bit style audio just with the only plugin I have on this laptop.
Moving house meant I didn't have access to my PC. When implementing the sounds, I found it
unfitting with the circular, sleek and modern look, so I changed the skin to an 8 bit style.

The cache object reuses audio instances rather than creating a new object
every time it's called. Just to make the game run better, using less resources. */

const AudioManager = (() => {
  const clips = {
    shrink:  'audio/shrink.mp3',
    plop1:   'audio/plop1.mp3',
    plop2:   'audio/plop2.mp3',
    victory: 'audio/victory.mp3',
  };

  // Cache stores the audio
  const cache = {};

  function play(name) {
    const src = clips[name];
    if (!src) return;  // Silently skip the unknown sound names

    // Create the Audio object once, then it replays it
    if (!cache[name]) {
      cache[name] = new Audio(src);
    }

    const audio = cache[name];
    audio.currentTime = 0;        // Rewind to start 
    audio.play().catch(() => {});  // This 'swallows' autoplay blocked errors
  }

  return { play };  
})();

/* These were helpful resources
https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio
https://javascript.info/closure


/* GAME STATE VARIABLES
  These are the variables which are each game states
  board is the 2D layout row,column -> null, 'red', 'yellow'
  currentPlayer: whose turn it is
  gameOver: prevents interaction*/

let board = [];             // 2D layout representing the coin grid
let currentPlayer = 'red';  // Red (P1) always goes first
let gameOver = false;       // True once 4 in a row or more is achieved!


/* DOM REFERENCES */
const boardEl       = document.getElementById('board');         // The grid container
const boardWrapper  = document.querySelector('.board-wrapper'); // Parent of board and flying coins
const turnCoinEl    = document.getElementById('turn-coin');     // Coloured square in the indicator for whose go it is
const turnTextEl    = document.getElementById('turn-text');     // Text in that indicator
const winnerBanner  = document.getElementById('winner-banner'); // Banner shown when someone wins
const winnerText    = document.getElementById('winner-text');   // Text inside that banner
const restartBtn    = document.getElementById('restart-btn');   // Play again button
const previewCoin   = document.getElementById('preview-coin');  // Hovering coin which previews above the board


/* INITIALISE BOARD
   Resets everything back to the start-of-game state. Called when page is loaded and when play again is clicked*/
function initBoard() {
  // Builds a fresh board with all null/empty cells
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // Resets to first players turn and removes the game over state
  currentPlayer = 'red';
  gameOver = false;

  // Hides the winner banner
  winnerBanner.classList.add('hidden');

  // Removes the hovering coin just in case it's still there from the last game
  hidePreviewCoin();

  // Self explanatory, back to P1
  updateTurnIndicator();

  // Rebuilds the grid
  renderBoard();
}


/* RENDER BOARD
   This function bridges the data (board[][]) and what
   the player sees. The board[][] layout is where the pieces actually are
  renderBoard() reads and builds matching HTML

   It is called after every single action. So instead of updating each cell,
   it clears everything and rebuilds from scratch using the data. With a small board,
   it does this fast enough to be instant */
function renderBoard() {

  // Wipes entire board clean
  boardEl.innerHTML = '';

  // Goes through each row top to bottom top = 0
  for (let r = 0; r < ROWS; r++) {

    // Child goes through each COLUMN in this row left to right 0 is leftmost
    for (let c = 0; c < COLS; c++) {

      // CREATE THE CELL
      // Each cell is a div that represents a slot. Created in JS rather than every div in the HTML. 
      // This creates that div
      // Makes it easier to change the board size if I wanted to experiment
      const cell = document.createElement('div');
      cell.classList.add('cell');

      // Stamps the cell with it's coordinates, so when an event happens, the handlers know which cell was interacted with
      cell.dataset.row = r;
      cell.dataset.col = c;

      // DRAWING COINS
      // Check the board layout at this coordinate. 
      // It will draw, based off the data, nothing (null) Player 1 coin (red) or Player 2 coin (yellow)
      if (board[r][c]) {

        // Create the coloured coin
        const coin = document.createElement('div');

        coin.classList.add('coin', board[r][c]);

        // Places the coin inside the cell
        cell.appendChild(coin);
      }

      // ATTACH EVENT LISTENERS

      // LEFT CLICK: Drops a coin
      // Only the column matter so handleDrop scans downward and finds the lowest empty row
      cell.addEventListener('click', () => handleDrop(c));

      // RIGHT CLICK: Removes opponent coin at a specific cell
      // e.preventDefault() makes it so the default right click on a browser doesn't open up! So nifty
      // Both r and c are so the handle knows which coin to pop out (with it's coordinates)
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handlePopOut(r, c);
      });

      // MOUSE ENTER: When cursor moves onto the board/a specific coin
      // Gives the row and column (coordinates) so the column can be highlighted 
      // or the crosshair is shown on opponents coin
      cell.addEventListener('mouseenter', () => handleMouseEnter(r, c));

      // MOUSE LEAVE: Clears the above hover styles 
      cell.addEventListener('mouseleave', () => handleMouseLeave());

      boardEl.appendChild(cell);
    }
  }
}


/* HANDLE DROP
   When user left clicks a cell, a coin is dropped into that column
   Finds the lowest empty row in the column and places the coin that coordinate
   Then a player switch or victory is triggered
   ===================================================================== */
function handleDrop(col) {
  if (gameOver) return;  // Ignores any interaction after a game over

  // Scans from the bottom upwards to find the first empty slot
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) { targetRow = r; break; }
  }
  if (targetRow === -1) return;  // This makes it so if a column is full, nothing happens

  // Place the current player's coin (yellow or red) into the board layout data
  board[targetRow][col] = currentPlayer;

  // Just makes it remember who dropped the coin because the current player may change before the animation is finished
  const droppingPlayer = currentPlayer;

  // Different dropping sounds for each player
  AudioManager.play(droppingPlayer === 'red' ? 'plop1' : 'plop2');

  // Checks if there is a win through 4 in a row
  const winningCells = checkWin(targetRow, col);

  if (winningCells) {
    // If there is a winner, all these processes happen
    // First the animation, board is re-rendered with new coin, and winners 4 in a row is highlighted, and the banner appears
    animateFly(col, targetRow, droppingPlayer, () => {
      renderBoard();
      highlightWinners(winningCells);
      showWinner();
    });
    return;
  }

  // Conversely, if there is no winner, these processes happen
  // Player is switched, animation happens, and the board is re-rendered with new coin
  switchPlayer();
  animateFly(col, targetRow, droppingPlayer, () => {
    renderBoard();
    // This updates the coin you see above the board to the opposite player
    updatePreviewCoin(col);
  });
}


/* ANIMATE FLY
   I had issues aligning this animation but I finally got there
   This creates a temporary dropping/flying coin div that animates 
   from the preview coins position to the lowest empty cell in the clicked column.
   Then it deletes itself

   I chose an overlay div over the actual cell coin because those cell coins
   are inside overflow : hidden in the css so anything outside its boundaries is cut off 
   and be invisible

   So instead I made a temporary copy and attached it to the .board-wrapper
   with no overflow restriction, so it can travel the full length. When it finishes falling,
   the copy is deleted

   Each coin needs to fall a different distance at different speed depending on where it's landing.
   Instead of writing keyframes animations in javascript for every drop, I used CSS variables (fly from, fly to,
   fly duration) as placeholders inside the CSS

   JS sets the variables on the temporary coin before it animates and CSS keyframes
   use the values given. 
   */

function animateFly(col, targetRow, player, onComplete) {
  // Calculates the exact postioning for the column clicked
  const edgeOffset = BOARD_BORDER + BOARD_PADDING + 4;  // adds the border padding and margin
  const colLeft = edgeOffset + col * (CELL_SIZE + GAP);

  // The coin starts where the preview coin is and ends at the top of the target cell.
  // Then the real coin slots into place making a pretty smooth transition
  const flyFrom = 16;
  const flyTo   = PREVIEW_HEIGHT + edgeOffset + targetRow * (CELL_SIZE + GAP);

  // Added longer time for coins falling further to give a sense of gravity and to make sure different heights speeds
  // didn't feel mismatched
  const duration = 150 + (targetRow + 1) * 80;

  // Creates the overlay coin element
  const flyer = document.createElement('div');
  flyer.classList.add('flying-coin', player);  // makes sure the right colour is chosen

  // Sets the properties which the CSS keyframes then reads
  flyer.style.setProperty('--fly-from',     `${flyFrom}px`);
  flyer.style.setProperty('--fly-to',       `${flyTo}px`);
  flyer.style.setProperty('--fly-duration', `${duration}ms`);
  flyer.style.left = `${colLeft}px`;

  // Attaches to the wrapper as mentioned before, so it is above everything and seen
  boardWrapper.appendChild(flyer);

  // When the CSS animation ends, remove the temporary coin 
  flyer.addEventListener('animationend', () => {
    flyer.remove();
    onComplete();
  }, { once: true });  // auto-removes the listener once fired
}


/* POP OUT
   Right click removes an opponents coin and applies gravity to all the coins
   above the removed in the column, to move them down

   There was an issue with the animation not finishing before the board state 
   updated, so I made it so the board is modified following the animations completion */

function handlePopOut(row, col) {
  if (gameOver) return;

  const opponent = currentPlayer === 'red' ? 'yellow' : 'red';

  // Makes it so you can only remove your opponents coin, not your own
  if (board[row][col] !== opponent) return;

  // Finds the coin to animate it out
  const cells = boardEl.querySelectorAll('.cell');
  const targetCell = cells[row * COLS + col];
  const coin = targetCell.querySelector('.coin');

  if (coin) {
    AudioManager.play('shrink');  // Shrinking sound like PAC MAN

    // Adds the CSS animation class, removes coin
    coin.classList.add('popping');
    coin.addEventListener('animationend', () => {
      applyPopOut(row, col);
    }, { once: true });
  } else {
    // No coin element exists
    applyPopOut(row, col);
  }
}


/* APPLY POP OUT
   Modifies the board so coins above the removed cell shift down by one.
   Then checks for a win from this change! */

function applyPopOut(row, col) {
  // Shifts rows in the column down by one
  for (let r = row; r > 0; r--) {
    board[r][col] = board[r - 1][col];
  }
  // The previous top row is now empty
  board[0][col] = null;

  // Checks for a winner (same as before when placing a coin)
  const winningCells = checkWin(row, col);
  if (winningCells) {
    renderBoard();
    highlightWinners(winningCells);
    showWinner();
    return;
  }

  // Same as before, no winner: switch player turn
  switchPlayer();
  renderBoard();
}


/* HANDLE MOUSE ENTER
   Fires when a mouse enters leading to two visual effects:
   1. every cell in the column hovered over is highlighted
   2. opponents coin hovered over is highlighted, plus a crosshair appears
      for extra emphasis

    At one point I accidentally had it so all the opponents coins in a column were highlighted. 
    So I fixed the issue having the individual coin highlighting for a clearer representation
    of a clicks effect. */


function handleMouseEnter(row, col) {
  if (gameOver) return;

  const opponent = currentPlayer === 'red' ? 'yellow' : 'red';
  const cells = boardEl.querySelectorAll('.cell');

  cells.forEach(cell => {
    const c = parseInt(cell.dataset.col);
    const r = parseInt(cell.dataset.row);

    // Highlights the whole column hovered over
    if (c === col) cell.classList.add('col-hover');

    // The opponent coin is highlighted
    if (c === col && r === row && board[r][c] === opponent) {
      const coin = cell.querySelector('.coin');
      if (coin) coin.classList.add('opponent-hover');
    }
  });

  updatePreviewCoin(col);
}


/* HANDLE MOUSE LEAVE
   Clears all the hover stylings when mouse leaves the cells. */

function handleMouseLeave() {
  boardEl.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('col-hover'); // Removes the column highlights
    const coin = cell.querySelector('.coin');
    if (coin) coin.classList.remove('opponent-hover');  // Remove the crosshair and the coin highlight
  });
  hidePreviewCoin();  // Hides the preview coin above the board
}


/* UPDATE PREVIEW COIN  
   Makes the preview coin appear above the board to sit above the hovered column
   Uses the same calculation for it's position as animateFly so the animation
   and preview coin are aligned */

function updatePreviewCoin(col) {
  // Aligns it's position as seen before
  const offset = BOARD_BORDER + BOARD_PADDING + 4 + col * (CELL_SIZE + GAP);
  previewCoin.style.left = `${offset}px`;

  // Sets the colour and makes it visible
  previewCoin.className = `preview-coin ${currentPlayer} visible`;
}


/* HIDE PREVIEW COIN
   Removes the visible class which triggers the CSS to make it disappear*/

function hidePreviewCoin() {
  previewCoin.classList.remove('visible');
}


/* SWITCH PLAYER
   Changes current player colour and makes the turn UI reflect the same */

function switchPlayer() {
  currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
  updateTurnIndicator();
}


/* UPDATE TURN INDICATOR
   Synchronises the colour and text for the turn indicator. Default class is red */
function updateTurnIndicator() {
  const playerName = currentPlayer === 'red' ? 'Player 1' : 'Player 2';
  turnTextEl.textContent = `${playerName}'s turn`;

  // Reset to to default (red) then change to yellow when current player is player 2
  turnCoinEl.className = 'turn-coin';
  if (currentPlayer === 'yellow') turnCoinEl.classList.add('yellow');
}


/* CHECK WIN 
   Probably the most important part in the games success. To check the win,
   the whole board is scanned to find if four OR MORE coins of the same colour
   are next to each other in a line.

   If found, returns the co-ordinates which form the winning line, or null
   if a win isn't found. If a win is found, those winning coins are highlighted.

   The checks, looks for horizontal, vertical, diagonal this way: / and diagonal this way \

   Each direction is scanned forward and backward 
   
   The whole board isn't scanned though. Only the directions from the coined just placed
   are scanned, as this is most efficient (and far easier for me to make :) )*/

function checkWin(row, col) {
  const player = board[row][col];
  if (!player) return null;  // Nothing to check if empty cell

  // The four directions it checks. This is the movement of the checking e.g. one up one across for diagonal 
  const directions = [
    [0,  1],   // horizontal
    [1,  0],   // vertical
    [1,  1],   // diagonal \
    [1, -1],   // diagonal /
  ];

  for (const [dr, dc] of directions) {
    // Starts from last placed coin
    const cells = [[row, col]];

    // Checking in positive direction
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      cells.push([r, c]); r += dr; c += dc;
    }

    // Checking in negative directions
    r = row - dr; c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      cells.push([r, c]); r -= dr; c -= dc;
    }

    // If four or more are in a line: A WIN!
    if (cells.length >= 4) return cells;
  }

  return null;  // No winning line found
}


/* HIGHLIGHT WINNERS
   Adds the winner CSS class to the coins to make them glow if they are part of the winning line*/
function highlightWinners(cells) {
  const allCells = boardEl.querySelectorAll('.cell');
  cells.forEach(([r, c]) => {
    // Convert the coordinates to a single number for the Nodelist, otherwise the coin could not be found. It's just the conversion
    // between the languages of the board array coordinates and the visual elements
    const cell = allCells[r * COLS + c];
    const coin = cell && cell.querySelector('.coin');
    if (coin) coin.classList.add('winner');
  });
}


/* SHOW WINNER 
   Plays the victory sound, writes the winner text and the banner appears over the board */


function showWinner() {
  gameOver = true;      // Stops anymore interactions
  hidePreviewCoin();    // Removes the preview coin 
  AudioManager.play('victory'); //Plays the victory sound

  // Makes sure the currentplayer doesn't switch from who just won the game
  const playerName = currentPlayer === 'red' ? 'Player 1' : 'Player 2';
  winnerText.textContent = `${playerName} wins!`;

  // Reveals the winner banner over the board
  winnerBanner.classList.remove('hidden');
}


/* EVENT LISTENERS
   1. Play Again button which calls to initialise the board ( initBoard() ) which resets the game obviously
   2. Mouse leaving the board element hides the preview coin, because there was incidents
      when testing, that the preview coin stayed there because my mouse had quickly jumped out of the board
restartBtn.addEventListener('click', initBoard);
boardEl.addEventListener('mouseleave', hidePreviewCoin);


/* START THE GAME
   initBoard() is called when the script loads. This builds the empty board
   and sets the initial state without anything needing to trigger it */
initBoard();