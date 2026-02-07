/**
 * Authentication Logic for FortiGRC
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

// Login Function
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: email, // Django SimpleJWT usually expects 'username' (or email if configured)
                password: password
            })
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();

        // Save tokens
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        // Save user info (mock or decoded from token if needed)
        localStorage.setItem('user_email', email);

        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// Handle Login Form Submit
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');
    const submitBtn = document.querySelector('button[type="submit"]');

    // Reset UI
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    const success = await login(email, password);

    if (success) {
        window.location.href = 'dashboard.html';
    } else {
        errorMsg.textContent = 'Invalid email or password. Please try again.';
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    window.location.href = 'login.html';
}

// Check Auth on Dashboard Load
function checkAuth() {
    const token = localStorage.getItem('access_token');
    const currentPage = window.location.pathname.split('/').pop();

    if (!token && currentPage !== 'login.html') {
        window.location.href = 'login.html';
    } else if (token && currentPage === 'login.html') {
        // Optional: Auto-redirect if already logged in
        window.location.href = 'dashboard.html';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Only run checkAuth if we are NOT on the login page (to avoid loops or premature redirects if logic fails)
    // Actually, checkAuth handles page detection.
    checkAuth();

    // Setup Logout Button if exists
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});
