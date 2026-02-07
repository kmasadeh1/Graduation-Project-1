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

    try {
        const response = await fetch(FRAMEWORK_API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            logout(); // From auth.js
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch framework data');
        }

        const data = await response.json();
        renderFramework(data, container);

    } catch (error) {
        console.error('Error fetching framework:', error);
        container.innerHTML = `<div class="error-message" style="display:block;">Error loading data: ${error.message}</div>`;
    }
}

function renderFramework(domains, container) {
    container.innerHTML = ''; // Clear loading state

    if (!domains || domains.length === 0) {
        container.innerHTML = '<p>No compliance data found.</p>';
        return;
    }

    domains.forEach(domain => {
        const domainCard = createDomainCard(domain);
        container.appendChild(domainCard);
    });
}

function createDomainCard(domain) {
    const card = document.createElement('div');
    card.className = 'domain-card';

    // Domain Header
    const header = document.createElement('div');
    header.className = 'domain-header';
    header.innerHTML = `
        <h3 class="domain-title">${domain.code || ''} ${domain.title}</h3>
        <span class="domain-description">${domain.description || ''}</span>
    `;
    card.appendChild(header);

    // SubDomains
    if (domain.subdomains && domain.subdomains.length > 0) {
        const content = document.createElement('div');
        content.className = 'domain-content';

        domain.subdomains.forEach(sub => {
            const subSection = createSubDomainSection(sub);
            content.appendChild(subSection);
        });
        card.appendChild(content);
    }

    return card;
}

function createSubDomainSection(subdomain) {
    const section = document.createElement('div');
    section.className = 'subdomain-section';

    const header = document.createElement('h4');
    header.className = 'subdomain-title';
    header.textContent = `${subdomain.code || ''} ${subdomain.title}`;
    section.appendChild(header);

    if (subdomain.description) {
        const desc = document.createElement('p');
        desc.className = 'subdomain-description';
        desc.textContent = subdomain.description;
        section.appendChild(desc);
    }

    // Controls Table
    if (subdomain.controls && subdomain.controls.length > 0) {
        const table = createControlsTable(subdomain.controls);
        section.appendChild(table);
    }

    return section;
}

function createControlsTable(controls) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-wrapper';

    const table = document.createElement('table');
    table.className = 'controls-table';

    table.innerHTML = `
        <thead>
            <tr>
                <th style="width: 100px;">Code</th>
                <th>Title & Description</th>
                <th style="width: 120px;">Maturity</th>
            </tr>
        </thead>
        <tbody>
            ${controls.map(control => {
        const badgeClass = getMaturityBadgeClass(control.maturity_level);
        return `
                <tr>
                    <td class="control-code">${control.ref_code || control.code}</td>
                    <td>
                        <div class="control-title">${control.title}</div>
                        <div class="control-desc">${control.description || ''}</div>
                    </td>
                    <td>
                        <span class="badge ${badgeClass}">${control.maturity_level || 'N/A'}</span>
                    </td>
                </tr>
                `;
    }).join('')}
        </tbody>
    `;

    tableWrapper.appendChild(table);
    return tableWrapper;
}

function getMaturityBadgeClass(level) {
    const lvl = parseInt(level, 10);
    if (isNaN(lvl)) return 'badge-gray';
    if (lvl >= 5) return 'badge-green';
    if (lvl >= 3) return 'badge-blue';
    return 'badge-gray';
}
