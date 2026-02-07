const API_BASE = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkTokenAndInit();
});

function checkTokenAndInit() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Cleanup previous modal state if stuck
    const modal = document.getElementById('riskModal');
    if (modal) modal.classList.add('hidden');

    fetchAssets(token);
    fetchRisks(token);
}

// Fetch Assets for Dropdown
async function fetchAssets(token) {
    try {
        const response = await fetch(`${API_BASE}/assets/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const assets = await response.json();
            const select = document.getElementById('asset');
            assets.forEach(asset => {
                const option = document.createElement('option');
                option.value = asset.id; // Assuming API returns 'id'
                option.textContent = asset.name; // Assuming API returns 'name'
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error fetching assets:', error);
    }
}

// Fetch and Render Risks
async function fetchRisks(token) {
    try {
        const response = await fetch(`${API_BASE}/risks/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const risks = await response.json();
            renderRiskTable(risks);
        }
    } catch (error) {
        console.error('Error fetching risks:', error);
    }
}

function renderRiskTable(risks) {
    const tbody = document.querySelector('#risk-table tbody');
    tbody.innerHTML = '';

    if (risks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No risks found. Add one to get started.</td></tr>';
        return;
    }

    risks.forEach(risk => {
        const tr = document.createElement('tr');
        const scoreClass = getRiskScoreClass(risk.risk_score);

        // Handle nested asset object or ID
        const assetName = risk.asset ? (risk.asset.name || risk.asset) : 'N/A';

        tr.innerHTML = `
            <td>${assetName}</td>
            <td>${risk.threat}</td>
            <td>${risk.vulnerability}</td>
            <td style="text-align: center;">${risk.likelihood}</td>
            <td style="text-align: center;">${risk.impact}</td>
            <td style="text-align: center;">
                <span class="badge ${scoreClass}">${risk.risk_score}</span>
            </td>
            <td>${risk.status}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getRiskScoreClass(score) {
    if (score <= 8) return 'risk-low';
    if (score <= 15) return 'risk-medium';
    return 'risk-high';
}

// Create Risk
async function createRisk(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');

    const riskData = {
        asset_id: document.getElementById('asset').value,
        threat: document.getElementById('threat').value,
        vulnerability: document.getElementById('vulnerability').value,
        likelihood: parseInt(document.getElementById('likelihood').value),
        impact: parseInt(document.getElementById('impact').value),
        status: document.getElementById('status').value
    };

    try {
        const response = await fetch(`${API_BASE}/risks/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(riskData)
        });

        if (response.ok) {
            closeModal();
            document.getElementById('addRiskForm').reset();
            fetchRisks(token); // Refresh table
        } else {
            console.error('Failed to create risk');
            alert('Failed to create risk. Please check inputs.');
        }
    } catch (error) {
        console.error('Error creating risk:', error);
    }
}

// Modal Logic
window.openModal = function () { // Expose to global scope for HTML onclick
    document.getElementById('riskModal').classList.remove('hidden');
}

window.closeModal = function () {
    document.getElementById('riskModal').classList.add('hidden');
}
