import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "docs");
fs.mkdirSync(outDir, { recursive: true });

const rows = [
  ["What is EduConnect?", "EduConnect is a role-based University ERP + LMS platform where students access syllabus-based notes, videos, PYQs, quizzes, live classes, subscriptions, and teacher interaction. Admin manages hierarchy, approvals, users, and subscriptions. Teachers upload assigned-subject content. Maintenance users raise academic update requests."],
  ["What is your role in the project?", "I worked on frontend and backend/API integration. I developed role-based pages, connected React with the Node.js MySQL API, implemented syllabus navigation, quiz flow, subscription request flow, teacher content upload, and admin approval workflows."],
  ["What is your teammate's role?", "My teammate is responsible for MySQL database design, table creation, data insertion, relationships, and seed data."],
  ["Which file defines routes/tasks?", "src/App.tsx defines frontend routes. src/components/auth/RoleRoute.tsx protects routes based on roles. server/mysql-api.mjs handles backend API. src/integrations/mysql/client.ts connects frontend to backend API."],
  ["What is SDLC in your project?", "Requirement analysis, system design, implementation, testing, deployment/execution, and maintenance. EduConnect started from the problem of scattered student resources and was designed as a structured ERP + LMS with role-based workflows."],
  ["What is SRS for EduConnect?", "SRS means Software Requirement Specification. For EduConnect, requirements include student syllabus-based learning, teacher upload workflow, admin hierarchy/user/content/subscription management, maintenance requests, quiz tracking, and premium access control."],
  ["What is black box testing?", "Black box testing checks system behavior from the user side without seeing internal code. Example: login with correct password should open dashboard; student opening admin route should be denied; quiz submit should show score."],
  ["Black box testing examples in EduConnect", "Student login, wrong login, admin login, student trying admin page, quiz submit, subscription request, admin approval, teacher upload, and syllabus navigation."],
  ["What is white box testing?", "White box testing checks internal code, logic, conditions, and data flow. Example: checking RoleRoute logic, quiz timer logic, score calculation, subscription conditions, and MySQL insert/update flow."],
  ["White box testing examples in EduConnect", "RoleRoute.tsx for role checks, useUserRole.ts for role fetching, TakeQuiz.tsx for timer/score, QuizBrowser.tsx for filtering/leaderboard, useSubscription.ts for free/premium access, mysql-api.mjs for backend CRUD."],
  ["What is unit testing?", "Testing individual units or components separately. Example: quiz timer, login validation, score calculation, role check, subscription access check, dashboard count logic."],
  ["What is integration testing?", "Testing two or more modules together. Example: signup creates app_users, profiles, and user_roles; quiz submit creates quiz_attempts and student_answers; subscription request creates subscriptions and payments."],
  ["What is system testing?", "Testing the complete application flow. Example: student signs up, logs in, opens syllabus, reads notes, watches video, attempts quiz, sees score, requests premium, admin approves, student unlocks premium content."],
  ["What is regression testing?", "After changing/fixing a feature, checking old features still work. Example: after changing quiz timer, verify quiz submit still works; after changing subscription logic, verify free content still opens."],
  ["What is cohesion?", "Cohesion means how focused a module is on one responsibility. High cohesion is good. Example: TakeQuiz.tsx handles only quiz attempt flow; Subscription.tsx handles subscription; AdminTeachers.tsx handles teacher approval/assignment."],
  ["What is coupling?", "Coupling means how dependent modules are on each other. Low coupling is good. In EduConnect, components call a common mysqlClient instead of directly connecting to MySQL, which keeps frontend and backend more separated."],
  ["Data coupling example", "TakeQuiz receives quizId from route and fetches quiz data. CoursePlayer receives subject/content data. QuizBrowser receives quiz records from API."],
  ["Control coupling example", "RoleRoute controls whether a page opens or redirects based on user role. Subscription status controls premium/free access."],
  ["Stamp coupling example", "Some components pass full objects like quiz or subject even when only some fields are needed. This is acceptable for the current project scale."],
  ["Common coupling example", "Auth session stored in local storage and accessed by mysqlClient/auth hooks is shared across modules."],
  ["Why is same student_answers table used for every student?", "Professional database design does not create a separate table per student. All student answers are stored in student_answers and linked to quiz_attempts. quiz_attempts contains user_id, so each student's answers are identified correctly."],
  ["Quiz answer storage workflow", "Student selects answers in frontend state. On submit or auto-submit, one quiz_attempts row is saved and one student_answers row is saved per question with selected_option_id and is_correct."],
  ["Quiz timer workflow", "Each question gets 20 seconds. On timeout, the quiz moves to the next question. On the last question, it auto-submits."],
  ["Subscription workflow", "Student selects semester premium, pays through QR, uploads screenshot and transaction ID, subscription/payment records are created as pending, admin verifies screenshot and activates premium access."],
  ["Teacher assignment workflow", "Admin approves teacher, assigns teacher to specific subjects, and teacher can upload content only for assigned subjects."],
  ["Maintenance workflow", "Maintenance user proposes academic hierarchy changes. The request goes to admin. Admin approves/rejects/applies the change."],
  ["Best short viva answer", "EduConnect is a role-based ERP + LMS platform built with React, TypeScript, Node.js, and MySQL. It provides syllabus-based learning resources for students, teacher content upload for assigned subjects, admin approval and hierarchy management, maintenance requests, quizzes, subscriptions, and live classes."],
];

const fileRows = [
  ["src/App.tsx", "Defines routes/pages."],
  ["src/pages/Auth.tsx", "Login, signup, role selection."],
  ["src/components/auth/RoleRoute.tsx", "Protects pages based on role."],
  ["src/hooks/useUserRole.ts", "Fetches current user role."],
  ["src/pages/Dashboard.tsx", "Role-based dashboard."],
  ["src/pages/Syllabus.tsx", "Syllabus navigation."],
  ["src/components/syllabus/CoursePlayer.tsx", "Notes/video LMS player."],
  ["src/pages/Quizzes.tsx", "Quiz page wrapper."],
  ["src/components/quiz/QuizBrowser.tsx", "Quiz cards and leaderboard."],
  ["src/components/quiz/TakeQuiz.tsx", "Quiz attempt, timer, submit, score."],
  ["src/pages/Subscription.tsx", "Student premium request/payment proof."],
  ["src/components/admin/AdminSubscriptionManager.tsx", "Admin payment verification."],
  ["src/pages/AdminHierarchy.tsx", "Academic hierarchy management."],
  ["src/pages/AdminTeachers.tsx", "Teacher approval and assignment."],
  ["src/pages/AdminStudents.tsx", "Student records."],
  ["src/pages/AdminContentApprovals.tsx", "Content approval workflow."],
  ["src/pages/MaintenanceRequests.tsx", "Maintenance request creation."],
  ["src/pages/MaintenanceDashboard.tsx", "Maintenance request tracking."],
  ["src/pages/TeacherCMS.tsx", "Teacher notes/videos/content upload."],
  ["src/pages/TeacherQuizzes.tsx", "Teacher quiz creation."],
  ["server/mysql-api.mjs", "Backend API connecting React with MySQL."],
  ["src/integrations/mysql/client.ts", "Frontend API client wrapper."],
  ["server/*.sql", "Seed and database data files."],
  [".env", "Environment configuration such as API URL."],
];

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>EduConnect Today's Q&A Notes</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.45; margin: 0; }
    h1 { font-size: 30px; margin: 0 0 8px; color: #0b1f44; }
    h2 { font-size: 20px; margin: 24px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; color: #0b1f44; }
    p { margin: 0 0 8px; }
    .cover { min-height: 88vh; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
    .logo { width: 68px; height: 68px; display: grid; place-items: center; border-radius: 18px; background: linear-gradient(135deg,#1d4ed8,#7c3aed); color: #fff; font-weight: 800; font-size: 28px; margin-bottom: 20px; }
    .subtitle { color: #4b5563; font-size: 16px; max-width: 620px; }
    .meta { margin-top: 24px; font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin: 10px 0 18px; }
    tr { page-break-inside: avoid; }
    th { background: #0b1f44; color: #fff; text-align: left; padding: 8px; }
    td { border: 1px solid #e5e7eb; padding: 7px; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #f9fafb; }
    .answer { color: #374151; }
    .pill { display: inline-block; padding: 5px 10px; border-radius: 999px; background: #eef2ff; color: #3730a3; font-weight: 700; font-size: 12px; margin: 4px 4px 4px 0; }
    .box { border-left: 4px solid #2563eb; background: #f8fbff; padding: 10px 12px; margin: 10px 0; }
    code { background: #f3f4f6; border-radius: 4px; padding: 1px 4px; font-family: Consolas, monospace; }
  </style>
</head>
<body>
  <section class="cover">
    <div class="logo">EC</div>
    <h1>EduConnect Today's Q&A Notes</h1>
    <p class="subtitle">Interview and viva preparation notes covering SDLC, SRS, testing, black box/white box testing, cohesion, coupling, workflows, and file responsibilities.</p>
    <div style="margin-top:16px">
      <span class="pill">Testing</span>
      <span class="pill">SDLC</span>
      <span class="pill">SRS</span>
      <span class="pill">Cohesion & Coupling</span>
      <span class="pill">Project Files</span>
    </div>
    <p class="meta">Generated on 04 June 2026 for EduConnect project interview preparation.</p>
  </section>

  <h2>1. Quick Project Explanation</h2>
  <div class="box">
    EduConnect is a role-based ERP + LMS platform built with React, TypeScript, Node.js, and MySQL. It provides syllabus-based learning resources for students, teacher content upload for assigned subjects, admin approval and hierarchy management, maintenance requests, quizzes, subscriptions, and live classes.
  </div>

  <h2>2. Today's Questions And Answers</h2>
  <table>
    <thead><tr><th style="width:30%">Question / Topic</th><th>Answer</th></tr></thead>
    <tbody>
      ${rows.map(([q,a]) => `<tr><td><strong>${q}</strong></td><td class="answer">${a}</td></tr>`).join("")}
    </tbody>
  </table>

  <h2>3. Important Files And Their Tasks</h2>
  <table>
    <thead><tr><th style="width:38%">File</th><th>Task</th></tr></thead>
    <tbody>
      ${fileRows.map(([f,t]) => `<tr><td><code>${f}</code></td><td>${t}</td></tr>`).join("")}
    </tbody>
  </table>

  <h2>4. Testing Summary To Speak In Viva</h2>
  <div class="box">
    In my project, black box testing was done by checking user workflows such as login, role access, quiz submit, subscription request, and admin approval without seeing internal code. White box testing was done by checking internal logic such as role-based routing, quiz timer, score calculation, and database insert/update operations. The project has high cohesion because each module has a focused task, and coupling is controlled by using reusable hooks and a common MySQL client wrapper.
  </div>

  <h2>5. Commands</h2>
  <table>
    <thead><tr><th>Command</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td><code>npm run api</code></td><td>Starts Node.js MySQL backend API.</td></tr>
      <tr><td><code>npm run dev</code></td><td>Starts React/Vite frontend.</td></tr>
      <tr><td><code>npm run build</code></td><td>Checks production build.</td></tr>
    </tbody>
  </table>
</body>
</html>`;

const htmlPath = path.join(outDir, "EduConnect_Todays_QA_Interview_Notes.html");
fs.writeFileSync(htmlPath, html, "utf8");
console.log(htmlPath);
