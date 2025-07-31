// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#00f0f0', // I
    '#0000f0', // J
    '#f0a000', // L
    '#f0f000', // O
    '#00f000', // S
    '#a000f0', // T
    '#f00000'  // Z
];

// Tetris pieces
const SHAPES = [
    null,
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// Game variables
let canvas = null;
let context = null;
let board = [];
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let paused = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0
};

// Initialize the game
function init() {
    // Create the board
    createBoard();
    
    // Initialize player
    resetPlayer();
    
    // Set up event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('pause-button').addEventListener('click', pauseGame);
    
    // Start the game loop
    requestAnimationFrame(update);
}

// Create the game board
function createBoard() {
    board = [];
    for (let y = 0; y < ROWS; y++) {
        board.push(Array(COLS).fill(0));
    }
    
    // Update the board display
    updateBoard();
}

// Reset the player with a new piece
function resetPlayer() {
    const pieces = 'IJLOSTZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    // Check for game over
    if (collide()) {
        gameOver = true;
        document.getElementById('start-button').disabled = false;
        document.getElementById('pause-button').disabled = true;
    }
}

// Create a piece
function createPiece(type) {
    if (type === 'I') return SHAPES[1];
    if (type === 'J') return SHAPES[2];
    if (type === 'L') return SHAPES[3];
    if (type === 'O') return SHAPES[4];
    if (type === 'S') return SHAPES[5];
    if (type === 'T') return SHAPES[6];
    if (type === 'Z') return SHAPES[7];
}

// Draw the board
function updateBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    // Draw the board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (board[y][x]) {
                cell.classList.add(getPieceClass(board[y][x]));
            }
            boardElement.appendChild(cell);
        }
    }
    
    // Draw the current piece
    if (player.matrix) {
        for (let y = 0; y < player.matrix.length; y++) {
            for (let x = 0; x < player.matrix[y].length; x++) {
                if (player.matrix[y][x]) {
                    const cell = document.createElement('div');
                    cell.className = 'cell ' + getPieceClass(player.matrix[y][x]);
                    cell.style.gridRowStart = (player.pos.y + y + 1);
                    cell.style.gridColumnStart = (player.pos.x + x + 1);
                    document.getElementById('board').appendChild(cell);
                }
            }
        }
    }
}

// Get the CSS class for a piece
function getPieceClass(pieceType) {
    const pieces = [null, 'I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return pieces[pieceType];
}

// Check for collision
function collide() {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] &&
                board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Merge the player piece with the board
function merge() {
    for (let y = 0; y < player.matrix.length; y++) {
        for (let x = 0; x < player.matrix[y].length; x++) {
            if (player.matrix[y][x] !== 0) {
                board[y + player.pos.y][x + player.pos.x] = player.matrix[y][x];
            }
        }
    }
}

// Move the player piece
function playerMove(dir) {
    player.pos.x += dir;
    if (collide()) {
        player.pos.x -= dir;
    } else {
        updateBoard();
    }
}

// Rotate the player piece
function playerRotate() {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    while (collide()) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix);
            player.pos.x = pos;
            return;
        }
    }
    updateBoard();
}

// Rotate a matrix
function rotate(matrix) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    
    matrix.forEach(row => row.reverse());
}

// Drop the player piece
function playerDrop() {
    player.pos.y++;
    if (collide()) {
        player.pos.y--;
        merge();
        resetPlayer();
        clearLines();
        updateBoard();
    }
    dropCounter = 0;
}

// Hard drop
function playerHardDrop() {
    while (!collide()) {
        player.pos.y++;
    }
    player.pos.y--;
    playerDrop();
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        // Remove the line
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        linesCleared++;
        y++;
    }
    
    if (linesCleared > 0) {
        // Update score
        lines += linesCleared;
        score += linesCleared * 100 * level;
        
        // Update level
        level = Math.floor(lines / 10) + 1;
        
        // Update drop speed
        dropInterval = 1000 - (level - 1) * 100;
        if (dropInterval < 100) dropInterval = 100;
        
        // Update display
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lines').textContent = lines;
    }
}

// Handle key presses
function handleKeyPress(event) {
    if (gameOver || paused) return;
    
    switch (event.keyCode) {
        case 37: // Left arrow
            playerMove(-1);
            break;
        case 39: // Right arrow
            playerMove(1);
            break;
        case 40: // Down arrow
            playerDrop();
            break;
        case 38: // Up arrow
            playerRotate();
            break;
        case 32: // Space
            playerHardDrop();
            break;
    }
}

// Start the game
function startGame() {
    if (gameOver) {
        // Reset the game
        createBoard();
        score = 0;
        level = 1;
        lines = 0;
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lines').textContent = lines;
        gameOver = false;
    }
    
    paused = false;
    document.getElementById('start-button').disabled = true;
    document.getElementById('pause-button').disabled = false;
    resetPlayer();
    updateBoard();
}

// Pause the game
function pauseGame() {
    paused = !paused;
    document.getElementById('pause-button').textContent = paused ? 'Resume' : 'Pause';
}

// Game loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!paused && !gameOver) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }
    
    updateBoard();
    requestAnimationFrame(update);
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', init);