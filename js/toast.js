function showToast(message, type = 'success') {
    // Icons based on type
    const icons = {
        success: 'fa-solid fa-circle-check',
        error: 'fa-solid fa-circle-exclamation',
        info: 'fa-solid fa-circle-info'
    };

    const iconClass = icons[type] || icons.info;

    // Create Toast Element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `
        <i class="${iconClass}"></i>
        <div style="flex:1;">
            <p style="font-weight: 500; font-size: 0.875rem;">${message}</p>
        </div>
    `;

    // Append to body
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-out forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}
