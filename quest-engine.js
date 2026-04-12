// --- 1. ЗВУК И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
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

const questTargets = [8, 26, 47, 79];
let discovered = 0;
let timerInterval;
let isHayBurned = false;
let snake, food, direction, gameLoop;
let box = 20;
let snakeTimeLeft = 120; // Таймер змейки (не сбрасывается)

function setState(stateName) {
    // 1. Оживляем звук для смартфонов
    if (typeof audioContext !== 'undefined' && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // 2. Остановка всех активных циклов перед переключением
    if (typeof gameLoop !== 'undefined') clearInterval(gameLoop);
    if (typeof blinkInterval !== 'undefined') clearTimeout(blinkInterval);
    if (typeof galaxyInterval !== 'undefined') clearInterval(galaxyInterval);

    // 3. Список всех существующих ID экранов
    const screens = ['state-menu', 'state-game', 'state-win', 'state-biology', 'state-snake', 'state-galaxy'];
    
    // Скрываем все экраны
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 4. ЛОГИКА ПЕРЕКЛЮЧЕНИЯ
    if (stateName === 'MENU') {
        const menu = document.getElementById('state-menu');
        if (menu) menu.style.display = 'flex';
        isHayBurned = false; 
        discovered = 0;
    } 
    else if (stateName === 'GAME') {
        const nickInput = document.getElementById('player-name');
        const nick = nickInput ? nickInput.value : "";
        if (!nick) return alert("ВВЕДИТЕ НИКНЕЙМ!");
        
        // Сначала показываем экран (это браузер разрешит всегда)
        document.getElementById('state-game').style.display = 'block';
        
        // Даем смартфону 100мс "продышаться" и запускаем остальное
        setTimeout(() => {
            if (document.getElementById('table').innerHTML.trim() === "") buildTable();
            startTimer();        
            startElementHunt();
        }, 100);
    }
    else if (stateName === 'BIOLOGY') {
        const bio = document.getElementById('state-biology');
        if (bio) bio.style.display = 'block';
    }
    else if (stateName === 'SNAKE') {
        const snakeS = document.getElementById('state-snake');
        if (snakeS) {
            snakeS.style.display = 'block';
            startSnakeGame(); 
        }
    }
    else if (stateName === 'GALAXY') {
        const galS = document.getElementById('state-galaxy');
        if (galS) {
            galS.style.display = 'block';
            startGalaxyGame();
        }
    }
    else if (stateName === 'WIN') {
        const winS = document.getElementById('state-win');
        if (winS) winS.style.display = 'flex';
        if (timerInterval) clearInterval(timerInterval);
        sendDataToGoogle();
    }
}

// --- 3. СЕКТОР C: ХИМИЯ ---
function buildTable() {
    const table = document.getElementById('table');
    elements.forEach(el => {
        const div = document.createElement('div');
        div.setAttribute('data-id', el.n);
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
            // Очищаем игровое поле и выводим Сектор D прямо ТУДА
            setTimeout(() => {
                const gameArea = document.querySelector('.table-viewport');
                if (gameArea) {
                    gameArea.innerHTML = `
                        <div id="logic-quest" style="padding:20px; border:1px dashed var(--orange); text-align:center;">
                            <p style="color:#00ff00; font-size:0.8rem;">СЕКТОР D: ИЗВЛЕКИТЕ КЛЮЧ ИЗ СЕНА</p>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                                <button class="menu-button" style="font-size:0.6rem;" onclick="checkLogic('matches')">СПИЧКИ</button>
                                <button class="menu-button" style="font-size:0.6rem;" onclick="checkLogic('magnet')">МАГНИТ</button>
                                <button class="menu-button" style="font-size:0.6rem;" onclick="checkLogic('forks')">ВИЛЫ</button>
                                <button class="menu-button" style="font-size:0.6rem;" onclick="checkLogic('vacuum')">ПЫЛЕСОС</button>
                                <button class="menu-button" style="font-size:0.6rem;" onclick="checkLogic('gloves')">ПЕРЧАТКИ</button>
                                <button class="menu-button" style="font-size:0.6rem;" onclick="checkLogic('rope')">ВЕРЕВКА</button>
                            </div>
                            <p id="logic-hint" style="font-size:0.7rem; margin-top:10px;"></p>
                        </div>`;
                }
            }, 1000);
        }
    }
}

// --- 4. СЕКТОР D: ФИЗИКА ---
function checkLogic(item) {
    playHevClick();
    const hint = document.getElementById('logic-hint');
    
    if (item === 'matches') {
        isHayBurned = true; // Сжигаем
        hint.innerHTML = "<b style='color:#ff8c00;'>СЕНО УНИЧТОЖЕНО. В ПЕПЛЕ ЧТО-ТО БЛЕСТИТ...</b>";
    } 
    else if (item === 'magnet') {
        if (isHayBurned === true) { // ЖЕСТКАЯ ПРОВЕРКА
            hint.innerHTML = "<b style='color:#00ff00;'>КЛЮЧ ИЗВЛЕЧЕН! ПЕРЕХОД В БИОЛАБОРАТОРИЮ...</b>";
            
            // Очищаем поле, чтобы не было зацикливания
            const tableArea = document.querySelector('.table-viewport');
            if (tableArea) tableArea.innerHTML = ""; 

            setTimeout(() => {
                setState('BIOLOGY'); 
            }, 2000);
        } else {
            hint.innerHTML = "<b style='color:#ff0000;'>МАГНИТ НЕ МОЖЕТ ПРОБИТЬ ТОЛЩУ СЕНА!</b>";
        }
    } else {
        hint.innerHTML = "ЭТОТ ПРЕДМЕТ БЕСПОЛЕЗЕН.";
    }
}

// --- 5. СЕКТОР B: БИОЛОГИЯ ---
function verifyBiology() {
    playHevClick();
    const ans1 = document.getElementById('bio-1').value;
    const ans2 = document.getElementById('bio-2').value;
    const ans3 = document.getElementById('bio-3').value;
    const ans6 = document.getElementById('bio-6').value;
    const hint = document.getElementById('bio-hint');

    // Проверяем ключевых (Дельфин, Орел, Крот и Головокраб)
    if (ans1 === 'water' && ans2 === 'land-air' && ans3 === 'soil' && ans6 === 'xen') {
        hint.style.color = "#00ff00";
        hint.innerHTML = "УСПЕХ! ИНИЦИАЛИЗАЦИЯ ТРЕНИРОВКИ ОБРАЗЦА...";
        setTimeout(() => {
            setState('SNAKE'); // Переход к Змейке
        }, 2000);
    } else {
        hint.style.color = "red";
        hint.innerHTML = "ОШИБКА В ДАННЫХ. ПРОВЕРЬТЕ СРЕДЫ ОБИТАНИЯ.";
    }
}

// --- 6. СЕКТОР S: ЗМЕЙКА ---
function startSnakeGame() {
    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    snake = [{x: 10 * box, y: 10 * box}];
    food = { x: Math.floor(Math.random() * 14 + 1) * box, y: Math.floor(Math.random() * 14 + 1) * box };
    direction = "right";
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        snakeTimeLeft -= 0.15;
        if (snakeTimeLeft <= 0) {
            clearInterval(gameLoop);
            alert("ВРЕМЯ ИСТЕКЛО. ЭВАКУАЦИЯ...");
            setState('WIN');
            return;
        }
        let snakeX = snake[0].x, snakeY = snake[0].y;
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
                return; // ОСТАНАВЛИВАЕМ ВЫПОЛНЕНИЕ, ЧТОБЫ НЕ БЫЛО ОШИБОК
            }
        } else {
            snake.pop();
        }
        
        let newHead = { x: snakeX, y: snakeY };
        
        if (snakeX < 0 || snakeX >= 300 || snakeY < 0 || snakeY >= 300 || collision(newHead, snake)) {
            snake = [{x: 10 * box, y: 10 * box}]; 
            direction = "right";
            // Не выходим из функции, просто сбрасываем положение
        } else {
            snake.unshift(newHead);
            ctx.fillStyle = "black"; 
            ctx.fillRect(0, 0, 300, 300);
            ctx.fillStyle = "#00ff00"; 
            ctx.font = "14px Courier New";
            ctx.fillText("STABILITY: " + Math.ceil(snakeTimeLeft) + "s", 10, 20);
            ctx.fillRect(food.x, food.y, box, box);
            snake.forEach((s, i) => { 
                ctx.fillStyle = i === 0 ? "orange" : "gray"; 
                ctx.fillRect(s.x, s.y, box, box); 
            });
        }
    }, 150);
}
function changeDir(d) { direction = d; playHevClick(); }
function collision(head, array) { return array.some(el => el.x === head.x && el.y === head.y); }

// --- 7. ТАЙМЕР ---
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

let currentTargetId = null;
let blinkInterval;

function startElementHunt() {
    // 1. Находим все квестовые элементы, которые ещё НЕ стабилизированы
    const elementsOnTable = document.querySelectorAll('.element');
    const remaining = [];
    
    elementsOnTable.forEach(div => {
        const id = parseInt(div.getAttribute('data-id'));
        if (questTargets.includes(id) && !div.classList.contains('stabilized')) {
            remaining.push(id);
        }
    });

    // 2. Убираем мигание у всех
    elementsOnTable.forEach(el => el.classList.remove('target-blink'));

    // 3. Если есть кого ловить — запускаем мигалку
    if (remaining.length > 0) {
        currentTargetId = remaining[Math.floor(Math.random() * remaining.length)];
        const targetDiv = document.querySelector(`.element[data-id="${currentTargetId}"]`);
        
        if (targetDiv) {
            targetDiv.classList.add('target-blink');
            // Перебрасываем мигалку на другой элемент через 3 секунды
            if (blinkInterval) clearTimeout(blinkInterval);
            blinkInterval = setTimeout(startElementHunt, 3000); 
        }
    }
}

let kills = 0;
let galaxyInterval;

function startGalaxyGame() {
    kills = 0;
    const field = document.getElementById('galaxy-field');
    const scoreBox = document.getElementById('score-galaxy');
    if (!field || !scoreBox) return;

    scoreBox.innerText = "KILLS: 0";
    if (galaxyInterval) clearInterval(galaxyInterval);
    
    // Каждые 800мс создаем новый метеорит
    galaxyInterval = setInterval(() => createMeteor(field, scoreBox), 800);
}

function createMeteor(field, scoreBox) {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.style.left = Math.random() * (field.offsetWidth - 60) + "px";
    meteor.style.top = "-60px";
    field.appendChild(meteor);

    let pos = -60;
    let speed = 3 + Math.random() * 3; // Разная скорость падения

    let fall = setInterval(() => {
        if (pos > field.offsetHeight) {
            clearInterval(fall);
            if (meteor.parentNode) field.removeChild(meteor);
        } else {
            pos += speed;
            meteor.style.top = pos + "px";
        }
    }, 20);

    // ТАП ПО МЕТЕОРИТУ
    meteor.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Защита от зума на смартфоне
        destroyMeteor(meteor, field, fall, scoreBox);
    });
    meteor.onclick = () => destroyMeteor(meteor, field, fall, scoreBox);
}

function destroyMeteor(meteor, field, fall, scoreBox) {
    playHevClick();
    
    // Эффект взрыва
    const rect = meteor.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    const exp = document.createElement('div');
    exp.className = 'explosion';
    exp.style.left = (rect.left - fieldRect.left) + "px";
    exp.style.top = (rect.top - fieldRect.top) + "px";
    field.appendChild(exp);
    setTimeout(() => field.removeChild(exp), 300);

    clearInterval(fall);
    if (meteor.parentNode) field.removeChild(meteor);
    
    kills++;
    scoreBox.innerText = "KILLS: " + kills;

    if (kills >= 20) {
        clearInterval(galaxyInterval);
        alert("УГРОЗА НЕЙТРАЛИЗОВАНА! СИСТЕМА СТАБИЛЬНА.");
        setState('WIN');
    }
}

window.onload = () => setState('MENU');
// Принудительная разблокировка звука для iOS/Android при любом первом тапе по экрану
document.body.addEventListener('touchstart', function() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, {once: true}); // Сработает только один раз
