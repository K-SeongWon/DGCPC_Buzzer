const express = require('express');
const http = require('http');
const { performance } = require('perf_hooks');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const dataFilePath = path.join(__dirname, 'data.json');

let data = {
    admin: {
        username: 'admin',
        password: 'dgcpc1985'
    },
    screen: {
        username: 'screen',
        password: 'screen'
    },
    rooms: {}
};

// JSON 파일에서 데이터를 읽어옵니다.
if (fs.existsSync(dataFilePath)) {
    const fileData = JSON.parse(fs.readFileSync(dataFilePath));
    fileData.admin = data.admin;
    data = {
        ...fileData,
        admin: data.admin // 고정된 비밀번호로 덮어씌우기
    };
}

function saveData() {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2)); // 데이터를 파일에 저장
}

function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function startBuzzerTimer(roomCode) {
    if (data.rooms[roomCode]) {
        data.rooms[roomCode].buzzerStartTime = performance.now();
    }
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

app.get('/player', (req, res) => {
    res.sendFile(__dirname + '/public/player.html');
});

app.get('/screen', (req, res) => {
    res.sendFile(__dirname + '/public/screen.html');
});

io.on('connection', (socket) => {
    socket.on('adminLogin', ({ username, password }) => {
        if ((username === data.admin.username && password === data.admin.password) ||
            (username === data.screen.username && password === data.screen.password)) {
            socket.emit('adminLoginResponse', { success: true, isAdmin: username === data.admin.username });
        } else {
            socket.emit('adminLoginResponse', { success: false });
        }
    });

    socket.on('createRoom', ({ roomName }) => {
        const roomCode = generateRoomCode();
        data.rooms[roomCode] = { name: roomName, code: roomCode, state: 'Ready', players: {}, teams: {}, buzzerResults: [], buzzerStartTime: null };
        saveData();
        io.emit('publicRoomList', Object.values(data.rooms));
    });

    socket.on('editRoom', ({ roomCode, newRoomName }) => {
        if (data.rooms[roomCode]) {
            data.rooms[roomCode].name = newRoomName;
            saveData();
            io.emit('publicRoomList', Object.values(data.rooms));
        }
    });

    socket.on('deleteRoom', (roomCode) => {
        if (data.rooms[roomCode]) {
            delete data.rooms[roomCode];
            saveData();
            io.emit('publicRoomList', Object.values(data.rooms));
        }
    });

    socket.on('getPublicRooms', () => {
        socket.emit('publicRoomList', Object.values(data.rooms));
    });

    socket.on('addTeam', ({ roomCode, teamName }) => {
        if (data.rooms[roomCode]) {
            const teamIndex = `team${Object.keys(data.rooms[roomCode].teams).length + 1}`;
            data.rooms[roomCode].teams[teamIndex] = { name: teamName, score: 0 };
            io.to(roomCode).emit('teamAdded', data.rooms[roomCode].teams);
            saveData();
        }
    });

    socket.on('editTeam', ({ roomCode, teamIndex, newTeamName }) => {
        if (data.rooms[roomCode] && data.rooms[roomCode].teams[teamIndex]) {
            data.rooms[roomCode].teams[teamIndex].name = newTeamName;

            // 플레이어의 팀 이름도 업데이트
            for (let playerName in data.rooms[roomCode].players) {
                if (data.rooms[roomCode].players[playerName].team === teamIndex) {
                    data.rooms[roomCode].players[playerName].team = teamIndex;
                }
            }

            io.to(roomCode).emit('teamUpdated', data.rooms[roomCode].teams);
            io.to(roomCode).emit('roomDataUpdated', data.rooms[roomCode]);
            saveData();
        }
    });

    socket.on('deleteTeam', ({ roomCode, teamIndex }) => {
        if (data.rooms[roomCode] && data.rooms[roomCode].teams[teamIndex]) {
            delete data.rooms[roomCode].teams[teamIndex];
            
            // 팀이 삭제되면 플레이어의 팀을 'unknown'으로 설정
            for (let playerName in data.rooms[roomCode].players) {
                if (data.rooms[roomCode].players[playerName].team === teamIndex) {
                    data.rooms[roomCode].players[playerName].team = 'unknown';
                }
            }
            
            io.to(roomCode).emit('teamDeleted', { teams: data.rooms[roomCode].teams, players: data.rooms[roomCode].players });
            io.to(roomCode).emit('roomDataUpdated', data.rooms[roomCode]);
            saveData();
        }
    });

    socket.on('joinRoom', ({ roomCode, playerName, teamIndex }) => {
        if (data.rooms[roomCode] && data.rooms[roomCode].state === 'Ready') {
            data.rooms[roomCode].players[playerName] = { name: playerName, team: teamIndex };
            socket.join(roomCode);
            saveData(); // 플레이어가 방에 참가한 후 즉시 저장
            io.to(roomCode).emit('playerJoined', data.rooms[roomCode].players);
            io.to(roomCode).emit('roomDataUpdated', data.rooms[roomCode]);
            if (data.rooms[roomCode].teams[teamIndex]) {
                socket.emit('playerData', { playerName, team: data.rooms[roomCode].teams[teamIndex].name });
            } else {
                socket.emit('playerData', { playerName, team: 'Unknown' });
            }
        } else {
            socket.emit('error', 'Room not found or not in Ready state');
        }
    });

    socket.on('getTeams', (roomCode) => {
        if (data.rooms[roomCode]) {
            socket.emit('teamsList', data.rooms[roomCode].teams);
        }
    });

    socket.on('startGame', (roomCode) => {
        if (data.rooms[roomCode]) {
            data.rooms[roomCode].state = 'Start';
            io.to(roomCode).emit('gameStarting');
            setTimeout(() => {
                startBuzzerTimer(roomCode);
                io.to(roomCode).emit('gameStarted');
                io.to(roomCode).emit('roomDataUpdated', data.rooms[roomCode]);
            }, 4000); // 3초 카운트다운 후 게임 시작 (1000ms 더 추가하여 0초까지 완전히 세도록 조정)
        }
    });

    socket.on('buzzerPressed', ({ roomCode, playerName }) => {
        if (data.rooms[roomCode] && data.rooms[roomCode].state === 'Start') {
            const player = data.rooms[roomCode].players[playerName];
            if (player) {
                const buzzerPressTime = performance.now();
                const timeElapsed = ((buzzerPressTime - data.rooms[roomCode].buzzerStartTime) / 1000).toFixed(5);
                data.rooms[roomCode].buzzerResults.push({ playerName, team: data.rooms[roomCode].teams[player.team].name, time: timeElapsed });
                io.to(roomCode).emit('buzzerResult', data.rooms[roomCode].buzzerResults);
                io.to(roomCode).emit('buzzTime', { playerName, time: timeElapsed });
                saveData();
            }
        }
    });

    socket.on('endGame', (roomCode) => {
        if (data.rooms[roomCode]) {
            data.rooms[roomCode].state = 'End';
            io.to(roomCode).emit('gameEnded', data.rooms[roomCode].buzzerResults);
            io.to(roomCode).emit('roomDataUpdated', data.rooms[roomCode]);
            saveData();
        }
    });

    socket.on('resetGame', (roomCode) => {
        if (data.rooms[roomCode]) {
            data.rooms[roomCode].state = 'Ready';
            data.rooms[roomCode].buzzerResults = [];
            data.rooms[roomCode].buzzerStartTime = null;
            io.to(roomCode).emit('gameReset');
            io.to(roomCode).emit('roomDataUpdated', data.rooms[roomCode]);
            saveData();
        }
    });

    // 방에 다시 접속할 때 팀 목록과 방 데이터를 전송
    socket.on('rejoinRoom', (roomCode) => {
        if (data.rooms[roomCode]) {
            socket.emit('teamsList', data.rooms[roomCode].teams);
            socket.emit('roomDataUpdated', data.rooms[roomCode]);
        }
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000.');
    saveData(); // Ensure data is saved on server start
});
