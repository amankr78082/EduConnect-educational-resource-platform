import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "docs");
fs.mkdirSync(outDir, { recursive: true });

const tables = [
  ["app_users", "Authentication account records: login email and password hash.", "id, email, password, created_at"],
  ["profiles", "User profile details used across student, teacher, admin, and maintenance views.", "user_id, full_name, phone, gender, university_id, course_id, branch_id, semester"],
  ["user_roles", "Role based access control mapping.", "user_id, role"],
  ["universities", "Top level academic institution records.", "name, short_name"],
  ["courses", "Courses under a university, such as MCA or B.Tech.", "university_id, name, total_semesters"],
  ["branches", "Program or specialization under a course.", "course_id, name, code"],
  ["schemes", "Curriculum version or academic scheme.", "branch_id, name, year, is_active"],
  ["subjects", "Semester subjects mapped to a scheme.", "scheme_id, name, code, semester, is_free"],
  ["units", "Subject units.", "subject_id, unit_number, name"],
  ["syllabus_topics", "Topic-wise syllabus index under each unit.", "unit_id, title, topic_order, description"],
  ["content", "Teacher uploaded notes, PDFs, and video links mapped to subject/unit/topic.", "subject_id, unit_id, syllabus_topic_id, content_type, file_url, video_url, approval_status"],
  ["content_topics", "Optional internal topic/page indexing for uploaded notes.", "content_id, title, page_number, topic_order"],
  ["content_views", "Tracks student content views.", "user_id, content_id, viewed_at"],
  ["bookmarks", "Student saved content items.", "user_id, content_id"],
  ["previous_papers", "PYQ records with optional teacher solution text/file.", "subject_id, unit_id, year, file_url, solution_text"],
  ["course_enrollments", "Student enrollment/progress per subject.", "user_id, subject_id, progress"],
  ["teacher_assignments", "Admin subject-wise teacher access mapping.", "teacher_id, subject_id, assigned_by, is_active"],
  ["live_sessions", "Teacher live classes and Meet/session links.", "subject_id, title, meet_link, is_live, started_at, ended_at"],
  ["quizzes", "Teacher/admin created quiz containers.", "subject_id, title, difficulty_level, is_published, time_limit_minutes"],
  ["questions", "Questions under each quiz.", "quiz_id, question_text, question_order, marks"],
  ["options", "MCQ options for questions.", "question_id, option_text, is_correct, option_order"],
  ["quiz_attempts", "One quiz attempt per student/quiz attempt.", "quiz_id, user_id, score, total_questions, total_marks, is_completed"],
  ["student_answers", "Individual answer records for each submitted attempt.", "attempt_id, question_id, selected_option_id, is_correct"],
  ["quiz_daily_usage", "Quiz usage/quota tracking support.", "user_id, usage_date, attempts_count, questions_attempted"],
  ["subscriptions", "Semester premium subscription requests and active plans.", "user_id, semester, amount, status, plan_type, activated_by"],
  ["payments", "Payment proof, transaction and admin verification records.", "user_id, subscription_id, amount, transaction_id, payment_screenshot_url, verified_by"],
  ["hierarchy_requests", "Maintenance requests for academic hierarchy changes.", "target_table, action_type, payload, status, requested_by, reviewed_by"],
  ["delete_requests", "Admin approval workflow before deleting sensitive records.", "table_name, record_id, reason, status"],
  ["audit_logs", "System activity logs for create/update/delete operations.", "table_name, record_id, action_type, old_data, new_data, actor_id"],
  ["chat_threads", "Student-teacher doubt discussion thread headers.", "student_id, teacher_id, subject, status"],
  ["chat_messages", "Messages inside doubt discussion threads.", "thread_id, sender_id, message"],
  ["teacher", "Legacy/simple teacher table still present in DB.", "teacher_id, name, Email_id"],
];

const moduleRows = [
  ["Authentication & RBAC", "Signup/login, profile creation, role selection, role protected routes for student, teacher, admin, and maintenance."],
  ["Student Dashboard", "Shows enrolled/available learning flow, subjects, teachers, quizzes, subscription access, live classes, and activity entry points."],
  ["Syllabus LMS", "University -> Course -> Branch -> Scheme -> Semester -> Subject -> Unit -> Topic drill-down with notes/videos/PYQs."],
  ["Smart Notes", "Topic-mapped notes with readable same-page content and PDF download/save option."],
  ["Video Learning", "Topic-wise video player workflow inspired by modern LMS navigation."],
  ["Quiz Arena", "Subject-wise quizzes, 20 free questions, premium full bank, 20 sec/question timer, score, correction, leaderboard."],
  ["Previous Year Papers", "Year-wise PYQ access, subject mapping, optional teacher solutions."],
  ["Subscription & Payment", "Student selects semester plan, scans QR, uploads screenshot/transaction ID, admin verifies and activates premium."],
  ["Teacher Dashboard", "Teacher sees assigned subjects, uploads notes/videos/PYQs, creates quizzes, schedules/starts live classes."],
  ["Teacher Assignment", "Admin approves teachers and maps teachers subject-wise so teachers access only assigned subjects."],
  ["Admin Dashboard", "ERP control center for hierarchy, teachers/students, approvals, subscriptions, analytics, audit logs."],
  ["Maintenance Dashboard", "Maintenance team proposes hierarchy/content structure changes; admin approves/rejects before publishing."],
  ["Approval Center", "Admin reviews uploaded content, delete requests, hierarchy requests, and subscription payments."],
  ["Doubt Chat", "Student can start chat thread with teacher; teacher can reply in discussion workflow."],
];

const techRows = [
  ["Frontend", "React 18, TypeScript, Vite, React Router DOM"],
  ["UI", "Tailwind CSS, shadcn/Radix UI components, Lucide React icons, Framer Motion"],
  ["State/Data Fetching", "TanStack React Query, custom MySQL client wrapper"],
  ["Backend", "Node.js API using native HTTP style/server module"],
  ["Database", "MySQL 8 with mysql2 driver"],
  ["Auth/RBAC", "Custom app_users + profiles + user_roles tables"],
  ["File Handling", "Local upload API and public upload paths for notes/payment screenshots/PYQs"],
  ["Charts/Analytics", "Recharts for dashboard/analytics visualization"],
  ["Dev Tools", "npm scripts: npm run api, npm run dev, npm run build"],
];

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>EduConnect Project Documentation</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, Helvetica, sans-serif; line-height: 1.48; background: white; }
    h1, h2, h3 { margin: 0 0 10px; color: #07152f; }
    h1 { font-size: 34px; letter-spacing: -0.5px; }
    h2 { font-size: 22px; margin-top: 26px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
    h3 { font-size: 16px; margin-top: 16px; }
    p { margin: 0 0 9px; }
    ul, ol { margin: 8px 0 14px 20px; padding: 0; }
    li { margin: 4px 0; }
    .cover { min-height: 92vh; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
    .brand { width: 72px; height: 72px; border-radius: 18px; background: linear-gradient(135deg, #1d4ed8, #7c3aed); color: white; display: grid; place-items: center; font-size: 30px; font-weight: 800; margin-bottom: 22px; }
    .subtitle { font-size: 18px; color: #4b5563; max-width: 620px; }
    .meta { margin-top: 30px; color: #6b7280; font-size: 13px; }
    .pill { display: inline-block; padding: 5px 10px; border-radius: 999px; background: #eef2ff; color: #3730a3; font-weight: 700; font-size: 12px; margin: 4px 4px 4px 0; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; background: #fff; break-inside: avoid; }
    .card strong { color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 11.5px; page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    th { background: #0b1f44; color: white; text-align: left; padding: 8px; }
    td { border: 1px solid #e5e7eb; padding: 7px; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #f9fafb; }
    .flow { border-left: 4px solid #2563eb; padding: 8px 0 8px 14px; margin: 10px 0 18px; background: #f8fbff; }
    .small { font-size: 12px; color: #4b5563; }
    .page-break { page-break-before: always; }
    code { font-family: Consolas, monospace; background: #f3f4f6; padding: 1px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <section class="cover">
    <div class="brand">EC</div>
    <h1>EduConnect</h1>
    <p class="subtitle">A University ERP + LMS platform for syllabus-based learning, teacher interaction, subscriptions, quizzes, live classes, notes, videos, and academic workflow management.</p>
    <div style="margin-top:18px">
      <span class="pill">React + TypeScript</span>
      <span class="pill">Node.js API</span>
      <span class="pill">MySQL</span>
      <span class="pill">Role Based Access Control</span>
      <span class="pill">ERP + LMS</span>
    </div>
    <p class="meta">Prepared for interview explanation, project viva, and company discussion.</p>
  </section>

  <h2>1. Project Overview</h2>
  <p><strong>EduConnect</strong> is a centralized academic resource platform for university students. The main problem it solves is scattered learning material: students often search across WhatsApp groups, Telegram channels, random PDFs, and YouTube playlists. EduConnect organizes everything by university syllabus hierarchy.</p>
  <div class="flow">
    University -> Course -> Branch/Program -> Scheme -> Semester -> Subject -> Unit -> Topic -> Notes / Videos / PYQs / Quizzes / Live Classes
  </div>
  <p>The project also includes ERP-style control for admins: academic hierarchy management, teacher approval, subject-wise teacher assignment, content approval, subscription verification, audit logs, and maintenance request workflow.</p>

  <h2>2. Main Roles</h2>
  <div class="grid">
    <div class="card"><h3>Student</h3><p>Accesses syllabus-based learning resources, notes, videos, PYQs, quizzes, live classes, progress, bookmarks, subscriptions, and teacher doubt chat.</p></div>
    <div class="card"><h3>Teacher</h3><p>Uploads academic content only for assigned subjects, creates quizzes, uploads PYQs/solutions, schedules live classes, and tracks quiz performance.</p></div>
    <div class="card"><h3>Admin</h3><p>Controls academic hierarchy, users, teacher approval, teacher assignment, content approvals, subscriptions, delete requests, and analytics.</p></div>
    <div class="card"><h3>Maintenance</h3><p>Suggests academic hierarchy changes and sends requests to admin. Maintenance does not directly publish critical changes.</p></div>
  </div>

  <h2>3. Technology Stack</h2>
  <table>
    <thead><tr><th>Layer</th><th>Technologies / Purpose</th></tr></thead>
    <tbody>${techRows.map(([a,b]) => `<tr><td><strong>${a}</strong></td><td>${b}</td></tr>`).join("")}</tbody>
  </table>

  <h2>4. Modules</h2>
  <table>
    <thead><tr><th>Module</th><th>Explanation</th></tr></thead>
    <tbody>${moduleRows.map(([a,b]) => `<tr><td><strong>${a}</strong></td><td>${b}</td></tr>`).join("")}</tbody>
  </table>

  <h2>5. Role Based Access Control</h2>
  <p>RBAC is implemented using <code>user_roles</code>. Routes are protected using a React role guard. Admin has broad access. Teacher, student, and maintenance users are limited to their respective dashboards and actions.</p>
  <ul>
    <li><strong>Admin:</strong> Full control and approval authority.</li>
    <li><strong>Teacher:</strong> Can manage content/quizzes/live classes for assigned subjects.</li>
    <li><strong>Student:</strong> Can consume resources and request subscription access.</li>
    <li><strong>Maintenance:</strong> Can create hierarchy update requests for admin review.</li>
  </ul>

  <h2>6. Academic Hierarchy Workflow</h2>
  <ol>
    <li>Admin creates university, course, branch/program, scheme, semester subjects, units, and topics.</li>
    <li>Admin approves teacher accounts.</li>
    <li>Admin assigns teachers to specific subjects.</li>
    <li>Teacher uploads notes, videos, PYQs, quizzes, and live class links for assigned subjects.</li>
    <li>Admin reviews/approves content where approval workflow is required.</li>
    <li>Student opens syllabus and consumes resources topic-wise.</li>
  </ol>

  <h2>7. Student Learning Workflow</h2>
  <div class="flow">
    Login -> Dashboard -> Syllabus -> Select University/Course/Semester -> Subject -> Unit -> Topic -> Notes / Video / PYQ / Quiz
  </div>
  <p>Students can view free preview content. Premium semester subscription unlocks full subject resources, full quiz question bank, downloadable notes, videos, and PYQs.</p>

  <h2>8. Subscription Workflow</h2>
  <ol>
    <li>Student selects semester premium plan.</li>
    <li>Student scans PhonePe/UPI QR and pays.</li>
    <li>Student uploads payment screenshot and transaction ID.</li>
    <li>System creates <code>subscriptions</code> and <code>payments</code> records with pending status.</li>
    <li>Admin reviews screenshot and activates/rejects subscription.</li>
    <li>After approval, student receives premium access for that semester.</li>
  </ol>

  <h2>9. Quiz Workflow</h2>
  <ul>
    <li>Teacher/admin creates quiz, questions, and options.</li>
    <li>Student starts quiz from Quiz Arena.</li>
    <li>Free students access up to 20 questions per subject quiz.</li>
    <li>Premium students access the full quiz bank where available.</li>
    <li>Timer is 20 seconds per question.</li>
    <li>On submit/auto-submit, system stores one <code>quiz_attempts</code> row and multiple <code>student_answers</code> rows.</li>
    <li>Leaderboard is generated from completed quiz attempts.</li>
  </ul>

  <h2>10. Database Tables</h2>
  <table>
    <thead><tr><th>Table</th><th>Purpose</th><th>Important Columns</th></tr></thead>
    <tbody>${tables.map(([a,b,c]) => `<tr><td><strong>${a}</strong></td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
  </table>

  <h2>11. Important Relationships</h2>
  <ul>
    <li><code>app_users.id</code> -> <code>profiles.user_id</code> and <code>user_roles.user_id</code></li>
    <li><code>universities.id</code> -> <code>courses.university_id</code></li>
    <li><code>courses.id</code> -> <code>branches.course_id</code></li>
    <li><code>branches.id</code> -> <code>schemes.branch_id</code></li>
    <li><code>schemes.id</code> -> <code>subjects.scheme_id</code></li>
    <li><code>subjects.id</code> -> <code>units.subject_id</code>, <code>content.subject_id</code>, <code>quizzes.subject_id</code>, <code>previous_papers.subject_id</code></li>
    <li><code>units.id</code> -> <code>syllabus_topics.unit_id</code></li>
    <li><code>teacher_assignments.teacher_id</code> links teacher user to <code>teacher_assignments.subject_id</code></li>
    <li><code>quizzes.id</code> -> <code>questions.quiz_id</code> -> <code>options.question_id</code></li>
    <li><code>quiz_attempts.id</code> -> <code>student_answers.attempt_id</code></li>
    <li><code>subscriptions.id</code> -> <code>payments.subscription_id</code></li>
  </ul>

  <h2>12. API / Backend Summary</h2>
  <p>The backend is a Node.js MySQL API. The frontend uses a custom <code>mysqlClient</code> wrapper that provides Supabase-like calls such as <code>from(table).select()</code>, <code>insert()</code>, <code>update()</code>, <code>delete()</code>, and <code>rpc()</code>.</p>
  <ul>
    <li><code>npm run api</code> starts the MySQL API server.</li>
    <li><code>npm run dev</code> starts the Vite frontend.</li>
    <li>API base URL is configured by <code>VITE_API_BASE_URL</code>.</li>
    <li>Authentication uses local session storage and DB tables.</li>
  </ul>

  <h2>13. Interview Explanation Script</h2>
  <p><strong>Short version:</strong> EduConnect is a syllabus-based LMS for university students with ERP-style admin control. It organizes notes, videos, PYQs, quizzes, live classes, subscriptions, and teacher interaction according to the academic hierarchy.</p>
  <p><strong>Detailed version:</strong> I built EduConnect using React, TypeScript, Tailwind CSS, Node.js, and MySQL. The system uses role based access control. Students access structured learning resources. Teachers upload content only for subjects assigned by admin. Admin manages hierarchy, teacher assignments, content approvals, subscriptions, and analytics. Maintenance users can raise academic update requests that admin approves before publishing.</p>

  <h2>14. Strengths Of The Project</h2>
  <ul>
    <li>Solves a real student problem: scattered academic content.</li>
    <li>Uses structured syllabus hierarchy instead of random resources.</li>
    <li>Includes real RBAC and subject-wise teacher access.</li>
    <li>Has subscription/payment verification workflow with screenshot proof.</li>
    <li>Stores quiz attempts and student answers in normalized DB tables.</li>
    <li>Includes admin/teacher/student/maintenance workflows, making it more than a simple LMS.</li>
  </ul>

  <h2>15. Possible Future Improvements</h2>
  <ul>
    <li>JWT based authentication and password reset email integration.</li>
    <li>Cloud file storage such as S3/Cloudinary for PDFs and screenshots.</li>
    <li>More detailed analytics for student progress and teacher performance.</li>
    <li>AI based topic explanation and automatic note summarization.</li>
    <li>Payment gateway integration instead of manual screenshot verification.</li>
    <li>Better notification system for live classes and approvals.</li>
  </ul>

  <h2>16. Commands To Run</h2>
  <ul>
    <li><code>npm install</code> - install dependencies.</li>
    <li><code>npm run api</code> - start backend API.</li>
    <li><code>npm run dev</code> - start frontend.</li>
    <li><code>npm run build</code> - production build verification.</li>
  </ul>
</body>
</html>`;

const htmlPath = path.join(outDir, "EduConnect_Project_Documentation.html");
fs.writeFileSync(htmlPath, html, "utf8");
console.log(htmlPath);
