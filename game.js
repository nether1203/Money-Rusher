// Основні змінні
let isPaused = false;
let currentLevel = 1;
let score = 0;

// Лідерборд — найкращий результат
let leaderboard = parseInt(localStorage.getItem('platformGameBestScore')) || 0;

// Елементи DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const pauseOverlay = document.getElementById('pauseOverlay');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Клавіші
const keys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Гравець
const player = {
    x: 50,
    y: canvas.height - 100,
    width: 40,
    height: 40,
    color: '#FFD700',
    velocityX: 0,
    velocityY: 0,
    gravity: 0.5,
    speed: 4.5,
    jumpForce: -12,
    jumps: 2,
    maxJumps: 3,
    canJump: true,
    isDead: false
};

const platforms = [];
const coins = [];

function showLeaderboard() {
    console.log(`Найкращий рахунок: ${leaderboard}`);
}

function resetGame() {
    currentLevel = 1;
    score = 0; // Скидаємо рахунок при смерті

    if (score > leaderboard) {
        leaderboard = score;
        localStorage.setItem('platformGameBestScore', leaderboard);
        alert(`Нова вершина! Ваш рекорд: ${leaderboard}`);
    }
    if (scoreElement) scoreElement.textContent = score;
    initLevel();
}

function initLevel() {
    platforms.length = 0;
    coins.length = 0;

    const platformCount = Math.min(6, 1 + currentLevel); // максимум 6 платформ
    const coinCount = 5 + currentLevel * 2;

    createPlatforms(platformCount);
    createCoins(coinCount);

    player.x = 50;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.jumps = player.maxJumps;
    player.isDead = false;

    if (scoreElement) scoreElement.textContent = score;
}

function createPlatforms(count) {
    const platformHeight = 20;
    const platformColors = ['#4CAF50', '#FF4444'];
    platforms.push({
        x: 0,
        y: canvas.height - platformHeight,
        width: canvas.width,
        height: platformHeight,
        color: platformColors[0],
        hasSpikes: false
    });

    let prevY = canvas.height - platformHeight;
    let attempts = 0;
    const sidePadding = 50;

    while (platforms.length < count && attempts < 100) {
        const width = 180;
        const maxGap = 100;
        const x = Math.random() * (canvas.width - width - 2 * sidePadding) + sidePadding;
        const y = prevY - (Math.random() * maxGap + 50);

        let overlapped = platforms.some(p => Math.abs(p.y - y) < 5 && x < p.x + p.width && x + width > p.x);
        if (overlapped || y < 0) {
            attempts++;
            continue;
        }

        const hasSpikes = Math.random() < 0.2;
        const color = hasSpikes ? platformColors[1] : platformColors[0];

        platforms.push({ x, y, width, height: platformHeight, color, hasSpikes });
        prevY = y;
        attempts++;
    }
}

function createCoins(count) {
    const radius = 10;
    let attempts = 0;

    while (coins.length < count && attempts < count * 20) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        if (platform.hasSpikes) {
            attempts++;
            continue;
        }

        const minX = platform.x + radius + 10;
        const maxX = platform.x + platform.width - radius - 10;
        const x = Math.random() * (maxX - minX) + minX;

        let y = platform.y - 30;
        if (y - radius < 0) y = radius;

        coins.push({ x, y, radius, color: '#FFD700' });
        attempts++;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    platforms.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    coins.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();
    });
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function update() {
    if (isPaused || player.isDead) return;

    player.velocityY += player.gravity;

    if (keys.ArrowLeft) player.velocityX = -player.speed;
    else if (keys.ArrowRight) player.velocityX = player.speed;
    else player.velocityX = 0;

    player.x += player.velocityX;
    player.y += player.velocityY;

    if (keys.ArrowUp && player.jumps > 0) {
        player.velocityY = player.jumpForce;
        player.jumps--;
        keys.ArrowUp = false;
    }

    if (player.x < 0) {
        player.x = 0;
        player.velocityX = player.speed;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.velocityX = -player.speed;
    }

    platforms.forEach(p => {
        if (checkCollision(player, p)) {
            if (player.velocityY > 0) {
                player.velocityY = 0;
                player.y = p.y - player.height;
                player.jumps = player.maxJumps;
                if (p.hasSpikes) gameOver();
            }
        }
    });

    coins.forEach((coin, index) => {
        if (checkPlayerCoinCollision(player, coin)) {
            coins.splice(index, 1);
            score += 10;
            if (scoreElement) scoreElement.textContent = score;
        }
    });

    if (coins.length === 0) {
        currentLevel++;
        initLevel();
    }

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.jumps = player.maxJumps;
    }

    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }
}

function gameLoop() {
    update();
    draw();
    if (!isPaused && !player.isDead) requestAnimationFrame(gameLoop);
}

function pauseGame() {
    isPaused = true;
    pauseOverlay.style.display = 'flex';
}

function resumeGame() {
    isPaused = false;
    pauseOverlay.style.display = 'none';
    requestAnimationFrame(gameLoop);
}

function backToMenu() {
    location.href = 'index.html';
}

function gameOver() {
    player.isDead = true;
    if (score > leaderboard) {
        leaderboard = score;
        localStorage.setItem('platformGameBestScore', leaderboard);
        alert(`Гра закінчена! Новий рекорд: ${leaderboard}`);
    } else {
        alert('Гра закінчена! Спробуйте ще раз.');
    }
    resetGame();
}

function checkCollision(r1, r2) {
    return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y + r1.height >= r2.y && r1.y + r1.height <= r2.y + r2.height;
}

function checkPlayerCoinCollision(player, coin) {
    const closestX = Math.max(player.x, Math.min(coin.x, player.x + player.width));
    const closestY = Math.max(player.y, Math.min(coin.y, player.y + player.height));
    const dx = coin.x - closestX;
    const dy = coin.y - closestY;
    return dx * dx + dy * dy <= coin.radius * coin.radius;
}

document.addEventListener('keydown', e => {
    if (e.code in keys) keys[e.code] = true;
});

document.addEventListener('keyup', e => {
    if (e.code in keys) keys[e.code] = false;
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

// Старт гри
resizeCanvas();
initLevel();
requestAnimationFrame(gameLoop);
