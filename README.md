# 🎓 Student Management System (Full-Stack)

A complete, production-ready Student Management Web Application with **FastAPI**, **PostgreSQL / SQLAlchemy**, and a responsive **HTML5 / CSS3 / Vanilla JavaScript** frontend.

---

## 🚀 Architecture Overview

```text
student_management/
├── backend/
│   ├── main.py              # FastAPI application (CRUD, sorting, pagination, CORS)
│   ├── models.py            # SQLAlchemy Student database model
│   ├── database.py          # PostgreSQL / SQLite connection configuration
│   ├── seed.py              # Automated data migration from JSON to Database
│   ├── student.json         # Initial seed records
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html           # Dashboard UI with stats, table, modals & toast alerts
│   ├── styles.css           # Modern, responsive styling with dark/light accent
│   ├── app.js               # Frontend application logic & Fetch API integration
│   ├── config.js            # Environment-aware backend API URL switcher
│   └── vercel.json          # Vercel deployment headers & configuration
├── render.yaml              # Render Blueprint for Web Service & PostgreSQL
├── requirements.txt         # Root dependencies for deployment platforms
└── .gitignore               # Git ignore rules for virtual environments & secrets
```

---

## ⚡ Features

- **Full CRUD Operations**: Create (`POST`), Read (`GET`), Update (`PUT`), Delete (`DELETE`).
- **Data Validation**: Strict Pydantic models with automated letter grade derivation (`A+`, `A`, `B`, `C`, `F`) and alphabetical name validation.
- **Advanced Querying**: Real-time search, course filtering, multi-field sorting, and pagination.
- **Relational Persistence**: PostgreSQL for production (Render / Neon / Supabase) with zero-configuration fallback to SQLite for local development.
- **Automatic Migration**: Automatically populates database tables from `student.json` upon initial startup.
- **CORS Configured**: Dynamic origin handling via `ALLOWED_ORIGINS` environment variable.
- **Configurable API Endpoint**: Built-in UI switcher to toggle between `localhost:8000` and your live Render backend URL.

---

## 🛠️ Local Development Setup

### 1. Start the Backend
Open a terminal in the project directory:
```bash
# Activate your virtual environment if not already active
# Windows:
..\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Uvicorn development server
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Alternative Redoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 2. Launch the Frontend
You can open `frontend/index.html` directly in any web browser, or serve it using VS Code Live Server or Python:
```bash
cd frontend
python -m http.server 5500
```
Open [http://127.0.0.1:5500](http://127.0.0.1:5500) in your browser.

---

## 🌐 Production Deployment Guide

### Stage 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "feat: complete production-ready student management system"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/student-management.git
git push -u origin main
```

### Stage 2: Deploy Backend to Render
1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Create a **New PostgreSQL Database**:
   - Name: `student-management-db`
   - Plan: **Free**
   - Copy the **Internal Database URL** (or External Database URL).
3. Create a **New Web Service**:
   - Connect your GitHub repository.
   - Root Directory: leave blank (or `.`)
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Plan: **Free**
4. Set Environment Variables on Render:
   - `DATABASE_URL`: *(Paste your Render PostgreSQL connection string)*
   - `ALLOWED_ORIGINS`: `https://<YOUR_VERCEL_FRONTEND>.vercel.app` (or `*` during setup)
5. Click **Deploy Web Service** and copy your live backend URL (e.g. `https://student-management-backend.onrender.com`).

### Stage 3: Deploy Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New Project** and import your GitHub repository.
3. In **Root Directory**, click edit and select **`frontend`**.
4. Framework Preset: **Other** (Static HTML/JS).
5. Click **Deploy**.
6. Once deployed, open your live Vercel URL!
7. Click the **API Config** button in the header and paste your Render backend URL (or update `frontend/config.js`).
