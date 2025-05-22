// ================== GAME CONFIG ================== //
const config = {
    width: 800,
    height: 500,
    paddleWidth: 15,
    paddleHeight: 100,
    paddleSpeed: 8,
    ballSize: 12,
    winningScore: 7,
    aiDifficulty: 1 // 1 to 3 difficlities
};

// ================== GAME STATE ================== //
const GameState = {
    MENU: 0,
    SINGLE_PLAYER: 1,
    MULTI_PLAYER: 2,
    PAUSED: 3,
    GAME_OVER: 4
};

let state = {
    current: GameState.MENU,
    previousState: GameState.MENU,
    selectedOption: 0,
    menuOptions: ["Single Player", "Multiplayer",],
    scores: { player1: 0, player2: 0 },
    winner: ""
};

// ================== GAME OBJECTS ================== //
let canvas, ctx;
let ball, player1, player2;

// ================== INITIALIZATION ================== //
function init() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    canvas.width = config.width;
    canvas.height = config.height;

    resetGameObjects();
    setupEventListeners();
    requestAnimationFrame(gameLoop);
}

function resetGameObjects() {
    player1 = {
        x: 20,
        y: config.height/2 - config.paddleHeight/2,
        width: config.paddleWidth,
        height: config.paddleHeight,
        speed: config.paddleSpeed,
        velocityY: 0,
        isAI: false
    };

    player2 = {
        x: config.width - 20 - config.paddleWidth,
        y: config.height/2 - config.paddleHeight/2,
        width: config.paddleWidth,
        height: config.paddleHeight,
        speed: config.paddleSpeed,
        velocityY: 0,
        isAI: state.current === GameState.SINGLE_PLAYER
    };

    resetBall();
}

function resetBall() {
    ball = {
        x: config.width/2 - config.ballSize/2,
        y: config.height/2 - config.ballSize/2,
        width: config.ballSize,
        height: config.ballSize,
        velocityX: 5 * (Math.random() > 0.5 ? 1 : -1),
        velocityY: 3 * (Math.random() * 2 - 1)
    };
}

function resetGame() {
    state.scores = { player1: 0, player2: 0 };
    resetGameObjects();
}

// ================== EVENT HANDLERS ================== //
function setupEventListeners() {
    document.removeEventListener("keydown", handleGameInput);
    document.removeEventListener("keyup", handleKeyRelease);
    document.removeEventListener("keydown", handleMenuInput);

    if (state.current === GameState.MENU || state.current === GameState.GAME_OVER) {
        document.addEventListener("keydown", handleMenuInput);
    } else {
        document.addEventListener("keydown", handleGameInput);
        document.addEventListener("keyup", handleKeyRelease);
    }
}

function handleMenuInput(e) {
    switch(e.key) {
        case "ArrowUp":
            state.selectedOption = (state.selectedOption - 1 + state.menuOptions.length) % state.menuOptions.length;
            break;
        case "ArrowDown":
            state.selectedOption = (state.selectedOption + 1) % state.menuOptions.length;
            break;
        case "ArrowLeft":
            if (state.selectedOption === 0) config.aiDifficulty = Math.max(1, config.aiDifficulty - 1);
            break;
        case "ArrowRight":
            if (state.selectedOption === 0) config.aiDifficulty = Math.min(3, config.aiDifficulty + 1);
            break;
        case "Enter":
            if (state.current === GameState.GAME_OVER) {
                resetGame();
                state.current = GameState.MENU; // Always go back to MENU first
                setupEventListeners();
            } else if (state.selectedOption === 0) {
                state.current = GameState.SINGLE_PLAYER;
                resetGame();
                setupEventListeners();
            } else if (state.selectedOption === 1) {
                state.current = GameState.MULTI_PLAYER;
                resetGame();
                setupEventListeners();
            }
            break;
        case "Escape":
            if (state.current === GameState.PAUSED) {
                state.current = state.previousState;
                setupEventListeners();
            } else if (state.current === GameState.GAME_OVER) {
                state.current = GameState.MENU;
                setupEventListeners();
            } else if (state.current === GameState.MENU) {
                // Do nothing
            } else {
                state.previousState = state.current;
                state.current = GameState.PAUSED;
                setupEventListeners();
            }
            break;
    }
}

function handleGameInput(e) {
    if (e.key === "w") player1.velocityY = -player1.speed;
    else if (e.key === "s") player1.velocityY = player1.speed;
    
    if (!player2.isAI) {
        if (e.key === "ArrowUp") player2.velocityY = -player2.speed;
        else if (e.key === "ArrowDown") player2.velocityY = player2.speed;
    }
    
    if (e.key === "Escape") {
        if (state.current === GameState.PAUSED) {
            state.current = state.previousState;
        } else {
            state.previousState = state.current;
            state.current = GameState.PAUSED;
        }
        setupEventListeners();
    }
}

function handleKeyRelease(e) {
    if (e.key === "w" || e.key === "s") player1.velocityY = 0;
    if (!player2.isAI && (e.key === "ArrowUp" || e.key === "ArrowDown")) player2.velocityY = 0;
}

// ================== GAME LOGIC ================== //
function updateAI() {
    const reactionThreshold = [0.6, 0.4, 0.2][config.aiDifficulty - 1];
    const predictionFactor = [0, 0.5, 1][config.aiDifficulty - 1];
    const errorMargin = [30, 15, 5][config.aiDifficulty - 1];
    
    let predictedY = ball.y;
    if (ball.velocityX > 0) {
        const timeToReach = (player2.x - ball.x) / ball.velocityX;
        predictedY += ball.velocityY * timeToReach * predictionFactor;
        predictedY += (Math.random() * 2 - 1) * errorMargin;
    }
    
    const paddleCenter = player2.y + player2.height/2;
    if (Math.abs(paddleCenter - predictedY) > player2.height * reactionThreshold) {
        player2.velocityY = (predictedY < paddleCenter) ? -player2.speed : player2.speed;
    } else {
        player2.velocityY = 0;
    }
}

function updateGame() {
    // Update positions
    player1.y += player1.velocityY;
    player2.y += player2.velocityY;
    
    // Boundary checking
    player1.y = Math.max(0, Math.min(config.height - player1.height, player1.y));
    player2.y = Math.max(0, Math.min(config.height - player2.height, player2.y));
    
    // Update ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Wall collision
    if (ball.y <= 0 || ball.y + ball.height >= config.height) {
        ball.velocityY = -ball.velocityY;
    }
    
    // Paddle collision
    if (checkCollision(ball, player1) || checkCollision(ball, player2)) {
        ball.velocityX = -ball.velocityX * 1.05;
        ball.velocityY += (Math.random() * 2 - 1) * 2;
    }
    
    // Scoring
    if (ball.x < 0) {
        state.scores.player2++;
        if (state.scores.player2 >= config.winningScore) {
            state.current = GameState.GAME_OVER;
            state.winner = player2.isAI ? "Computer" : "Player 2";
            setupEventListeners();
        } else {
            resetBall();
        }
    }
    if (ball.x > config.width) {
        state.scores.player1++;
        if (state.scores.player1 >= config.winningScore) {
            state.current = GameState.GAME_OVER;
            state.winner = player2.isAI ? "You" : "Player 1";
            setupEventListeners();
        } else {
            resetBall();
        }
    }
}

function checkCollision(ball, paddle) {
    return ball.x < paddle.x + paddle.width &&
           ball.x + ball.width > paddle.x &&
           ball.y < paddle.y + paddle.height &&
           ball.y + ball.height > paddle.y;
}

// ================== RENDERING ================== //
function render() {
    // Clear canvas
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, config.width, config.height);
    
    // Draw center line
    ctx.strokeStyle = "#333";
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(config.width/2, 0);
    ctx.lineTo(config.width/2, config.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // State-based rendering
    if (state.current === GameState.MENU) {
        renderMenu();
    } else if (state.current === GameState.PAUSED) {
        renderGame();
        renderPauseScreen();
    } else if (state.current === GameState.GAME_OVER) {
        renderGame();
        renderGameOver();
    } else {
        renderGame();
    }
}

function renderMenu() {
    // Title
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PONG", config.width/2, 100);
    
    // Options
    ctx.font = "36px Arial";
    state.menuOptions.forEach((option, index) => {
        ctx.fillStyle = (index === state.selectedOption) ? "#0f0" : "#fff";
        ctx.fillText(option, config.width/2, 200 + index * 50);
    });
    
    // Difficulty
    if (state.selectedOption === 0) {
        ctx.font = "24px Arial";
        ctx.fillStyle = "#fff";
        ctx.fillText(`Difficulty: ${["Easy", "Medium", "Hard"][config.aiDifficulty - 1]}`, 
                    config.width/2, 350);
    }
    
    // Controls
    ctx.font = "18px Arial";
    ctx.fillStyle = "#666";
    ctx.fillText("Use Up & Down arrows to navigate, ESC to pause the game & Enter to select", config.width/2, config.height - 50);
}

function renderGame() {
    // Draw paddles
    ctx.fillStyle = "#fff";
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    
    // Draw ball
    ctx.fillStyle = "#fff";
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
    
    // Draw scores
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(state.scores.player1, config.width/4, 50);
    ctx.fillText(state.scores.player2, config.width*3/4, 50);
}

function renderPauseScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, config.width, config.height);
    
    ctx.fillStyle = "#fff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", config.width/2, config.height/2 - 30);
    
    ctx.font = "24px Arial";
    ctx.fillText("Press ESC to resume", config.width/2, config.height/2 + 30);
}

function renderGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, config.width, config.height);
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${state.winner} Won!`, config.width/2, config.height/2 - 60);
    
    ctx.font = "36px Arial";
    ctx.fillText(`${state.scores.player1} - ${state.scores.player2}`, config.width/2, config.height/2);
    
    ctx.font = "24px Arial";
    ctx.fillText("Press ENTER to play again", config.width/2, config.height/2 + 60);
    ctx.fillText("Press ESC for main menu", config.width/2, config.height/2 + 110);
}

// ================== GAME LOOP ================== //
function gameLoop() {
    if (state.current === GameState.SINGLE_PLAYER) updateAI();
    if (state.current === GameState.SINGLE_PLAYER || state.current === GameState.MULTI_PLAYER) {
        updateGame();
    }
    render();
    requestAnimationFrame(gameLoop);
}

// Start the game
window.onload = init;
