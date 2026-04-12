// --- 1. ИНИЦИАЛИЗАЦИЯ ЗВУКА ---
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playHevClick() {
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
}

// --- 2. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
const questTargets = [8, 26, 47, 79];
let discovered = 0;
let timerInterval;
let isHayBurned = false;
let snake, food, direction, gameLoop;
let box = 20;

// --- 3. МАШИНА СОСТОЯНИЙ (STATE MACHINE) ---
function setState(stateName) {
    if (audioContext.state === 'suspended') audioContext.resume();

    const screens = ['state-menu', 'state-game', 'state-win', 'state-biology', 'state-snake'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    if (stateName === 'MENU') {
        document.getElementById('state-menu').style.display = 'flex';
    } 
    else if (stateName === 'GAME') {
        const nick = document.getElementById('player-name').value;
        if (!nick) return alert("ВВЕДИТЕ НИКНЕЙМ!");
        document.getElementById('state-game').style.display = 'block';
        if (document.getElementById('table').innerHTML.trim() === "") buildTable();
        startTimer();
    } 
    else if (stateName === 'BIOLOGY') {
        document.getElementById('state-biology').style.display = 'block';
    }
    else if (stateName === 'SNAKE') {
        document.getElementById('state-snake').style.display = 'block';
        startSnakeGame();
    }
    else if (stateName === 'WIN') {
        document.getElementById('state-win').style.display = 'flex';
        if (timerInterval) clearInterval(timerInterval);
    }
}

// --- 4. СЕКТОР C: ХИМИЯ ---
function buildTable() {
    const table = document.getElementById('table');
    elements.forEach(el => {
        const div = document.createElement('div');
        const isQuest = questTargets.includes(el.n);
        div.className = 'element' + (isQuest ? ' active-quest' : '');
        div.style.gridColumn = el.x;
        div.style.gridRow = el.y;
        div.innerHTML = `<span class="num">${el.n}</span><span class="sym">${el.s}</span><span class="name">${el.name}</span>`;
        div.onclick = () => {
            playHevClick();
            showDetails(el);
            if(isQuest) handleQuest(el.n, div);
        };
        table.appendChild(div);
    });
}

function showDetails(el) {
    const content = document.getElementById('content');
    content.innerHTML = `<h2 style="color:var(--orange)">[ ${el.s} ]</h2><p>${el.name}</p><p>Масса: ${el.m}</p><p>Заряд: +${el.n}</p>`;
    document.getElementById('details').classList.add('open');
}

function closeDetails() { document.getElementById('details').classList.remove('open'); }

function handleQuest(id, div) {
    if (!div.classList.contains('stabilized')) {
        div.classList.add('stabilized');
        div.style.background = "var(--orange)";
        div.style.color = "#000";
        const logo = document.querySelector('.sticky-header .lambda-icon');
        if (logo) {
            logo.classList.add('lambda-flash');
            setTimeout(() => logo.classList.remove('lambda-flash'), 1000);
        }
        discovered++;
        if(discovered === 4) {
            setTimeout(() => {
                const gameArea = document.querySelector('.table-viewport');
                if (gameArea) gameArea.innerHTML = `
                    <div id="logic-quest" style="padding:20px; border:1px dashed var(--orange); text-align:center;">
                        <p style="color:#00ff00;">СЕКТОР D: ИЗВЛЕКИТЕ КЛЮЧ ИЗ СЕНА</p>
                        <button class="menu-button" onclick="checkLogic('matches')">СПИЧКИ</button>
                        <button class="menu-button" onclick="checkLogic('magnet')">МАГНИТ</button>
                        <p id="logic-hint"></p>
                    </div>`;
            }, 1000);
        }
    }
}

// --- 5. СЕКТОР D: ФИЗИКА (СЕНО) ---
function checkLogic(item) {
    playHevClick();
    const hint = document.getElementById('logic-hint');
    if (item === 'matches') {
        isHayBurned = true;
        hint.innerHTML = "СЕНО СГОРЕЛО. ОСТАЛСЯ ПЕПЕЛ.";
    } else if (item === 'magnet') {
        if (isHayBurned) {
            hint.innerHTML = "КЛЮЧ НАЙДЕН! ПЕРЕХОД В СЕКТОР B...";
            setTimeout(() => setState('BIOLOGY'), 2000);
        } else hint.innerHTML = "СЛИШКОМ МНОГО СЕНА!";
    }
}

// --- 6. СЕКТОР B: БИОЛОГИЯ ---
function verifyBiology() {
    playHevClick();
    const ans1 = document.getElementById('bio-1').value;
    const ans6 = document.getElementById('bio-6').value;
    const hint = document.getElementById('bio-hint');
    if (ans1 === 'water' && ans6 === 'xen') {
        hint.innerHTML = "УСПЕХ! ПЕРЕХОД К ТРЕНИРОВКЕ...";
        setTimeout(() => setState('SNAKE'), 2000);
    } else hint.innerHTML = "ОШИБКА В ДАННЫХ!";
}

// --- 7. СЕКТОР S: ЗМЕЙКА ---
function startSnakeGame() {
    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    snake = [{x: 10 * box, y: 10 * box}];
    food = { x: Math.floor(Math.random() * 14 + 1) * box, y: Math.floor(Math.random() * 14 + 1) * box };
    direction = "right";
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        let snakeX = snake[0].x;
        let snakeY = snake[0].y;
        if (direction === "up") snakeY -= box;
        if (direction === "down") snakeY += box;
        if (direction === "left") snakeX -= box;
        if (direction === "right") snakeX += box;
        if (snakeX === food.x && snakeY === food.y) {
            playHevClick();
            food = { x: Math.floor(Math.random() * 14 + 1) * box, y: Math.floor(Math.random() * 14 + 1) * box };
            if (snake.length >= 10) {
                clearInterval(gameLoop);
                setState('WIN');
            }
        } else snake.pop();
        let newHead = { x: snakeX, y: snakeY };
        if (snakeX < 0 || snakeX >= 300 || snakeY < 0 || snakeY >= 300 || collision(newHead, snake)) {
            clearInterval(gameLoop);
            startSnakeGame();
        } else {
            snake.unshift(newHead);
            ctx.fillStyle = "black"; ctx.fillRect(0,0,300,300);
            ctx.fillStyle = "#00ff00"; ctx.fillRect(food.x, food.y, box, box);
            snake.forEach((s, i) => { ctx.fillStyle = i===0 ? "orange" : "gray"; ctx.fillRect(s.x, s.y, box, box); });
        }
    }, 150);
}
function changeDir(d) { direction = d; playHevClick(); }
function collision(head, array) { return array.some(el => el.x === head.x && el.y === head.y); }

// --- 8. ТАЙМЕР ---
function startTimer() {
    let timeLeft = 900;
    const display = document.getElementById('timer');
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        if (display) display.innerText = `${m}:${s<10?'0'+s:s}`;
        if (timeLeft <= 0) location.reload();
    }, 1000);
}

window.onload = () => setState('MENU');
