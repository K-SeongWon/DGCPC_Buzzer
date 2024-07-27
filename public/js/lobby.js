const socket = io();

let isAdmin = false;
let isScreen = false;

socket.on('adminLoginResponse', (response) => {
    if (response.success) {
        isAdmin = response.isAdmin;
        isScreen = !response.isAdmin;
        sessionStorage.setItem('isAdmin', isAdmin);
        sessionStorage.setItem('isScreen', isScreen);
        sessionStorage.setItem('username', document.getElementById('adminUsername').value);
        sessionStorage.setItem('password', document.getElementById('adminPassword').value);
        if (isAdmin) {
            document.getElementById('adminPanel').style.display = 'block';
        }
        loadRooms();
    } else {
        sessionStorage.clear(); // 로그인 실패 시 세션 스토리지 초기화
        alert('Invalid login credentials');
    }
});

document.getElementById('createRoom').addEventListener('click', () => {
    const roomName = document.getElementById('roomName').value;
    socket.emit('createRoom', { roomName });
});

socket.on('publicRoomList', (rooms) => {
    const publicRoomList = document.getElementById('publicRoomList');
    publicRoomList.innerHTML = '';
    rooms.forEach(room => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${room.name} - 
            ${isAdmin ? `<button onclick="editRoom('${room.code}')">Edit</button> <button onclick="deleteRoom('${room.code}')">Delete</button>` : ''}
            <button onclick="joinRoom('${room.code}')">${isAdmin ? 'Enter as Admin' : isScreen ? 'Enter as Screen' : 'Join'}</button>
        `;
        publicRoomList.appendChild(li);
    });
});

function loadRooms() {
    socket.emit('getPublicRooms');
}

function editRoom(roomCode) {
    const newRoomName = prompt('Enter new room name:');
    if (newRoomName) {
        socket.emit('editRoom', { roomCode, newRoomName });
    }
}

function deleteRoom(roomCode) {
    if (confirm('Are you sure you want to delete this room?')) {
        socket.emit('deleteRoom', roomCode);
    }
}

function joinRoom(roomCode) {
    const username = sessionStorage.getItem('username');
    if (isAdmin) {
        window.location.href = `/admin?code=${roomCode}`;
    } else if (isScreen) {
        window.location.href = `/screen?code=${roomCode}`;
    } else {
        window.location.href = `/player?code=${roomCode}&username=${username}`;
    }
}

socket.emit('getPublicRooms');

// Check if admin was previously logged in
if (sessionStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isScreen') === 'true') {
    isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    isScreen = sessionStorage.getItem('isScreen') === 'true';
    if (isAdmin) {
        document.getElementById('adminPanel').style.display = 'block';
    }
    socket.emit('adminLogin', {
        username: sessionStorage.getItem('username'),
        password: sessionStorage.getItem('password')
    });
}
