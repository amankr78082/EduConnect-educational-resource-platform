USE educonnect_db;

-- Topic-level video mapping for MCA 101.
-- This keeps long course videos useful by opening the relevant timestamped segment.
-- Safe to run multiple times.

SET @teacher_rahul_id = '11111111-1111-4111-8111-111111111111';

CREATE TEMPORARY TABLE IF NOT EXISTS mca101_topic_videos (
  content_id CHAR(36) PRIMARY KEY,
  unit_number INT NOT NULL,
  topic_title VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  video_url TEXT NOT NULL
);

TRUNCATE TABLE mca101_topic_videos;

INSERT INTO mca101_topic_videos
  (content_id, unit_number, topic_title, title, description, video_url)
VALUES
  ('66666666-6666-4666-8666-000000000101', 1, 'Structure of a C program',
   'C Program Structure - Topic Video',
   'Timestamped topic video for the structure of a C program.',
   'https://www.youtube.com/watch?v=KJgsSFOSQv0&start=0&end=760'),
  ('55555555-5555-4555-8555-000000000102', 1, 'Data types, identifiers and keywords',
   'C Data Types, Identifiers and Keywords - Topic Video',
   'Timestamped topic video for C data types, identifiers, variables and keywords.',
   'https://www.youtube.com/watch?v=D4ePj0ill5k&start=0&end=900'),
  ('66666666-6666-4666-8666-000000000103', 1, 'Operators, expressions, casting and precedence',
   'C Operators and Expressions - Topic Video',
   'Timestamped topic video for expressions, operators and precedence in C.',
   'https://www.youtube.com/watch?v=KJgsSFOSQv0&start=760&end=1280'),
  ('66666666-6666-4666-8666-000000000104', 1, 'Control and iteration constructs',
   'C Control Statements and Loops - Topic Video',
   'Timestamped topic video for if-else, switch, loops and iteration.',
   'https://www.youtube.com/watch?v=KJgsSFOSQv0&start=1280&end=2100'),
  ('66666666-6666-4666-8666-000000000105', 1, 'Functions, prototypes and recursion',
   'C Functions and Recursion - Topic Video',
   'Timestamped topic video for functions, prototypes and recursion in C.',
   'https://www.youtube.com/watch?v=KJgsSFOSQv0&start=2100&end=3000'),
  ('66666666-6666-4666-8666-000000000106', 2, 'Arrays and multidimensional arrays',
   'C Arrays and Multidimensional Arrays - Topic Video',
   'Timestamped topic video for arrays and multidimensional arrays.',
   'https://www.youtube.com/watch?v=KJgsSFOSQv0&start=3000&end=3900'),
  ('66666666-6666-4666-8666-000000000108', 2, 'Strings and string operations',
   'C Strings and String Operations - Topic Video',
   'Dedicated topic video for strings, character arrays and common string operations in C.',
   'https://www.youtube.com/watch?v=KJgsSFOSQv0&start=4800&end=5700'),
  ('66666666-6666-4666-8666-000000000107', 2, 'Pointers and pointer arithmetic',
   'C Pointers and Pointer Arithmetic - Topic Video',
   'Timestamped topic video for pointers and pointer arithmetic.',
   'https://www.youtube.com/watch?v=KJgsSFOSQv0&start=3900&end=4800'),
  ('66666666-6666-4666-8666-000000000109', 2, 'Structures, unions and file handling',
   'C Structures, Unions and File Handling - Topic Video',
   'Dedicated topic video for structures, unions and file handling in C.',
   'https://www.youtube.com/watch?v=KJgsSFOSQv0&start=5700&end=7200'),
  ('66666666-6666-4666-8666-000000000110', 3, 'Need for data structures',
   'Need for Data Structures - Topic Video',
   'Topic video explaining why data structures are needed and how they organize data.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=0&end=900'),
  ('66666666-6666-4666-8666-000000000111', 3, 'Algorithm analysis and complexity',
   'Algorithm Analysis and Complexity - Topic Video',
   'Topic video segment for algorithm analysis and basic complexity ideas.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=900&end=1800'),
  ('66666666-6666-4666-8666-000000000112', 3, 'Asymptotic notations',
   'Asymptotic Notations - Topic Video',
   'Topic video segment for growth of functions and asymptotic notation concepts.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=1800&end=2700'),
  ('66666666-6666-4666-8666-000000000113', 4, 'Stack operations and polish notation',
   'Stack Operations and Polish Notation - Topic Video',
   'Topic video segment for stack operations, infix, prefix and postfix expressions.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=10380&end=14100'),
  ('66666666-6666-4666-8666-000000000114', 4, 'Queue, circular queue and operations',
   'Queue and Circular Queue Operations - Topic Video',
   'Topic video segment for queue concepts and implementations.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=17790&end=21600'),
  ('66666666-6666-4666-8666-000000000115', 4, 'Singly, doubly and circular linked lists',
   'Linked Lists - Topic Video',
   'Topic video segment for singly, doubly and circular linked list concepts.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=2100&end=10380'),
  ('66666666-6666-4666-8666-000000000116', 5, 'Binary tree definitions and properties',
   'Binary Tree Definitions and Properties - Topic Video',
   'Topic video segment for binary tree definitions and properties.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=21720&end=25200'),
  ('66666666-6666-4666-8666-000000000117', 5, 'Tree traversals',
   'Tree Traversals - Topic Video',
   'Topic video segment for level order, preorder, inorder and postorder traversal.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=25200&end=29200'),
  ('66666666-6666-4666-8666-000000000118', 5, 'Expression trees, threaded binary trees and heaps',
   'Expression Trees and Heaps - Topic Video',
   'Topic video segment for expression trees, tree variants and heaps.',
   'https://www.youtube.com/watch?v=B31LgI4Y4DQ&start=29200&end=33600');

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
  created_by,
  approval_status
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
  @teacher_rahul_id,
  'approved'
FROM mca101_topic_videos v
JOIN subjects s ON s.code = 'MCA 101'
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
  created_by = VALUES(created_by),
  approval_status = VALUES(approval_status);

DROP TEMPORARY TABLE IF EXISTS mca101_topic_videos;
