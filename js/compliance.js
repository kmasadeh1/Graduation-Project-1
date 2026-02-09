const FRAMEWORK_API_URL = 'http://127.0.0.1:8000/api/framework/';

document.addEventListener('DOMContentLoaded', () => {
    checkTokenAndFetch();
});

function checkTokenAndFetch() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    fetchFramework(token);
}

async function fetchFramework(token) {
    const container = document.getElementById('framework-container');
    container.innerHTML = '<div class="loading-spinner">Loading framework...</div>';

    try {
        const response = await fetch(FRAMEWORK_API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        renderFramework(data, container);

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div class="error-message" style="display:block;">Error: ${error.message}</div>`;
    }
}

function renderFramework(domains, container) {
    container.innerHTML = '';

    if (!domains.length) {
        container.innerHTML = '<p>No data found.</p>';
        return;
    }

    domains.forEach(domain => {
        // 1. Domain Card (The Wrapper)
        const card = document.createElement('div');
        card.className = 'domain-card';

        // 2. Header (Clickable)
        const header = document.createElement('div');
        header.className = 'domain-header accordion-header';
        header.innerHTML = `
            <div>
                <h3 class="domain-title">${domain.code} - ${domain.name}</h3>
                <span class="domain-description">${domain.description || ''}</span>
            </div>
            <i class="fa-solid fa-chevron-down accordion-icon"></i>
        `;

        // 3. Content (Hidden by default)
        const content = document.createElement('div');
        content.className = 'domain-content accordion-content';

        // Render Subdomains inside
        if (domain.subdomains) {
            domain.subdomains.forEach(sub => {
                const subDiv = document.createElement('div');
                subDiv.className = 'subdomain-section';
                subDiv.innerHTML = `
                    <h4 class="subdomain-title" style="color: var(--primary-color); margin-top: 1rem;">
                        ${sub.code} ${sub.name}
                    </h4>
                `;

                if (sub.controls && sub.controls.length > 0) {
                    subDiv.appendChild(createControlsTable(sub.controls));
                }
                content.appendChild(subDiv);
            });
        }

        // 4. Click Event
        header.addEventListener('click', () => {
            const icon = header.querySelector('.accordion-icon');
            icon.classList.toggle('rotate');
            content.classList.toggle('open');
        });

        card.appendChild(header);
        card.appendChild(content);
        container.appendChild(card);
    });
}

function createControlsTable(controls) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    const rows = controls.map(c => `
        <tr>
            <td class="control-code">${c.ref_code || c.code}</td>
            <td>
                <div class="control-title">${c.title}</div>
                <div class="control-desc">${c.description}</div>
            </td>
            <td><span class="badge badge-gray">Target: L${c.maturity_level}</span></td>
        </tr>
    `).join('');

    wrapper.innerHTML = `
        <table class="controls-table">
            <thead>
                <tr>
                    <th style="width:100px;">Code</th>
                    <th>Control</th>
                    <th style="width:100px;">Maturity</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
    return wrapper;
}
