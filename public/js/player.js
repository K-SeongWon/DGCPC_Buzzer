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
    const playerName = sessionStorage.getItem('playerName');
    const teamIndex = document.getElementById('playerTeam').value;
    socket.emit('joinRoom', { roomCode, playerName, teamIndex });
    document.getElementById('playerDetails').style.display = 'none';
    document.getElementById('gameDetails').style.display = 'block';
});

socket.on('playerData', (data) => {
    socket.emit('rejoinRoom', roomCode); // 팀 업데이트 후 방 데이터 요청
    document.getElementById('playerNameDisplay').innerText = data.playerName;
    document.getElementById('playerTeamDisplay').innerText = data.team;
});

socket.on('teamsList', (teams) => {
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = '';
    for (let teamIndex in teams) {
        const team = teams[teamIndex];
        const option = document.createElement('option');
        option.value = teamIndex;
        option.innerText = team.name;
        playerTeamSelect.appendChild(option);
    }

    // 플레이어 팀 이름 업데이트
    const playerName = document.getElementById('playerNameDisplay').innerText;
    const playerTeamIndex = sessionStorage.getItem('teamIndex');
    if (playerTeamIndex && teams[playerTeamIndex]) {
        document.getElementById('playerTeamDisplay').innerText = teams[playerTeamIndex].name;
    }
});

socket.on('teamAdded', (teams) => {
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = '';
    for (let teamIndex in teams) {
        const team = teams[teamIndex];
        const option = document.createElement('option');
        option.value = teamIndex;
        option.innerText = team.name;
        playerTeamSelect.appendChild(option);
    }
});

socket.on('teamUpdated', (teams) => {
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = '';
    for (let teamIndex in teams) {
        const team = teams[teamIndex];
        const option = document.createElement('option');
        option.value = teamIndex;
        option.innerText = team.name;
        playerTeamSelect.appendChild(option);
    }

    // 플레이어 팀 이름 업데이트
    const playerName = document.getElementById('playerNameDisplay').innerText;
    const playerTeamIndex = sessionStorage.getItem('teamIndex');
    if (playerTeamIndex && teams[playerTeamIndex]) {
        document.getElementById('playerTeamDisplay').innerText = teams[playerTeamIndex].name;
    }
});

socket.on('teamDeleted', (data) => {
    const playerTeamSelect = document.getElementById('playerTeam');
    playerTeamSelect.innerHTML = '';
    for (let teamIndex in data.teams) {
        const team = data.teams[teamIndex];
        const option = document.createElement('option');
        option.value = teamIndex;
        option.innerText = team.name;
        playerTeamSelect.appendChild(option);
    }

    const playerNameDisplay = document.getElementById('playerNameDisplay').innerText;
    const player = data.players[playerNameDisplay];
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
    const player = roomData.players[sessionStorage.getItem('playerName')];
    if (player) {
        document.getElementById('roomStateDisplay').innerText = roomData.state;
        document.getElementById('playerTeamDisplay').innerText = roomData.teams[player.team].name;
    }
});
