const socket = io();

document.getElementById('username').addEventListener('input', (e) => {
    const username = e.target.value;
    document.getElementById('passwordContainer').style.display = (username === 'admin' || username === 'screen') ? 'block' : 'none';
    document.getElementById('loginButton').style.display = 'block';
});

document.getElementById('loginButton').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username === 'admin' || username === 'screen') {
        socket.emit('adminLogin', { username, password });
    } else {
        sessionStorage.setItem('username', username);
        window.location.href = '/lobby.html';
    }
});

socket.on('adminLoginResponse', (response) => {
    if (response.success) {
        sessionStorage.setItem('isAdmin', response.isAdmin);
        sessionStorage.setItem('isScreen', !response.isAdmin);
        sessionStorage.setItem('username', document.getElementById('username').value);
        sessionStorage.setItem('password', document.getElementById('password').value);
        window.location.href = '/lobby.html';
    } else {
        alert('Invalid login credentials');
    }
});
