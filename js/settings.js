const API_BASE = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkToken();
});

function checkToken() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
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
