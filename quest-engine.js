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
    // ОЖИВЛЯЕМ ЗВУК: Смартфон разрешит аудио только после этого клика
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    document.getElementById('state-menu').style.display = 'none';
    document.getElementById('state-game').style.display = 'none';
    document.getElementById('state-win').style.display = 'none';

    if (stateName === 'GAME') {
        const nick = document.getElementById('player-name').value;
        if (!nick) return alert("ВВЕДИТЕ НИКНЕЙМ!");
        document.getElementById('state-game').style.display = 'block';
        if (document.getElementById('table').innerHTML === "") buildTable();
        startTimer(); // Запуск отсчета
    } else if (stateName === 'MENU') {
        document.getElementById('state-menu').style.display = 'flex';
    } else if (stateName === 'WIN') {
        document.getElementById('state-win').style.display = 'flex';
        if (timerInterval) clearInterval(timerInterval); // Остановка времени
    }
}

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
function checkLogic(item) {
    const hint = document.getElementById('logic-hint');
    const reward = document.getElementById('final-reward');
    const quest = document.getElementById('logic-quest');

    if (item === 'magnet') {
        playHevClick(); // Наш фирменный звук
        hint.innerHTML = "<b style='color:#00ff00;'>ВЕРНО! Железо — ферромагнетик. Магнит притянет ключ сквозь сено.</b>";
        setTimeout(() => {
            quest.style.display = 'none';
            reward.style.display = 'block';
        }, 2000);
    } else if (item === 'matches') {
        hint.innerHTML = "<b style='color:#ff0000;'>ОПАСНО! Сгорит и сено, и Гимназия. Ключ расплавится.</b>";
    } else {
        hint.innerHTML = "<b style='color:#888;'>Слишком медленно... Сингулярность требует скорости.</b>";
    }
}
