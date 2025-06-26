const controlsSection = document.getElementById("controlsSection");

// Спочатку ховаємо блок з керуванням
controlsSection.style.display = "none";

// Функція для початку гри
function startGame() {
    location.href = "game.html"; // Переходимо на гру
}

// Функція для показу/приховання блоку керування
function toggleControls() {
    if (controlsSection.style.display === "none") {
        controlsSection.style.display = "block";
    } else {
        controlsSection.style.display = "none";
    }
}