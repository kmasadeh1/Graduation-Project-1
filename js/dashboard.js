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
    // --- DATA ADAPTER (The Fix) ---
    // We map the API response (score/risk_summary) to match YOUR existing variables (compliance/risks)

    // 1. Map Risks (Direct match)
    const risks = data.risk_summary || { low: 0, medium: 0, high: 0 };

    // 2. Map Compliance
    // Since the API returns a 'score' (e.g., 75), we normalize it to 100 so your donut chart works.
    // Total = 100, Compliant = Score.
    const score = Math.round(data.compliance_score || 0);
    const compliance = {
        total_controls: 100,
        compliant_controls: score
    };

    // --- YOUR EXISTING CODE BELOW (Preserved) ---

    // 1. Render Summary Numbers
    document.getElementById('stat-total-controls').textContent = compliance.total_controls + "%"; // Added % for clarity
    document.getElementById('stat-assessed').textContent = compliance.compliant_controls + "%";   // Added % for clarity

    // 2. Render Compliance Chart (Donut)
    const ctxCompliance = document.getElementById('complianceChart').getContext('2d');
    const nonCompliant = compliance.total_controls - compliance.compliant_controls;

    // Destroy chart if it exists to prevent "Canvas is already in use" errors
    if (window.myComplianceChart) window.myComplianceChart.destroy();

    window.myComplianceChart = new Chart(ctxCompliance, {
        type: 'doughnut',
        data: {
            labels: ['Compliant', 'Not Compliant / Pending'],
            datasets: [{
                data: [compliance.compliant_controls, nonCompliant],
                backgroundColor: [
                    '#10b981', // Green 500
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
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // 3. Render Risk Chart (Bar)
    const ctxRisk = document.getElementById('riskChart').getContext('2d');

    // Destroy chart if it exists
    if (window.myRiskChart) window.myRiskChart.destroy();

    window.myRiskChart = new Chart(ctxRisk, {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                label: 'Risk Count',
                data: [risks.low, risks.medium, risks.high],
                backgroundColor: [
                    '#10b981', // Green
                    '#f97316', // Orange
                    '#ef4444'  // Red
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f1f5f9'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}