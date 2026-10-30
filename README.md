# HostelEase — Smart Hostel Complaint & Maintenance Management System

HostelEase is an integrated full-stack web application designed to digitize, streamline, and audit the entire maintenance lifecycle in student residential facilities. It replaces manual paper registers with an automated workflow connecting student residents, maintenance technicians, and hostel administrators.

---

## 1. Core Features & Capabilities

- **Role-Based Portals:** Dedicated dashboards and access control for **Students**, **Maintenance Staff**, and **Administrators**.
- **Automated Ticket Lifecycle:** Unique sequential complaint IDs (`HST-2026-000001`) with real-time status transitions:  
  `PENDING` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`
- **Student Privacy & Visit Protocols:**
  - Gender preference matching for maintenance workers.
  - Optional warden / staff accompaniment for room visits.
  - Configurable open-door protocols and future appointment slot scheduling.
  - Student visit approval requirement before technician room entry.
- **Technician Task Management:**
  - Real-time task queues filtered by assignment status.
  - Detailed work log history with timestamped progress updates.
  - Reassignment handling: automatically updates former technician queues when tickets are reassigned.
- **Verified Feedback & Rating:**
  - 1–5 star ratings and satisfaction comments upon ticket resolution.
  - Immutable locking: once resident feedback is recorded, the ticket is finalized and locked against unauthorized status changes.
- **Administrative Control & Analytics:**
  - Real-time Recharts dashboards for category breakdown, priority distribution, and staff workload.
  - User management (create staff/admin accounts, toggle active status, permanent cleanup).
  - One-click CSV export of maintenance audit records.
- **Dual Interface Architecture:**
  - **Interface A (React Single Page Application):** Production-ready frontend with client-side routing, accessibility mode, high-contrast theme, and multi-language support.
  - **Interface B (Django Template Area):** Server-rendered views demonstrating Django Template Language (DTL), ModelForms, CSRF, URL regex routing, cookies, and sessions.

---

## 2. Technology Stack

### Backend
- **Framework:** Django 5.2 & Django REST Framework (DRF) 3.16
- **Language:** Python 3.10+
- **Database:** SQLite (default development) with environment-based MySQL configuration
- **Authentication:** Django session authentication with custom User model and secure HTTP-only cookies
- **CORS & Media:** `django-cors-headers`, Pillow

### Frontend
- **Framework:** React 19 with Vite bundler
- **Language:** JavaScript (ES6+)
- **Routing:** React Router v7
- **Styling:** Bootstrap 5.3 + Custom Chocolate & Cream design system
- **Data Visualization:** Recharts
- **Icons:** React Icons (`react-icons/bi`)
- **HTTP Client:** Axios with CSRF header synchronization

---

## 3. Project Structure

```
django-project/
├── backend/                               # Django Application Root
│   ├── manage.py                          # Management command runner
│   ├── requirements.txt                   # Python dependencies
│   ├── .env.example                       # Environment configuration template
│   ├── config/                            # Core project settings and URL router
│   │   ├── settings.py                    # Global configuration (Auth, CORS, DB)
│   │   ├── urls.py                        # Root API and template routing
│   │   └── wsgi.py
│   ├── accounts/                          # Custom User model, auth & RBAC
│   │   ├── models.py                      # User model (Student, Staff, Admin)
│   │   ├── views.py                       # Auth, profile, user management views
│   │   ├── serializers.py                 # User & authentication serializers
│   │   ├── permissions.py                 # RBAC permission classes
│   │   └── management/commands/           # Data seeding & cleanup commands
│   ├── complaints/                        # Core complaint workflow application
│   │   ├── models.py                      # Complaint, Assignment, WorkLog, Feedback
│   │   ├── views.py                       # Ticket CRUD, status transitions, CSV export
│   │   ├── serializers.py                 # Model serializers with nested history
│   │   └── utils.py                       # Working hours validation logic
│   ├── notifications/                     # In-app notifications
│   │   ├── models.py                      # Notification model & deduplication
│   │   └── views.py                       # Read/unread and batch operations
│   ├── activity_logs/                     # Administrative audit trail
│   │   ├── models.py                      # ActivityLog model
│   │   └── views.py                       # Audit log query endpoints
│   ├── django_demo/                       # Server-rendered syllabus demonstration
│   │   ├── forms.py                       # Django ModelForms and CSRF validation
│   │   ├── views.py                       # FBVs, sessions, cookies, regex dispatch
│   │   └── urls.py                        # Template routing
│   ├── templates/                         # HTML templates
│   │   ├── 404.html & 500.html            # Custom error handlers
│   │   └── django_demo/                   # DTL templates
│   └── static/                            # Static stylesheets and assets
├── frontend/                              # React Single Page Application
│   ├── index.html                         # Entry HTML template
│   ├── package.json                       # Dependencies and build scripts
│   ├── vite.config.js                     # Vite build configuration
│   ├── public/                            # Static public assets
│   └── src/
│       ├── main.jsx                       # React DOM entry point
│       ├── App.jsx                        # Layout and protected route hierarchy
│       ├── api/                           # Axios client & domain API modules
│       ├── context/                       # Auth, Notification, Accessibility contexts
│       ├── components/                    # Reusable UI widgets and modals
│       ├── pages/                         # Role-specific dashboard views
│       ├── styles/                        # Theme CSS & high-contrast overrides
│       └── utils/                         # Category classifier & time slot helpers
└── .gitignore                             # Root repository exclusions
```

---

## 4. Getting Started

### Prerequisites
- **Python:** 3.10 or newer
- **Node.js:** 18 or newer (with `npm`)

---

### Step 1: Set Up Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

5. (Optional) Seed demonstration data:
   ```bash
   python manage.py seed_demo_data
   ```

6. Start the Django development server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   - **Backend API:** `http://127.0.0.1:8000/`
   - **Django Admin:** `http://127.0.0.1:8000/admin/`
   - **Django Template Area:** `http://127.0.0.1:8000/django-demo/`

---

### Step 2: Set Up Frontend

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - **React Application:** `http://127.0.0.1:5173/`

---

## 5. Pre-Seeded Demonstration Accounts

The login interface includes one-click credentials for testing each user role:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@hostel.edu` | `admin123` | Full access. Assign/reassign tickets, view analytics, manage users, export CSV reports. |
| **Maintenance Staff** | `staff.rajesh@hostel.edu` | `staff123` | View assigned tasks, propose visit arrival times, append work logs, mark tickets resolved. |
| **Student Resident** | `student.aarav@hostel.edu` | `student123` | File complaints, configure visit preferences, approve room entry, submit 1–5 star feedback. |

To clear pre-seeded demonstration data at any time:
```bash
python manage.py clear_predefined_data
```

---

## 6. REST API Overview

All API endpoints require active session authentication, except registration, login, and CSRF initialization.

### Authentication (`/api/auth/`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/csrf/` | Retrieve and set CSRF cookie |
| `POST` | `/api/auth/register/` | Register student account |
| `POST` | `/api/auth/login/` | Establish user session |
| `POST` | `/api/auth/logout/` | Terminate session |
| `GET`/`PUT` | `/api/auth/me/` | Current user profile |
| `POST` | `/api/auth/change-password/` | Update password |
| `GET` | `/api/auth/staff-list/` | Active technicians for ticket assignment |
| `GET` | `/api/auth/users/` | Admin list of registered users |
| `POST` | `/api/auth/users/create/` | Admin user creation (Staff / Admin) |
| `POST` | `/api/auth/users/<id>/toggle-status/` | Enable / disable user account |
| `DELETE` | `/api/auth/users/<id>/delete/` | Permanently remove user and cascade records |

### Complaints (`/api/complaints/`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/complaints/` | List complaints (scoped by role with search/filter) |
| `POST` | `/api/complaints/` | File a new complaint (Student only) |
| `GET` | `/api/complaints/<id>/` | Detailed complaint data with history and logs |
| `POST` | `/api/complaints/<id>/assign/` | Assign or reassign maintenance technician |
| `POST` | `/api/complaints/<id>/status/` | Update ticket status (`IN_PROGRESS`, `RESOLVED`) |
| `POST` | `/api/complaints/<id>/worklogs/` | Add technician progress entry |
| `POST` | `/api/complaints/<id>/feedback/` | Submit 1–5 star rating and comment |
| `POST` | `/api/complaints/<id>/approve-visit/` | Resident approval for technician entry |
| `POST` | `/api/complaints/<id>/schedule-visit/` | Propose technician visit arrival slot |
| `POST` | `/api/complaints/<id>/reopen/` | Reopen resolved complaint |
| `POST` | `/api/complaints/<id>/reschedule/` | Request rescheduled visit window |
| `POST` | `/api/complaints/<id>/withdraw/` | Cancel pending complaint |
| `GET` | `/api/complaints/dashboard-stats/` | Aggregated metrics for dashboards |
| `GET` | `/api/complaints/export-csv/` | Export complaint audit logs to CSV |

### Notifications & Audit (`/api/notifications/`, `/api/activity-logs/`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notifications/` | List user notifications |
| `POST` | `/api/notifications/<id>/read/` | Mark individual notification as read |
| `POST` | `/api/notifications/mark-all-read/` | Mark all user notifications as read |
| `DELETE` | `/api/notifications/<id>/` | Delete single notification |
| `GET` | `/api/activity-logs/` | Admin audit log trail |

---

## 7. Environment Configuration

Copy `backend/.env.example` to `backend/.env` for local configuration:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SECRET_KEY` | Development key | Django secret key for cryptographic signing |
| `DEBUG` | `True` | Debug mode (must be `False` in production) |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated allowed hostnames |
| `DB_ENGINE` | `sqlite` | Database engine (`sqlite` or `mysql`) |
| `DB_NAME` | `hostelease_db` | MySQL database name |
| `DB_USER` | `root` | MySQL database user |
| `DB_PASSWORD` | `""` | MySQL database password |
| `DB_HOST` | `127.0.0.1` | MySQL database host |
| `DB_PORT` | `3306` | MySQL port |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS frontend origin |

---

## 8. Automated Testing

The backend includes comprehensive automated test suites covering authentication, role isolation, ticket workflows, staff reassignment, and visit safety logic.

To execute all tests:
```bash
python manage.py test
```

Key test coverage includes:
- Role creation and RBAC enforcement (`STUDENT`, `STAFF`, `ADMIN`).
- Public registration constraints preventing privilege escalation.
- Sequential complaint ID generation (`HST-YYYY-######`).
- Student ticket isolation (students cannot view or mutate other rooms' complaints).
- Admin staff assignment, reassignment, and queue synchronization.
- Technician work logs and resolution status updates.
- Feedback submission and immutable ticket locking.
- Django template views, ModelForms, session visit counters, and custom 404/500 handlers.

---

## 9. Security & Access Control

- **Password Storage:** Hashed using Django's default PBKDF2 with SHA-256 algorithm.
- **CSRF Protection:** Synchronized tokens across POST/PUT/DELETE requests via Axios request interceptors.
- **Session Security:** `SESSION_COOKIE_HTTPONLY = True` to prevent client-side script inspection of session keys.
- **Privilege Separation:** Public user registration is restricted to the `STUDENT` role; `STAFF` and `ADMIN` accounts can only be provisioned by authorized administrators.
- **Object-Level Isolation:** Database queries enforce tenancy boundaries at the query layer so students only access their own tickets and technicians only access active assignments.
