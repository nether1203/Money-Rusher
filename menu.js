// Змінні для меню
let isControlsOpen = false;
const menu = document.querySelector('.menu');
const startButton = document.getElementById('startButton');
const controlsButton = document.getElementById('controlsButton');
const controlsMenu = document.getElementById('controlsMenu');
const closeControls = document.getElementById('closeControls');

// Ініціалізація меню
function init() {
    // Слухачі подій для кнопок
    startButton.addEventListener('click', startGame);
    controlsButton.addEventListener('click', toggleControls);
    closeControls.addEventListener('click', toggleControls);
}

// Функції для кнопок
function startGame() {
    window.location.href = 'game.html';
}

function toggleControls() {
    isControlsOpen = !isControlsOpen;
    controlsMenu.style.display = isControlsOpen ? 'block' : 'none';
}

// Запуск ініціалізації після завантаження DOM
document.addEventListener('DOMContentLoaded', init);
