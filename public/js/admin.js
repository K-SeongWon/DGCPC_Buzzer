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
    socket.emit('rejoinRoom', roomCode); // 팀 업데이트 후 방 데이터 요청
});

socket.on('teamDeleted', (data) => {
    updateTeamsList(data.teams);
    updateParticipantsList(data.players, data.teams);
});

socket.on('playerJoined', (players) => {
    socket.emit('rejoinRoom', roomCode); // 플레이어 업데이트 후 방 데이터 요청
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

// Remove the buzzTime event handler to avoid duplication
// socket.on('buzzTime', ({ playerName, time }) => {
//     const resultsList = document.getElementById('buzzerResultsList');
//     const li = document.createElement('li');
//     li.innerHTML = `<span class="result-name">${playerName}</span>: <span class="result-time">${time} s</span>`;
//     resultsList.appendChild(li);
// });

socket.on('roomDataUpdated', (roomData) => {
    document.getElementById('roomStateDisplay').innerText = roomData.state;
    document.getElementById('roomNameDisplay').innerText = roomData.name;
    document.getElementById('roomCodeDisplay').innerText = roomData.code;
    updateParticipantsList(roomData.players, roomData.teams);
    updateTeamsList(roomData.teams);
});

function updateTeamsList(teams) {
    const teamsList = document.getElementById('teamsList');
    teamsList.innerHTML = '';
    for (let teamIndex in teams) {
        const team = teams[teamIndex];
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="team-name">${team.name}</span>
            <button onclick="editTeam('${teamIndex}')">Edit</button>
            <button onclick="deleteTeam('${teamIndex}')">Delete</button>
            <ul id="participants-${teamIndex}"></ul>
        `;
        teamsList.appendChild(li);
    }
}

function editTeam(teamIndex) {
    const newTeamName = prompt("Enter new team name:", teamIndex);
    if (newTeamName) {
        socket.emit('editTeam', { roomCode, teamIndex, newTeamName });
    }
}

function deleteTeam(teamIndex) {
    if (confirm(`Are you sure you want to delete this team?`)) {
        socket.emit('deleteTeam', { roomCode, teamIndex });
    }
}

function updateParticipantsList(players, teams) {
    const teamsList = document.getElementById('teamsList').children;
    for (let li of teamsList) {
        const teamIndex = li.querySelector('.team-name').dataset.index;
        const participantsList = li.querySelector(`#participants-${teamIndex}`);
        participantsList.innerHTML = '';
        for (let playerName in players) {
            if (players[playerName].team === teamIndex) {
                const playerTeamName = teams[players[playerName].team].name;
                const playerElement = document.createElement('li');
                playerElement.innerHTML = `<span class="player-name">${players[playerName].name}</span> (<span class="player-team">${playerTeamName}</span>)`;
                participantsList.appendChild(playerElement);
            }
        }
    }
}
