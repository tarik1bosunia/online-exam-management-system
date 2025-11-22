# Online Exam Management System

**Project Submission for Wafi Solutions - Python Track Internship Batch 3**

This project is submitted as part of the selection process for Wafi Solutions Internship Program.
 
- **Submitted by:** Md. Tarik Bosunia
- **Email:** tarik.cse.ru@gmail.com 
- **Submission Date:** November 22, 2025

---

## 📋 About This Project

A robust, full-stack web application for managing and conducting online examinations. Built with **FastAPI** (Backend) and **Next.js 16** (Frontend), featuring automated grading, Excel question imports, and real-time state persistence.

This project demonstrates proficiency in:
- Python backend development with FastAPI
- Modern frontend development with Next.js and TypeScript
- Database design and ORM usage (PostgreSQL + SQLModel)
- RESTful API design and authentication
- Docker containerization and deployment
- Full-stack integration and state management

---

## 🚀 Tech Stack

### Backend
* **Framework:** FastAPI (Python 3.12)
* **Database:** PostgreSQL 17
* **ORM:** SQLModel (SQLAlchemy + Pydantic)
* **Testing:** Pytest
* **Key Libraries:** Pandas (Excel processing), PyJWT (Authentication), Passlib (Security)

### Frontend
* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **State Management:** Redux Toolkit & RTK Query
* **Styling:** Tailwind CSS + Shadcn UI
* **Deployment:** Docker & Docker Compose

---

## ✨ Key Features

### Admin Features
- 🔐 Secure authentication and authorization
- 📝 Create and manage exams with custom settings
- 📊 Excel-based question import (supports MCQ and written questions)
- 👥 View and manage student submissions
- 📈 Automated grading for objective questions
- 📋 View all exams in a comprehensive dashboard
- ⚙️ Edit exam details and configurations

### Student Features
- 📖 Browse available exams
- ⏱️ Real-time exam timer with auto-submit
- 💾 Auto-save functionality (prevents data loss)
- ✍️ Take exams with both MCQ and written questions
- 📊 View results and detailed feedback
- 🔄 Resume incomplete exams

### Technical Features
- 🐳 Fully containerized with Docker
- 🔒 JWT-based authentication
- 📡 RESTful API architecture
- 🎨 Modern, responsive UI
- ⚡ Real-time state management
- 🧪 Comprehensive test coverage

---

## 🛠️ Prerequisites

* Docker Desktop installed and running
* *(Optional for local development)* Node.js 20+ and Python 3.12+

---

## ⚡ Quick Start (Docker)

1. **Clone the repository:**
```bash
git clone <repository-url>
cd online-exam-management-system
```

2. **Ensure ports are available:**
   - Frontend: Port 3000
   - Backend: Port 8000
   - Make sure Docker is running

3. **Start all services:**
```bash
docker-compose up --build
```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API docs (Swagger): http://localhost:8000/docs

### Default Login Credentials
- **Admin:** 
  - Email: `admin@example.com`
  - Password: `admin123`
- **Student:** 
  - Email: `student@example.com`
  - Password: `student123`

---

## 🧭 Local Development

### Backend (local)

1. Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r backend/requirements.txt
pip install -e backend
```

3. Run the FastAPI app:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (local)

1. Install Node dependencies and start the dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Open the app at `http://localhost:3000`.

---

## 🧪 Running Tests

### Backend Tests (Docker)
```bash
docker-compose exec backend bash
pytest
```

### Backend Tests (Local)
```bash
cd backend
pytest
```

---

## 📁 Project Structure

```
online-exam-management-system/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   ├── core/              # Core configurations
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── services/          # Business logic
│   ├── tests/                 # Backend tests
│   ├── helper/                # Utility scripts & sample data
│   └── requirements.txt       # Python dependencies
├── frontend/                   # Next.js application
│   ├── app/                   # App Router pages
│   ├── components/            # Reusable UI components
│   ├── features/              # Feature-specific components
│   ├── lib/                   # Redux store & API clients
│   └── hooks/                 # Custom React hooks
├── docker-compose.yml         # Service orchestration
└── README.md                  # This file
```

---

## 📊 How to Import Questions via Excel (Admin Only)

1. Navigate to the Admin Dashboard
2. Use the question import feature
3. Upload an Excel file following the format in `backend/helper/sample_questions.xlsx`
4. The system supports both MCQ and written-type questions

**Sample Excel Format:**
- Column A: Question Text
- Column B: Question Type (mcq/written)
- Column C-F: Options (for MCQ)
- Column G: Correct Answer

---

## ⚙️ Configuration

### Environment Variables
Backend configuration is managed through environment variables in `backend/app/core/config.py`:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

### Security Note
⚠️ **Important:** Do NOT commit secrets to the repository. All sensitive credentials should be stored in environment variables or a `.env` file (which should be gitignored).

---

## 🎯 Implementation Highlights

### Backend Architecture
- Clean architecture with separation of concerns
- RESTful API design following best practices
- JWT-based authentication and authorization
- Role-based access control (Admin/Student)
- Database migrations with Alembic
- Comprehensive error handling

### Frontend Architecture
- Modern Next.js 14+ App Router
- TypeScript for type safety
- Redux Toolkit for predictable state management
- RTK Query for efficient API caching
- Custom hooks for reusable logic
- Responsive design with Tailwind CSS
- Shadcn UI components for consistency

### Data Flow
1. User authenticates via login
2. JWT token stored in Redux state
3. Protected routes verify authentication
4. API calls include JWT in headers
5. Backend validates token and permissions
6. Data fetched/mutated via RTK Query
7. Real-time UI updates through Redux

---

## 🚀 Deployment

The application is containerized and can be deployed to any platform supporting Docker:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Self-hosted with Docker Compose

---

## 📝 Future Enhancements

- [ ] Support for different question types (true/false, fill-in-the-blank)
- [ ] Advanced analytics and reporting
- [ ] Email notifications for exam schedules
- [ ] Proctoring features with webcam integration
- [ ] Mobile application
- [ ] Bulk student registration via CSV
- [ ] Question pool randomization
- [ ] Time-based access restrictions

---

## 👨‍💻 About the Developer

This project showcases full-stack development capabilities including:
- Backend API development with Python/FastAPI
- Frontend development with React/Next.js
- Database design and optimization
- Authentication and security implementation
- Docker containerization
- Modern UI/UX design principles
- State management patterns
- Testing and documentation

---

## 📧 Contact

For inquiries about this project submission:
- **Email:** [Your Email]
- **Project Repository:** [Repository URL]

---

## 🙏 Acknowledgments

This project is submitted as part of the **Wafi Solutions Internship Batch 3 - Python Track** selection process.

**Wafi Solutions Team**  
Website: [wafisolutions.com](https://wafisolutions.com)  
Email: career@wafisolutions.com

---

## 📄 License

This project is submitted for educational and evaluation purposes as part of an internship application.

---

**Submission Date:** November 22, 2025  
**Deadline:** November 22, 2025, 11:59 PM

---

*Thank you for reviewing this submission! 