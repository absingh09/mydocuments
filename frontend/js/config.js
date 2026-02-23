/**
 * config.js — API base URL configuration
 *
 * HOW TO USE:
 *   - Development (local):  set API_BASE to 'http://localhost:8000'
 *   - Production:           set API_BASE to your deployed backend URL
 *                           e.g. 'https://my-documents-api.onrender.com'
 *
 * This file must be loaded FIRST in every HTML page (before api.js).
 */

// ---------------------------------------------------------
// CHANGE THIS VALUE when deploying to production:
// ---------------------------------------------------------
const API_BASE = 'http://localhost:8000';
// ---------------------------------------------------------

window.__CONFIG__ = { API_BASE };
