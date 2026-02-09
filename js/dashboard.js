const API_BASE = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkTokenAndFetchStats();
});

function checkTokenAndFetchStats() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    fetchStats(token);
}

async function fetchStats(token) {
    try {
        // FIX: Changed endpoint to the one that actually exists and returns stats
        const response = await fetch(`${API_BASE}/framework/reports/executive/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            logout(); // Assumes auth.js is loaded
            return;
        }

        if (response.ok) {
            const data = await response.json();
            renderDashboard(data);
        } else {
            console.error('Failed to fetch dashboard stats');
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

function renderDashboard(data) {
    // 1. Data Adapter / Normalization
    // Handle either backend structure: data.risks (new) or data.risk_summary (old)
    const rawRisks = data.risks || data.risk_summary || {};
    const risks = {
        low: rawRisks.low || rawRisks.low_risks || 0,
        medium: rawRisks.medium || rawRisks.medium_risks || 0,
        high: rawRisks.high || rawRisks.high_risks || 0,
        mitigated: rawRisks.mitigated || 0
    };

    // Handle either backend structure: data.compliance (new) or data.compliance_score (old flat score)
    let complianceData = data.compliance;
    if (!complianceData) {
        // Fallback if compliance object is missing but we have a score
        const score = Math.round(data.compliance_score || 0);
        complianceData = {
            total_controls: 100, // Dummy base if total unknown
            compliant_controls: score, // Treat score as count if normalized
            compliance_percentage: score
        };
    } else {
        // Ensure percentage is calculated if missing but counts exist
        if (complianceData.compliance_percentage === undefined && complianceData.total_controls > 0) {
            complianceData.compliance_percentage = (complianceData.compliant_controls / complianceData.total_controls) * 100;
        }
    }

    // Default safe values
    complianceData.total_controls = complianceData.total_controls || 0;
    complianceData.compliant_controls = complianceData.compliant_controls || 0;
    complianceData.compliance_percentage = complianceData.compliance_percentage || 0;

    // 2. Render Text Stats
    const totalEl = document.getElementById('stat-total-controls');
    if (totalEl) totalEl.textContent = complianceData.total_controls;

    // Update the "Assessments" number to show percentage compliant
    const assessEl = document.getElementById('stat-assessed');
    if (assessEl) {
        assessEl.textContent = Math.round(complianceData.compliance_percentage) + "%";
        // Color code the text
        if (complianceData.compliance_percentage >= 80) assessEl.style.color = '#10b981'; // Green
        else if (complianceData.compliance_percentage >= 50) assessEl.style.color = '#f59e0b'; // Orange
        else assessEl.style.color = '#ef4444'; // Red
    }

    // 3. Render Compliance Chart (Donut)
    const ctxCompliance = document.getElementById('complianceChart').getContext('2d');
    const compliantCount = complianceData.compliant_controls;
    const nonCompliantCount = complianceData.total_controls - compliantCount;

    if (window.myComplianceChart) window.myComplianceChart.destroy();

    window.myComplianceChart = new Chart(ctxCompliance, {
        type: 'doughnut',
        data: {
            labels: ['Compliant', 'Non-Compliant / Pending'],
            datasets: [{
                data: [compliantCount, nonCompliantCount],
                backgroundColor: [
                    '#10b981', // Emerald 500
                    '#e2e8f0'  // Slate 200
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // 4. Render Risk Chart (Bar) - NOW WITH MITIGATED
    const ctxRisk = document.getElementById('riskChart').getContext('2d');

    if (window.myRiskChart) window.myRiskChart.destroy();

    window.myRiskChart = new Chart(ctxRisk, {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High', 'Mitigated'], // Added Mitigated
            datasets: [{
                label: 'Risk Count',
                data: [
                    risks.low,
                    risks.medium,
                    risks.high,
                    risks.mitigated
                ],
                backgroundColor: [
                    '#22c55e', // Green (Low)
                    '#f97316', // Orange (Medium)
                    '#ef4444', // Red (High)
                    '#3b82f6'  // Blue (Mitigated - Success)
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { stepSize: 1 }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}