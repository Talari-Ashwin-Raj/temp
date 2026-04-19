# Smart Task & Team Management System (TaskHandler)

A full-stack web application designed to help student teams and small startups manage tasks, assign work, track progress, and collaborate efficiently. 

This system provides a structured, role-based solution with a strong focus on backend-driven control and system design, implementing advanced Object-Oriented Programming (OOP) principles and a clean architectural approach (Controller → Service → Repository). 

It features a premium dark-mode React single-page application (SPA) on the frontend and an Express + SQLite backend.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Distinct roles (`Admin`, `Manager`, `Member`) determining abilities to create projects, assign tasks, or merely update statuses.
- **Secure Authentication:** JWT-based session management stored securely in localStorage, with hashed passwords using `bcrypt`.
- **Project Management:** Admins and Managers can define projects and assign specific team members.
- **Kanban Task Board:** Track tasks visually through `To Do`, `In Progress`, and `Done` states. Custom validations ensure no skipping states (e.g., you cannot jump from To Do directly to Done).
- **Collaboration & Comments:** Dedicated discussion threads on individual tasks. 
- **Notification System:** Asynchronous mapping to alert users immediately when they are assigned to a new task or when task statuses change. 
- **Dashboard & Analytics:** Visual aggregation of your workload statistics and system quick-links.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, React Router DOM, Vanilla CSS (Premium Dark Theme, Glassmorphism).
- **Backend:** Node.js, Express.js.
- **Database:** Supabase (PostgreSQL) integrated natively via **Prisma ORM**.
- **Security:** `jsonwebtoken` (JWT), `bcryptjs`.

## ⚙️ Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Setup Database & Backend
Navigate to the backend directory, install the required packages, and run the seeder script to populate your database with dummy data and test accounts. 
```bash
cd backend
npm install
npm run seed
```

Start the backend server (Runs on port `3000`):
```bash
npm start
```

### 2. Setup Frontend
Open a new terminal window, navigate to the frontend directory, and install the modules.
```bash
cd frontend
npm install
```

Start the Vite development server (Runs on port `5173`):
```bash
npm run dev
```

The application will now be running. You can open your browser to `http://localhost:5173/login`.

---

## 🔑 Test Credentials

There are two primary accounts provisioned for testing access control, project creation, and task management functions without needing to register iteratively:

| Role | Username | Email | Password | Try testing... |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | admin | `admin@taskhandler.com` | `password123` | Generating projects, assigning managers, viewing overarching stats. |
| **Member** | new | `new@taskhandler.com` | `123456` | Altering task status, commenting on tasks, testing restricted access. |

*Note: You can easily test the Async notifications by having two browsers (e.g. Chrome, Firefox) open simultaneously: logging into the Manager account on one, and a Member on the other. Assigning a task from the Manager instantly triggers a notification to populate in the Member's Navbar!*
# temp
