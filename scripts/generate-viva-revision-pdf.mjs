import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "docs");
fs.mkdirSync(outDir, { recursive: true });

const sdlcRows = [
  ["Requirement Analysis", "In this phase, the problem is identified and user requirements are collected. The team understands what the users need from the system.", "In EduConnect, the problem was that university students could not easily find syllabus-based notes, videos, PYQs, quizzes, and live classes in one organized place."],
  ["Planning", "In this phase, scope, timeline, technology, team responsibility, and feasibility are decided.", "Frontend and backend work were handled by you, while your teammate worked on MySQL database design, tables, and data insertion."],
  ["System Design", "In this phase, architecture, UI design, database design, modules, and workflows are planned.", "EduConnect was designed as a role-based ERP + LMS with Student, Teacher, Admin, and Maintenance dashboards."],
  ["Implementation", "In this phase, actual coding is done according to the design and requirements.", "React pages, Node.js API, MySQL integration, quiz module, subscription flow, teacher upload, and admin workflows were implemented."],
  ["Testing", "In this phase, the application is checked for errors, wrong outputs, broken workflows, and security issues.", "Login, role access, syllabus navigation, quiz submission, subscription approval, and teacher upload were tested."],
  ["Deployment", "In this phase, the application is run in the target environment so users can access it.", "EduConnect runs locally using npm run api for backend, npm run dev for frontend, and MySQL as database."],
  ["Maintenance", "In this phase, bugs are fixed and new features are added based on feedback.", "Quiz timer was updated, UI changes were made, syllabus data was added, and subscription/teacher workflows were improved."],
];

const testingRows = [
  ["Unit Testing", "Testing individual functions or components separately.", "Testing quiz timer, login validation, score calculation, and role-checking logic."],
  ["Integration Testing", "Testing combined modules to check if they work together.", "Testing quiz submit flow where frontend sends answers, backend stores attempt, and MySQL saves student_answers."],
  ["System Testing", "Testing the complete software as one system.", "Testing complete flow: signup -> login -> dashboard -> syllabus -> quiz -> score -> subscription request."],
  ["Regression Testing", "Checking old functionality after changes are made.", "After changing quiz timer to 20 seconds, checking quiz submission and score calculation still work."],
  ["Acceptance Testing", "Checking whether the system satisfies user requirements.", "Confirming that students can access syllabus-based content and teachers can upload assigned-subject resources."],
  ["Black Box Testing", "Testing input and output without seeing internal code.", "Student login, admin approval, quiz submit, and subscription request are tested from user side."],
  ["White Box Testing", "Testing internal code, conditions, logic, and paths.", "RoleRoute logic, TakeQuiz timer, score calculation, and MySQL insert/update operations are checked."],
];

const blackBoxRows = [
  ["Student login", "Correct email and password", "Student dashboard should open"],
  ["Wrong login", "Wrong password", "Error message should display"],
  ["Student opens admin page", "Student role user opens /admin/teachers", "Access should be denied or redirected"],
  ["Quiz submit", "Student selects answers and submits", "Score and correction should appear"],
  ["Subscription request", "Student uploads payment screenshot and transaction ID", "Pending subscription request should be created"],
  ["Admin approval", "Admin approves payment request", "Premium access should activate"],
  ["Teacher upload", "Teacher uploads PDF/video", "Content should be stored and visible according to approval/access rules"],
];

const whiteBoxRows = [
  ["RoleRoute.tsx", "Checks if correct roles can access protected pages."],
  ["useUserRole.ts", "Checks if user roles are fetched and interpreted correctly."],
  ["TakeQuiz.tsx", "Checks timer, answer selection, auto-next, auto-submit, score calculation, and answer saving."],
  ["QuizBrowser.tsx", "Checks quiz filtering, leaderboard ranking, and question count display."],
  ["useSubscription.ts", "Checks free vs premium access conditions."],
  ["mysql-api.mjs", "Checks backend CRUD logic and MySQL query execution."],
  ["client.ts", "Checks frontend API request wrapper and auth session handling."],
];

const cohesionRows = [
  ["TakeQuiz.tsx", "Handles only quiz attempt, timer, answer selection, score, and submit."],
  ["QuizBrowser.tsx", "Handles quiz cards and leaderboard display."],
  ["Subscription.tsx", "Handles student subscription request, QR/payment proof, and form submission."],
  ["AdminTeachers.tsx", "Handles teacher approval and subject assignment."],
  ["TeacherCMS.tsx", "Handles teacher content upload and content management."],
  ["RoleRoute.tsx", "Handles only route protection based on role."],
  ["mysql-api.mjs", "Handles backend MySQL API operations."],
];

const couplingRows = [
  ["Data Coupling", "One module passes data to another.", "TakeQuiz gets quizId from route and fetches quiz data."],
  ["Control Coupling", "One module controls the behavior/access of another.", "RoleRoute controls whether a page is opened or redirected based on user role."],
  ["Stamp Coupling", "A full object is passed when only some fields are needed.", "Some components pass full quiz or subject objects."],
  ["Common Coupling", "Multiple modules depend on shared global/common data.", "Auth session is stored locally and used across components."],
  ["Database Coupling", "Backend depends on database tables and schema.", "mysql-api.mjs depends on MySQL tables such as users, content, quizzes, and subscriptions."],
];

const algorithmRows = [
  ["Role Checking Algorithm", "Gets logged-in user, fetches role from user_roles table, and redirects user to allowed dashboard/page."],
  ["Quiz Scoring Algorithm", "Loops through questions, compares selected option with correct option, adds marks, and saves correct/wrong status."],
  ["Quiz Timer Algorithm", "Each question gets 20 seconds. On timeout it moves to next question, and on last question it auto-submits."],
  ["Subscription Access Algorithm", "Checks active premium subscription for selected semester. If active, full content is unlocked; otherwise only free preview is shown."],
  ["Leaderboard Algorithm", "Fetches completed attempts, groups by student, calculates percentage, sorts students in descending order, and displays rank."],
  ["Search/Filter Algorithm", "Filters quizzes, students, subjects, and content based on semester, level, role, or search keyword."],
  ["Hierarchy Traversal", "Displays academic data step-by-step: University -> Course -> Branch -> Scheme -> Semester -> Subject -> Unit -> Topic."],
];

const fileRows = [
  ["src/App.tsx", "Defines all frontend routes and connects pages with URLs."],
  ["src/pages/Auth.tsx", "Handles login, signup, profile data, and role selection."],
  ["src/components/auth/RoleRoute.tsx", "Protects pages based on user role."],
  ["src/hooks/useUserRole.ts", "Fetches current user and user roles."],
  ["src/pages/Dashboard.tsx", "Shows dashboard according to role: admin, teacher, student, or maintenance."],
  ["src/pages/Syllabus.tsx", "Handles syllabus hierarchy navigation and subject selection."],
  ["src/components/syllabus/CoursePlayer.tsx", "Displays topic-wise notes and video learning player."],
  ["src/pages/Quizzes.tsx", "Main quiz page wrapper."],
  ["src/components/quiz/QuizBrowser.tsx", "Shows quiz cards, filters, and leaderboard."],
  ["src/components/quiz/TakeQuiz.tsx", "Handles quiz attempt, timer, options, submit, score, and corrections."],
  ["src/pages/Subscription.tsx", "Handles premium plan, QR payment, screenshot upload, and subscription request."],
  ["src/components/admin/AdminSubscriptionManager.tsx", "Admin verifies payment screenshots and approves subscriptions."],
  ["src/pages/AdminHierarchy.tsx", "Admin/maintenance academic hierarchy management."],
  ["src/pages/AdminTeachers.tsx", "Teacher approval and teacher-subject assignment."],
  ["src/pages/AdminStudents.tsx", "Student records and profile information."],
  ["src/pages/AdminContentApprovals.tsx", "Admin content approval workflow."],
  ["src/pages/MaintenanceRequests.tsx", "Maintenance academic change request form."],
  ["src/pages/MaintenanceDashboard.tsx", "Maintenance request tracking and status."],
  ["src/pages/TeacherCMS.tsx", "Teacher content upload: notes, videos, resources."],
  ["src/pages/TeacherQuizzes.tsx", "Teacher quiz creation and management."],
  ["server/mysql-api.mjs", "Node.js backend API that connects React frontend with MySQL database."],
  ["src/integrations/mysql/client.ts", "Frontend MySQL API client wrapper used by React components."],
  ["server/*.sql", "SQL seed/data files for syllabus, quiz, PYQ, and demo data."],
  [".env", "Environment configuration such as API URL and database-related values."],
];

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>EduConnect Detailed Viva Revision</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.45; }
    h1 { font-size: 31px; color: #0b1f44; margin: 0 0 8px; }
    h2 { font-size: 20px; color: #0b1f44; margin: 24px 0 9px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
    h3 { font-size: 15px; color: #111827; margin: 14px 0 6px; }
    p { margin: 0 0 8px; }
    ul, ol { margin: 6px 0 12px 20px; padding: 0; }
    li { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 9px 0 16px; }
    th { background: #0b1f44; color: white; text-align: left; padding: 7px; }
    td { border: 1px solid #e5e7eb; padding: 6px; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #f9fafb; }
    pre { background: #f3f4f6; border-radius: 8px; padding: 10px; font-family: Consolas, monospace; font-size: 10.5px; white-space: pre-wrap; }
    code { background: #f3f4f6; padding: 1px 4px; border-radius: 4px; font-family: Consolas, monospace; }
    .cover { min-height: 91vh; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
    .logo { width: 68px; height: 68px; border-radius: 18px; background: linear-gradient(135deg,#1d4ed8,#7c3aed); color: white; display: grid; place-items: center; font-weight: 800; font-size: 28px; margin-bottom: 20px; }
    .subtitle { font-size: 16px; color: #4b5563; max-width: 680px; }
    .pill { display: inline-block; padding: 5px 10px; border-radius: 999px; background: #eef2ff; color: #3730a3; font-size: 12px; font-weight: 700; margin: 4px 4px 0 0; }
    .box { border-left: 4px solid #2563eb; background: #f8fbff; padding: 10px 12px; margin: 9px 0 14px; }
    .warn { border-left-color: #f59e0b; background: #fffbeb; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; break-inside: avoid; }
    .small { font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <section class="cover">
    <div class="logo">EC</div>
    <h1>EduConnect Detailed Viva Revision</h1>
    <p class="subtitle">Fully explained last-minute viva notes for SDLC, SRS, software requirements, testing, black box testing, white box testing, cohesion, coupling, algorithms, workflows, and EduConnect project examples.</p>
    <div style="margin-top: 14px;">
      <span class="pill">SDLC</span>
      <span class="pill">SRS</span>
      <span class="pill">Testing</span>
      <span class="pill">Cohesion</span>
      <span class="pill">Coupling</span>
      <span class="pill">Algorithms</span>
      <span class="pill">EduConnect Examples</span>
    </div>
    <p class="small" style="margin-top: 24px;">Prepared for EduConnect major project viva.</p>
  </section>

  <h2>1. How To Explain EduConnect</h2>
  <p><strong>EduConnect</strong> is a role-based University ERP + LMS platform. It provides syllabus-based learning resources for students and administrative control for academic management.</p>
  <div class="box">
    <strong>One-line answer:</strong> EduConnect is a role-based ERP + LMS platform where students access syllabus-based notes, videos, PYQs, quizzes, and live classes; teachers upload assigned-subject content; admins manage hierarchy, approvals, users and subscriptions; and maintenance users raise academic update requests.
  </div>
  <p>The main problem solved by the project is that university students usually depend on scattered resources such as WhatsApp groups, Telegram channels, random PDFs, and YouTube playlists. EduConnect organizes everything according to syllabus hierarchy.</p>
  <div class="box">
    University -> Course -> Branch -> Scheme -> Semester -> Subject -> Unit -> Topic -> Notes / Videos / PYQs / Quizzes / Live Classes
  </div>

  <h2>2. Your Role And Team Role</h2>
  <div class="two">
    <div class="card">
      <h3>Your Work</h3>
      <ul>
        <li>Frontend development using React and TypeScript.</li>
        <li>Backend/API integration with Node.js and MySQL API.</li>
        <li>Role-based dashboard and route protection.</li>
        <li>Quiz workflow, timer, score, and leaderboard.</li>
        <li>Subscription request and payment screenshot workflow.</li>
        <li>Teacher/admin/student/maintenance module integration.</li>
      </ul>
    </div>
    <div class="card">
      <h3>Teammate Work</h3>
      <ul>
        <li>MySQL database design.</li>
        <li>Table creation and data insertion.</li>
        <li>Database relationships.</li>
        <li>Seed data for syllabus, quiz, users, content, and academic hierarchy.</li>
      </ul>
    </div>
  </div>

  <h2>3. SDLC - Software Development Life Cycle</h2>
  <p><strong>SDLC</strong> stands for <strong>Software Development Life Cycle</strong>. It is a systematic process used to develop software. It helps the team plan, design, develop, test, deploy, and maintain the project in an organized way.</p>
  <table>
    <thead><tr><th>Phase</th><th>Meaning</th><th>EduConnect Example</th></tr></thead>
    <tbody>${sdlcRows.map(([a,b,c]) => `<tr><td><strong>${a}</strong></td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
  </table>
  <div class="box">
    <strong>Viva answer:</strong> SDLC is the process followed to develop software systematically. In EduConnect, we first identified the problem of scattered academic resources, then designed a role-based LMS, implemented frontend/backend/database, tested modules, and improved features based on feedback.
  </div>

  <h2>4. Software Requirement</h2>
  <p><strong>Software requirement</strong> means what the software should do and how it should behave. Requirements are mainly divided into functional and non-functional requirements.</p>
  <div class="two">
    <div class="card">
      <h3>Functional Requirements</h3>
      <p>Functional requirements describe the actual features of the system.</p>
      <ul>
        <li>User can login and signup.</li>
        <li>User gets dashboard based on role.</li>
        <li>Student can access syllabus, notes, videos, PYQs, quizzes.</li>
        <li>Teacher can upload assigned-subject content.</li>
        <li>Admin can approve teachers and subscriptions.</li>
        <li>Maintenance can raise hierarchy update requests.</li>
      </ul>
    </div>
    <div class="card">
      <h3>Non-Functional Requirements</h3>
      <p>Non-functional requirements describe quality and performance of the system.</p>
      <ul>
        <li>Role-based security.</li>
        <li>Responsive and clean UI.</li>
        <li>Reliable MySQL data storage.</li>
        <li>Fast API response and data fetching.</li>
        <li>Easy navigation for students.</li>
        <li>Maintainable modular code.</li>
      </ul>
    </div>
  </div>
  <div class="box">
    <strong>Viva answer:</strong> Software requirements define what the system should do. In EduConnect, functional requirements include login, role-based dashboard, syllabus navigation, teacher upload, quiz attempt, and subscription approval. Non-functional requirements include security, usability, responsiveness, and database reliability.
  </div>

  <h2>5. SRS - Software Requirement Specification</h2>
  <p><strong>SRS</strong> stands for <strong>Software Requirement Specification</strong>. It is a formal document that contains complete details of software requirements. It acts as a reference for developers, testers, and project evaluators.</p>
  <p>An SRS usually contains:</p>
  <ul>
    <li>Project objective</li>
    <li>Scope of the project</li>
    <li>Users and roles</li>
    <li>Functional requirements</li>
    <li>Non-functional requirements</li>
    <li>Database requirements</li>
    <li>System workflow</li>
    <li>Constraints and assumptions</li>
  </ul>
  <div class="box">
    <strong>EduConnect SRS summary:</strong> The SRS of EduConnect defines four users: student, teacher, admin, and maintenance. Students access learning resources, teachers upload assigned-subject content, admins manage hierarchy and approvals, and maintenance users raise academic update requests.
  </div>

  <h2>6. Software Testing</h2>
  <p><strong>Software testing</strong> is the process of checking whether the software works according to requirements. Testing helps detect bugs, wrong outputs, security issues, broken workflows, and database errors.</p>
  <table>
    <thead><tr><th>Testing Type</th><th>Meaning</th><th>EduConnect Example</th></tr></thead>
    <tbody>${testingRows.map(([a,b,c]) => `<tr><td><strong>${a}</strong></td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
  </table>
  <div class="box">
    <strong>Viva answer:</strong> Software testing is used to check whether the application works according to requirements. In EduConnect, I tested login, role access, syllabus flow, teacher upload, quiz submission, subscription approval, and database updates.
  </div>

  <h2>7. Black Box Testing</h2>
  <p><strong>Black box testing</strong> means testing the software without checking internal code. The tester only checks input and output. It focuses on user behavior and expected result.</p>
  <table>
    <thead><tr><th>Test Case</th><th>Input</th><th>Expected Output</th></tr></thead>
    <tbody>${blackBoxRows.map(([a,b,c]) => `<tr><td><strong>${a}</strong></td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
  </table>
  <div class="box">
    <strong>Viva answer:</strong> In black box testing, I tested EduConnect from the user side without checking code. For example, I checked whether login works, student cannot access admin pages, quiz submit shows score, and subscription request becomes pending.
  </div>

  <h2>8. White Box Testing</h2>
  <p><strong>White box testing</strong> means testing the internal logic, code paths, conditions, functions, and database operations. The tester knows the internal structure of the software.</p>
  <table>
    <thead><tr><th>Code Area</th><th>What Was Tested</th></tr></thead>
    <tbody>${whiteBoxRows.map(([a,b]) => `<tr><td><code>${a}</code></td><td>${b}</td></tr>`).join("")}</tbody>
  </table>
  <div class="box">
    <strong>Viva answer:</strong> In white box testing, I checked internal logic like role-based routing, quiz timer, score calculation, subscription access conditions, and database insert/update operations.
  </div>

  <h2>9. Cohesion</h2>
  <p><strong>Cohesion</strong> means how focused a module is on one specific responsibility. High cohesion is good because it makes code easier to understand, test, and maintain.</p>
  <table>
    <thead><tr><th>Module / File</th><th>Focused Responsibility</th></tr></thead>
    <tbody>${cohesionRows.map(([a,b]) => `<tr><td><code>${a}</code></td><td>${b}</td></tr>`).join("")}</tbody>
  </table>
  <div class="box">
    <strong>Viva answer:</strong> EduConnect has high cohesion because each module has a clear responsibility. For example, TakeQuiz.tsx handles only quiz logic, while Subscription.tsx handles only subscription workflow.
  </div>

  <h2>10. Coupling</h2>
  <p><strong>Coupling</strong> means how much one module depends on another module. Low coupling is good because changes in one module do not strongly affect other modules.</p>
  <p>In EduConnect, coupling is controlled by using hooks and a common MySQL client wrapper. React components do not directly connect to MySQL; they call backend API through <code>src/integrations/mysql/client.ts</code>.</p>
  <table>
    <thead><tr><th>Coupling Type</th><th>Meaning</th><th>EduConnect Example</th></tr></thead>
    <tbody>${couplingRows.map(([a,b,c]) => `<tr><td><strong>${a}</strong></td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
  </table>
  <div class="box">
    <strong>Viva answer:</strong> I tried to keep coupling low by using reusable hooks and a common MySQL client wrapper. React components do not directly connect to MySQL. They call the backend API through the client wrapper.
  </div>

  <h2>11. Algorithms And Logic Used</h2>
  <p>EduConnect does not use heavy DSA algorithms like graph shortest path or sorting libraries, but it uses important application-level algorithms and workflows.</p>
  <table>
    <thead><tr><th>Algorithm / Logic</th><th>Use In EduConnect</th></tr></thead>
    <tbody>${algorithmRows.map(([a,b]) => `<tr><td><strong>${a}</strong></td><td>${b}</td></tr>`).join("")}</tbody>
  </table>

  <h3>Quiz Scoring Algorithm</h3>
  <pre>For each question:
  get selected option
  get correct option
  if selected option == correct option:
      add marks
      save answer as correct
  else:
      save answer as wrong
Final score = total correct marks</pre>

  <h3>Role Checking Algorithm</h3>
  <pre>Get logged-in user
Get user role from user_roles table
If admin:
    allow admin dashboard
Else if teacher:
    allow teacher dashboard
Else if student:
    allow student dashboard
Else if maintenance:
    allow maintenance dashboard</pre>

  <h3>Subscription Access Algorithm</h3>
  <pre>If student has active premium subscription for semester:
    show full content
Else:
    show free preview content only</pre>

  <h3>Leaderboard Algorithm</h3>
  <pre>Fetch completed quiz attempts
Group attempts by student
Calculate percentage for each student
Sort students by highest percentage
Display rank</pre>

  <h2>12. Major Files And Responsibilities</h2>
  <table>
    <thead><tr><th>File</th><th>Responsibility</th></tr></thead>
    <tbody>${fileRows.map(([a,b]) => `<tr><td><code>${a}</code></td><td>${b}</td></tr>`).join("")}</tbody>
  </table>

  <h2>13. Database Tables To Remember</h2>
  <table>
    <thead><tr><th>Table</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td><code>app_users</code></td><td>Stores login email and password.</td></tr>
      <tr><td><code>profiles</code></td><td>Stores user details such as full name, phone, gender, semester.</td></tr>
      <tr><td><code>user_roles</code></td><td>Stores role: student, teacher, admin, maintenance.</td></tr>
      <tr><td><code>universities, courses, branches, schemes, subjects, units, syllabus_topics</code></td><td>Stores academic hierarchy.</td></tr>
      <tr><td><code>content</code></td><td>Stores notes, videos, PDFs and approval status.</td></tr>
      <tr><td><code>teacher_assignments</code></td><td>Stores subject-wise teacher mapping.</td></tr>
      <tr><td><code>quizzes, questions, options</code></td><td>Stores quiz structure.</td></tr>
      <tr><td><code>quiz_attempts, student_answers</code></td><td>Stores student quiz results and selected answers.</td></tr>
      <tr><td><code>subscriptions, payments</code></td><td>Stores premium plan and payment proof.</td></tr>
      <tr><td><code>hierarchy_requests</code></td><td>Stores maintenance requests for admin approval.</td></tr>
    </tbody>
  </table>

  <h2>14. Final Viva Answer</h2>
  <div class="box">
    EduConnect is a role-based ERP + LMS platform developed using React, TypeScript, Node.js, and MySQL. The system has four roles: student, teacher, admin, and maintenance. Students access syllabus-based notes, videos, PYQs, quizzes, and live classes. Teachers upload content only for assigned subjects. Admin manages academic hierarchy, teacher approval, subscriptions, and content approvals. Maintenance users raise academic update requests. The project follows SDLC phases like requirement analysis, design, implementation, testing, and maintenance. Testing includes black box testing for user workflows and white box testing for internal logic like role checking, quiz timer, score calculation, and database operations.
  </div>

  <h2>15. Last Minute Tips</h2>
  <ul>
    <li>Always answer definition first, then give EduConnect example.</li>
    <li>If asked about testing, mention both user-side testing and code-side testing.</li>
    <li>If asked about database, mention normalized tables and relationships.</li>
    <li>If asked about your contribution, say frontend + backend/API integration.</li>
    <li>If asked about teammate contribution, say MySQL schema, relationships and data insertion.</li>
  </ul>
</body>
</html>`;

const htmlPath = path.join(outDir, "EduConnect_Detailed_Viva_Revision.html");
fs.writeFileSync(htmlPath, html, "utf8");
console.log(htmlPath);
