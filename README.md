# My Documents — Fullstack Portfolio

A secure personal document/certificate portfolio with user accounts backed by **FastAPI** + **MongoDB Atlas**.

```
My Documents/
├── backend/          ← FastAPI server  (deploy to Railway / Render)
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── models.py
│   ├── routes/
│   │   ├── auth.py
│   │   └── documents.py
│   ├── requirements.txt
│   ├── Procfile
│   ├── runtime.txt
│   ├── .env          ← never commit this
│   └── .env.example
└── frontend/         ← Static HTML/CSS/JS  (deploy to Netlify / Vercel)
    ├── index.html    ← Login / Sign-up
    ├── dashboard.html← Document portfolio
    ├── netlify.toml
    ├── css/style.css
    └── js/
        ├── config.js ← ⭐ Change API_BASE here for production
        ├── api.js
        ├── auth.js
        └── dashboard.js
```

---

## 🖥️ Running Locally

### 1 — Start the backend
```bash
cd backend
pip install -r requirements.txt
# Create .env from .env.example and fill in values
uvicorn main:app --reload --port 8000
```
Backend is now at **http://localhost:8000**

### 2 — Open the frontend
Open `frontend/index.html` directly in your browser using VS Code **Live Server** extension:
- Right-click `frontend/index.html` → **Open with Live Server**
- Or open using any local HTTP server on port 5500

> `frontend/js/config.js` already points to `http://localhost:8000` for local dev.

---

## 🚀 Deploying to Production

### Step 1 — Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your repo, set the **Root Directory** to `backend`
3. Add these **Environment Variables** in Railway dashboard:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your full MongoDB Atlas connection string |
| `SECRET_KEY` | A long random string (32+ chars) |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` |
| `ALLOWED_ORIGINS` | `https://your-site.netlify.app` |

4. Railway auto-detects `Procfile` and deploys. Copy your backend URL e.g. `https://my-documents-api.up.railway.app`

---

### Step 2 — Set the backend URL in the frontend

Edit **`frontend/js/config.js`** — change **one line**:

```js
// Before (local dev):
const API_BASE = 'http://localhost:8000';

// After (production):
const API_BASE = 'https://my-documents-api.up.railway.app';
```

---

### Step 3 — Deploy Frontend to Netlify

**Option A — Drag & Drop (easiest):**
1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Deploy manually**
2. Drag and drop the entire `frontend/` folder onto the page
3. Done! Netlify gives you a URL like `https://my-documents.netlify.app`

**Option B — GitHub (auto-deploys on push):**
1. Push your project to GitHub
2. Netlify → **Import from Git** → select repo
3. Set **Base directory** = `frontend`, **Publish directory** = `.`
4. The `netlify.toml` file handles configuration automatically

---

### Step 4 — Update CORS (optional hardening)

After you have the Netlify URL, go to your Railway backend environment variables and set:
```
ALLOWED_ORIGINS=https://your-site.netlify.app
```
Then in `backend/main.py`, change `allow_origins=["*"]` to `allow_origins=ALLOWED_ORIGINS`.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://user:pass@mydocumentsdb.giyn2tb.mongodb.net/?appName=mydocumentsdb
SECRET_KEY=your_very_long_random_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=https://your-site.netlify.app
```

### Frontend (`frontend/js/config.js`)
```js
const API_BASE = 'https://your-backend.up.railway.app';  // no trailing slash
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | No | Create account |
| POST | `/api/login` | No | Login → get JWT |
| GET | `/api/documents` | Yes | List your documents |
| POST | `/api/documents` | Yes | Upload a document |
| GET | `/api/documents/{id}` | Yes | View document (with file data) |
| PUT | `/api/documents/{id}` | Yes | Edit name/issuer/date |
| DELETE | `/api/documents/{id}` | Yes | Delete document |

Interactive API docs: **http://localhost:8000/docs** (local) or your Railway URL + `/docs`
