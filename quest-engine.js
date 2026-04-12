const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playHevClick() {
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

function setState(stateName) {
    if (typeof audioContext !== 'undefined' && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // 1. Добавь 'state-snake' в этот список
    const screens = ['state-menu', 'state-game', 'state-win', 'state-biology', 'state-snake'];
    
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    if (stateName === 'MENU') {
        const menu = document.getElementById('state-menu');
        if (menu) menu.style.display = 'flex';
    } 
    else if (stateName === 'GAME') {
        const nickInput = document.getElementById('player-name');
        if (!nickInput || !nickInput.value) {
            alert("ВВЕДИТЕ ВАШ НИКНЕЙМ!");
            document.getElementById('state-menu').style.display = 'flex';
            return;
        }
        document.getElementById('state-game').style.display = 'block';
        if (document.getElementById('table').innerHTML.trim() === "") buildTable();
        startTimer();
    } 
    else if (stateName === 'BIOLOGY') {
        const bio = document.getElementById('state-biology');
        if (bio) bio.style.display = 'block';
    }
    // 2. НОВОЕ СОСТОЯНИЕ ДЛЯ ЗМЕЙКИ:
    else if (stateName === 'SNAKE') {
        const snakeScreen = document.getElementById('state-snake');
        if (snakeScreen) snakeScreen.style.display = 'block';
        startSnakeGame(); // Запускаем движок змейки
    }
    else if (stateName === 'WIN') {
        const win = document.getElementById('state-win');
        if (win) win.style.display = 'flex';
        if (timerInterval) clearInterval(timerInterval);
        sendDataToGoogle();
    }
}
} // <--- ПРОВЕРЬ ЭТУ СКОБКУ!
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
            playHevClick(); // ДОБАВИЛИ ЗВУК КЛИКА
            showDetails(el);
            if(isQuest) handleQuest(el.n, div);
        };
        table.appendChild(div);
    });
}

function showDetails(el) {
    const content = document.getElementById('content');
    // Добавляем больше данных для солидности терминала
    content.innerHTML = `
        <h2 style="color:var(--orange); margin-top:0;">[ ОБЪЕКТ: ${el.s} ]</h2>
        <p><b style="color:var(--orange)">ИМЯ:</b> ${el.name}</p>
        <p><b style="color:var(--orange)">МАССА:</b> ${el.m}</p>
        <p><b style="color:var(--orange)">ЗАРЯД ЯДРА:</b> +${el.n}</p>
        <p style="font-size:0.8rem; color:#888; border-top:1px solid #333; pt-10">Статус: Анализ завершен.</p>
    `;
    document.getElementById('details').classList.add('open');
}

function closeDetails() { 
    document.getElementById('details').classList.remove('open'); 
}

function handleQuest(id, div) {
    if (!div.classList.contains('stabilized')) {
        div.classList.add('stabilized');
        // Красим элемент в оранжевый при активации
        div.style.background = "var(--orange)";
        div.style.color = "#000";
        
        // ВСПЫШКА ЛЯМБДЫ (Зеленый сектор)
        const logo = document.querySelector('.sticky-header .lambda-icon');
        if (logo) {
            logo.classList.add('lambda-flash');
            setTimeout(() => logo.classList.remove('lambda-flash'), 1000);
        }

        discovered++;
        // Если нашли все 4 (O, Fe, Ag, Au) — победа
        if(discovered === 4) {
            setTimeout(() => setState('WIN'), 800);
        }
    }
}
let timerInterval; // Глобальный пульс системы

function startTimer() {
    let timeLeft = 900; // 15 минут до каскадного резонанса
    const timerDisplay = document.getElementById('timer');
    
    // Сброс прогресса при новом старте
    discovered = 0; 
    
    if (timerInterval) clearInterval(timerInterval); 

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("КРИТИЧЕСКАЯ МАССА ДОСТИГНУТА! СИСТЕМА ПЕРЕЗАГРУЖАЕТСЯ...");
            location.reload(); 
            return;
        }
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        
        if (timerDisplay) {
            timerDisplay.innerText = `${mins}:${secs < 10 ? '0' + secs : secs}`;
        }
        
        if (timeLeft < 60 && timerDisplay) {
            timerDisplay.style.color = "#ff0000";
            timerDisplay.style.textShadow = "0 0 15px #ff0000";
        }
    }, 1000);
}

// ИНИЦИАЛИЗАЦИЯ: Система переходит в состояние МЕНЮ при загрузке
window.onload = () => {
    setState('MENU');
};
let isHayBurned = false; // Состояние стога сена

function checkLogic(item) {
    const hint = document.getElementById('logic-hint');
    // Мы больше не ищем reward здесь, мы просто переключаем экраны через setState
    
    if (item === 'matches') {
        playHevClick();
        isHayBurned = true;
        hint.innerHTML = "<b style='color:#ff8c00;'>СИСТЕМА: Стог сена уничтожен. Остался пепел...</b>";
    } 
    else if (item === 'magnet') {
        playHevClick();
        if (isHayBurned) {
            hint.innerHTML = "<b style='color:#00ff00;'>ВЕРНО! Ключ найден. Инициализация Сектора B...</b>";
            
            // Ждем 2 секунды, чтобы падаваны прочитали успех, и переключаем экран
            setTimeout(() => {
                setState('BIOLOGY'); 
            }, 2000);
        } else {
            hint.innerHTML = "<b style='color:#888;'>Магнит бесполезен... Сено блокирует поле.</b>";
        }
    } else {
        hint.innerHTML = "<b style='color:#ff0000;'>ОШИБКА: Объект не подходит.</b>";
    }
}

function checkBio(type) {
    const hint = document.getElementById('bio-hint');
    playHevClick();

    if (type === 'alien') {
        hint.innerHTML = "<b style='color:#00ff00;'>ОБЪЕКТ ИДЕНТИФИЦИРОВАН: АНОМАЛИЯ ИЗ КАРМАННОГО ИЗМЕРЕНИЯ ЗЕН. В КАРАНТИН!</b>";
        setTimeout(() => {
            // Переход к следующему сектору (Змейка или Энергоблок)
            alert("СЕКТОР B ЗАЧИЩЕН. ПЕРЕХОД К ЭНЕРГОБЛОКУ...");
            setState('PHYSICS'); // Или следующий по списку
        }, 2000);
    } else {
        hint.innerHTML = "<b style='color:red;'>ОШИБКА: Это земной организм. Ищите чужеродную ДНК!</b>";
    }
}

function verifyBiology() {
    playHevClick();
    
    // Сбор данных
    const answers = {
        1: document.getElementById('bio-1').value, // Дельфин -> water
        2: document.getElementById('bio-2').value, // Орел -> land-air
        3: document.getElementById('bio-3').value, // Крот -> soil
        4: document.getElementById('bio-4').value, // Червь -> organism/soil
        5: document.getElementById('bio-5').value, // Верблюд -> land-air
        6: document.getElementById('bio-6').value  // Головокраб -> xen
    };

    const hint = document.getElementById('bio-hint');

    // ПРОВЕРКА
    const isCorrect = 
        answers[1] === 'water' && 
        answers[2] === 'land-air' && 
        answers[3] === 'soil' && 
        (answers[4] === 'organism' || answers[4] === 'soil') && 
        answers[5] === 'land-air' && 
        answers[6] === 'xen';

    if (isCorrect) {
        hint.style.color = "#00ff00";
        hint.innerHTML = "АНАЛИЗ ЗАВЕРШЕН. ВСЕ СРЕДЫ ИДЕНТИФИЦИРОВАНЫ ВЕРНО.";
        setTimeout(() => {
            setState('SNAKE'); // Направляем в Сектор со Змейкой
        }, 2000);
    } else {
        hint.style.color = "red";
        hint.innerHTML = "ОШИБКА: НЕСООТВЕТСТВИЕ БИОМОВ. ПРОВЕРЬТЕ ДАННЫЕ.";
    }
}

let snake, food, direction, gameLoop;
const canvas = document.getElementById('snakeCanvas');
const ctx = (canvas) ? canvas.getContext('2d') : null;
const box = 15; // Размер ячейки

function startSnakeGame() {
    snake = [{x: 10 * box, y: 10 * box}];
    food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
    direction = "right";
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(drawSnake, 150); // Скорость Буллсквида
}

function changeDir(d) {
    playHevClick();
    if (d === 'up' && direction !== 'down') direction = 'up';
    if (d === 'down' && direction !== 'up') direction = 'down';
    if (d === 'left' && direction !== 'right') direction = 'left';
    if (d === 'right' && direction !== 'left') direction = 'right';
}

function drawSnake() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 300, 300);

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i === 0) ? "#ff8c00" : "#555"; // Голова оранжевая, хвост серый
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }

    ctx.fillStyle = "#00ff00"; // Цвет изотопа
    ctx.fillRect(food.x, food.y, box, box);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction === "up") snakeY -= box;
    if (direction === "down") snakeY += box;
    if (direction === "left") snakeX -= box;
    if (direction === "right") snakeX += box;

    // Проверка поедания
    if (snakeX === food.x && snakeY === food.y) {
        food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
        if (snake.length >= 10) { // Нужно собрать 10 штук
            clearInterval(gameLoop);
            alert("ОБРАЗЕЦ СТАБИЛИЗИРОВАН. ПЕРЕХОД К ФИНАЛУ...");
            setState('WIN');
        }
    } else {
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    // Столкновение со стенами или собой
    if (snakeX < 0 || snakeX >= 300 || snakeY < 0 || snakeY >= 300 || collision(newHead, snake)) {
        clearInterval(gameLoop);
        alert("ОШИБКА: ОБЪЕКТ ПОГИБ. ПЕРЕЗАПУСК СЕКТОРА...");
        startSnakeGame();
    }

    snake.unshift(newHead);
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) return true;
    }
    return false;
}
