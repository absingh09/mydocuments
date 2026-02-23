/**
 * auth.js — Login & Register logic for index.html
 * Reads API URL from config.js
 */

// Redirect if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}

const AUTH_BASE = ((window.__CONFIG__ && window.__CONFIG__.API_BASE) || 'http://localhost:8000').replace(/\/$/, '');

function switchTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    hideError();
}

function showError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg;
    el.style.display = 'block';
}
function hideError() {
    document.getElementById('authError').style.display = 'none';
}

// ── LOGIN ────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    try {
        const res = await fetch(`${AUTH_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value.trim(),
                password: document.getElementById('loginPassword').value,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            showError(data.detail || 'Login failed. Please try again.');
        } else {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user_name', data.user_name);
            localStorage.setItem('user_email', data.user_email);
            window.location.href = 'dashboard.html';
        }
    } catch {
        showError('Cannot connect to server. Make sure the backend is running.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
});

// ── REGISTER ─────────────────────────────────────────────────
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const pass = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    if (pass !== confirm) { showError('Passwords do not match.'); return; }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Creating account…';

    try {
        const res = await fetch(`${AUTH_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('regName').value.trim(),
                email: document.getElementById('regEmail').value.trim(),
                password: pass,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            showError(data.detail || 'Registration failed. Please try again.');
        } else {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user_name', data.user_name);
            localStorage.setItem('user_email', data.user_email);
            window.location.href = 'dashboard.html';
        }
    } catch {
        showError('Cannot connect to server. Make sure the backend is running.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
});
