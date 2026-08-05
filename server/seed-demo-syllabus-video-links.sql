USE educonnect_db;

-- Adds YouTube video links mapped to existing syllabus topics.
-- Safe to run multiple times.
-- Demo subject teachers:
-- MCA 101 -> Rahul Sharma
-- MCA 201 -> Priya Verma

SET @teacher_rahul_id = '11111111-1111-4111-8111-111111111111';
SET @teacher_priya_id = '11111111-1111-4111-8111-222222222222';

CREATE TEMPORARY TABLE IF NOT EXISTS demo_syllabus_video_links (
  content_id CHAR(36) PRIMARY KEY,
  subject_code VARCHAR(100) NOT NULL,
  unit_number INT NOT NULL,
  topic_title VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  video_url TEXT NOT NULL
);

TRUNCATE TABLE demo_syllabus_video_links;

INSERT INTO demo_syllabus_video_links
  (content_id, subject_code, unit_number, topic_title, title, description, video_url)
VALUES
  (
    '66666666-6666-4666-8666-000000000101',
    'MCA 101',
    1,
    'Structure of a C program',
    'C Program Structure - YouTube Lecture',
    'Mapped video lesson for the basic structure of a C program.',
    'https://www.youtube.com/watch?v=KJgsSFOSQv0'
  ),
  (
    '55555555-5555-4555-8555-000000000102',
    'MCA 101',
    1,
    'Data types, identifiers and keywords',
    'C Data Types, Identifiers and Keywords - YouTube Lecture',
    'Mapped video lesson for C data types, identifiers, variables and keywords.',
    'https://www.youtube.com/watch?v=D4ePj0ill5k'
  ),
  (
    '66666666-6666-4666-8666-000000000103',
    'MCA 101',
    1,
    'Operators, expressions, casting and precedence',
    'C Operators and Expressions - YouTube Lecture',
    'Mapped video lesson for expressions, operators and precedence in C.',
    'https://www.youtube.com/watch?v=KJgsSFOSQv0'
  ),
  (
    '66666666-6666-4666-8666-000000000104',
    'MCA 101',
    1,
    'Control and iteration constructs',
    'C Control Statements and Loops - YouTube Lecture',
    'Mapped video lesson for if-else, switch, loops and iteration.',
    'https://www.youtube.com/watch?v=KJgsSFOSQv0'
  ),
  (
    '66666666-6666-4666-8666-000000000105',
    'MCA 101',
    1,
    'Functions, prototypes and recursion',
    'C Functions and Recursion - YouTube Lecture',
    'Mapped video lesson for functions, prototypes and recursion in C.',
    'https://www.youtube.com/watch?v=KJgsSFOSQv0'
  ),
  (
    '66666666-6666-4666-8666-000000000106',
    'MCA 101',
    2,
    'Arrays and multidimensional arrays',
    'C Arrays and Multidimensional Arrays - YouTube Lecture',
    'Mapped video lesson for arrays and multidimensional arrays.',
    'https://www.youtube.com/watch?v=KJgsSFOSQv0'
  ),
  (
    '66666666-6666-4666-8666-000000000107',
    'MCA 101',
    2,
    'Pointers and pointer arithmetic',
    'C Pointers and Pointer Arithmetic - YouTube Lecture',
    'Mapped video lesson for pointers and pointer arithmetic.',
    'https://www.youtube.com/watch?v=KJgsSFOSQv0'
  ),
  (
    '66666666-6666-4666-8666-000000000201',
    'MCA 201',
    1,
    'Advantages of DBMS approach',
    'DBMS Introduction and Advantages - YouTube Lecture',
    'Mapped video lesson for DBMS introduction and advantages.',
    'https://www.youtube.com/watch?v=HXV3zeQKqGY'
  ),
  (
    '66666666-6666-4666-8666-000000000202',
    'MCA 201',
    1,
    'Data independence, schema and subschema',
    'Data Independence, Schema and Subschema - YouTube Lecture',
    'Mapped video lesson for database architecture and data independence.',
    'https://www.youtube.com/watch?v=HXV3zeQKqGY'
  ),
  (
    '66666666-6666-4666-8666-000000000203',
    'MCA 201',
    1,
    'Database languages, transactions and administrator role',
    'Database Languages and Transactions - YouTube Lecture',
    'Mapped video lesson for DBMS languages, transactions and DBA role.',
    'https://www.youtube.com/watch?v=HXV3zeQKqGY'
  ),
  (
    '66666666-6666-4666-8666-000000000204',
    'MCA 201',
    1,
    'ER model, keys, weak entities and specialization',
    'ER Model, Keys and Weak Entity Sets - YouTube Lecture',
    'Mapped video lesson for ER model, keys and weak entities.',
    'https://www.youtube.com/watch?v=Zgi3mp83iJ4'
  ),
  (
    '66666666-6666-4666-8666-000000000205',
    'MCA 201',
    2,
    'Domains, relations and relational database',
    'Introduction to Relational Data Model - YouTube Lecture',
    'Mapped video lesson for domains, relations and relational databases.',
    'https://www.youtube.com/watch?v=Q45sr5p_NmQ'
  ),
  (
    '55555555-5555-4555-8555-000000000202',
    'MCA 201',
    2,
    'Relational algebra and SQL structure',
    'SQL Structure and Relational Algebra - YouTube Lecture',
    'Mapped video lesson for relational algebra and SQL structure.',
    'https://www.youtube.com/watch?v=HXV3zeQKqGY'
  ),
  (
    '66666666-6666-4666-8666-000000000207',
    'MCA 201',
    2,
    'Joins, views, nested queries and DDL',
    'SQL Joins, Views, Nested Queries and DDL - YouTube Lecture',
    'Mapped video lesson for SQL joins, views, nested queries and DDL.',
    'https://www.youtube.com/watch?v=HXV3zeQKqGY'
  ),
  (
    '66666666-6666-4666-8666-000000000208',
    'MCA 201',
    3,
    'ER schema reduction to tables',
    'ER to Relational Mapping - YouTube Lecture',
    'Mapped video lesson for converting ER schemas into relational tables.',
    'https://www.youtube.com/watch?v=b7hYIhddNho'
  );

INSERT INTO content (
  id,
  subject_id,
  unit_id,
  syllabus_topic_id,
  title,
  description,
  content_type,
  file_url,
  video_url,
  notes_content,
  created_by
)
SELECT
  v.content_id,
  s.id,
  u.id,
  t.id,
  v.title,
  v.description,
  'video',
  NULL,
  v.video_url,
  NULL,
  CASE
    WHEN v.subject_code = 'MCA 101' THEN @teacher_rahul_id
    WHEN v.subject_code = 'MCA 201' THEN @teacher_priya_id
    ELSE @teacher_rahul_id
  END
FROM demo_syllabus_video_links v
JOIN subjects s ON s.code = v.subject_code
JOIN units u ON u.subject_id = s.id AND u.unit_number = v.unit_number
JOIN syllabus_topics t ON t.unit_id = u.id AND t.title = v.topic_title
ON DUPLICATE KEY UPDATE
  subject_id = VALUES(subject_id),
  unit_id = VALUES(unit_id),
  syllabus_topic_id = VALUES(syllabus_topic_id),
  title = VALUES(title),
  description = VALUES(description),
  content_type = VALUES(content_type),
  file_url = VALUES(file_url),
  video_url = VALUES(video_url),
  notes_content = VALUES(notes_content),
  created_by = VALUES(created_by);

DROP TEMPORARY TABLE IF EXISTS demo_syllabus_video_links;
