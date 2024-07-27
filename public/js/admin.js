const socket = io();
let roomCode;

const urlParams = new URLSearchParams(window.location.search);
roomCode = urlParams.get('code');

if (roomCode) {
    document.getElementById('roomDetails').style.display = 'block';
    socket.emit('rejoinRoom', roomCode);
    socket.emit('joinRoom', { roomCode, playerName: 'admin', team: 'Admin' });
}

document.getElementById('addTeam').addEventListener('click', () => {
    const teamName = document.getElementById('teamName').value;
    socket.emit('addTeam', { roomCode, teamName });
});

socket.on('teamAdded', (teams) => {
    updateTeamsList(teams);
});

socket.on('teamUpdated', (teams) => {
    updateTeamsList(teams);
});

socket.on('teamDeleted', (data) => {
    updateTeamsList(data.teams);
    updateParticipantsList(data.players);
});

socket.on('playerJoined', (players) => {
    updateParticipantsList(players);
});

document.getElementById('startGame').addEventListener('click', () => {
    socket.emit('startGame', roomCode);
});

document.getElementById('endGame').addEventListener('click', () => {
    socket.emit('endGame', roomCode);
});

document.getElementById('resetGame').addEventListener('click', () => {
    socket.emit('resetGame', roomCode);
});

socket.on('gameStarting', () => {
    document.getElementById('roomStateDisplay').innerText = 'Starting...';
    let countdown = 3;
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
});

socket.on('gameEnded', (results) => {
    document.getElementById('roomStateDisplay').innerText = 'End';
});

socket.on('gameReset', () => {
    document.getElementById('roomStateDisplay').innerText = 'Ready';
    document.getElementById('participantsList').innerHTML = '';
});

socket.on('buzzerResult', (results) => {
    const resultsList = document.getElementById('buzzerResultsList');
    resultsList.innerHTML = '';
    results.forEach(result => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="result-name">${result.playerName}</span> (<span class="result-team">${result.team}</span>): <span class="result-time">${result.time} s</span>`;
        resultsList.appendChild(li);
    });
});

socket.on('buzzTime', ({ playerName, time }) => {
    const resultsList = document.getElementById('buzzerResultsList');
    const li = document.createElement('li');
    li.innerHTML = `<span class="result-name">${playerName}</span>: <span class="result-time">${time} s</span>`;
    resultsList.appendChild(li);
});

socket.on('roomDataUpdated', (roomData) => {
    document.getElementById('roomStateDisplay').innerText = roomData.state;
    document.getElementById('roomNameDisplay').innerText = roomData.name;
    document.getElementById('roomCodeDisplay').innerText = roomData.code;
    updateParticipantsList(roomData.players);
    updateTeamsList(roomData.teams);
});

function updateTeamsList(teams) {
    const teamsList = document.getElementById('teamsList');
    teamsList.innerHTML = '';
    teams.forEach(team => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="team-name">${team}</span>
            <button onclick="editTeam('${team}')">Edit</button>
            <button onclick="deleteTeam('${team}')">Delete</button>
        `;
        teamsList.appendChild(li);
    });
}

function editTeam(oldTeamName) {
    const newTeamName = prompt("Enter new team name:", oldTeamName);
    if (newTeamName && newTeamName !== oldTeamName) {
        socket.emit('editTeam', { roomCode, oldTeamName, newTeamName });
    }
}

function deleteTeam(teamName) {
    if (confirm(`Are you sure you want to delete the team "${teamName}"?`)) {
        socket.emit('deleteTeam', { roomCode, teamName });
    }
}

function updateParticipantsList(players) {
    const participantsList = document.getElementById('participantsList');
    participantsList.innerHTML = '';
    for (let playerName in players) {
        const player = players[playerName];
        if (player.name && player.name !== 'admin' && player.name !== 'screen' && player.name !== 'undefined') {
            const li = document.createElement('li');
            li.innerHTML = `<span class="player-name">${player.name}</span> (<span class="player-team">${player.team}</span>)`;
            participantsList.appendChild(li);
        }
    }
}
