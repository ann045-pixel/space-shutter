// ==================== НАСТРОЙКА ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shootSound = new Audio('laser-blast-descend_gy7c5deo.mp3')

canvas.width = 400;
canvas.height = 480;
// ==================== ЗВЁЗДЫ (ФИКСИРОВАННЫЕ) ====================
const stars = [];
for (let i = 0; i < 100; i++) {  // Создаём 100 звёзд
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1
    });
}

// ==================== ИГРОВЫЕ ПЕРЕМЕННЫЕ ====================
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    level: 1,
    lives: 3,
    enemies: [],        
    bullets: [],       
    ufoX: canvas.width / 2 - 25,  
    enemySpawnTimer: 0,
    ENEMY_SPAWN_INTERVAL: 20,
    bulletSpawnTimer: 0,     
    BULLET_SPAWN_INTERVAL: 15 
};

// ==================== ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ====================
const scoreElement = document.querySelector('.score span');
const levelElement = document.querySelector('.level span');
const livesElement = document.querySelector('.lives');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const pauseScreen = document.getElementById('pauseScreen');
const resumeButton = document.getElementById('resumeButton');
const restartFromPauseButton = document.getElementById('restartFromPauseButton');
const quitButton = document.getElementById('quitButton')

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let animationFrameId = null;  

// ==================== УПРАВЛЕНИЕ ====================
canvas.addEventListener('mousemove', (e) => {
    if (!gameState.isPlaying) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    gameState.ufoX = (e.clientX - rect.left) * scaleX - 25;
    gameState.ufoX = Math.max(0, Math.min(gameState.ufoX, canvas.width - 50));
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameState.isPlaying) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    gameState.ufoX = (e.touches[0].clientX - rect.left) * scaleX - 25;
    gameState.ufoX = Math.max(0, Math.min(gameState.ufoX, canvas.width - 50));
});

// ==================== СТРЕЛЬБА ПО КЛИКУ ====================
canvas.addEventListener('click', (e) => {
    if (!gameState.isPlaying) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    console.log('Клик в координатах:', clickX, clickY);
    
    spawnBulletWithTarget(clickX, clickY);
});
// Для мобильных устройств (тап)
canvas.addEventListener('touchstart', (e) => {
    if (!gameState.isPlaying) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
    const touchY = (e.touches[0].clientY - rect.top) * scaleY;
    
    spawnBulletWithTarget(touchX, touchY);
});

// ==================== ПАУЗА ПО КЛАВИШЕ P ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'р' || e.key === 'Р') {
        if (gameState.isPlaying) {
            gameState.isPaused = !gameState.isPaused;
            
            if (gameState.isPaused) {
                pauseScreen.classList.add('active');  // Показываем меню паузы
            } else {
                pauseScreen.classList.remove('active');  // Прячем меню
            }
        }
    }
});

// ==================== СОЗДАНИЕ ВРАГОВ ====================
function spawnEnemy() {
    const isUfo = Math.random() < 0.3; // 30% тарелки, 70% астероиды
    
    gameState.enemies.push({
        x: Math.random() * (canvas.width - 50) + 25,
        y: 20,
        speed: 1.5 + gameState.level * 0.3,
        type: isUfo ? 'ufo' : 'asteroid'
    });
}

// ==================== СОЗДАНИЕ ПУЛИ С НАПРАВЛЕНИЕМ ====================
function spawnBulletWithTarget(targetX, targetY) {
    // Позиция НЛО
    const fromX = gameState.ufoX + 22;
    const fromY = canvas.height - 70;
    
    // Вычисляем направление к цели
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    
    // Защита от деления на ноль (если кликнули прямо в НЛО)
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
    
    // Вычисляем длину вектора
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Нормализуем вектор (чтобы пуля летела с постоянной скоростью)
    // и умножаем на скорость
    const speed = 8;
    const vx = (dx / length) * speed;
    const vy = (dy / length) * speed;
    
    console.log('Стрельба:', fromX, fromY, '->', targetX, targetY, 'вектор:', vx, vy);
    
    gameState.bullets.push({
        x: fromX,
        y: fromY,
        vx: vx,
        vy: vy,
        width: 6,
        height: 6,
        active: true
    });
    
    if (shootSound) {
        shootSound.currentTime = 0;
        shootSound.play().catch(e => console.log('Звук не загрузился'));
    }
}

// ==================== ДВИЖЕНИЕ ВРАГОВ ====================
function updateEnemies() {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        let enemy = gameState.enemies[i];
        enemy.y += enemy.speed;
        
        // Столкновение с ракетой
        if (enemy.y > canvas.height - 90 && 
            enemy.x > gameState.ufoX - 15 && 
            enemy.x < gameState.ufoX + 65) {
            
            gameState.enemies.splice(i, 1);
            gameState.lives -= 1;
            updateLivesDisplay();
            
            if (gameState.lives <= 0) {
                gameOver();
                return;
            }
        }
        
        // Улетел за экран
        else if (enemy.y > canvas.height) {
            gameState.enemies.splice(i, 1);
        }
    }
}

// ==================== ДВИЖЕНИЕ ПУЛЬ И ПОПАДАНИЯ ====================
function updateBullets() {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        let bullet = gameState.bullets[i];
        
        // Двигаем пулю по вектору
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Проверка попаданий
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            let enemy = gameState.enemies[j];
            
            // Упрощенная проверка столкновения (круг-круг)
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) { // Радиус столкновения
                // Попадание!
                gameState.bullets.splice(i, 1);
                gameState.enemies.splice(j, 1);
                gameState.score += 10;
                gameState.level = Math.floor(gameState.score / 50) + 1;
                
                if (scoreElement) scoreElement.textContent = gameState.score;
                if (levelElement) levelElement.textContent = gameState.level;
                
                break; // Пуля исчезла
            }
        }
        
        // Удаляем пули, улетевшие за экран
        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            gameState.bullets.splice(i, 1);
        }
    }
}

// ==================== ДВИЖЕНИЕ ЗВЁЗД ====================
function updateStars() {
    stars.forEach(star => {
        star.y += 0.5;  // Скорость падения звёзд
        if (star.y > canvas.height) {
            star.y = 0;  // Телепорт наверх
            star.x = Math.random() * canvas.width;  // Новая случайная позиция
        }
    });
}

// ==================== ОТОБРАЖЕНИЕ ЖИЗНЕЙ ====================
function updateLivesDisplay() {
    if (livesElement) {
        let hearts = '';
        for (let i = 0; i < 3; i++) {
            hearts += i < gameState.lives ? '❤️' : '🖤';
        }
        livesElement.innerHTML = hearts;
    }
}

// ==================== ОТРИСОВКА ====================
function draw() {
    // Космический фон
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Звезды
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    
    // НЛО с лучами
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.font = '50px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.fillText('🛸', gameState.ufoX, canvas.height - 50);
    ctx.shadowBlur = 0;
    
    // Враги
    ctx.font = '40px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    gameState.enemies.forEach(enemy => {
        if (enemy.type === 'asteroid') {
            ctx.fillText('☄️', enemy.x, enemy.y);
        } else {
            ctx.fillText('👾', enemy.x, enemy.y);
        }
    });
    
    // Пули
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    
    gameState.bullets.forEach(bullet => {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        const angle = Math.atan2(bullet.vy, bullet.vx);
        ctx.rotate(angle);
        ctx.fillRect(-8, -2, 16, 4);
        ctx.restore();
    });
    
    ctx.shadowBlur = 0;
}

// ==================== ИГРОВОЙ ЦИКЛ ====================
function gameLoop() {
    if (!gameState.isPlaying) return;
    
    if (gameState.isPaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    updateStars();
    
    gameState.enemySpawnTimer++;
    if (gameState.enemySpawnTimer >= gameState.ENEMY_SPAWN_INTERVAL) {
        spawnEnemy();
        gameState.enemySpawnTimer = 0;
    }
    
    updateEnemies();
    updateBullets();
    draw();
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// ==================== КНОПКИ МЕНЮ ПАУЗЫ ====================
if (resumeButton) {
    resumeButton.addEventListener('click', () => {
        gameState.isPaused = false;
        pauseScreen.classList.remove('active');
    });
}

if (restartFromPauseButton) {
    restartFromPauseButton.addEventListener('click', () => {
        gameState.isPaused = false;
        pauseScreen.classList.remove('active');
        startGame();
    });
}

if (quitButton) {
    quitButton.addEventListener('click', () => {
        stopGameLoop(); 
        gameState.isPlaying = false;
        gameState.isPaused = false;
        pauseScreen.classList.remove('active');
        startScreen.classList.add('active');
    });
}

// ==================== ОСТАНОВКА ИГРОВОГО ЦИКЛА ====================
function stopGameLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log('Цикл остановлен');
    }
}

// ==================== GAME OVER ====================
function gameOver() {
    stopGameLoop();
    gameState.isPlaying = false;
    if (finalScoreElement) finalScoreElement.textContent = gameState.score;
    if (gameOverScreen) gameOverScreen.classList.add('active');
     if (pauseScreen) pauseScreen.classList.remove('active');
}

// ==================== СТАРТ ====================
function startGame() {
    stopGameLoop();
     stars.length = 0;  // Очищаем массив
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1
        });
    }
    gameState = {
        isPlaying: true,
        score: 0,
        level: 1,
        lives: 3,
        enemies: [],
        bullets: [],
        ufoX: canvas.width / 2 - 25,
        enemySpawnTimer: 0,
        ENEMY_SPAWN_INTERVAL: 40,
        bulletSpawnTimer: 0,
        BULLET_SPAWN_INTERVAL: 15
    };
    
    if (scoreElement) scoreElement.textContent = '0';
    if (levelElement) levelElement.textContent = '1';
    updateLivesDisplay();
    
    if (startScreen) startScreen.classList.remove('active');
    if (gameOverScreen) gameOverScreen.classList.remove('active');
     if (pauseScreen) pauseScreen.classList.remove('active');
    gameLoop();
}

// ==================== КНОПКИ ====================
if (startButton) startButton.addEventListener('click', startGame);

if (restartButton) restartButton.addEventListener('click', startGame);
