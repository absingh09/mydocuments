/**
 * dashboard.js — Document portfolio logic for authenticated users
 * Works with FastAPI backend via api.js
 */

// ── Auth Guard ─────────────────────────────────────────────────
if (!localStorage.getItem('token')) {
    window.location.href = '/index.html';
}

// ── State ──────────────────────────────────────────────────────
let docs = [];
let editingId = null;
let currentFilter = 'all';

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Show username
    const name = localStorage.getItem('user_name') || 'User';
    document.getElementById('userNameDisplay').textContent = name;

    // Setup upload zone
    setupUpload();

    // Load documents
    loadDocuments();
});

// ── Logout ─────────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    window.location.href = '/index.html';
}

// ── Upload ─────────────────────────────────────────────────────
function setupUpload() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });
    input.addEventListener('change', e => { handleFiles(e.target.files); input.value = ''; });
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const payload = {
                name: guessName(file.name),
                issuer: '',
                date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                file_type: file.type,
                filename: file.name,
                data: e.target.result,  // base64 data URL
            };
            showProgressBar();
            try {
                const res = await apiPost('/documents', payload);
                if (!res) return; // 401 redirect handled by api.js
                if (!res.ok) {
                    const err = await res.json();
                    showToast(err.detail || 'Upload failed', 'error');
                } else {
                    const doc = await res.json();
                    docs.unshift({ ...doc, data: payload.data }); // keep data locally for display
                    render();
                    showToast(`"${doc.name}" uploaded successfully`);
                }
            } catch {
                showToast('Upload failed — server not reachable', 'error');
            } finally {
                hideProgressBar();
            }
        };
        reader.readAsDataURL(file);
    });
}

function guessName(filename) {
    return filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Load Documents ─────────────────────────────────────────────
async function loadDocuments() {
    try {
        const res = await apiGet('/documents');
        if (!res) return; // 401 handled
        if (!res.ok) { renderGrid([]); return; }
        docs = await res.json();
        updateYearFilters();
        render();
    } catch {
        renderGrid([]);
        showToast('Could not load documents — server not reachable', 'error');
    }
}

// ── Render ─────────────────────────────────────────────────────
function render() {
    updateYearFilters();
    let filtered = docs;
    if (currentFilter !== 'all') {
        filtered = docs.filter(d => (d.date || '').includes(currentFilter));
    }

    // Stats
    document.getElementById('totalCount').textContent = docs.length;
    const issuers = new Set(docs.map(d => d.issuer).filter(Boolean));
    document.getElementById('issuerCount').textContent = issuers.size;
    const years = new Set(docs.map(d => { const m = (d.date || '').match(/\d{4}/); return m ? m[0] : null; }).filter(Boolean));
    document.getElementById('yearCount').textContent = years.size;

    renderGrid(filtered);
}

function renderGrid(filtered) {
    const grid = document.getElementById('certGrid');
    if (filtered.length === 0) {
        grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏅</div>
        <div class="empty-title">${docs.length === 0 ? 'No documents yet' : 'No documents match this filter'}</div>
        <div class="empty-sub">${docs.length === 0 ? 'Upload your first certificate to get started' : 'Try a different filter'}</div>
      </div>`;
        return;
    }

    grid.innerHTML = filtered.map((d, i) => `
    <div class="cert-card" style="animation-delay:${i * 0.05}s" onclick="openDoc('${d.id}')">
      <div class="cert-preview">
        ${d.file_type === 'application/pdf'
            ? `<div class="pdf-thumb"><div class="pdf-icon">📄</div><div style="font-size:12px;letter-spacing:.05em">PDF Document</div></div>`
            : (d.data
                ? `<img src="${d.data}" alt="${escHtml(d.name)}" loading="lazy">`
                : `<div class="pdf-thumb"><div class="pdf-icon">🖼️</div><div style="font-size:12px">Image</div></div>`)
        }
        <div class="cert-overlay">
          <button class="overlay-btn">View Document</button>
        </div>
      </div>
      <div class="cert-info">
        <div class="cert-course">${escHtml(d.name || 'Untitled')}</div>
        <div class="cert-meta">
          <span class="cert-issuer">${escHtml(d.issuer || '')}</span>
          <span class="cert-date">${escHtml(d.date || '')}</span>
        </div>
        <div class="cert-actions" onclick="event.stopPropagation()">
          <button class="action-btn" onclick="openEdit('${d.id}')">✎ Edit</button>
          <button class="action-btn" onclick="downloadDoc('${d.id}')">↓ Save</button>
          <button class="action-btn danger" onclick="deleteDoc('${d.id}')">✕ Remove</button>
        </div>
      </div>
    </div>
  `).join('');
}

function updateYearFilters() {
    const years = [...new Set(docs.map(d => { const m = (d.date || '').match(/\d{4}/); return m ? m[0] : null; }).filter(Boolean))].sort((a, b) => b - a);
    const container = document.getElementById('filterContainer');
    const allBtn = `<button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="setFilter('all', this)">All</button>`;
    const yearBtns = years.map(y => `<button class="filter-btn ${currentFilter === y ? 'active' : ''}" onclick="setFilter('${y}', this)">${y}</button>`).join('');
    container.innerHTML = allBtn + yearBtns;
}

function setFilter(val, btn) {
    currentFilter = val;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
}

// ── View Modal ─────────────────────────────────────────────────
async function openDoc(id) {
    const local = docs.find(d => d.id === id);
    document.getElementById('modalTitle').textContent = local?.name || 'Document';
    document.getElementById('modalIssuer').textContent = local?.issuer || '';
    document.getElementById('modalDate').textContent = local?.date || '';
    document.getElementById('modalBody').innerHTML = `<div class="spinner"></div>`;
    document.getElementById('viewModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
        // Fetch full document with base64 data from server
        const res = await apiGet(`/documents/${id}`);
        if (!res || !res.ok) {
            document.getElementById('modalBody').innerHTML = '<p style="color:var(--text-dim);padding:20px">Failed to load document.</p>';
            return;
        }
        const doc = await res.json();

        // Update local cache with data
        const idx = docs.findIndex(d => d.id === id);
        if (idx !== -1) docs[idx].data = doc.data;

        document.getElementById('modalTitle').textContent = doc.name;
        document.getElementById('modalIssuer').textContent = doc.issuer || '';
        document.getElementById('modalDate').textContent = doc.date || '';

        const dl = document.getElementById('modalDownload');
        dl.href = doc.data;
        dl.download = doc.filename;

        const body = document.getElementById('modalBody');
        if (doc.file_type === 'application/pdf') {
            body.innerHTML = `<iframe src="${doc.data}" title="${escHtml(doc.name)}"></iframe>`;
        } else {
            body.innerHTML = `<img src="${doc.data}" alt="${escHtml(doc.name)}">`;
        }
    } catch {
        document.getElementById('modalBody').innerHTML = '<p style="color:var(--text-dim);padding:20px">Error loading document.</p>';
    }
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('modalBody').innerHTML = '';
}

// ── Edit Modal ─────────────────────────────────────────────────
function openEdit(id) {
    editingId = id;
    const d = docs.find(x => x.id === id);
    document.getElementById('editName').value = d?.name || '';
    document.getElementById('editIssuer').value = d?.issuer || '';
    document.getElementById('editDate').value = d?.date || '';
    document.getElementById('editModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.body.style.overflow = '';
    editingId = null;
}

async function saveEdit() {
    if (!editingId) return;
    const payload = {
        name: document.getElementById('editName').value,
        issuer: document.getElementById('editIssuer').value,
        date: document.getElementById('editDate').value,
    };
    try {
        const res = await apiPut(`/documents/${editingId}`, payload);
        if (!res || !res.ok) { showToast('Update failed', 'error'); return; }
        const updated = await res.json();
        const idx = docs.findIndex(d => d.id === editingId);
        if (idx !== -1) docs[idx] = { ...docs[idx], ...updated };
        render();
        closeEditModal();
        showToast('Document details updated');
    } catch {
        showToast('Update failed — server not reachable', 'error');
    }
}

// ── Download / Delete ──────────────────────────────────────────
async function downloadDoc(id) {
    const local = docs.find(d => d.id === id);
    // If we already have data locally, use it
    if (local?.data) {
        triggerDownload(local.data, local.filename);
        return;
    }
    // Otherwise fetch from server
    showProgressBar();
    try {
        const res = await apiGet(`/documents/${id}`);
        if (!res || !res.ok) { showToast('Download failed', 'error'); return; }
        const doc = await res.json();
        const idx = docs.findIndex(d => d.id === id);
        if (idx !== -1) docs[idx].data = doc.data;
        triggerDownload(doc.data, doc.filename);
    } finally {
        hideProgressBar();
    }
}

function triggerDownload(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
}

async function deleteDoc(id) {
    if (!confirm('Remove this document from your portfolio?')) return;
    try {
        const res = await apiDelete(`/documents/${id}`);
        if (!res || (res.status !== 204 && !res.ok)) { showToast('Delete failed', 'error'); return; }
        docs = docs.filter(d => d.id !== id);
        render();
        showToast('Document removed');
    } catch {
        showToast('Delete failed — server not reachable', 'error');
    }
}

// ── Utilities ──────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = `toast${type === 'error' ? ' error' : ''}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}

function showProgressBar() {
    const bar = document.getElementById('uploadProgress');
    bar.style.display = 'block';
    bar.style.width = '70%';
}
function hideProgressBar() {
    const bar = document.getElementById('uploadProgress');
    bar.style.width = '100%';
    setTimeout(() => { bar.style.display = 'none'; bar.style.width = '0'; }, 400);
}

function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
