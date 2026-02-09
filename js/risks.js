const API_BASE = 'http://127.0.0.1:8000/api';
let currentRiskId = null;

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
    const assetModal = document.getElementById('assetModal');
    if (assetModal) assetModal.classList.add('hidden');

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
            // Clear existing options except default
            select.innerHTML = '<option value="">Select an Asset...</option>';

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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No risks found. Add one to get started.</td></tr>';
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
            <td style="text-align: center;">
                <button class="btn-secondary" style="padding: 2px 8px; font-size: 0.75rem;" onclick='openEditModal(${JSON.stringify(risk)})'>
                    <i class="fa-solid fa-pen"></i>
                </button>
            </td>
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
// Create or Update Risk
async function createRisk(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');

    const riskData = {
        asset: document.getElementById('asset').value,
        threat: document.getElementById('threat').value,
        vulnerability: document.getElementById('vulnerability').value,
        likelihood: parseInt(document.getElementById('likelihood').value),
        impact: parseInt(document.getElementById('impact').value),
        status: document.getElementById('status').value
    };

    try {
        let response;
        if (currentRiskId) {
            // EDIT MODE (PATCH)
            response = await fetch(`${API_BASE}/risks/${currentRiskId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(riskData)
            });
        } else {
            // CREATE MODE (POST)
            response = await fetch(`${API_BASE}/risks/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(riskData)
            });
        }

        if (response.ok) {
            closeModal();
            document.getElementById('addRiskForm').reset();
            fetchRisks(token); // Refresh table

            const msg = currentRiskId ? 'Risk updated!' : 'Risk created!';
            currentRiskId = null; // Reset ID after op

            if (typeof showToast === 'function') {
                showToast(msg, 'success');
            } else {
                alert(msg);
            }
        } else {
            console.error('Failed to save risk');
            if (typeof showToast === 'function') {
                showToast('Failed to save risk.', 'error');
            } else {
                alert('Failed to save risk. Please check inputs.');
            }
        }
    } catch (error) {
        console.error('Error saving risk:', error);
    }
}

// Modal Logic
// Modal Logic
window.openEditModal = function (risk) {
    currentRiskId = risk.id;

    // Populate fields
    const assetSelect = document.getElementById('asset');
    // Handle if asset is object or ID
    const assetId = (typeof risk.asset === 'object' && risk.asset !== null) ? risk.asset.id : risk.asset;
    assetSelect.value = assetId || '';

    document.getElementById('threat').value = risk.threat;
    document.getElementById('vulnerability').value = risk.vulnerability;
    document.getElementById('likelihood').value = risk.likelihood;
    document.getElementById('impact').value = risk.impact;
    document.getElementById('status').value = risk.status;

    // Change Modal Title
    document.querySelector('#riskModal h3').textContent = "Edit Risk";

    // Show Modal
    document.getElementById('riskModal').classList.remove('hidden');
}

window.openModal = function () { // Expose to global scope for HTML onclick
    currentRiskId = null;
    document.getElementById('addRiskForm').reset();
    document.querySelector('#riskModal h3').textContent = "Add New Risk";
    document.getElementById('riskModal').classList.remove('hidden');
}

window.closeModal = function () {
    document.getElementById('riskModal').classList.add('hidden');
}

// --- Asset Management Logic ---

window.openAssetModal = function () {
    document.getElementById('assetModal').classList.remove('hidden');
    const token = localStorage.getItem('access_token');
    fetchAssetsForManager(token);
}

window.closeAssetModal = function () {
    document.getElementById('assetModal').classList.add('hidden');
}

async function fetchAssetsForManager(token) {
    const tbody = document.getElementById('asset-list-body');
    tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/assets/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const assets = await response.json();
            tbody.innerHTML = '';

            if (assets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3">No assets found.</td></tr>';
                return;
            }

            assets.forEach(asset => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${asset.name}</td>
                    <td>${asset.value}</td>
                    <td>
                        <button class="btn-danger-sm" onclick="deleteAsset(${asset.id})" style="padding: 2px 6px; font-size: 0.75rem; background: var(--risk-high); color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error fetching assets for manager:', error);
        tbody.innerHTML = '<tr><td colspan="3">Error loading assets.</td></tr>';
    }
}

async function createAsset(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');

    const assetData = {
        name: document.getElementById('new-asset-name').value,
        value: document.getElementById('new-asset-value').value,
        description: document.getElementById('new-asset-desc').value
    };

    try {
        const response = await fetch(`${API_BASE}/assets/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assetData)
        });

        if (response.status === 201) {
            alert('Asset created successfully!');
            document.getElementById('createAssetForm').reset();
            // Refresh Both lists
            fetchAssetsForManager(token);
            fetchAssets(token); // Update main dropdown
        } else {
            console.error('Failed to create asset');
            alert('Failed to create asset.');
        }
    } catch (error) {
        console.error('Error creating asset:', error);
    }
}

async function deleteAsset(id) {
    if (!confirm('Are you sure you want to delete this asset? This cannot be undone.')) return;

    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(`${API_BASE}/assets/${id}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 204) {
            // Refresh Both lists
            fetchAssetsForManager(token);
            fetchAssets(token); // Update main dropdown
        } else {
            console.error('Failed to delete asset');
            alert('Failed to delete asset (might be in use).');
        }
    } catch (error) {
        console.error('Error deleting asset:', error);
    }
}
