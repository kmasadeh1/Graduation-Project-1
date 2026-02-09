const API_BASE = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkToken();
    fetchUserProfile(); // New Function
});

function checkToken() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

async function fetchUserProfile() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`${API_BASE}/auth/profile/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const user = await response.json();
            document.getElementById('first-name').value = user.first_name || '';
            document.getElementById('last-name').value = user.last_name || '';
            document.getElementById('email').value = user.email || '';

            // Update the top-right navbar name dynamically
            const profileDisplay = document.querySelector('.user-profile div');
            if (profileDisplay) profileDisplay.textContent = (user.first_name[0] + user.last_name[0]).toUpperCase();
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    const data = {
        first_name: document.getElementById('first-name').value,
        last_name: document.getElementById('last-name').value,
        email: document.getElementById('email').value
    };

    try {
        const response = await fetch(`${API_BASE}/auth/profile/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showToast('Profile updated successfully!', 'success');
            // Update local storage email for consistency
            localStorage.setItem('user_email', data.email);
            document.querySelector('.user-email-display').textContent = data.email;
        } else {
            showToast('Failed to update profile.', 'error');
        }
    } catch (error) {
        showToast('Error updating profile.', 'error');
    }
}

async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Client-side Validation
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match.', 'error');
        return;
    }

    if (newPassword.length < 5) {
        showToast('Password is too short (min 5 characters).', 'error');
        return;
    }

    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(`${API_BASE}/auth/change-password/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                old_password: currentPassword,
                new_password: newPassword
            })
        });

        if (response.status === 200) {
            showToast('Password updated successfully!', 'success');
            document.getElementById('changePasswordForm').reset();
        } else {
            const data = await response.json();
            // Handle error message from backend
            let errorMsg = 'Failed to update password.';
            if (data.detail) errorMsg = data.detail;
            else if (data.old_password) errorMsg = `Current Password: ${data.old_password[0]}`;
            else if (data.new_password) errorMsg = `New Password: ${data.new_password[0]}`;

            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showToast('An error occurred. Please try again.', 'error');
    }
}
