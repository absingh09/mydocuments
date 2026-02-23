/**
 * api.js — Centralized API client with JWT injection and 401 redirect
 * Reads the base URL from config.js (window.__CONFIG__.API_BASE)
 */

const _BASE = (window.__CONFIG__ && window.__CONFIG__.API_BASE) || 'http://localhost:8000';
const API_BASE = _BASE.replace(/\/$/, '') + '/api';

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res;
    try {
        res = await fetch(API_BASE + path, { ...options, headers });
    } catch (err) {
        throw new Error('Cannot reach server. Is the backend running?');
    }

    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        window.location.href = 'index.html';
        return null;
    }
    return res;
}

async function apiGet(path) { return apiFetch(path, { method: 'GET' }); }
async function apiPost(path, body) { return apiFetch(path, { method: 'POST', body: JSON.stringify(body) }); }
async function apiPut(path, body) { return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }); }
async function apiDelete(path) { return apiFetch(path, { method: 'DELETE' }); }
