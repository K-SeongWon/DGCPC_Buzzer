const socket = io();
let roomCode;

const urlParams = new URLSearchParams(window.location.search);
roomCode = urlParams.get('code');

if (roomCode) {
    document.getElementById('screenDetails').style.display = 'block';
    document.getElementById('roomCodeScreen').innerText = roomCode;
    socket.emit('joinRoom', { roomCode });
}

socket.on('playerJoined', (players) => {
    updateParticipantsList(players);
});

socket.on('buzzerResult', (results) => {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    results.forEach(result => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="result-name">${result.playerName}</span> (<span class="result-team">${result.team}</span>): <span class="result-time">${result.time} s</span>`;
        resultsList.appendChild(li);
    });
});

socket.on('gameEnded', (results) => {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    results.forEach(result => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="result-name">${result.playerName}</span> (<span class="result-team">${result.team}</span>): <span class="result-time">${result.time} s</span>`;
        resultsList.appendChild(li);
    });
});

socket.on('gameReset', () => {
    document.getElementById('screenParticipantsList').innerHTML = '';
    document.getElementById('resultsList').innerHTML = '';
});

socket.on('gameStarting', () => {
    let countdown = 3;
    const countdownInterval = setInterval(() => {
        document.getElementById('roomStateDisplay').innerText = `Starting in ${countdown}...`;
        countdown--;
        if (countdown < 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
});

socket.on('roomDataUpdated', (roomData) => {
    document.getElementById('roomNameScreen').innerText = roomData.name;
    document.getElementById('roomStateDisplay').innerText = roomData.state;
    updateParticipantsList(roomData.players);
});

socket.on('teamAdded', (teams) => {
    // Update screen if necessary
});

socket.on('teamUpdated', (teams) => {
    // Update screen if necessary
});

socket.on('teamDeleted', (data) => {
    updateParticipantsList(data.players);
});

function updateParticipantsList(players) {
    const screenParticipantsList = document.getElementById('screenParticipantsList');
    screenParticipantsList.innerHTML = '';
    for (let ip in players) {
        const player = players[ip];
        const li = document.createElement('li');
        li.innerHTML = `<span class="player-name">${player.name}</span> (<span class="player-team">${player.team}</span>)`;
        screenParticipantsList.appendChild(li);
    }
}
