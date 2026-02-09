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

    // Cleanup previous modal state
    const modal = document.getElementById('assessmentModal');
    if (modal) modal.classList.add('hidden');

    fetchData(token);
}

// Global state to store merging results map: controlId -> assessment
let assessmentMap = {};
let controlsList = [];

async function fetchData(token) {
    try {
        // Parallel Fetch: Framework (Controls) AND Assessments
        const [frameworkRes, assessmentRes] = await Promise.all([
            fetch(`${API_BASE}/framework/`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/assessments/`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (frameworkRes.status === 401 || assessmentRes.status === 401) {
            logout();
            return;
        }

        const frameworkData = await frameworkRes.json();
        const assessmentsData = await assessmentRes.json();

        // Process Data
        processAndRender(frameworkData, assessmentsData);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function processAndRender(domains, assessments) {
    // 1. Flatten Controls from Hierarchy
    controlsList = [];
    domains.forEach(domain => {
        if (domain.subdomains) {
            domain.subdomains.forEach(sub => {
                if (sub.controls) {
                    sub.controls.forEach(ctrl => {
                        // Attach parent info for context if needed
                        ctrl.domainName = domain.name;
                        controlsList.push(ctrl);
                    });
                }
            });
        }
    });

    // 2. Map Assessments by Control ID for O(1) lookup
    assessmentMap = {};
    assessments.forEach(ass => {
        assessmentMap[ass.control] = ass; // Assuming API returns 'control' as ID
    });

    // 3. Render Table
    renderTable();
}

function renderTable() {
    const tbody = document.querySelector('#assessment-table tbody');
    tbody.innerHTML = '';

    if (controlsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No controls found.</td></tr>';
        return;
    }

    controlsList.forEach(control => {
        const assessment = assessmentMap[control.id]; // Match by ID
        const status = assessment ? assessment.status : 'Not Started';
        const badgeClass = getStatusBadgeClass(status);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="control-code">${control.ref_code || control.code}</td>
            <td>
                <div class="control-title">${control.title}</div>
                <div class="control-desc">${control.description || ''}</div>
            </td>
            <td>
                <span class="badge ${badgeClass}">${status}</span>
            </td>
            <td style="text-align: right;">
                <button class="btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="openAssessmentModal(${control.id})">
                    Manage
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Compliant': return 'badge-green';
        case 'In Progress': return 'badge-blue';
        case 'Not Started': return 'badge-gray';
        case 'Non-Compliant': return 'risk-high'; // Reuse red class
        default: return 'badge-gray';
    }
}

// Open Modal
window.openAssessmentModal = function (controlId) {
    const control = controlsList.find(c => c.id === controlId);
    if (!control) return;

    const assessment = assessmentMap[controlId];

    // Populate Modal
    document.getElementById('modal-control-code').textContent = control.ref_code || control.code;
    document.getElementById('modal-control-title').textContent = control.title;
    document.getElementById('control-id').value = control.id;

    // Reset Form
    document.getElementById('evidence-file').value = '';
    document.getElementById('evidence-list').innerHTML = '';

    if (assessment) {
        document.getElementById('assessment-id').value = assessment.id;
        document.getElementById('status').value = assessment.status;
        enableEvidenceSection(true);
        // Render existing evidence if API provides it inside assessment object (e.g. assessment.evidence_files)
        // Note: The prompt didn't specify the exact structure of evidence return, assumming a separate list or embedded. 
        // For now, we will assume we might need to fetch it or it's empty until uploaded.
    } else {
        document.getElementById('assessment-id').value = '';
        document.getElementById('status').value = 'Not Started';
        enableEvidenceSection(false);
    }

    document.getElementById('assessmentModal').classList.remove('hidden');
}

function enableEvidenceSection(enable) {
    const section = document.getElementById('evidence-section');
    if (enable) {
        section.style.opacity = '1';
        section.style.pointerEvents = 'auto';
        section.querySelector('p').textContent = 'Upload documents (PDF, IMG, TXT).';
    } else {
        section.style.opacity = '0.5';
        section.style.pointerEvents = 'none';
        section.querySelector('p').textContent = 'Upload documents (PDF, IMG, TXT). *Save status first to enable.*';
    }
}

// Create/Update Assessment (Status)
async function saveAssessment(event) {
    event.preventDefault();
    const token = localStorage.getItem('access_token');
    const controlId = document.getElementById('control-id').value;
    const assessmentId = document.getElementById('assessment-id').value;
    const status = document.getElementById('status').value;

    try {
        let response;
        if (assessmentId) {
            // PATCH
            response = await fetch(`${API_BASE}/assessments/${assessmentId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: status })
            });
        } else {
            // POST
            response = await fetch(`${API_BASE}/assessments/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    control: controlId, // Should match backend serializer expectation
                    status: status
                })
            });
        }

        if (response.ok) {
            const savedAssessment = await response.json();
            // Update local map
            assessmentMap[controlId] = savedAssessment;
            document.getElementById('assessment-id').value = savedAssessment.id;
            enableEvidenceSection(true);

            // Refresh Table UI row without full reload
            renderTable();

            alert('Status Saved!');
        } else {
            alert('Failed to save status.');
        }

    } catch (error) {
        console.error('Error saving assessment:', error);
    }
}

// Upload Evidence
async function uploadEvidence() {
    const token = localStorage.getItem('access_token');
    const assessmentId = document.getElementById('assessment-id').value;
    const fileInput = document.getElementById('evidence-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file.');
        return;
    }

    if (!assessmentId) {
        alert('Assessment must exist before uploading.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assessment', assessmentId);
    formData.append('description', file.name);

    try {
        const response = await fetch(`${API_BASE}/evidence/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.status === 201) {
            alert('Evidence uploaded successfully!');
            fileInput.value = '';
            // Refresh local data to show new evidence if the API returns it in assessments
            fetchData(token);
        } else {
            const err = await response.text();
            console.error(err);
            alert('Upload failed.');
        }
    } catch (error) {
        console.error('Error uploading:', error);
        alert('Error uploading evidence.');
    }
}

function addEvidenceToList(filename) {
    const list = document.getElementById('evidence-list');
    const item = document.createElement('div');
    item.className = 'evidence-item';
    item.innerHTML = `
        <i class="fa-regular fa-file"></i>
        <span>${filename}</span>
    `;
    list.appendChild(item);
}

// Modal Close logic existing in risks.js/auth.js but repeated here for safety if isolated
window.closeModal = function () {
    document.getElementById('assessmentModal').classList.add('hidden');
}
