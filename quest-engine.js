/// --- 1. ЗВУК И ПЕРЕМЕННЫЕ ---
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

const questTargets = [8, 26, 47, 79]; // Твои элементы O, Fe, Ag, Au
let discovered = 0, timerInterval, isHayBurned = false;
let snake, food, direction, gameLoop, box = 20, snakeTimeLeft = 120;
let kills = 0, galaxyInterval, currentTargetId = null, blinkInterval;

// --- 2. МАШИНА СОСТОЯНИЙ ---
function setState(stateName) {
    if (audioContext.state === 'suspended') audioContext.resume();
    if (gameLoop) clearInterval(gameLoop);
    if (galaxyInterval) clearInterval(galaxyInterval);
    if (blinkInterval) clearTimeout(blinkInterval);

    const screens = ['state-menu', 'state-game', 'state-win', 'state-biology', 'state-snake', 'state-galaxy'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    if (stateName === 'MENU') {
        document.getElementById('state-menu').style.display = 'flex';
        isHayBurned = false; discovered = 0; snakeTimeLeft = 120;
    } else if (stateName === 'GAME') {
        const nickInput = document.getElementById('player-name');
        if (!nickInput || !nickInput.value) return alert("ВВЕДИТЕ НИКНЕЙМ!");
        document.getElementById('state-game').style.display = 'block';
        if (document.getElementById('table').innerHTML.trim() === "") buildTable();
        startTimer(); startElementHunt();
    } else if (stateName === 'BIOLOGY') {
        document.getElementById('state-biology').style.display = 'block';
    } else if (stateName === 'SNAKE') {
        document.getElementById('state-snake').style.display = 'block';
        startSnakeGame();
    } else if (stateName === 'GALAXY') {
        document.getElementById('state-galaxy').style.display = 'block';
        startGalaxyGame();
    } else if (stateName === 'WIN') {
        document.getElementById('state-win').style.display = 'flex';
        if (timerInterval) clearInterval(timerInterval);
    }
        else if (stateName === 'VAULT') {
        document.getElementById('state-vault').style.display = 'block';
    }
}

// --- 3. ТАБЛИЦА И ОХОТА ---
function buildTable() {
    const table = document.getElementById('table');
    if (!table) return;
    elements.forEach(el => {
        const div = document.createElement('div');
        div.setAttribute('data-id', el.n);
        div.className = 'element' + (questTargets.includes(el.n) ? ' active-quest' : '');
        div.style.gridColumn = el.x; div.style.gridRow = el.y;
        div.innerHTML = `<span class="num">${el.n}</span><span class="sym">${el.s}</span><span class="name">${el.name}</span>`;
        div.onclick = () => { playHevClick(); showDetails(el); handleQuest(el.n, div); };
        table.appendChild(div);
    });
}

function startElementHunt() {
    const elNodes = document.querySelectorAll('.element');
    const remaining = [];
    elNodes.forEach(node => {
        const id = parseInt(node.getAttribute('data-id'));
        if (questTargets.includes(id) && !node.classList.contains('stabilized')) remaining.push(id);
    });
    elNodes.forEach(el => el.classList.remove('target-blink'));
    if (remaining.length > 0) {
        currentTargetId = remaining[Math.floor(Math.random() * remaining.length)];
        const targetDiv = document.querySelector(`.element[data-id="${currentTargetId}"]`);
        if (targetDiv) targetDiv.classList.add('target-blink');
        blinkInterval = setTimeout(startElementHunt, 3000);
    }
}

function handleQuest(id, div) {
    if (id === currentTargetId && !div.classList.contains('stabilized')) {
        playHevClick(); div.classList.remove('target-blink'); div.classList.add('stabilized');
        div.style.background = "var(--orange)"; div.style.color = "#000"; discovered++;
        if (blinkInterval) clearTimeout(blinkInterval);
        if (discovered < 4) setTimeout(startElementHunt, 500);
        else setTimeout(() => {
            document.querySelector('.table-viewport').innerHTML = `
            <div style="padding:20px; border:1px dashed var(--orange); text-align:center;">
                <p style="color:#00ff00;">СЕКТОР D: ИЗВЛЕКИТЕ КЛЮЧ ИЗ СЕНА</p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                    <button class="menu-button" onclick="checkLogic('matches')">СПИЧКИ</button>
                    <button class="menu-button" onclick="checkLogic('magnet')">МАГНИТ</button>
                    <button class="menu-button" onclick="checkLogic('forks')">ВИЛЫ</button>
                    <button class="menu-button" onclick="checkLogic('vacuum')">ПЫЛЕСОС</button>
                </div><p id="logic-hint" style="margin-top:10px;"></p></div>`;
        }, 1000);
    }
}

function checkLogic(item) {
    playHevClick(); const hint = document.getElementById('logic-hint');
    if (item === 'matches') { isHayBurned = true; hint.innerHTML = "СЕНО СГОРЕЛО. ОСТАЛСЯ ПЕПЕЛ."; }
    else if (item === 'magnet') {
        if (isHayBurned) { hint.innerHTML = "КЛЮЧ НАЙДЕН!"; setTimeout(() => setState('BIOLOGY'), 1500); }
        else hint.innerHTML = "СЛИШКОМ МНОГО СЕНА!";
    }
}

// --- 4. БИОЛОГИЯ ---
function verifyBiology() {
    playHevClick();
    const a1 = document.getElementById('bio-1').value, a6 = document.getElementById('bio-6').value;
    if (a1 === 'water' && a6 === 'xen') {
        document.getElementById('bio-hint').innerHTML = "УСПЕХ!";
        setTimeout(() => setState('SNAKE'), 1500);
    } else { document.getElementById('bio-hint').innerHTML = "ОШИБКА В ДАННЫХ!"; }
}

// --- 5. ЗМЕЙКА ---
function startSnakeGame() {
    const canvas = document.getElementById('snakeCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    snake = [{x: 10 * box, y: 10 * box}]; direction = "right";
    food = { x: Math.floor(Math.random() * 14 + 1) * box, y: Math.floor(Math.random() * 14 + 1) * box };
    gameLoop = setInterval(() => {
        snakeTimeLeft -= 0.2; if (snakeTimeLeft <= 0) { clearInterval(gameLoop); setState('GALAXY'); return; }
        let sX = snake[0].x, sY = snake[0].y;
        if (direction === "up") sY -= box; else if (direction === "down") sY += box;
        else if (direction === "left") sX -= box; else if (direction === "right") sX += box;
        if (sX === food.x && sY === food.y) {
            playHevClick();
            food = { x: Math.floor(Math.random() * 14 + 1) * box, y: Math.floor(Math.random() * 14 + 1) * box };
            if (snake.length >= 10) { clearInterval(gameLoop); setState('GALAXY'); return; }
        } else { snake.pop(); }
        let head = {x: sX, y: sY};
        if (sX<0 || sX>=300 || sY<0 || sY>=300 || snake.some(s=>s.x===head.x && s.y===head.y)) {
            snake = [{x: 10 * box, y: 10 * box}]; direction = "right";
        } else {
            snake.unshift(head);
            ctx.fillStyle = "black"; ctx.fillRect(0,0,300,300);
            ctx.fillStyle = "#00ff00"; ctx.font = "14px Monospace";
            ctx.fillText("STABILITY: " + Math.ceil(snakeTimeLeft), 10, 20);
            ctx.fillRect(food.x, food.y, box, box);
            snake.forEach((s, i) => { ctx.fillStyle = i===0 ? "orange" : "gray"; ctx.fillRect(s.x, s.y, box, box); });
        }
    }, 150);
}
function changeDir(d) { direction = d; playHevClick(); }

// --- 6. ГАЛАКТИКА (GALAXY DEFENSE) ---
let galaxyTimeLeft = 30; // Лимит времени

function startGalaxyGame() {
    kills = 0;
    galaxyTimeLeft = 30; // Сброс таймера
    const f = document.getElementById('galaxy-field');
    const s = document.getElementById('score-galaxy');
    if (!f || !s) return;

    if (galaxyInterval) clearInterval(galaxyInterval);
    
    galaxyInterval = setInterval(() => {
        // 1. Уменьшаем время (тикает каждые 100мс)
        galaxyTimeLeft -= 0.1; 
        
        // 2. Обновляем табло
        s.innerHTML = `KILLS: ${kills} | TIME: ${Math.max(0, Math.ceil(galaxyTimeLeft))}s`;

        // 3. ПРОВЕРКА ПОБЕДЫ (набрали 20 киллов)
        if (kills >= 20) {
            clearInterval(galaxyInterval);
            sendDataToGoogle(); 
            // ВЫДАЕМ КОД ПРЯМО ТУТ
            alert("УГРОЗА НЕЙТРАЛИЗОВАНА! ВАШ КОД ДОСТУПА: HL-SINGULARITY-106"); 
            setState('WIN');
        }


        // 4. ПРОВЕРКА ПРОИГРЫША (время вышло)
        if (galaxyTimeLeft <= 0) {
            clearInterval(galaxyInterval);
            sendDataToGoogle(); // Всё равно шлём данные Наблюдателю
            alert("ВРЕМЯ ИСТЕКЛО! СЕКТОР НЕ ЗАЧИЩЕН, НО КОД ВЫДАН.");
            setState('WIN');
            return;
        }

        // 5. ШАНС ПОЯВЛЕНИЯ МЕТЕОРИТА
        if (Math.random() > 0.8) {
            createMeteor(f, s);
        }
    }, 100);
}

function createMeteor(field, scoreBox) {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.innerHTML = "λ";
    meteor.style.left = Math.random() * (field.offsetWidth - 50) + "px";
    meteor.style.top = "-50px";
    field.appendChild(meteor);

    let pos = -50;
    let speed = 4 + Math.random() * 4; // Скорость падения

    let fall = setInterval(() => {
        if (pos > field.offsetHeight) {
            clearInterval(fall);
            if (meteor.parentNode) field.removeChild(meteor);
        } else {
            pos += speed;
            meteor.style.top = pos + "px";
        }
    }, 30);

    // ТАП ПО МЕТЕОРИТУ
    const hitAction = () => {
        playHevClick();
        clearInterval(fall);
        if (meteor.parentNode) field.removeChild(meteor);
        kills++;
        scoreBox.innerHTML = `KILLS: ${kills} | TIME: ${Math.ceil(galaxyTimeLeft)}s`;
    };

    meteor.onclick = hitAction;
    meteor.ontouchstart = (e) => { e.preventDefault(); hitAction(); };
}

// --- 7. ФИНАЛ ---
function showDetails(el) { 
    document.getElementById('content').innerHTML = `<h2>${el.name}</h2>`; 
    document.getElementById('details').classList.add('open'); 
}

function closeDetails() { 
    document.getElementById('details').classList.remove('open'); 
}

function startTimer() {
    let tl = 900;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        tl--; 
        let m = Math.floor(tl/60), s = tl%60;
        const d = document.getElementById('timer');
        if (d) d.innerText = `${m}:${s < 10 ? '0' + s : s}`;
        if (tl <= 0) location.reload();
    }, 1000);
}
function sendDataToGoogle() {
    const nick = document.getElementById('player-name').value;
    const mainTime = document.getElementById('timer').innerText; // Время от 15 мин
    const galaxyTime = Math.ceil(galaxyTimeLeft); // Остаток от 30 сек Галактики
    
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwOtFiGt0u-y0hwpL2UfQelGX25mybXuxT6vwr-qgLYllHvOJvL_KXv2ffGYC3VgWKP3w/exec'; 

    // Формируем отчет для Наблюдателя
    const report = `Остаток: ${mainTime} (Galaxy: ${galaxyTime}s)`;

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick, time: report })
    });
}

function unlockSecretSector() {
    const code = document.getElementById('final-secret-code').value.toUpperCase();
    if (code === 'HL-SINGULARITY-106') {
        playHevClick();
        alert("ДОСТУП РАЗРЕШЕН. ПРИВЕТСТВУЮ, ПАДАВАН.");
        setState('VAULT');
    } else {
        alert("ДОСТУП ЗАПРЕЩЕН. НЕВЕРНЫЙ КОД.");
    }
}

function openVault(type) {
    playHevClick();
    const container = document.getElementById('vault-content');
    container.style.display = 'block';
    container.innerHTML = ""; // Чистим

    else  if (type === 'video') {
        container.innerHTML = `
            <h3 style="color:var(--orange)">АРХИВ: ВИДЕОУРОКИ (6 КЛАСС)</h3>
            
            <!-- ПЛЕЕР (Изначально пустой) -->
            <div id="video-player-box" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border:1px solid var(--orange); background:#000; margin-bottom:15px; display:none;">
                <iframe id="main-video-frame" src="" style="position:absolute; top:0; left:0; width:100%; height:100%;" frameborder="0" allowfullscreen></iframe>
            </div>

            <!-- СПИСОК УРОКОВ -->
            <div style="display:flex; flex-direction:column; gap:8px; text-align:left;">
                <button class="menu-button" style="font-size:0.7rem; padding:10px;" onclick="loadVideo('ССЫЛКА_RUTUBE_1')">● УРОК 1: Обмен веществ – главный признак жизни</button>
                <button class="menu-button" style="font-size:0.7rem; padding:10px;" onclick="loadVideo('ССЫЛКА_RUTUBE_2')">● УРОК 2: Удобрения и почвенное питание растений</button>
                <button class="menu-button" style="font-size:0.7rem; padding:10px;" onclick="loadVideo('ССЫЛКА_RUTUBE_3')">● УРОК 3: Фотосинтез</button>
                <button class="menu-button" style="font-size:0.7rem; padding:10px;" onclick="loadVideo('ССЫЛКА_RUTUBE_4')">● УРОК 4: Фотосинтез</button>
                <button class="menu-button" style="font-size:0.7rem; padding:10px;" onclick="loadVideo('ССЫЛКА_RUTUBE_5')">● УРОК 5: Гетеротрофное питание</button>
            </div>
        `;
    }
    } else if (type === 'vpr') {
        container.innerHTML = `<h3>ТРЕНАЖЕР ВПР</h3><p style="font-size:0.8rem;">Готовься к аттестации, боец!</p>
        <button class="menu-button" onclick="window.open('ССЫЛКА_НА_ТЕСТ')">НАЧАТЬ ТЕСТ</button>`;
    } else if (type === 'tetris') {
        container.innerHTML = `
    <h3 style="color:var(--orange)">МОЛЕКУЛЯРНЫЙ СИНТЕЗ</h3>
    <canvas id="tetrisCanvas" width="200" height="400" style="border:2px solid var(--orange); margin: 0 auto; display:block; background:#000;"></canvas>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-top:15px;">
        <button class="menu-button" onclick="moveTetris('L')">◀</button>
        <button class="menu-button" onclick="moveTetris('W')">🔄</button>
        <button class="menu-button" onclick="moveTetris('D')">▼</button>
        <button class="menu-button" onclick="moveTetris('R')">▶</button>
    </div>
`;
        setTimeout(startTetris, 100); // Даем время отрисовать Canvas
    }
}

// --- МОЛЕКУЛЯРНЫЙ ТЕТРИС (СЕКТОР X) ---
let tBoard, tPiece, tInterval, tCtx, tCanvas;
const ROWS = 20, COLS = 10, SQ = 20;

// Классические фигуры (тетрамино) в виде матриц
const PIECES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]], // Z
    [[0,1,0],[1,1,1]], // T
    [[1,0,0],[1,1,1]], // L
    [[0,0,1],[1,1,1]]  // J
];

function startTetris() {
    tCanvas = document.getElementById('tetrisCanvas');
    if (!tCanvas) return;
    tCtx = tCanvas.getContext('2d');
    tBoard = Array.from({length: ROWS}, () => Array(COLS).fill("black"));

    function newPiece() {
        const shape = PIECES[Math.floor(Math.random() * PIECES.length)];
        const color = ["#ff8c00", "#00ff00", "#00ffff", "#ff00ff", "#ffff00"][Math.floor(Math.random()*5)];
        return { shape, color, x: 3, y: 0 };
    }

    tPiece = newPiece();

    function drawSq(x, y, color) {
        tCtx.fillStyle = color;
        tCtx.fillRect(x*SQ, y*SQ, SQ, SQ);
        tCtx.strokeStyle = "#111";
        tCtx.strokeRect(x*SQ, y*SQ, SQ, SQ);
    }

    function draw() {
        tCtx.fillStyle = "black";
        tCtx.fillRect(0, 0, tCanvas.width, tCanvas.height);
        for(let r=0; r<ROWS; r++) {
            for(let c=0; c<COLS; c++) {
                if(tBoard[r][c] !== "black") drawSq(c, r, tBoard[r][c]);
            }
        }
        tPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if(value) drawSq(tPiece.x + dx, tPiece.y + dy, tPiece.color);
            });
        });
    }

    function collision(nx, ny, shape) {
        for(let r=0; r<shape.length; r++) {
            for(let c=0; c<shape[r].length; c++) {
                if(!shape[r][c]) continue;
                let newX = nx + c, newY = ny + r;
                if(newX < 0 || newX >= COLS || newY >= ROWS) return true;
                if(newY < 0) continue;
                if(tBoard[newY][newX] !== "black") return true;
            }
        }
        return false;
    }

    window.moveTetris = (dir) => {
        if(dir === 'L' && !collision(tPiece.x-1, tPiece.y, tPiece.shape)) tPiece.x--;
        if(dir === 'R' && !collision(tPiece.x+1, tPiece.y, tPiece.shape)) tPiece.x++;
        if(dir === 'D') {
            if(!collision(tPiece.x, tPiece.y+1, tPiece.shape)) tPiece.y++;
            else lock();
        }
        if(dir === 'W') { // ПОВОРОТ
            let next = tPiece.shape[0].map((_, i) => tPiece.shape.map(row => row[i]).reverse());
            if(!collision(tPiece.x, tPiece.y, next)) tPiece.shape = next;
        }
        draw();
    };

    function lock() {
        tPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if(value) {
                    if(tPiece.y + dy < 0) { alert("СИНТЕЗ ПРЕРВАН"); startTetris(); return; }
                    tBoard[tPiece.y + dy][tPiece.x + dx] = tPiece.color;
                }
            });
        });
        for(let r=ROWS-1; r>=0; r--) {
            if(tBoard[r].every(cell => cell !== "black")) {
                tBoard.splice(r, 1);
                tBoard.unshift(Array(COLS).fill("black"));
                playHevClick();
            }
        }
        tPiece = newPiece();
    }

    if(tInterval) clearInterval(tInterval);
    tInterval = setInterval(() => {
        if(!collision(tPiece.x, tPiece.y+1, tPiece.shape)) tPiece.y++; else lock();
        draw();
    }, 600);
}
function closeVaultContent() {
    playHevClick();
    // 1. Останавливаем игровой цикл тетриса, если он запущен
    if (tInterval) clearInterval(tInterval);
    
    // 2. Прячем контейнер с игрой/видео
    const container = document.getElementById('vault-content');
    if (container) {
        container.innerHTML = "";
        container.style.display = 'none';
    }
    
    // 3. Возвращаемся к выбору кейсов
    setState('VAULT');
}
function loadVideo(url) {
    playHevClick();
    const box = document.getElementById('video-player-box');
    const frame = document.getElementById('main-video-frame');
    
    if (box && frame) {
        box.style.display = 'block'; // Показываем плеер
        frame.src = url;             // Загружаем видео
        // Прокручиваем экран к видео, чтобы было удобно смотреть
        box.scrollIntoView({behavior: "smooth"});
    }
}
// ЭТО ПОСЛЕДНЯЯ СТРОЧКА ФАЙЛА
window.onload = () => setState('MENU');
