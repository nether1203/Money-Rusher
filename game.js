// Ініціалізація canvas
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

// Об'єкт для зберігання стану клавіш
const keys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Змінні для гри
let score = 0;
let scoreElement = null;
let pauseOverlay = null;
let isGameStarted = false;
let isPaused = false;
let lastTime = 0;

// Платформи та монети
const platforms = [];
const coins = [];

// Гравець
const player = {
    x: 50,
    y: 0, // Початкова позиція буде встановлена під час ініціалізації
    width: 40,
    height: 40,
    speed: 3,
    velocityX: 0,
    velocityY: 0,
    gravity: 0.5,
    jumpForce: -10, // Зменшена сила стрибка для кращого контролю
    color: '#FFD700',
    canJump: true,
    isDead: false,
    maxJumps: 2, // Максимальна кількість стрибків для подвійного стрибка
    jumps: 2      // Поточна кількість доступних стрибків
};

// Функція для обчислення параметрів рівня
function getLevelSettings(level) {
    // Базові параметри
    const basePlatformCount = 10;
    const baseCoinCount = 5;
    const baseGravity = 0.25;
    const baseSpeed = 3;
    const basePlatformWidth = 180;
    const baseMinGap = 100;
    const baseMaxGap = 150;
    
    // Зміна параметрів з рівнем
    const platformCount = basePlatformCount + Math.floor((level - 1) * 0.5);
    const coinCount = baseCoinCount + Math.floor((level - 1) * 0.3);
    const gravity = baseGravity + (level - 1) * 0.01;
    const speed = baseSpeed + (level - 1) * 0.05;
    const minGap = baseMinGap - (level - 1) * 10;
    const maxGap = baseMaxGap - (level - 1) * 10;
    
    return {
        platformCount: platformCount,
        coinCount: coinCount,
        gravity: gravity,
        speed: speed,
        minGap: minGap,
        maxGap: maxGap,
        platformWidth: basePlatformWidth
    };
}

// Оновлення гри
function update() {
    if (isPaused || player.isDead) return; // Не оновлюємо гру при паузі або смерті

    // Гравітація
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // Рух вправо/вліво
    if (keys.ArrowLeft && player.x > 0) {
        player.velocityX = -player.speed;
    } else if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.velocityX = player.speed;
    } else {
        player.velocityX = 0;
    }
    player.x += player.velocityX;

    // Стрибки
    if (keys.ArrowUp && canPlayerJump()) {
        doJump();
    }

    // Перевірка колізій з платформами
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            player.velocityY = 0;
            player.y = platform.y - player.height;
            player.canJump = true;
            player.jumps = player.maxJumps;
        }
    });

    // Збір монет
    collectCoins();

    // Обмеження верхньої границі
    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }

    // Обмеження нижньої границі
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
    }
}

// Функції паузи
function pauseGame() {
    // Запобігаємо повторному виклику паузи
    if (isPaused) return;
    
    isPaused = true;
    pauseOverlay.style.display = 'flex';
    
    // Скидаємо клавіші при паузі
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    
    // Зберігаємо стан гравця перед паузою
    player.pauseState = {
        velocityX: player.velocityX,
        velocityY: player.velocityY,
        jumps: player.jumps,
        canJump: player.canJump,
        x: player.x,
        y: player.y,
        speed: player.speed,
        gravity: player.gravity,
        jumpForce: player.jumpForce,
        jumpDuration: player.jumpDuration,
        jumpTime: player.jumpTime,
        isDead: player.isDead
    };
}

function resumeGame() {
    // Запобігаємо повторному виклику резюме
    if (!isPaused) return;
    
    isPaused = false;
    pauseOverlay.style.display = 'none';
    
    // Відновлюємо стан гравця після паузи
    if (player.pauseState) {
        player.velocityX = player.pauseState.velocityX;
        player.velocityY = player.pauseState.velocityY;
        player.jumps = player.pauseState.jumps;
        player.canJump = player.pauseState.canJump;
        player.x = player.pauseState.x;
        player.y = player.pauseState.y;
        player.speed = player.pauseState.speed;
        player.gravity = player.pauseState.gravity;
        player.jumpForce = player.pauseState.jumpForce;
        player.jumpDuration = player.pauseState.jumpDuration;
        player.jumpTime = player.pauseState.jumpTime;
        player.isDead = player.pauseState.isDead;
        delete player.pauseState;
    }
    
    // Запускаємо оновлення гри
    gameLoop();
}

// Функція для завершення гри
function gameOver() {
    player.isDead = true;
    pauseOverlay.innerHTML = `
        <div>
            <h2>Гра закінчена</h2>
            <p>Ваш рахунок: ${score}</p>
            <button onclick="restartGame()">Спробувати ще раз</button>
            <button onclick="backToMenu()">В головне меню</button>
        </div>
    `;
    pauseOverlay.style.display = 'flex';
    pauseOverlay.classList.add('game-over');
}

// Функція для перезапуску гри
function restartGame() {
    // Скидаємо всі змінні
    currentLevel = 1;
    score = 0;
    scoreElement.textContent = score;
    
    // Скидаємо стан гравця
    player.x = 50;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.jumps = player.maxJumps;
    player.canJump = true;
    player.isDead = false;
    
    // Скидаємо платформи та монети
    platforms.length = 0;
    coins.length = 0;
    
    // Ініціалізуємо нову гру
    initLevel();
    pauseOverlay.style.display = 'none';
    pauseOverlay.classList.remove('game-over');
    gameLoop();
}

function backToMenu() {
    // Скидаємо гру
    isGameStarted = false;
    isPaused = false;
    pauseOverlay.style.display = 'none';
    // Перенаправляємо в меню
    window.location.href = 'index.html';
}

let currentLevel = 1;

// Запуск ініціалізації після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізація елементів DOM
    scoreElement = document.getElementById('score');
    pauseOverlay = document.getElementById('pauseOverlay');
    
    // Ініціалізація canvas
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas context!');
        return;
    }
    
    // Встановлюємо розмір canvas
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // Ініціалізація клавіатурних дій
    document.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowUp') {
            e.preventDefault(); // Запобігаємо стандартному поведінку
            keys[e.code] = true;
            console.log('Jump key pressed!'); // Для дебагу
        } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            keys[e.code] = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowUp' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            keys[e.code] = false;
        }
    });

    // Ініціалізація гри
    initGame();
});

// Функція для ініціалізації гри
function initGame() {
    console.log('Initializing game...');
    
    // Скидаємо всі змінні
    currentLevel = 1;
    score = 0;

    // Скидаємо стан клавіш
    keys.ArrowUp = false;
    keys.ArrowLeft = false;
    keys.ArrowRight = false;

    scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    // Скидаємо платформи та монети
    platforms.length = 0;
    coins.length = 0;
    
    // Скидаємо стан гравця
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.canJump = true;
    player.isDead = false;
    player.jumps = player.maxJumps; // Скидаємо кількість стрибків
    
    // Оновлюємо параметри рівня
    const levelSettings = getLevelSettings(currentLevel);
    player.gravity = levelSettings.gravity;
    player.speed = levelSettings.speed;
    player.jumpForce = -10;
    
    // Додаємо дебаг інформацію
    console.log('Player settings:');
    console.log('Gravity:', player.gravity);
    console.log('Jump force:', player.jumpForce);
    console.log('Initial position:', player.x, player.y);
    console.log('Canvas size:', canvas.width, canvas.height);
    
    // Створюємо платформи та монети
    createPlatforms(levelSettings.platformCount);
    createCoins(levelSettings.coinCount);
    
    // Запускаємо гру
    gameLoop();
}

// Функція для ініціалізації рівня
function initLevel() {
    // Очищаємо всі платформи та монети
    platforms.length = 0;
    coins.length = 0;
    
    // Отримуємо параметри рівня
    const levelSettings = getLevelSettings(currentLevel);
    
    // Створюємо платформи
    createPlatforms(levelSettings.platformCount);
    
    // Створюємо монети
    createCoins(levelSettings.coinCount);
    
    // Оновлюємо параметри гравця
    player.gravity = levelSettings.gravity;
    player.speed = levelSettings.speed;
    player.jumpForce = -14;
    player.jumpDuration = 0.2;
    
    // Скидаємо стан гравця
    player.x = 50;
    player.y = canvas.height - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.canJump = true;
    player.jumps = player.maxJumps;
    player.isDead = false;
    
    // Оновлюємо рахунок
    score = 0;
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    // Запускаємо гру
}

function createPlatforms(count) {
    const platformWidth = 100;
    const platformHeight = 20;
    const platformColors = ['#4CAF50', '#FF4444'];
    
    // Створюємо першу платформу біля землі
    platforms.push({
        x: canvas.width / 2 - platformWidth / 2,
        y: canvas.height - 100,
        width: platformWidth,
        height: platformHeight,
        color: platformColors[0],
        hasSpikes: false
    });
    
    // Створюємо решту платформ
    for (let i = 1; i < count; i++) {
        const prevPlatform = platforms[i - 1];
        const gap = Math.random() * 100 + 50; // Випадковий розрив від 50 до 150
        const x = Math.random() * (canvas.width - platformWidth);
        const y = prevPlatform.y - gap;
        const hasSpikes = Math.random() < 0.3; // 30% шанс на шипи
        const color = hasSpikes ? platformColors[1] : platformColors[0];
        
        platforms.push({
            x: x,
            y: y,
            width: platformWidth,
            height: platformHeight,
            color: color,
            hasSpikes: hasSpikes
        });
    }
}

// Ініціалізація монет
function createCoins() {
    const levelSettings = getLevelSettings(currentLevel);
    const coinCount = levelSettings.coinCount;
    const platformHeight = 20;
    
    for (let i = 0; i < coinCount; i++) {
        let validPosition = false;
        let x, y;
        
        // Знаходимо вільну позицію для монети
        while (!validPosition) {
            x = Math.random() * (canvas.width - 40) + 20; // Залишаємо відступи від країв
            y = Math.random() * (canvas.height - 40) + 20;
            
            // Перевіряємо, чи монета не знаходиться на платформі
            let isValid = true;
            platforms.forEach(platform => {
                if (x + 20 > platform.x && x < platform.x + platform.width &&
                    y + 20 > platform.y - platformHeight && y < platform.y + platformHeight) {
                    isValid = false;
                }
            });
            
            if (isValid) {
                validPosition = true;
            }
        }
        
        coins.push({
            x: x,
            y: y,
            radius: 10, // Радіус монети
            color: '#FFD700'
        });
    }
}

// Функція для малювання
function draw() {
    // Очищення canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Малювання платформ
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Якщо на платформі є шипи - малюємо їх
        if (platform.hasSpikes) {
            // Малюємо три шипи по центру платформи
            const spikeHeight = 10;
            const spikeWidth = 5;
            const spikeSpacing = platform.width / 4;
            
            ctx.fillStyle = '#FF0000'; // Червоний колір для шипів
            
            // Лівий шип
            ctx.beginPath();
            ctx.moveTo(platform.x + spikeSpacing, platform.y);
            ctx.lineTo(platform.x + spikeSpacing + spikeWidth, platform.y - spikeHeight);
            ctx.lineTo(platform.x + spikeSpacing - spikeWidth, platform.y - spikeHeight);
            ctx.closePath();
            ctx.fill();
            
            // Середній шип
            ctx.beginPath();
            ctx.moveTo(platform.x + platform.width / 2, platform.y);
            ctx.lineTo(platform.x + platform.width / 2 + spikeWidth, platform.y - spikeHeight);
            ctx.lineTo(platform.x + platform.width / 2 - spikeWidth, platform.y - spikeHeight);
            ctx.closePath();
            ctx.fill();
            
            // Правий шип
            ctx.beginPath();
            ctx.moveTo(platform.x + platform.width - spikeSpacing, platform.y);
            ctx.lineTo(platform.x + platform.width - spikeSpacing + spikeWidth, platform.y - spikeHeight);
            ctx.lineTo(platform.x + platform.width - spikeSpacing - spikeWidth, platform.y - spikeHeight);
            ctx.closePath();
            ctx.fill();
        }
    });

    // Малювання монет
    coins.forEach(coin => {
        ctx.fillStyle = coin.color;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Малювання гравця
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Малювання хітбоксу гравця
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Малювання хітбоксів платформ
    platforms.forEach(platform => {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Малювання хітбоксів монет
    coins.forEach(coin => {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    // Малювання рахунку
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}
// Функція для перевірки колізії гравця з монетою (прямокутник з колом)
function checkPlayerCoinCollision(player, coin) {
    // Знаходимо найближчу точку на прямокутнику гравця до центру монети
    let closestX = Math.max(player.x, Math.min(coin.x, player.x + player.width));
    let closestY = Math.max(player.y, Math.min(coin.y, player.y + player.height));

    // Розраховуємо відстань між найближчою точкою та центром монети
    let distanceX = coin.x - closestX;
    let distanceY = coin.y - closestY;
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    // Зіткнення відбувається, якщо квадрат відстані менший або дорівнює квадрату радіуса монети
    return distanceSquared <= (coin.radius * coin.radius);
}

// Функція для перевірки колізій (гравець на платформі)
function checkCollision(rect1, rect2) {
    // Перевіряємо верхню сторону rect1 з нижньою стороною rect2
    return (rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y + rect1.height >= rect2.y &&
           rect1.y + rect1.height <= rect2.y + rect2.height);
}

// Функція для перевірки, чи можна стрибати
function canPlayerJump() {
    // Перевіряємо, чи є доступні стрибки
    return player.jumps > 0;
}

// Функція для виконання стрибка
function doJump() {
    player.velocityY = player.jumpForce;
    player.jumps--; // Зменшуємо кількість доступних стрибків
}

// Функція для збору монет
function collectCoins() {
    coins.forEach((coin, index) => {
        if (checkPlayerCoinCollision(player, coin)) {
            coins.splice(index, 1);
            score += 10;
            if (scoreElement) {
                scoreElement.textContent = score;
            }
        }
    });
}

// Оновлення гри
function update() {
    if (isPaused || player.isDead) return;

    // Гравітація
    player.velocityY += player.gravity;
    
    // Рух вправо/вліво
    if (keys.ArrowLeft && player.x > 0) {
        player.velocityX = -player.speed;
    } else if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.velocityX = player.speed;
    } else {
        player.velocityX = 0;
    }
    player.x += player.velocityX;

    // Стрибки
    if (keys.ArrowUp && canPlayerJump()) {
        doJump();
    }

    // Перевірка колізій з платформами
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Зупиняємо падіння
            if (player.velocityY > 0) {
                player.velocityY = 0;
                player.y = platform.y - player.height;
                player.jumps = player.maxJumps; // Відновлюємо стрибки при приземленні на платформу
            }
            
            // Перевірка на шипи
            if (platform.hasSpikes) {
                gameOver();
            }
        }
    });

    // Оновлюємо позицію
    player.y += player.velocityY;

    // Збір монет
    collectCoins();

    // Обмеження верхньої границі
    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }

    // Обмеження нижньої границі
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.jumps = player.maxJumps; // Відновлюємо стрибки при приземленні на землю
    }
}

// Головний цикл гри
function gameLoop() {
    if (!canvas || !ctx) {
        console.error('Canvas or context not initialized!');
        return;
    }
    
    // Оновлюємо стан
    update();
    
    // Малюємо
    draw();
    
    // Продовжуємо цикл
    requestAnimationFrame(gameLoop);
}

// Створюємо кнопку паузи
const pauseButton = document.getElementById('pauseButton');
if (pauseButton) {
    pauseButton.addEventListener('click', pauseGame);
}

// Створюємо кнопки в меню
const startButton = document.getElementById('startButton');
if (startButton) {
    startButton.addEventListener('click', startGame);
}

// Ініціалізація гри
initGame();
