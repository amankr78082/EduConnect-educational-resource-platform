import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function loadDotEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1].trim()] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadDotEnv();

const apiPort = Number(process.env.PORT || process.env.API_PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8080";
const allowedOrigins = new Set([
  frontendOrigin,
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8082",
  "http://localhost:8083",
  "http://127.0.0.1:8083",
]);
const allowedTables = new Set([
  "app_users",
  "universities", "courses", "branches", "schemes", "subjects", "units", "syllabus_topics", "teacher_assignments", "content", "content_topics",
  "previous_papers", "profiles", "user_roles", "course_enrollments", "bookmarks", "content_views",
  "subscriptions", "payments", "quiz_daily_usage", "quizzes", "questions", "options", "quiz_attempts",
  "student_answers", "live_sessions", "hierarchy_requests", "delete_requests", "audit_logs",
  "chat_threads", "chat_messages",
]);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "educonnect_db",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

await ensureLocalAuthTable();
await ensureTeacherAssignmentsTable();
await ensureContentTopicColumns();
await ensureContentApprovalColumns();
await ensureCourseEnrollmentColumns();
await ensureLiveSessionColumns();
await ensurePreviousPaperColumns();
await ensureProfileColumns();
await ensureSubscriptionColumns();
await ensurePaymentsTable();
await ensureQuizColumns();
await ensureAuditLogsTable();
await ensureHierarchyRequestColumns();

const eventClients = new Set();
const auditIgnoredTables = new Set(["audit_logs"]);
const realtimeIgnoredTables = new Set(["content_views"]);

function quoteIdent(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw httpError(400, `Invalid identifier: ${name}`);
  return `\`${name}\``;
}

function assertTable(table) {
  if (!allowedTables.has(table)) throw httpError(400, `Table is not allowed: ${table}`);
}

function cleanSelect(select) {
  if (!select || select.trim() === "*" || select.includes("(") || select.includes(":")) return "*";
  return select
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean)
    .map(quoteIdent)
    .join(", ");
}

function buildWhere(filters = [], params = []) {
  const clauses = [];
  for (const filter of filters) {
    if (!filter.column || String(filter.column).includes(".")) continue;
    const column = quoteIdent(filter.column);
    if (filter.op === "eq") {
      clauses.push(`${column} = ?`);
      params.push(filter.value);
    } else if (filter.op === "neq") {
      clauses.push(`${column} <> ?`);
      params.push(filter.value);
    } else if (filter.op === "in") {
      const values = Array.isArray(filter.value) ? filter.value : [];
      if (values.length === 0) {
        clauses.push("1 = 0");
      } else {
        clauses.push(`${column} IN (${values.map(() => "?").join(", ")})`);
        params.push(...values);
      }
    } else if (["gt", "gte", "lt", "lte"].includes(filter.op)) {
      const op = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[filter.op];
      clauses.push(`${column} ${op} ?`);
      params.push(filter.value);
    }
  }
  return clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
}

function buildOrder(orders = []) {
  const parts = orders
    .filter((order) => order.column && !String(order.column).includes("."))
    .map((order) => `${quoteIdent(order.column)} ${order.ascending === false ? "DESC" : "ASC"}`);
  return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
}

async function runQuery(table, body) {
  assertTable(table);
  const params = [];
  const count = Boolean(body.count);
  const select = count ? "COUNT(*) AS count_value" : cleanSelect(body.select);
  const where = buildWhere(body.filters, params);
  const order = count ? "" : buildOrder(body.orders);
  const limit = body.limit ? ` LIMIT ${Number(body.limit)}` : "";
  let rows;
  try {
    [rows] = await pool.execute(`SELECT ${select} FROM ${quoteIdent(table)}${where}${order}${limit}`, params);
  } catch (error) {
    if (error.code === "ER_BAD_FIELD_ERROR" || error.code === "ER_NO_SUCH_TABLE") {
      console.warn(`[mysql-api] ${table} query skipped: ${error.message}`);
      return { data: body.single || body.maybeSingle || body.head ? null : [], count: 0 };
    }
    throw error;
  }
  if (count) return { data: body.head ? null : rows, count: rows[0]?.count_value || 0 };
  if (body.single || body.maybeSingle) return { data: rows[0] || null, count: null };
  return { data: rows, count: null };
}

function getActorId(body) {
  return body.actor_id || body.actorId || null;
}

function getRecordIdFromFilters(filters = []) {
  const idFilter = filters.find((filter) => filter.column === "id" && filter.op === "eq");
  return idFilter?.value || null;
}

function summarizeMutation(table, action, rowOrValues = {}) {
  const row = rowOrValues || {};
  const label = row.title || row.name || row.full_name || row.email || row.role || row.status || row.table_name || row.id || table;
  const actionText = action === "insert" ? "created" : action === "upsert" ? "saved" : action === "update" ? "updated" : "deleted";
  return `${table.replace(/_/g, " ")} ${actionText}${label ? `: ${label}` : ""}`;
}

function broadcastActivity(log) {
  if (realtimeIgnoredTables.has(log.table_name)) return;
  const payload = `data: ${JSON.stringify(log)}\n\n`;
  for (const res of eventClients) {
    try {
      res.write(payload);
    } catch {
      eventClients.delete(res);
    }
  }
}

async function insertAuditLog({ table, action, actorId, recordId, summary, changes }) {
  if (auditIgnoredTables.has(table)) return;
  const log = {
    id: randomUUID(),
    table_name: table,
    record_id: recordId || null,
    action: action.toUpperCase(),
    actor_id: actorId || null,
    summary,
    changes: changes ? JSON.stringify(changes) : null,
  };

  try {
    await pool.execute(
      `INSERT INTO audit_logs (id, table_name, record_id, action, actor_id, summary, changes)
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
      [log.id, log.table_name, log.record_id, log.action, log.actor_id, log.summary, log.changes || "{}"],
    );
    broadcastActivity({ ...log, changes, created_at: new Date().toISOString() });
  } catch (error) {
    console.warn(`[mysql-api] audit log skipped for ${table}: ${error.message}`);
  }
}

async function runMutation(table, body) {
  assertTable(table);
  const values = Array.isArray(body.values) ? body.values : [body.values];
  const params = [];
  const actorId = getActorId(body);

  if (body.action === "insert" || body.action === "upsert") {
    const inserted = [];
    for (const raw of values) {
      const row = { ...raw };
      row.id ??= randomUUID();
      const columns = Object.keys(row);
      const placeholders = columns.map(() => "?").join(", ");
      const assignments = columns.map((column) => `${quoteIdent(column)} = VALUES(${quoteIdent(column)})`).join(", ");
      const sql = body.action === "upsert"
        ? `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(", ")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${assignments}`
        : `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(", ")}) VALUES (${placeholders})`;
      await pool.execute(sql, columns.map((column) => row[column]));
      inserted.push(row);
      await insertAuditLog({
        table,
        action: body.action,
        actorId,
        recordId: row.id || null,
        summary: summarizeMutation(table, body.action, row),
        changes: row,
      });
    }
    return { data: body.returning ? (body.single ? inserted[0] : inserted) : null };
  }

  const where = buildWhere(body.filters, params);
  if (!where) throw httpError(400, `${body.action} requires at least one filter`);

  if (body.action === "update") {
    const columns = Object.keys(body.values || {});
    const setParams = columns.map((column) => body.values[column]);
    const sql = `UPDATE ${quoteIdent(table)} SET ${columns.map((column) => `${quoteIdent(column)} = ?`).join(", ")}${where}`;
    const [result] = await pool.execute(sql, [...setParams, ...params]);
    await insertAuditLog({
      table,
      action: body.action,
      actorId,
      recordId: getRecordIdFromFilters(body.filters),
      summary: summarizeMutation(table, body.action, body.values),
      changes: { filters: body.filters || [], values: body.values || {}, affectedRows: result.affectedRows || 0 },
    });
    return { data: null };
  }

  if (body.action === "delete") {
    const [result] = await pool.execute(`DELETE FROM ${quoteIdent(table)}${where}`, params);
    await insertAuditLog({
      table,
      action: body.action,
      actorId,
      recordId: getRecordIdFromFilters(body.filters),
      summary: summarizeMutation(table, body.action),
      changes: { filters: body.filters || [], affectedRows: result.affectedRows || 0 },
    });
    return { data: null };
  }

  throw httpError(400, `Unsupported action: ${body.action}`);
}

async function handleAuth(pathname, body) {
  if (pathname === "/api/auth/signup") {
    const id = randomUUID();
    await pool.execute(
      "INSERT INTO app_users (id, email, password) VALUES (?, ?, ?)",
      [id, body.email, body.password || ""],
    );
    await pool.execute(
      `INSERT IGNORE INTO profiles (
        id, user_id, full_name, phone, gender, date_of_birth, address,
        university_id, course_id, branch_id, semester
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        id,
        body.fullName || body.email,
        body.phone || null,
        body.gender || null,
        body.dateOfBirth || null,
        body.address || null,
        body.universityId || null,
        body.courseId || null,
        body.branchId || null,
        body.semester || null,
      ],
    ).catch(() => {});
    return { user: { id, email: body.email }, session: { user: { id, email: body.email } } };
  }

  if (pathname === "/api/auth/signin") {
    const [rows] = await pool.execute("SELECT id, email FROM app_users WHERE email = ? AND password = ? LIMIT 1", [body.email, body.password || ""]);
    if (!rows[0]) throw httpError(401, "Invalid email or password");
    return { user: rows[0], session: { user: rows[0] } };
  }

  return { ok: true };
}

async function handleLegacyGet(url) {
  if (url.pathname === "/api/dashboard-metrics") {
    return { data: await getDashboardMetrics(), count: null };
  }

  if (url.pathname === "/api/universities") {
    return runQuery("universities", { select: "id, name, short_name", orders: [{ column: "name" }] });
  }
  if (url.pathname === "/api/courses") {
    return runQuery("courses", {
      select: "id, university_id, name, total_semesters",
      filters: [{ op: "eq", column: "university_id", value: requiredSearch(url, "universityId") }],
      orders: [{ column: "name" }],
    });
  }
  if (url.pathname === "/api/branches") {
    return runQuery("branches", {
      select: "id, course_id, name, code",
      filters: [{ op: "eq", column: "course_id", value: requiredSearch(url, "courseId") }],
      orders: [{ column: "name" }],
    });
  }
  if (url.pathname === "/api/schemes") {
    return runQuery("schemes", {
      select: "id, branch_id, name, year",
      filters: [{ op: "eq", column: "branch_id", value: requiredSearch(url, "branchId") }],
      orders: [{ column: "year", ascending: false }, { column: "name" }],
    });
  }
  if (url.pathname === "/api/semesters") {
    const result = await runQuery("subjects", {
      select: "semester",
      filters: [{ op: "eq", column: "scheme_id", value: requiredSearch(url, "schemeId") }],
      orders: [{ column: "semester" }],
    });
    return { data: [...new Set(result.data.map((row) => row.semester))], count: null };
  }
  if (url.pathname === "/api/subjects") {
    return runQuery("subjects", {
      select: "id, name, code, semester, description, is_free",
      filters: [
        { op: "eq", column: "scheme_id", value: requiredSearch(url, "schemeId") },
        { op: "eq", column: "semester", value: Number(requiredSearch(url, "semester")) },
      ],
      orders: [{ column: "code" }],
    });
  }
  return null;
}

async function getDashboardMetrics() {
  const realAccountWhere = `
    au.email NOT LIKE '%@educonnect.local'
  `;

  const [[studentCount], [teacherCount], [adminCount], [maintenanceCount], [universityCount], [courseCount], [subjectCount], [assignmentCount], [notesCount], [videoCount], [paperCount], [quizCount], [pendingSubscriptionCount], [deleteRequestCount]] = await Promise.all([
    pool.execute(`SELECT COUNT(DISTINCT ur.user_id) AS count_value FROM user_roles ur JOIN app_users au ON au.id = ur.user_id WHERE ur.role = 'student' AND ${realAccountWhere}`).then(([rows]) => rows),
    pool.execute(`SELECT COUNT(DISTINCT ur.user_id) AS count_value FROM user_roles ur JOIN app_users au ON au.id = ur.user_id WHERE ur.role = 'teacher' AND ${realAccountWhere}`).then(([rows]) => rows),
    pool.execute(`SELECT COUNT(DISTINCT ur.user_id) AS count_value FROM user_roles ur JOIN app_users au ON au.id = ur.user_id WHERE ur.role = 'admin' AND ${realAccountWhere}`).then(([rows]) => rows),
    pool.execute(`SELECT COUNT(DISTINCT ur.user_id) AS count_value FROM user_roles ur JOIN app_users au ON au.id = ur.user_id WHERE ur.role = 'maintenance' AND ${realAccountWhere}`).then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM universities").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM courses").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM subjects").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM teacher_assignments WHERE is_active = TRUE").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM content WHERE content_type = 'notes' AND approval_status = 'approved'").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM content WHERE content_type = 'video' AND approval_status = 'approved'").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM previous_papers").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM quizzes").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM subscriptions WHERE status = 'pending'").then(([rows]) => rows),
    pool.execute("SELECT COUNT(*) AS count_value FROM delete_requests").then(([rows]) => rows),
  ]);

  return {
    students: Number(studentCount?.count_value || 0),
    teachers: Number(teacherCount?.count_value || 0),
    admins: Number(adminCount?.count_value || 0),
    maintenance: Number(maintenanceCount?.count_value || 0),
    universities: Number(universityCount?.count_value || 0),
    courses: Number(courseCount?.count_value || 0),
    subjects: Number(subjectCount?.count_value || 0),
    teacherAssignments: Number(assignmentCount?.count_value || 0),
    uploadedNotes: Number(notesCount?.count_value || 0),
    videoLectures: Number(videoCount?.count_value || 0),
    previousPapers: Number(paperCount?.count_value || 0),
    quizzes: Number(quizCount?.count_value || 0),
    pendingSubscriptions: Number(pendingSubscriptionCount?.count_value || 0),
    deleteRequests: Number(deleteRequestCount?.count_value || 0),
  };
}

function requiredSearch(url, name) {
  const value = url.searchParams.get(name);
  if (!value) throw httpError(400, `Missing required query parameter: ${name}`);
  return value;
}

async function ensureLocalAuthTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS app_users (
      id CHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureTeacherAssignmentsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id CHAR(36) PRIMARY KEY,
      teacher_id CHAR(36) NOT NULL,
      subject_id CHAR(36) NOT NULL,
      assigned_by CHAR(36) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_teacher_assignments_teacher_subject (teacher_id, subject_id),
      INDEX idx_teacher_assignments_teacher (teacher_id),
      INDEX idx_teacher_assignments_subject (subject_id)
    )
  `);
}

async function ensureContentTopicColumns() {
  const [columns] = await pool.execute(
    "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'content' AND column_name = 'syllabus_topic_id'",
  );
  if (!columns[0]?.count_value) {
    await pool.execute("ALTER TABLE content ADD COLUMN syllabus_topic_id CHAR(36) NULL");
  }

  const [indexes] = await pool.execute(
    "SELECT COUNT(*) AS count_value FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'content' AND index_name = 'idx_content_syllabus_topic'",
  );
  if (!indexes[0]?.count_value) {
    await pool.execute("CREATE INDEX idx_content_syllabus_topic ON content (syllabus_topic_id)");
  }
}

async function ensureContentApprovalColumns() {
  const requiredColumns = [
    ["approval_status", "VARCHAR(30) NOT NULL DEFAULT 'approved'"],
    ["reviewed_by", "CHAR(36) NULL"],
    ["reviewed_at", "TIMESTAMP NULL"],
    ["review_notes", "TEXT NULL"],
  ];

  for (const [columnName, columnType] of requiredColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'content' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE content ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }

  const [indexes] = await pool.execute(
    "SELECT COUNT(*) AS count_value FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'content' AND index_name = 'idx_content_approval_status'",
  );
  if (!indexes[0]?.count_value) {
    await pool.execute("CREATE INDEX idx_content_approval_status ON content (approval_status)");
  }
}

async function ensureCourseEnrollmentColumns() {
  const [columns] = await pool.execute(
    "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'course_enrollments' AND column_name = 'progress'",
  );
  if (!columns[0]?.count_value) {
    await pool.execute("ALTER TABLE course_enrollments ADD COLUMN progress INT NOT NULL DEFAULT 0");
  }
}

async function ensureLiveSessionColumns() {
  const requiredColumns = [
    ["meet_link", "TEXT NULL"],
    ["is_live", "BOOLEAN NOT NULL DEFAULT FALSE"],
    ["started_at", "TIMESTAMP NULL"],
    ["ended_at", "TIMESTAMP NULL"],
  ];

  for (const [columnName, columnType] of requiredColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'live_sessions' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE live_sessions ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }
}

async function ensurePreviousPaperColumns() {
  const requiredColumns = [
    ["semester", "INT NOT NULL DEFAULT 1"],
    ["solution_text", "LONGTEXT NULL"],
    ["solution_file_url", "TEXT NULL"],
  ];

  for (const [columnName, columnType] of requiredColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'previous_papers' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE previous_papers ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }
}

async function ensureProfileColumns() {
  const requiredColumns = [
    ["phone", "VARCHAR(20) NULL"],
    ["gender", "VARCHAR(30) NULL"],
    ["date_of_birth", "DATE NULL"],
    ["address", "TEXT NULL"],
    ["university_id", "CHAR(36) NULL"],
    ["course_id", "CHAR(36) NULL"],
    ["branch_id", "CHAR(36) NULL"],
    ["semester", "INT NULL"],
  ];

  for (const [columnName, columnType] of requiredColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'profiles' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE profiles ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }
}

async function ensureSubscriptionColumns() {
  const requiredColumns = [
    ["plan_type", "VARCHAR(50) NOT NULL DEFAULT 'premium'"],
    ["purchased_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP"],
    ["notes", "TEXT NULL"],
    ["activated_by", "CHAR(36) NULL"],
  ];

  for (const [columnName, columnType] of requiredColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'subscriptions' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE subscriptions ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }

  const [uniqueIndexes] = await pool.execute(
    "SELECT COUNT(*) AS count_value FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'subscriptions' AND index_name = 'uq_subscriptions_user_semester'",
  );
  if (!uniqueIndexes[0]?.count_value) {
    try {
      await pool.execute("CREATE UNIQUE INDEX uq_subscriptions_user_semester ON subscriptions (user_id, semester)");
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY") throw error;
      console.warn("[mysql-api] skipped subscriptions unique index because duplicate user/semester rows already exist");
    }
  }
}

async function ensurePaymentsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      subscription_id CHAR(36) NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      payment_method VARCHAR(100) NULL,
      transaction_id VARCHAR(255) NULL,
      payment_status ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
      payment_screenshot_url TEXT NULL,
      paid_at TIMESTAMP NULL,
      verified_by CHAR(36) NULL,
      verified_at TIMESTAMP NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_payments_user (user_id),
      INDEX idx_payments_subscription (subscription_id),
      INDEX idx_payments_status (payment_status)
    )
  `);
}

async function ensureQuizColumns() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS quiz_daily_usage (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      usage_date DATE NOT NULL,
      attempts_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_quiz_daily_usage_user (user_id),
      INDEX idx_quiz_daily_usage_date (usage_date)
    )
  `);

  const quizColumns = [
    ["time_limit_minutes", "INT NOT NULL DEFAULT 30"],
  ];
  for (const [columnName, columnType] of quizColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'quizzes' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE quizzes ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }

  const questionColumns = [
    ["marks", "INT NOT NULL DEFAULT 1"],
  ];
  for (const [columnName, columnType] of questionColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'questions' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE questions ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }

  const attemptColumns = [
    ["total_marks", "INT NULL"],
    ["submitted_at", "TIMESTAMP NULL"],
  ];
  for (const [columnName, columnType] of attemptColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'quiz_attempts' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE quiz_attempts ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }

  const usageColumns = [
    ["quiz_date", "DATE NULL"],
    ["questions_attempted", "INT NOT NULL DEFAULT 0"],
    ["usage_date", "DATE NULL"],
    ["attempts_count", "INT NOT NULL DEFAULT 0"],
  ];
  for (const [columnName, columnType] of usageColumns) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'quiz_daily_usage' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE quiz_daily_usage ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }
}

async function ensureAuditLogsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id CHAR(36) PRIMARY KEY,
      table_name VARCHAR(100) NOT NULL,
      record_id CHAR(36) NULL,
      action VARCHAR(30) NOT NULL,
      actor_id CHAR(36) NULL,
      summary TEXT NULL,
      changes JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_logs_table (table_name),
      INDEX idx_audit_logs_actor (actor_id),
      INDEX idx_audit_logs_created_at (created_at)
    )
  `);
}

async function ensureHierarchyRequestColumns() {
  const columnsToAdd = [
    ["notes", "TEXT NULL"],
    ["review_notes", "TEXT NULL"],
  ];

  for (const [columnName, columnType] of columnsToAdd) {
    const [columns] = await pool.execute(
      "SELECT COUNT(*) AS count_value FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'hierarchy_requests' AND column_name = ?",
      [columnName],
    );
    if (!columns[0]?.count_value) {
      await pool.execute(`ALTER TABLE hierarchy_requests ADD COLUMN ${quoteIdent(columnName)} ${columnType}`);
    }
  }
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

async function handleUpload(body) {
  if (!body.bucket || !body.filePath || !body.dataUrl) throw httpError(400, "Missing upload payload");
  if (!/^[A-Za-z0-9_-]+$/.test(body.bucket)) throw httpError(400, "Invalid bucket");
  const safeFilePath = String(body.filePath).replace(/\\/g, "/");
  if (safeFilePath.includes("..") || safeFilePath.startsWith("/")) throw httpError(400, "Invalid file path");

  const match = String(body.dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw httpError(400, "Invalid file data");

  const targetDir = path.join(rootDir, "public", "uploads", body.bucket, path.dirname(safeFilePath));
  await fs.promises.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(rootDir, "public", "uploads", body.bucket, safeFilePath);
  await fs.promises.writeFile(targetPath, Buffer.from(match[2], "base64"));
  return { path: `${body.bucket}/${safeFilePath}`, publicUrl: `/uploads/${body.bucket}/${safeFilePath}` };
}

function localTutorReply(messages = []) {
  const last = String(messages[messages.length - 1]?.content || "").toLowerCase();
  if (last.includes("dbms")) {
    return "DBMS means Database Management System. In your syllabus, start from DBMS advantages, data independence, schemas, ER model, keys, and then relational model/SQL. Open the mapped DBMS topic in the LMS player for notes, videos, and PYQs together.";
  }
  if (last.includes("c program") || last.includes("structure")) {
    return "A C program usually contains header files, global declarations, the `main()` function, local declarations, statements, and a return statement. In EduConnect, open MCA 101 -> Unit 1 -> Structure of a C program to see the exact notes and timestamped video.";
  }
  if (last.includes("quiz")) {
    return "Quiz rule: the first 15 quiz attempts are free. After that, students need an active course subscription to unlock up to 50 quiz attempts and premium resources.";
  }
  if (last.includes("subscription") || last.includes("payment")) {
    return "For subscription, a student submits payment details and screenshot. Admin verifies the request. Once approved, premium course resources and extended quiz access become available.";
  }
  if (last.includes("teacher")) {
    return "Teachers can upload notes, PDFs, video links, PYQs, create quizzes, and schedule live classes only for subjects assigned by the admin.";
  }
  return "I can help with syllabus topics, notes, videos, quizzes, subscriptions, and EduConnect workflows. For full AI answers, add an AI API key in `.env`; until then I am running in local tutor mode.";
}

async function handleChat(body) {
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!messages.length) throw httpError(400, "No messages provided");

  if (!apiKey) {
    return {
      content: localTutorReply(messages),
      mode: "local",
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are EduConnect AI, a concise tutor for a university ERP + LMS. Help students understand syllabus topics, notes, videos, quizzes, PYQs, and course workflows. Keep answers practical and student-friendly.",
        },
        ...messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: String(message.content || "").slice(0, 4000),
        })),
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw httpError(response.status, payload.error?.message || "AI service error");
  }

  return {
    content: payload.choices?.[0]?.message?.content || "I could not generate a response.",
    mode: "ai",
  };
}

function sendJson(res, statusCode, payload) {
  const requestOrigin = res.req?.headers?.origin;
  const allowOrigin = requestOrigin && (
    allowedOrigins.has(requestOrigin) ||
    /^http:\/\/192\.168\.\d+\.\d+:808\d$/.test(requestOrigin)
  ) ? requestOrigin : frontendOrigin;

  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(payload));
}

function sendEventStream(req, res) {
  const requestOrigin = req.headers.origin;
  const allowOrigin = requestOrigin && (
    allowedOrigins.has(requestOrigin) ||
    /^http:\/\/192\.168\.\d+\.\d+:808\d$/.test(requestOrigin)
  ) ? requestOrigin : frontendOrigin;

  res.writeHead(200, {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, connected_at: new Date().toISOString() })}\n\n`);
  eventClients.add(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    } catch {
      clearInterval(keepAlive);
      eventClients.delete(res);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    eventClients.delete(res);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, null);
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") return sendJson(res, 200, { ok: true });
    if (req.method === "GET" && url.pathname === "/api/events") return sendEventStream(req, res);
    if (req.method === "GET") {
      const legacyResult = await handleLegacyGet(url);
      if (legacyResult) return sendJson(res, 200, legacyResult.data);
    }
    if (req.method === "POST" && url.pathname.startsWith("/api/auth/")) {
      return sendJson(res, 200, { data: await handleAuth(url.pathname, await readJson(req)), error: null });
    }
    if (req.method === "POST" && url.pathname === "/api/upload") {
      return sendJson(res, 200, { data: await handleUpload(await readJson(req)), error: null });
    }
    if (req.method === "POST" && url.pathname === "/api/chat") {
      return sendJson(res, 200, { data: await handleChat(await readJson(req)), error: null });
    }
    if (req.method === "POST" && url.pathname.startsWith("/api/db/")) {
      const [, , , table, operation] = url.pathname.split("/");
      const body = await readJson(req);
      const result = operation === "mutate" ? await runMutation(table, body) : await runQuery(table, body);
      return sendJson(res, 200, { ...result, error: null });
    }
    if (req.method === "POST" && url.pathname === "/api/rpc/update_enrollment_progress") {
      return sendJson(res, 200, { data: null, error: null });
    }
    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(`[mysql-api] ${url.pathname} failed`, error);
    sendJson(res, error.statusCode || 500, { data: null, error: error.message || "Internal server error" });
  }
});

server.listen(apiPort, () => {
  console.log(`[mysql-api] listening on http://localhost:${apiPort}`);
});
