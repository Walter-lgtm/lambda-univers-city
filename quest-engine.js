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
            alert("УГРОЗА НЕЙТРАЛИЗОВАНА! РЕЗУЛЬТАТ ЗАФИКСИРОВАН.");
            setState('WIN');
            return;
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
    const nickInput = document.getElementById('player-name');
    const timerDisplay = document.getElementById('timer');
    
    const nick = nickInput ? nickInput.value : "Unknown_Padawan";
    const timeLeft = timerDisplay ? timerDisplay.innerText : "00:00";
    
    // СЮДА ВСТАВИШЬ ССЫЛКУ, КОТОРУЮ ПОЛУЧИШЬ В GOOGLE
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwOtFiGt0u-y0hwpL2UfQelGX25mybXuxT6vwr-qgLYllHvOJvL_KXv2ffGYC3VgWKP3w/exec'; 

    const data = {
        nickname: nick,
        time: timeLeft
    };

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(() => console.log("Данные переданы Наблюдателю. Эксперимент завершен."))
    .catch(error => console.error("Ошибка связи с порталом:", error));
}
// ЭТО ПОСЛЕДНЯЯ СТРОЧКА ФАЙЛА
window.onload = () => setState('MENU');
