const socket = io();

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const playerName = document.getElementById('username').value;
    sessionStorage.setItem('playerName', playerName);

    if (playerName === 'admin' || playerName === 'screen') {
        const password = document.getElementById('password').value;
        socket.emit('adminLogin', { username: playerName, password });
    } else {
        window.location.href = '/lobby.html';
    }
});

socket.on('adminLoginResponse', (response) => {
    if (response.success) {
        if (response.isAdmin) {
            sessionStorage.setItem('isAdmin', true);
            window.location.href = '/lobby.html';
        } else {
            sessionStorage.setItem('isScreen', true);
            window.location.href = '/lobby.html';
        }
    } else {
        alert('Invalid login credentials');
    }
});
