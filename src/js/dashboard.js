// Logout functionality
const logoutButton = document.querySelector('.sidebar-logout');
if (logoutButton) {
    logoutButton.addEventListener('click', function() {
        // Clear any session data if needed
        // sessionStorage.clear();
        // Redirect back to login page
        window.location.href = '../../index.html';
    });
}

// Set active navigation link based on current page
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    const activePageMap = {
        'export.html': 'employee.html'
    };
    const activePage = activePageMap[currentPage] || currentPage;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === activePage) {
            link.classList.add('active');
        }
    });
});
