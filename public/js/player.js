const socket = io();
let roomCode;
let hasBuzzed = false;

const urlParams = new URLSearchParams(window.location.search);
roomCode = urlParams.get('code');

if (roomCode) {
    document.getElementById('playerDetails').style.display = 'block';
    socket.emit('getTeams', roomCode);
}

document.getElementById('joinTeam').addEventListener('click', () => {
    const playerName = document.getElementById('playerName').value;
    const playerTeam = document.getElementById('playerTeam').value;
    socket.emit('joinRoom', { roomCode, playerName, team: playerTeam });
    document.getElementById('playerDetails').style.display = 'none';
    document.getElementById('gameDetails').style.display = 'block';
});

socket.on('playerData', (data) => {
    document.getElementById('playerNameDisplay').innerText = data.playerName;
    document.getElementById('playerTeamDisplay').innerText = data.team;
});

socket.on('teamsList', (teams) => {
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = '';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.innerText = team;
        playerTeamSelect.appendChild(option);
    });
});

socket.on('teamAdded', (teams) => {
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = '';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.innerText = team;
        playerTeamSelect.appendChild(option);
    });
});

socket.on('teamUpdated', (teams) => {
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = '';
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.innerText = team;
        playerTeamSelect.appendChild(option);
    });
});

socket.on('teamDeleted', (data) => {
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = '';
    data.teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.innerText = team;
        playerTeamSelect.appendChild(option);
    });

    const playerNameDisplay = document.getElementById('playerNameDisplay').innerText;
    const player = Object.values(data.players).find(p => p.name === playerNameDisplay);
    if (player) {
        document.getElementById('playerTeamDisplay').innerText = player.team;
    }
});

socket.on('gameStarting', () => {
    let countdown = 3;
    document.getElementById('buzzer').style.display = 'none';
    hasBuzzed = false;
    const countdownInterval = setInterval(() => {
        document.getElementById('roomStateDisplay').innerText = `Starting in ${countdown}...`;
        countdown--;
        if (countdown < 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
});

socket.on('gameStarted', () => {
    document.getElementById('roomStateDisplay').innerText = 'Start';
    if (!hasBuzzed) {
        document.getElementById('buzzer').style.display = 'block';
    }
});

document.getElementById('buzzer').addEventListener('click', () => {
    if (!hasBuzzed) {
        const playerName = document.getElementById('playerNameDisplay').innerText;
        socket.emit('buzzerPressed', { roomCode, playerName });
        document.getElementById('buzzer').style.display = 'none';
        hasBuzzed = true;
    }
});

socket.on('gameEnded', () => {
    document.getElementById('buzzTime').style.display = 'none';
    hasBuzzed = false;
});

socket.on('gameReset', () => {
    document.getElementById('buzzer').style.display = 'none';
    document.getElementById('buzzTime').style.display = 'none';
    hasBuzzed = false;
});

socket.on('buzzTime', ({ playerName, time }) => {
    const buzzTime = document.getElementById('buzzTime');
    buzzTime.style.display = 'block';
    buzzTime.innerText = `${playerName}: ${time} s`;
});

socket.on('roomDataUpdated', (roomData) => {
    document.getElementById('roomStateDisplay').innerText = roomData.state;
});
