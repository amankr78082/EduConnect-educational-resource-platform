USE educonnect_db;

-- Demo teacher logins:
-- Rahul Sharma: rahul.teacher@educonnect.local / Teacher@123
-- Priya Verma: priya.teacher@educonnect.local / Teacher@123
-- Anita Singh: anita.teacher@educonnect.local / Teacher@123
-- Vikram Patel: vikram.teacher@educonnect.local / Teacher@123
-- Neha Gupta: neha.teacher@educonnect.local / Teacher@123
-- Suresh Kumar: suresh.teacher@educonnect.local / Teacher@123
-- Meera Joshi: meera.teacher@educonnect.local / Teacher@123
SET @teacher_rahul_id = '11111111-1111-4111-8111-111111111111';
SET @teacher_priya_id = '11111111-1111-4111-8111-222222222222';
SET @teacher_anita_id = '11111111-1111-4111-8111-333333333333';
SET @teacher_vikram_id = '11111111-1111-4111-8111-444444444444';
SET @teacher_neha_id = '11111111-1111-4111-8111-555555555555';
SET @teacher_suresh_id = '11111111-1111-4111-8111-666666666666';
SET @teacher_meera_id = '11111111-1111-4111-8111-777777777777';

INSERT INTO app_users (id, email, password)
VALUES
  (@teacher_rahul_id, 'rahul.teacher@educonnect.local', 'Teacher@123'),
  (@teacher_priya_id, 'priya.teacher@educonnect.local', 'Teacher@123'),
  (@teacher_anita_id, 'anita.teacher@educonnect.local', 'Teacher@123'),
  (@teacher_vikram_id, 'vikram.teacher@educonnect.local', 'Teacher@123'),
  (@teacher_neha_id, 'neha.teacher@educonnect.local', 'Teacher@123'),
  (@teacher_suresh_id, 'suresh.teacher@educonnect.local', 'Teacher@123'),
  (@teacher_meera_id, 'meera.teacher@educonnect.local', 'Teacher@123')
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  password = VALUES(password);

INSERT INTO profiles (id, user_id, full_name, avatar_url)
VALUES
  ('22222222-2222-4222-8222-222222222222', @teacher_rahul_id, 'Rahul Sharma', NULL),
  ('22222222-2222-4222-8222-222222222223', @teacher_priya_id, 'Priya Verma', NULL),
  ('22222222-2222-4222-8222-222222222224', @teacher_anita_id, 'Anita Singh', NULL),
  ('22222222-2222-4222-8222-222222222225', @teacher_vikram_id, 'Vikram Patel', NULL),
  ('22222222-2222-4222-8222-222222222226', @teacher_neha_id, 'Neha Gupta', NULL),
  ('22222222-2222-4222-8222-222222222227', @teacher_suresh_id, 'Suresh Kumar', NULL),
  ('22222222-2222-4222-8222-222222222228', @teacher_meera_id, 'Meera Joshi', NULL)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  avatar_url = VALUES(avatar_url);

INSERT INTO user_roles (id, user_id, role)
VALUES
  ('33333333-3333-4333-8333-333333333333', @teacher_rahul_id, 'teacher'),
  ('33333333-3333-4333-8333-333333333334', @teacher_priya_id, 'teacher'),
  ('33333333-3333-4333-8333-333333333335', @teacher_anita_id, 'teacher'),
  ('33333333-3333-4333-8333-333333333336', @teacher_vikram_id, 'teacher'),
  ('33333333-3333-4333-8333-333333333337', @teacher_neha_id, 'teacher'),
  ('33333333-3333-4333-8333-333333333338', @teacher_suresh_id, 'teacher'),
  ('33333333-3333-4333-8333-333333333339', @teacher_meera_id, 'teacher')
ON DUPLICATE KEY UPDATE
  role = VALUES(role);

SET @mca101_subject_id = (SELECT id FROM subjects WHERE code = 'MCA 101' LIMIT 1);
SET @mca103_subject_id = (SELECT id FROM subjects WHERE code = 'MCA 103' LIMIT 1);
SET @mca201_subject_id = (SELECT id FROM subjects WHERE code = 'MCA 201' LIMIT 1);
SET @mca202_subject_id = (SELECT id FROM subjects WHERE code = 'MCA 202' LIMIT 1);
SET @mca205_subject_id = (SELECT id FROM subjects WHERE code = 'MCA 205' LIMIT 1);
SET @mca301_subject_id = (SELECT id FROM subjects WHERE code = 'MCA 301' LIMIT 1);
SET @mca302_subject_id = (SELECT id FROM subjects WHERE code = 'MCA 302' LIMIT 1);

DELETE FROM teacher_assignments
WHERE teacher_id IN (
  @teacher_rahul_id,
  @teacher_priya_id,
  @teacher_anita_id,
  @teacher_vikram_id,
  @teacher_neha_id,
  @teacher_suresh_id,
  @teacher_meera_id
);

INSERT INTO teacher_assignments (id, teacher_id, subject_id, assigned_by, is_active)
SELECT '44444444-4444-4444-8444-000000000101', @teacher_rahul_id, @mca101_subject_id, NULL, 1
WHERE @mca101_subject_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  assigned_by = VALUES(assigned_by);

INSERT INTO teacher_assignments (id, teacher_id, subject_id, assigned_by, is_active)
SELECT '44444444-4444-4444-8444-000000000103', @teacher_meera_id, @mca103_subject_id, NULL, 1
WHERE @mca103_subject_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  assigned_by = VALUES(assigned_by);

INSERT INTO teacher_assignments (id, teacher_id, subject_id, assigned_by, is_active)
SELECT '44444444-4444-4444-8444-000000000201', @teacher_priya_id, @mca201_subject_id, NULL, 1
WHERE @mca201_subject_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  assigned_by = VALUES(assigned_by);

INSERT INTO teacher_assignments (id, teacher_id, subject_id, assigned_by, is_active)
SELECT '44444444-4444-4444-8444-000000000202', @teacher_vikram_id, @mca202_subject_id, NULL, 1
WHERE @mca202_subject_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  assigned_by = VALUES(assigned_by);

INSERT INTO teacher_assignments (id, teacher_id, subject_id, assigned_by, is_active)
SELECT '44444444-4444-4444-8444-000000000205', @teacher_suresh_id, @mca205_subject_id, NULL, 1
WHERE @mca205_subject_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  assigned_by = VALUES(assigned_by);

INSERT INTO teacher_assignments (id, teacher_id, subject_id, assigned_by, is_active)
SELECT '44444444-4444-4444-8444-000000000301', @teacher_anita_id, @mca301_subject_id, NULL, 1
WHERE @mca301_subject_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  assigned_by = VALUES(assigned_by);

INSERT INTO teacher_assignments (id, teacher_id, subject_id, assigned_by, is_active)
SELECT '44444444-4444-4444-8444-000000000302', @teacher_neha_id, @mca302_subject_id, NULL, 1
WHERE @mca302_subject_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_active = VALUES(is_active),
  assigned_by = VALUES(assigned_by);

SET @mca101_unit1_id = (SELECT u.id FROM units u JOIN subjects s ON s.id = u.subject_id WHERE s.code = 'MCA 101' AND u.unit_number = 1 LIMIT 1);
SET @mca101_topic_program_id = (
  SELECT t.id FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 101' AND u.unit_number = 1 AND t.title = 'Structure of a C program'
  LIMIT 1
);
SET @mca101_topic_datatypes_id = (
  SELECT t.id FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 101' AND u.unit_number = 1 AND t.title = 'Data types, identifiers and keywords'
  LIMIT 1
);

SET @mca201_unit1_id = (SELECT u.id FROM units u JOIN subjects s ON s.id = u.subject_id WHERE s.code = 'MCA 201' AND u.unit_number = 1 LIMIT 1);
SET @mca201_unit2_id = (SELECT u.id FROM units u JOIN subjects s ON s.id = u.subject_id WHERE s.code = 'MCA 201' AND u.unit_number = 2 LIMIT 1);
SET @mca201_topic_er_id = (
  SELECT t.id FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 201' AND u.unit_number = 1 AND t.title = 'ER model, keys, weak entities and specialization'
  LIMIT 1
);
SET @mca201_topic_sql_id = (
  SELECT t.id FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 201' AND u.unit_number = 2 AND t.title = 'Relational algebra and SQL structure'
  LIMIT 1
);

SET @mca301_unit1_id = (SELECT u.id FROM units u JOIN subjects s ON s.id = u.subject_id WHERE s.code = 'MCA 301' AND u.unit_number = 1 LIMIT 1);
SET @mca301_topic_intro_id = (
  SELECT t.id FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 301' AND u.unit_number = 1 AND t.title = 'Data mining motivation and importance'
  LIMIT 1
);

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '55555555-5555-4555-8555-000000000101',
  @mca101_subject_id,
  @mca101_unit1_id,
  @mca101_topic_program_id,
  'Structure of a C Program - Smart Notes',
  'Topic notes mapped to MCA 101 Unit 1.',
  'notes',
  NULL,
  NULL,
  '# Structure of a C Program

## Core Layout
A C program is organized using preprocessor directives, global declarations, functions, and the `main()` function.

```c
#include <stdio.h>

int main() {
    printf("Hello EduConnect");
    return 0;
}
```

## Important Points
- `#include` adds standard library declarations.
- `main()` is the entry point.
- Statements end with semicolon.
- `return 0` indicates successful execution.

## Exam Focus
Practice writing simple programs with input, output, arithmetic expressions, and conditional flow.',
  @teacher_rahul_id
WHERE @mca101_subject_id IS NOT NULL AND @mca101_topic_program_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  unit_id = VALUES(unit_id),
  syllabus_topic_id = VALUES(syllabus_topic_id),
  title = VALUES(title),
  description = VALUES(description),
  content_type = VALUES(content_type),
  notes_content = VALUES(notes_content),
  video_url = VALUES(video_url),
  file_url = VALUES(file_url),
  created_by = VALUES(created_by);

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '55555555-5555-4555-8555-000000000102',
  @mca101_subject_id,
  @mca101_unit1_id,
  @mca101_topic_datatypes_id,
  'C Data Types and Keywords - Video Lecture',
  'Introductory video lecture for data types, identifiers, and keywords.',
  'video',
  NULL,
  'https://www.youtube.com/watch?v=KJgsSFOSQv0',
  NULL,
  @teacher_rahul_id
WHERE @mca101_subject_id IS NOT NULL AND @mca101_topic_datatypes_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  unit_id = VALUES(unit_id),
  syllabus_topic_id = VALUES(syllabus_topic_id),
  title = VALUES(title),
  description = VALUES(description),
  content_type = VALUES(content_type),
  video_url = VALUES(video_url),
  notes_content = VALUES(notes_content),
  file_url = VALUES(file_url),
  created_by = VALUES(created_by);

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '55555555-5555-4555-8555-000000000201',
  @mca201_subject_id,
  @mca201_unit1_id,
  @mca201_topic_er_id,
  'ER Model, Keys and Weak Entities - Smart Notes',
  'DBMS topic notes for ER modeling and key constraints.',
  'notes',
  NULL,
  NULL,
  '# ER Model, Keys and Weak Entities

## Entity Relationship Model
The ER model represents real-world objects as entities, their properties as attributes, and their associations as relationships.

## Keys
- Super key: uniquely identifies a row.
- Candidate key: minimal super key.
- Primary key: selected candidate key.
- Foreign key: creates relationship between relations.

## Weak Entity
A weak entity depends on an owner entity and is identified using a partial key plus owner key.

## Quick Revision
Draw ER diagrams carefully with entity sets, relationship sets, cardinality, participation, and key attributes.',
  @teacher_priya_id
WHERE @mca201_subject_id IS NOT NULL AND @mca201_topic_er_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  unit_id = VALUES(unit_id),
  syllabus_topic_id = VALUES(syllabus_topic_id),
  title = VALUES(title),
  description = VALUES(description),
  content_type = VALUES(content_type),
  notes_content = VALUES(notes_content),
  video_url = VALUES(video_url),
  file_url = VALUES(file_url),
  created_by = VALUES(created_by);

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '55555555-5555-4555-8555-000000000202',
  @mca201_subject_id,
  @mca201_unit2_id,
  @mca201_topic_sql_id,
  'SQL Structure and Relational Algebra - Video Lecture',
  'Mapped DBMS video lesson for SQL and relational algebra basics.',
  'video',
  NULL,
  'https://www.youtube.com/watch?v=HXV3zeQKqGY',
  NULL,
  @teacher_priya_id
WHERE @mca201_subject_id IS NOT NULL AND @mca201_topic_sql_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  unit_id = VALUES(unit_id),
  syllabus_topic_id = VALUES(syllabus_topic_id),
  title = VALUES(title),
  description = VALUES(description),
  content_type = VALUES(content_type),
  video_url = VALUES(video_url),
  notes_content = VALUES(notes_content),
  file_url = VALUES(file_url),
  created_by = VALUES(created_by);

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '55555555-5555-4555-8555-000000000301',
  @mca301_subject_id,
  @mca301_unit1_id,
  @mca301_topic_intro_id,
  'Why Data Mining Matters - Smart Notes',
  'Data Mining introduction notes mapped to MCA 301 Unit 1.',
  'notes',
  NULL,
  NULL,
  '# Why Data Mining Matters

## Meaning
Data mining is the process of discovering useful patterns, relationships, trends, and anomalies from large datasets.

## Why It Is Important
- Helps convert raw data into decisions.
- Supports prediction and classification.
- Finds hidden relationships in business, education, healthcare, and finance.

## Common Tasks
- Classification
- Clustering
- Association rule mining
- Outlier detection
- Prediction

## Exam Focus
Understand the difference between data mining, data warehousing, OLAP, and simple reporting.',
  @teacher_anita_id
WHERE @mca301_subject_id IS NOT NULL AND @mca301_topic_intro_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  unit_id = VALUES(unit_id),
  syllabus_topic_id = VALUES(syllabus_topic_id),
  title = VALUES(title),
  description = VALUES(description),
  content_type = VALUES(content_type),
  notes_content = VALUES(notes_content),
  video_url = VALUES(video_url),
  file_url = VALUES(file_url),
  created_by = VALUES(created_by);
