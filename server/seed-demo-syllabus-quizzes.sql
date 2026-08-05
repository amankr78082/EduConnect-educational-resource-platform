USE educonnect_db;

SET @mca101 := (SELECT id FROM subjects WHERE code = 'MCA 101' ORDER BY created_at DESC LIMIT 1);
SET @mca103 := (SELECT id FROM subjects WHERE code = 'MCA 103' ORDER BY created_at DESC LIMIT 1);
SET @mca201 := (SELECT id FROM subjects WHERE code = 'MCA 201' ORDER BY created_at DESC LIMIT 1);
SET @mca202 := (SELECT id FROM subjects WHERE code = 'MCA 202' ORDER BY created_at DESC LIMIT 1);
SET @mca205 := (SELECT id FROM subjects WHERE code = 'MCA 205' ORDER BY created_at DESC LIMIT 1);
SET @mca302 := (SELECT id FROM subjects WHERE code = 'MCA 302' ORDER BY created_at DESC LIMIT 1);

DELETE o FROM options o
JOIN questions q ON q.id = o.question_id
JOIN quizzes z ON z.id = q.quiz_id
WHERE z.title IN (
  'MCA 101 - C Programming Fundamentals Quiz',
  'MCA 103 - Operating System Basics Quiz',
  'MCA 201 - DBMS Unit 1 Quiz',
  'MCA 202 - Computer Network Fundamentals Quiz',
  'MCA 205 - Java OOP Concepts Quiz',
  'MCA 302 - Artificial Intelligence Basics Quiz'
);

DELETE q FROM questions q
JOIN quizzes z ON z.id = q.quiz_id
WHERE z.title IN (
  'MCA 101 - C Programming Fundamentals Quiz',
  'MCA 103 - Operating System Basics Quiz',
  'MCA 201 - DBMS Unit 1 Quiz',
  'MCA 202 - Computer Network Fundamentals Quiz',
  'MCA 205 - Java OOP Concepts Quiz',
  'MCA 302 - Artificial Intelligence Basics Quiz'
);

DELETE FROM quizzes
WHERE title IN (
  'MCA 101 - C Programming Fundamentals Quiz',
  'MCA 103 - Operating System Basics Quiz',
  'MCA 201 - DBMS Unit 1 Quiz',
  'MCA 202 - Computer Network Fundamentals Quiz',
  'MCA 205 - Java OOP Concepts Quiz',
  'MCA 302 - Artificial Intelligence Basics Quiz'
);

SET @quiz_mca101 := UUID();
INSERT INTO quizzes (id, subject_id, title, description, difficulty_level, is_published, time_limit_minutes)
SELECT @quiz_mca101, @mca101, 'MCA 101 - C Programming Fundamentals Quiz',
       'Syllabus-based practice quiz covering C basics, data types, operators and arrays.',
       0, TRUE, 12
WHERE @mca101 IS NOT NULL;

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca101, 'Which symbol is used to terminate most statements in C?', 1, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, ';', TRUE, 1), (UUID(), @q, ':', FALSE, 2), (UUID(), @q, '.', FALSE, 3), (UUID(), @q, ',', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca101, 'Which data type is commonly used to store a single character in C?', 2, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'char', TRUE, 1), (UUID(), @q, 'int', FALSE, 2), (UUID(), @q, 'float', FALSE, 3), (UUID(), @q, 'double', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca101, 'Array indexing in C starts from which value?', 3, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, '0', TRUE, 1), (UUID(), @q, '1', FALSE, 2), (UUID(), @q, '-1', FALSE, 3), (UUID(), @q, 'Depends on compiler', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca101, 'Which operator is used to access the value stored at a pointer address?', 4, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, '*', TRUE, 1), (UUID(), @q, '&', FALSE, 2), (UUID(), @q, '->', FALSE, 3), (UUID(), @q, '.', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca101, 'Which loop executes its body at least once?', 5, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'do-while loop', TRUE, 1), (UUID(), @q, 'for loop', FALSE, 2), (UUID(), @q, 'while loop', FALSE, 3), (UUID(), @q, 'nested loop', FALSE, 4);

SET @quiz_mca103 := UUID();
INSERT INTO quizzes (id, subject_id, title, description, difficulty_level, is_published, time_limit_minutes)
SELECT @quiz_mca103, @mca103, 'MCA 103 - Operating System Basics Quiz',
       'Practice quiz on process, scheduling, memory management and deadlock fundamentals.',
       1, TRUE, 15
WHERE @mca103 IS NOT NULL;

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca103, 'Which component manages process scheduling and memory allocation?', 1, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Operating System', TRUE, 1), (UUID(), @q, 'Compiler', FALSE, 2), (UUID(), @q, 'Assembler', FALSE, 3), (UUID(), @q, 'Web browser', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca103, 'A program in execution is called a:', 2, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Process', TRUE, 1), (UUID(), @q, 'File', FALSE, 2), (UUID(), @q, 'Command', FALSE, 3), (UUID(), @q, 'Directory', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca103, 'Which scheduling algorithm gives CPU to the process with the smallest burst time first?', 3, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Shortest Job First', TRUE, 1), (UUID(), @q, 'FCFS', FALSE, 2), (UUID(), @q, 'Round Robin', FALSE, 3), (UUID(), @q, 'Priority aging', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca103, 'Deadlock can occur when processes wait for resources in a:', 4, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Circular wait', TRUE, 1), (UUID(), @q, 'Linear queue', FALSE, 2), (UUID(), @q, 'Ready state only', FALSE, 3), (UUID(), @q, 'Cache miss', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca103, 'Virtual memory mainly helps in:', 5, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Running programs larger than physical memory', TRUE, 1), (UUID(), @q, 'Increasing CPU clock speed', FALSE, 2), (UUID(), @q, 'Replacing the compiler', FALSE, 3), (UUID(), @q, 'Removing all page faults', FALSE, 4);

SET @quiz_mca201 := UUID();
INSERT INTO quizzes (id, subject_id, title, description, difficulty_level, is_published, time_limit_minutes)
SELECT @quiz_mca201, @mca201, 'MCA 201 - DBMS Unit 1 Quiz',
       'Topic-wise DBMS quiz covering advantages, data independence, ER model and database languages.',
       1, TRUE, 15
WHERE @mca201 IS NOT NULL;

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca201, 'Which is a major advantage of DBMS over file processing systems?', 1, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Reduced redundancy and improved consistency', TRUE, 1), (UUID(), @q, 'No need for security', FALSE, 2), (UUID(), @q, 'Only single-user access', FALSE, 3), (UUID(), @q, 'Data stored without structure', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca201, 'Data independence means:', 2, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Application programs are less affected by data storage changes', TRUE, 1), (UUID(), @q, 'Data is never related', FALSE, 2), (UUID(), @q, 'Database has no schema', FALSE, 3), (UUID(), @q, 'Only admin can read data', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca201, 'Which database language is used to define schema?', 3, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'DDL', TRUE, 1), (UUID(), @q, 'DML', FALSE, 2), (UUID(), @q, 'DCL only', FALSE, 3), (UUID(), @q, 'HTML', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca201, 'In ER modeling, an entity with no primary key of its own is called:', 4, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Weak entity', TRUE, 1), (UUID(), @q, 'Strong entity', FALSE, 2), (UUID(), @q, 'Composite attribute', FALSE, 3), (UUID(), @q, 'Relationship set', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca201, 'A transaction should follow which property set?', 5, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'ACID', TRUE, 1), (UUID(), @q, 'BASE64', FALSE, 2), (UUID(), @q, 'CRUD only', FALSE, 3), (UUID(), @q, 'FIFO', FALSE, 4);

SET @quiz_mca202 := UUID();
INSERT INTO quizzes (id, subject_id, title, description, difficulty_level, is_published, time_limit_minutes)
SELECT @quiz_mca202, @mca202, 'MCA 202 - Computer Network Fundamentals Quiz',
       'Practice quiz for OSI model, protocols, addressing and transmission basics.',
       1, TRUE, 15
WHERE @mca202 IS NOT NULL;

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca202, 'How many layers are there in the OSI reference model?', 1, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, '7', TRUE, 1), (UUID(), @q, '4', FALSE, 2), (UUID(), @q, '5', FALSE, 3), (UUID(), @q, '8', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca202, 'Which protocol is commonly used for reliable transport?', 2, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'TCP', TRUE, 1), (UUID(), @q, 'UDP', FALSE, 2), (UUID(), @q, 'ARP', FALSE, 3), (UUID(), @q, 'ICMP only', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca202, 'IP address works primarily at which OSI layer?', 3, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Network layer', TRUE, 1), (UUID(), @q, 'Physical layer', FALSE, 2), (UUID(), @q, 'Session layer', FALSE, 3), (UUID(), @q, 'Presentation layer', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca202, 'DNS is used to:', 4, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Translate domain names to IP addresses', TRUE, 1), (UUID(), @q, 'Encrypt hard disks', FALSE, 2), (UUID(), @q, 'Compile web pages', FALSE, 3), (UUID(), @q, 'Schedule CPU processes', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca202, 'Which device forwards packets between different networks?', 5, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Router', TRUE, 1), (UUID(), @q, 'Repeater only', FALSE, 2), (UUID(), @q, 'Keyboard', FALSE, 3), (UUID(), @q, 'Monitor', FALSE, 4);

SET @quiz_mca205 := UUID();
INSERT INTO quizzes (id, subject_id, title, description, difficulty_level, is_published, time_limit_minutes)
SELECT @quiz_mca205, @mca205, 'MCA 205 - Java OOP Concepts Quiz',
       'Object-oriented Java quiz covering class, object, inheritance, abstraction and polymorphism.',
       0, TRUE, 12
WHERE @mca205 IS NOT NULL;

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca205, 'Which keyword is used to inherit a class in Java?', 1, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'extends', TRUE, 1), (UUID(), @q, 'implements only', FALSE, 2), (UUID(), @q, 'inherits', FALSE, 3), (UUID(), @q, 'include', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca205, 'Which concept allows one method name to behave differently based on parameters?', 2, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Method overloading', TRUE, 1), (UUID(), @q, 'Encapsulation only', FALSE, 2), (UUID(), @q, 'Garbage collection', FALSE, 3), (UUID(), @q, 'Thread sleep', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca205, 'Which access modifier gives widest visibility?', 3, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'public', TRUE, 1), (UUID(), @q, 'private', FALSE, 2), (UUID(), @q, 'protected', FALSE, 3), (UUID(), @q, 'default', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca205, 'Which method is the entry point of a standard Java application?', 4, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'public static void main(String[] args)', TRUE, 1), (UUID(), @q, 'start()', FALSE, 2), (UUID(), @q, 'runMain()', FALSE, 3), (UUID(), @q, 'init()', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca205, 'Wrapping data and methods into a single unit is called:', 5, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Encapsulation', TRUE, 1), (UUID(), @q, 'Compilation', FALSE, 2), (UUID(), @q, 'Linking', FALSE, 3), (UUID(), @q, 'Parsing', FALSE, 4);

SET @quiz_mca302 := UUID();
INSERT INTO quizzes (id, subject_id, title, description, difficulty_level, is_published, time_limit_minutes)
SELECT @quiz_mca302, @mca302, 'MCA 302 - Artificial Intelligence Basics Quiz',
       'AI quiz covering agents, search, knowledge representation and learning basics.',
       1, TRUE, 15
WHERE @mca302 IS NOT NULL;

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca302, 'An AI agent perceives its environment through:', 1, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Sensors', TRUE, 1), (UUID(), @q, 'Only databases', FALSE, 2), (UUID(), @q, 'Printers', FALSE, 3), (UUID(), @q, 'Compilers', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca302, 'Which search strategy expands the shallowest node first?', 2, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Breadth First Search', TRUE, 1), (UUID(), @q, 'Depth First Search', FALSE, 2), (UUID(), @q, 'Hill climbing only', FALSE, 3), (UUID(), @q, 'Backpropagation', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca302, 'A heuristic function is used to:', 3, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Estimate closeness to goal', TRUE, 1), (UUID(), @q, 'Store passwords', FALSE, 2), (UUID(), @q, 'Compile Java code', FALSE, 3), (UUID(), @q, 'Format documents', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca302, 'Machine learning mainly focuses on:', 4, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Learning patterns from data', TRUE, 1), (UUID(), @q, 'Manual hardware wiring', FALSE, 2), (UUID(), @q, 'Only file compression', FALSE, 3), (UUID(), @q, 'CPU scheduling only', FALSE, 4);

SET @q := UUID();
INSERT INTO questions (id, quiz_id, question_text, question_order, marks) VALUES
(@q, @quiz_mca302, 'Knowledge representation is used to:', 5, 1);
INSERT INTO options (id, question_id, option_text, is_correct, option_order) VALUES
(UUID(), @q, 'Represent facts and rules for reasoning', TRUE, 1), (UUID(), @q, 'Increase monitor brightness', FALSE, 2), (UUID(), @q, 'Delete database schema', FALSE, 3), (UUID(), @q, 'Only draw charts', FALSE, 4);

SELECT z.title, s.code, s.name, COUNT(q.id) AS questions
FROM quizzes z
JOIN subjects s ON s.id = z.subject_id
LEFT JOIN questions q ON q.quiz_id = z.id
WHERE z.title IN (
  'MCA 101 - C Programming Fundamentals Quiz',
  'MCA 103 - Operating System Basics Quiz',
  'MCA 201 - DBMS Unit 1 Quiz',
  'MCA 202 - Computer Network Fundamentals Quiz',
  'MCA 205 - Java OOP Concepts Quiz',
  'MCA 302 - Artificial Intelligence Basics Quiz'
)
GROUP BY z.id, z.title, s.code, s.name
ORDER BY s.code;
