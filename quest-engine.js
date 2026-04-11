const questTargets = [8, 26, 47, 79];
let discovered = 0;

function setState(stateName) {
    document.getElementById('state-menu').style.display = 'none';
    document.getElementById('state-game').style.display = 'none';
    document.getElementById('state-win').style.display = 'none';

    if (stateName === 'GAME') {
        const nick = document.getElementById('player-name').value;
        if (!nick) return alert("ВВЕДИТЕ ВАШ НИКНЕЙМ!");
        
        document.getElementById('state-game').style.display = 'block';
        
        // Построение таблицы, если она пустая
        if (document.getElementById('table').innerHTML === "") buildTable();
        
        // ЗАПУСК ТАЙМЕРА — БЕЗ ЭТОГО ВРЕМЯ НЕ ПОЙДЕТ!
        startTimer(); 
    } 
    else if (stateName === 'MENU') {
        document.getElementById('state-menu').style.display = 'flex';
    } 
    else if (stateName === 'WIN') {
        document.getElementById('state-win').style.display = 'flex';
        // Здесь мы остановим таймер при победе
        clearInterval(timerInterval);
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
            showDetails(el);
            if(isQuest) handleQuest(el.n, div);
        };
        table.appendChild(div);
    });
}

function showDetails(el) {
    const content = document.getElementById('content');
    content.innerHTML = `<h2>[ ${el.s} ]</h2><p>${el.name}</p><p>Масса: ${el.m}</p>`;
    document.getElementById('details').classList.add('open');
}

function closeDetails() { document.getElementById('details').classList.remove('open'); }

function handleQuest(id, div) {
    if (!div.classList.contains('stabilized')) {
        div.classList.add('stabilized');
        div.style.background = "var(--orange)";
        
        // ВСПЫШКА ЛЯМБДЫ
        const logo = document.querySelector('.sticky-header .lambda-icon');
        logo.classList.add('lambda-flash');
        setTimeout(() => logo.classList.remove('lambda-flash'), 1000);

        discovered++;
        if(discovered === 4) setTimeout(() => setState('WIN'), 800);
    }
}

let timerInterval; // Глобальный пульс системы

function startTimer() {
    let timeLeft = 900; // 15 минут до каскадного резонанса
    const timerDisplay = document.getElementById('timer');
    
    if (timerInterval) clearInterval(timerInterval); // Сброс, если запускаем заново

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("КРИТИЧЕСКАЯ МАССА ДОСТИГНУТА! СИСТЕМА ПЕРЕЗАГРУЖАЕТСЯ...");
            location.reload(); // Перезагрузка страницы при проигрыше
            return;
        }
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        
        // Обновляем табло
        if (timerDisplay) {
            timerDisplay.innerText = `${mins}:${secs < 10 ? '0' + secs : secs}`;
        }
        
        // Визуальный эффект опасности на последней минуте
        if (timeLeft < 60 && timerDisplay) {
            timerDisplay.style.color = "#ff0000";
            timerDisplay.style.textShadow = "0 0 15px #ff0000";
        }
    }, 1000);
}
window.onload = () => setState('MENU');
