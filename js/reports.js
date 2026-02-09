const API_BASE = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkTokenAndFetch();
});

function checkTokenAndFetch() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    fetchReportData(token);
}

async function fetchReportData(token) {
    try {
        const response = await fetch(`${API_BASE}/framework/reports/executive/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const data = await response.json();
            renderReport(data);
        } else {
            console.error('Failed to fetch report data');
            document.getElementById('compliance-score').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching report:', error);
    }
}

function renderReport(data) {
    // 1. Compliance Score
    const score = data.compliance_score || 0;
    const scoreEl = document.getElementById('compliance-score');
    scoreEl.textContent = `${score}%`;

    // Color code the score
    if (score >= 80) scoreEl.style.color = 'var(--success-color)';
    else if (score >= 50) scoreEl.style.color = '#f59e0b'; // Orange
    else scoreEl.style.color = 'var(--danger-color)';

    // 2. Top Risks
    const risksBody = document.getElementById('top-risks-body');
    risksBody.innerHTML = '';

    if (!data.top_risks || data.top_risks.length === 0) {
        risksBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No high risks identified.</td></tr>';
    } else {
        data.top_risks.forEach(risk => {
            const tr = document.createElement('tr');

            // ... (Your asset name logic is fine) ...

            // ADD THIS COLOR LOGIC:
            let badgeClass = 'risk-low';
            // Assuming your CSS has .risk-low (green), .risk-medium (orange), .risk-high (red)
            if (risk.risk_score >= 16) badgeClass = 'risk-high';
            else if (risk.risk_score >= 9) badgeClass = 'risk-medium';

            tr.innerHTML = `
        <td>${assetName}</td>
        <td>${risk.threat}</td>
        <td style="text-align:center;">
            <span class="badge ${badgeClass}">${risk.risk_score}</span>
        </td>
    `;
            risksBody.appendChild(tr);
        });
    }

    // 3. Compliance Gaps
    const gapsBody = document.getElementById('compliance-gaps-body');
    gapsBody.innerHTML = '';

    if (!data.compliance_gaps || data.compliance_gaps.length === 0) {
        gapsBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No compliance gaps found. Great job!</td></tr>';
    } else {
        data.compliance_gaps.forEach(gap => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
<td class="control-code">${gap.control || gap.ref_code || gap.code}</td>
                <td>
                     <div class="control-title">${gap.title}</div>
                </td>
            `;
            gapsBody.appendChild(tr);
        });
    }
}
