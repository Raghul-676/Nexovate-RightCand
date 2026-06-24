# 🎓 Student Centralized Evaluation System (SCES) v2.0

**Complete Refactor** — Clean, modern, production-ready architecture.

---

## 🏗️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React 18 + Vite
- **Database**: SQLite (SQLAlchemy ORM)
- **Auth**: JWT (Bearer tokens)
- **Styling**: Pure CSS (modern, responsive)

---

## 📂 Project Structure

```
sces/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── students.py
│   │   │   ├── evaluations.py
│   │   │   ├── coding.py
│   │   │   └── dashboard.py
│   │   ├── services/        # Business logic
│   │   │   ├── auth_service.py
│   │   │   └── coding_service.py
│   │   ├── models/          # SQLAlchemy models
│   │   │   └── models.py
│   │   ├── schemas/         # Pydantic schemas
│   │   │   └── schemas.py
│   │   ├── database.py      # DB config
│   │   └── main.py          # FastAPI app
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/           # React pages
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Students.jsx
    │   │   ├── Evaluations.jsx
    │   │   └── CodingProfiles.jsx
    │   ├── components/      # Reusable components
    │   │   ├── Navbar.jsx
    │   │   └── Modal.jsx
    │   ├── services/        # API & Auth
    │   │   ├── api.js
    │   │   └── AuthContext.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Setup Instructions

### Backend Setup

```bash
cd sces/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server (port 8000)
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd sces/frontend

# Install dependencies
npm install

# Run dev server (port 5173)
npm run dev
```

---

## 🌐 Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ✨ Features

### 🔐 Authentication
- JWT-based login/signup
- Role-based access (admin/student)
- Protected routes

### 👨‍🎓 Student Management
- Add/Edit/Delete students
- Track roll number, department, year
- Email validation

### 📊 Evaluation System
- Assign marks to students
- Multiple exam types (internal/external/assignment)
- Subject-wise tracking

### 💻 Coding Profiles
- Link LeetCode, Codeforces, GitHub accounts
- **Live stats fetching**:
  - LeetCode: problems solved, contest rating
  - Codeforces: rating, rank
  - GitHub: repos, followers
- Real-time API integration

### 📈 Dashboard
- Total students, evaluations, profiles
- Average marks calculation
- Department-wise breakdown

---

## 🔑 API Endpoints

### Auth
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Students
- `GET /api/students/` — List all
- `POST /api/students/` — Create
- `GET /api/students/{id}` — Get one
- `PUT /api/students/{id}` — Update
- `DELETE /api/students/{id}` — Delete

### Evaluations
- `GET /api/evaluations/` — List all
- `GET /api/evaluations/student/{id}` — Get by student
- `POST /api/evaluations/` — Create
- `PUT /api/evaluations/{id}` — Update
- `DELETE /api/evaluations/{id}` — Delete

### Coding Profiles
- `GET /api/coding/student/{id}` — Get profile
- `POST /api/coding/` — Create profile
- `PUT /api/coding/student/{id}` — Update profile
- `GET /api/coding/student/{id}/stats` — **Fetch live stats**

### Dashboard
- `GET /api/dashboard/stats` — Summary statistics

---

## 🎨 UI Features

- Clean, modern design
- Responsive layout
- Loading states
- Error handling
- Modal dialogs
- Form validation
- Smooth animations

---

## 🔧 Configuration

### Backend
- JWT secret: `app/services/auth_service.py` → `SECRET_KEY`
- Database: `app/database.py` → `DATABASE_URL`
- CORS: `app/main.py` → `allow_origins`

### Frontend
- API proxy: `vite.config.js` → `proxy`
- Base URL: `src/services/api.js`

---

## 📝 Notes

- Database auto-creates on first run
- Default token expiry: 7 days
- All passwords hashed with bcrypt
- API rate limits: None (add if needed)

---

## 🚧 Future Enhancements

- [ ] Add more coding platforms (CodeChef, HackerRank)
- [ ] Export reports (PDF/Excel)
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Dark mode
- [ ] Mobile app

---

## 📄 License

MIT License — Free to use and modify.

---

**Built with ❤️ using FastAPI + React**
