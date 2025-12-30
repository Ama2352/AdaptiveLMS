# Adaptive Learning Management System (Math LMS)

A professional education platform featuring an Adaptive Intelligence Engine based on ELO ratings and knowledge graph mastery.

## 🌟 Key Features

### 🧠 Adaptive Intelligence Engine

- **Granular ELO Tracking**: Individual ability scores for every knowledge concept.
- **Dynamic Question Selection**: AI selects questions matching the student's current mastery level (Weakest-Link strategy).
- **Mastery Thresholds**: Concepts are marked as mastered based on ELO progression (Threshold: 1250).

### 📊 Advanced Teacher Analytics

- **Learning Trajectory Tracking**: Real-time line charts comparing student ELO vs. question difficulty.
- **Diagnostic Insights**: "Total Growth" and "Remediation Alerts" to identify struggling students.
- **Knowledge Breadth**: Track unique concept coverage and mastery percentages.

### ⚡ Optimized Infrastructure

- **High Performance**: Backend optimized with Database Connection Pooling and batched queries for <500ms latency.
- **Robust Postgres Schema**: Includes student profiles, mastery logs, and relational concept mapping.

## 📁 Project Structure

```text
.
├── frontend/             # React (Vite) frontend application
│   ├── src/
│   │   ├── api.js       # API client configuration
│   │   ├── pages/       # Application pages (Learning, Teacher Dashboard, etc.)
│   │   └── components/  # User interface components
│   └── ...
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/         # API Route handlers
│   │   ├── models/      # Pydantic data models
│   │   ├── core/        # Core logic, database, and config
│   │   └── main.py      # Entry point
│   ├── scripts/         # Database migration and seeding scripts
│   ├── requirements.txt # Python dependencies
│   └── .env             # Environment variables (Copy from .env.example)
├── docs/                 # Documentation and research simulations
└── README.md
```

## 🚀 Getting Started

### Backend Setup

1. Navigate to `backend/`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Unix)
4. Install dependencies: `pip install -r requirements.txt`
5. Set up your `.env` file with `DB_URL`.
6. Apply schema: `python scripts/apply_schema.py`
7. Seed data: `python scripts/seed.py`
8. Run the backend: `python app/main.py`

### Frontend Setup

1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS (optional), Recharts, Lucide React
- **Backend**: FastAPI, PostgreSQL (Psycopg2), Pydantic
- **Adaptive Engine**: Custom ELO-based recommendation and mastery logic
