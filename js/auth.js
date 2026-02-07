/**
 * Authentication Logic for FortiGRC
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

// --- 1. CORE API FUNCTIONS ---

// Login Function
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: email, // Django SimpleJWT expects 'username' (we map email to it)
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
        localStorage.setItem('user_email', email);

        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// Register Function (NEW)
async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register/`, { // Check this URL in urls.py!
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }

        return { success: true };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: error.message };
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    window.location.href = 'login.html';
}

// --- 2. FORM HANDLERS ---

// Handle Login Form Submit
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value; // Changed ID to match HTML
    const password = document.getElementById('login-password').value; // Changed ID to match HTML
    const msgBox = document.getElementById('message-box');
    const submitBtn = event.target.querySelector('button[type="submit"]');

    // Reset UI
    if (msgBox) msgBox.style.display = 'none';
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    const success = await login(email, password);

    if (success) {
        window.location.href = 'dashboard.html';
    } else {
        if (msgBox) {
            msgBox.textContent = 'Invalid email or password.';
            msgBox.style.display = 'block';
            msgBox.style.color = 'red';
        } else {
            alert('Invalid email or password');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle Register Form Submit (NEW)
async function handleRegister(event) {
    event.preventDefault();

    const first = document.getElementById('reg-first').value;
    const last = document.getElementById('reg-last').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const msgBox = document.getElementById('message-box'); // We reuse the login error box

    // Simple Validation
    if (password.length < 4) {
        alert("Password is too short!");
        return;
    }

    const result = await register({
        first_name: first,
        last_name: last,
        email: email,
        password: password
    });

    if (result.success) {
        alert("Account created successfully! Please log in.");
        toggleForms('login'); // Switch back to login view
        document.getElementById('login-email').value = email; // Pre-fill email
    } else {
        if (msgBox) {
            msgBox.style.display = 'block';
            msgBox.style.color = 'red';
            // Clean up the error message (remove brackets/quotes if it's JSON)
            msgBox.textContent = "Registration Failed: " + result.message.replace(/[{}"]/g, '');
        } else {
            alert("Error: " + result.message);
        }
    }
}

// --- 3. PAGE INITIALIZATION ---

// Check Auth on Dashboard Load
function checkAuth() {
    const token = localStorage.getItem('access_token');
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html'; // Handle empty path

    // If on dashboard but no token -> Go to Login
    if (!token && currentPage !== 'login.html') {
        window.location.href = 'login.html';
    }
    // If on login but have token -> Go to Dashboard
    else if (token && currentPage === 'login.html') {
        window.location.href = 'dashboard.html';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Setup Logout Button if exists (for dashboard)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});