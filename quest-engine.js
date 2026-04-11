const questTargets = [8, 26, 47, 79];
let discovered = 0;

function setState(stateName) {
    document.getElementById('state-menu').style.display = 'none';
    document.getElementById('state-game').style.display = 'none';
    document.getElementById('state-win').style.display = 'none';

    if (stateName === 'GAME') {
        const nick = document.getElementById('player-name').value;
        if (!nick) return alert("ВВЕДИТЕ НИКНЕЙМ!");
        document.getElementById('state-game').style.display = 'block';
        if (document.getElementById('table').innerHTML === "") buildTable();
    } else if (stateName === 'MENU') {
        document.getElementById('state-menu').style.display = 'flex';
    } else if (stateName === 'WIN') {
        document.getElementById('state-win').style.display = 'flex';
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
        div.style.background = "orange";
        discovered++;
        if(discovered === 4) setTimeout(() => setState('WIN'), 500);
    }
}

window.onload = () => setState('MENU');
