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
        const response = await fetch(`${API_BASE}/dashboard/stats/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            logout();
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
    // 1. Render Summary Numbers
    // Assuming API structure: { compliance: { total: 10, compliant: 2 }, risks: { low: 1, medium: 2, high: 3 } }
    // Adjust logic based on actual API response structure from the prompt aggregation endpoint description.

    // Fallback/Safety Check
    const compliance = data.compliance || { total_controls: 0, compliant_controls: 0 };
    const risks = data.risks || { low: 0, medium: 0, high: 0 };

    document.getElementById('stat-total-controls').textContent = compliance.total_controls;
    document.getElementById('stat-assessed').textContent = compliance.compliant_controls; // Or assessed count if available

    // 2. Render Compliance Chart (Donut)
    const ctxCompliance = document.getElementById('complianceChart').getContext('2d');
    const nonCompliant = compliance.total_controls - compliance.compliant_controls;

    new Chart(ctxCompliance, {
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

    new Chart(ctxRisk, {
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
