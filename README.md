# EduConnect - A Comprehensive Educational Resource Platform

EduConnect is a student-friendly university learning platform that centralizes academic resources such as syllabus-indexed notes, video lectures, previous year papers, quizzes, live classes, teacher interaction, and subscription-based learning access.

## Project Overview

The platform is designed for students, teachers, administrators, and maintenance users. It organizes academic content through a structured hierarchy:

```text
University -> Course -> Branch -> Scheme -> Semester -> Subject -> Unit -> Topic
```

Students can access learning resources topic-wise, teachers can upload academic content, and admins can manage hierarchy, users, approvals, subscriptions, and analytics.

## Key Features

- Role-based dashboards for students, teachers, admins, and maintenance users
- University/course/semester/subject hierarchy management
- Syllabus-based notes, videos, PYQs, units, and topics
- Quiz module with timer, scoring, attempts, and leaderboard
- Teacher content upload workflow
- Admin approval and subscription management
- Payment screenshot based subscription verification
- Live class link management
- Real-time style activity updates through backend APIs

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Router
- TanStack Query

### Backend

- Node.js
- MySQL2
- REST-style API endpoints
- Role-based access logic

### Database

- MySQL
- Structured tables for users, profiles, roles, academic hierarchy, content, quizzes, payments, subscriptions, live sessions, and audit logs

## Project Structure

```text
src/
  components/      Reusable UI and feature components
  pages/           Route-level pages and dashboards
  hooks/           Custom React hooks
  integrations/    API client integration
  services/        API helper services

server/
  mysql-api.mjs    Node.js backend API
  seed-*.sql       MySQL seed files for syllabus, quizzes, content, and PYQs

public/
  notes/           Public note PDFs
  papers/          Previous year papers
  docs/            Diagrams and report assets
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example` as reference:

```env
VITE_API_BASE_URL="http://localhost:3001/api"
API_PORT="3001"
FRONTEND_ORIGIN="http://localhost:8080"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="your-password"
MYSQL_DATABASE="educonnect_db"
```

Run backend API:

```bash
npm run api
```

Run frontend:

```bash
npm run dev
```

Build frontend:

```bash
npm run build
```

## Deployment Plan

Recommended free deployment setup:

```text
Frontend: Vercel
Backend: Render
Database: Aiven MySQL
```

Deployment flow:

```text
React Frontend -> Node.js API -> MySQL Database
```

## Author

Aman Kumar
