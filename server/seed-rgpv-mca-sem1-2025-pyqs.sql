USE educonnect_db;

-- RGPV MCA Semester 1 PYQs for year 2025.
-- PDF files are stored in:
-- public/papers/rgpv/mca/sem1/2025/

SET @mca101 = (SELECT id FROM subjects WHERE code = 'MCA 101' LIMIT 1);
SET @mca102 = (SELECT id FROM subjects WHERE code = 'MCA 102' LIMIT 1);
SET @mca103 = (SELECT id FROM subjects WHERE code = 'MCA 103' LIMIT 1);
SET @mca104 = (SELECT id FROM subjects WHERE code = 'MCA 104' LIMIT 1);
SET @mca105 = (SELECT id FROM subjects WHERE code = 'MCA 105' LIMIT 1);

INSERT INTO previous_papers (
  id, subject_id, title, year, exam_type, file_url, semester, solution_text, solution_file_url, uploaded_by
)
SELECT
  '88888888-8888-4888-8888-000000000101',
  @mca101,
  'MCA 101 Programming in C with Data Structure - 2025 PYQ',
  2025,
  'end_sem',
  '/papers/rgpv/mca/sem1/2025/mca-101-sem1-2025.pdf',
  1,
  NULL,
  NULL,
  NULL
WHERE @mca101 IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  title = VALUES(title),
  year = VALUES(year),
  exam_type = VALUES(exam_type),
  file_url = VALUES(file_url),
  semester = VALUES(semester),
  solution_text = VALUES(solution_text),
  solution_file_url = VALUES(solution_file_url);

INSERT INTO previous_papers (
  id, subject_id, title, year, exam_type, file_url, semester, solution_text, solution_file_url, uploaded_by
)
SELECT
  '88888888-8888-4888-8888-000000000102',
  @mca102,
  'MCA 102 Statistical Mathematics - 2025 PYQ',
  2025,
  'end_sem',
  '/papers/rgpv/mca/sem1/2025/mca-102-sem1-2025.pdf',
  1,
  NULL,
  NULL,
  NULL
WHERE @mca102 IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  title = VALUES(title),
  year = VALUES(year),
  exam_type = VALUES(exam_type),
  file_url = VALUES(file_url),
  semester = VALUES(semester),
  solution_text = VALUES(solution_text),
  solution_file_url = VALUES(solution_file_url);

INSERT INTO previous_papers (
  id, subject_id, title, year, exam_type, file_url, semester, solution_text, solution_file_url, uploaded_by
)
SELECT
  '88888888-8888-4888-8888-000000000103',
  @mca103,
  'MCA 103 Operating System and Architecture - 2025 PYQ',
  2025,
  'end_sem',
  '/papers/rgpv/mca/sem1/2025/mca-103-sem1-2025.pdf',
  1,
  NULL,
  NULL,
  NULL
WHERE @mca103 IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  title = VALUES(title),
  year = VALUES(year),
  exam_type = VALUES(exam_type),
  file_url = VALUES(file_url),
  semester = VALUES(semester),
  solution_text = VALUES(solution_text),
  solution_file_url = VALUES(solution_file_url);

INSERT INTO previous_papers (
  id, subject_id, title, year, exam_type, file_url, semester, solution_text, solution_file_url, uploaded_by
)
SELECT
  '88888888-8888-4888-8888-000000000104',
  @mca104,
  'MCA 104 Information Technology - 2025 PYQ',
  2025,
  'end_sem',
  '/papers/rgpv/mca/sem1/2025/mca-104-sem1-2025.pdf',
  1,
  NULL,
  NULL,
  NULL
WHERE @mca104 IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  title = VALUES(title),
  year = VALUES(year),
  exam_type = VALUES(exam_type),
  file_url = VALUES(file_url),
  semester = VALUES(semester),
  solution_text = VALUES(solution_text),
  solution_file_url = VALUES(solution_file_url);

INSERT INTO previous_papers (
  id, subject_id, title, year, exam_type, file_url, semester, solution_text, solution_file_url, uploaded_by
)
SELECT
  '88888888-8888-4888-8888-000000000105',
  @mca105,
  'MCA 105 Communication Skills - 2025 PYQ',
  2025,
  'end_sem',
  '/papers/rgpv/mca/sem1/2025/mca-105-sem1-2025.pdf',
  1,
  NULL,
  NULL,
  NULL
WHERE @mca105 IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  title = VALUES(title),
  year = VALUES(year),
  exam_type = VALUES(exam_type),
  file_url = VALUES(file_url),
  semester = VALUES(semester),
  solution_text = VALUES(solution_text),
  solution_file_url = VALUES(solution_file_url);
