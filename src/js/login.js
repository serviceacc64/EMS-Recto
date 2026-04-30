document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Validation
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    // Check credentials
    if (username === 'admin' && password === '123') {
        // Redirect to dashboard
        window.location.href = 'src/pages/dashboard.html';
    } else {
        alert('Invalid username or password');
    }
});
