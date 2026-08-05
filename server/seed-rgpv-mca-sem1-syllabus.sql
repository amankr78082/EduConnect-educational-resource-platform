USE educonnect_db;

-- Proper syllabus indexing layer:
-- University -> Course -> Branch -> Scheme -> Semester -> Subject -> Unit -> Syllabus Topic
CREATE TABLE IF NOT EXISTS syllabus_topics (
  id CHAR(36) PRIMARY KEY,
  unit_id CHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  topic_order INT NOT NULL DEFAULT 0,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_syllabus_topics_unit_title (unit_id, title),
  INDEX idx_syllabus_topics_unit_order (unit_id, topic_order),
  CONSTRAINT fk_syllabus_topics_unit
    FOREIGN KEY (unit_id) REFERENCES units(id)
    ON DELETE CASCADE
);

INSERT INTO universities (id, name, short_name, description)
VALUES (UUID(), 'Rajiv Gandhi Proudyogiki Vishwavidyalaya', 'RGPV', 'State Technological University of Madhya Pradesh')
ON DUPLICATE KEY UPDATE
  short_name = VALUES(short_name),
  description = VALUES(description);

SET @rgpv_id = (
  SELECT id FROM universities
  WHERE short_name = 'RGPV' OR name = 'Rajiv Gandhi Proudyogiki Vishwavidyalaya'
  LIMIT 1
);

INSERT INTO courses (id, university_id, name, duration_years, total_semesters, description)
VALUES (UUID(), @rgpv_id, 'MCA', 2, 4, 'Master of Computer Applications')
ON DUPLICATE KEY UPDATE
  duration_years = VALUES(duration_years),
  total_semesters = VALUES(total_semesters),
  description = VALUES(description);

SET @mca_course_id = (
  SELECT id FROM courses
  WHERE university_id = @rgpv_id AND name = 'MCA'
  LIMIT 1
);

INSERT INTO branches (id, course_id, name, code, description)
VALUES (UUID(), @mca_course_id, 'General', 'GEN', 'MCA General Programme')
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  description = VALUES(description);

SET @mca_branch_id = (
  SELECT id FROM branches
  WHERE course_id = @mca_course_id AND name = 'General'
  LIMIT 1
);

INSERT INTO schemes (id, branch_id, name, year, description, is_active)
VALUES (UUID(), @mca_branch_id, '2024 Scheme', 2024, 'RGPV MCA syllabus scheme', 1)
ON DUPLICATE KEY UPDATE
  year = VALUES(year),
  description = VALUES(description),
  is_active = VALUES(is_active);

SET @mca_scheme_id = (
  SELECT id FROM schemes
  WHERE branch_id = @mca_branch_id AND name = '2024 Scheme'
  LIMIT 1
);

INSERT INTO subjects (id, scheme_id, name, code, semester, description, is_free)
VALUES
  (UUID(), @mca_scheme_id, 'Programming in C with Data Structure', 'MCA 101', 1, 'C programming fundamentals with core data structures.', 1),
  (UUID(), @mca_scheme_id, 'Statistical Mathematics', 'MCA 102', 1, 'Matrices, calculus, probability, distributions and discrete mathematics.', 1),
  (UUID(), @mca_scheme_id, 'Operating System and Architecture', 'MCA 103', 1, 'Computer organization, processor architecture, operating systems, memory, I/O and file systems.', 1),
  (UUID(), @mca_scheme_id, 'Information Technology', 'MCA 104', 1, 'Communication technology, GIS, information security, AI, IoT, VR, cloud and distributed computing.', 0),
  (UUID(), @mca_scheme_id, 'Communication Skills', 'MCA 105', 1, 'Listening, speaking, reading, writing, group dynamics and interview skills.', 0),
  (UUID(), @mca_scheme_id, 'C and DS Lab', 'MCA 106', 1, 'Practical programs for C programming and data structures.', 0),
  (UUID(), @mca_scheme_id, 'Operating System Lab', 'MCA 107', 1, 'Practical implementation of operating system algorithms.', 0)
ON DUPLICATE KEY UPDATE
  scheme_id = VALUES(scheme_id),
  name = VALUES(name),
  semester = VALUES(semester),
  description = VALUES(description),
  is_free = VALUES(is_free);

SET @mca101 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 101' LIMIT 1);
SET @mca102 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 102' LIMIT 1);
SET @mca103 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 103' LIMIT 1);
SET @mca104 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 104' LIMIT 1);
SET @mca105 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 105' LIMIT 1);
SET @mca106 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 106' LIMIT 1);
SET @mca107 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 107' LIMIT 1);

INSERT INTO units (id, subject_id, unit_number, name, description)
VALUES
  (UUID(), @mca101, 1, 'Fundamentals of C Programming', 'Structure of C program, data types, identifiers, keywords and expressions.'),
  (UUID(), @mca101, 2, 'Arrays, Strings and Pointers', 'Arrays, strings, pointers, dynamic memory and file handling.'),
  (UUID(), @mca101, 3, 'Overview of Data Structures', 'Need, execution time, algorithm complexity and asymptotic analysis.'),
  (UUID(), @mca101, 4, 'Stack, Queue and Linked Lists', 'Stack, queue, list implementation and operations.'),
  (UUID(), @mca101, 5, 'Trees', 'Binary trees, traversals, expression trees, threaded trees, forests and heaps.'),

  (UUID(), @mca102, 1, 'Matrices and Eigenvalue Problems', 'Rank, consistency, eigenvalues, eigenvectors and matrix theorems.'),
  (UUID(), @mca102, 2, 'Calculus', 'Single and multiple variable calculus, limits, continuity and differentiability.'),
  (UUID(), @mca102, 3, 'Testing of Hypothesis', 'Sampling distributions and tests for mean, variance and proportion.'),
  (UUID(), @mca102, 4, 'Probability and Probability Distribution', 'Probability laws, PMF, PDF and common distributions.'),
  (UUID(), @mca102, 5, 'Discrete Mathematics', 'Sets, counting, proof techniques, logic and graph basics.'),

  (UUID(), @mca103, 1, 'Computer Organization Fundamentals', 'Register transfer language, buses, ALU, control unit and micro-operations.'),
  (UUID(), @mca103, 2, 'Processor Architecture and OS Introduction', 'Instruction cycle, 8086 architecture, OS evolution, process and scheduling.'),
  (UUID(), @mca103, 3, 'Memory Management', 'Swapping, paging, page replacement, segmentation and virtual memory.'),
  (UUID(), @mca103, 4, 'Process Synchronization and Deadlocks', 'Semaphores, monitors, classical synchronization problems and deadlock handling.'),
  (UUID(), @mca103, 5, 'File System and I/O Management', 'Files, directories, protection, I/O hardware/software and disk scheduling.'),

  (UUID(), @mca104, 1, 'Communication Technology and GIS', 'CDMA, WLL, GSM, Wi-Fi, VOIP, radar, fiber optics, ISDN and GIS.'),
  (UUID(), @mca104, 2, 'Information Security and Mobile Commerce', 'Cryptography, digital signature, firewall, authentication, M-commerce and digital marketing.'),
  (UUID(), @mca104, 3, 'Artificial Intelligence', 'Machine learning, neural networks, robotics, NLP, expert systems and fuzzy logic.'),
  (UUID(), @mca104, 4, 'Internet of Things and Virtual Reality', 'IoT design, automation, industry applications, VR and embedded systems.'),
  (UUID(), @mca104, 5, 'Distributed and Cloud Computing', 'Centralized/distributed computing, cluster, grid, cloud services and deployment models.'),

  (UUID(), @mca105, 1, 'Listening and Speaking Skills', 'Listening barriers, listening improvement, paralanguage and presentations.'),
  (UUID(), @mca105, 2, 'Reading and Writing Skills', 'Reading strategies, paragraphs, essays, reports, letters, notices and minutes.'),
  (UUID(), @mca105, 3, 'Modes of Communication', 'Interpersonal skills, negotiation skills, non-verbal communication and etiquette.'),
  (UUID(), @mca105, 4, 'Group Dynamics', 'Group discussion, team building, leadership and decision making.'),
  (UUID(), @mca105, 5, 'Interview Skills', 'Interview types, CV preparation, mock interview and quick tips.'),

  (UUID(), @mca106, 1, 'C Programming Basics Lab', 'Programs using control and iterative structures.'),
  (UUID(), @mca106, 2, 'Array and String Lab', 'Array manipulation and string manipulation programs.'),
  (UUID(), @mca106, 3, 'Stack and Queue Lab', 'Stack, queue and linked-list based implementations.'),
  (UUID(), @mca106, 4, 'Linked List and Dynamic Memory Lab', 'Linked lists, dynamic allocation and file handling.'),
  (UUID(), @mca106, 5, 'Tree Lab', 'Tree implementation practice.'),

  (UUID(), @mca107, 1, 'CPU Scheduling Lab', 'FCFS, SJF, Round Robin and Priority scheduling.'),
  (UUID(), @mca107, 2, 'File and Memory Allocation Lab', 'Sequential, indexed, linked allocation and memory allocation strategies.'),
  (UUID(), @mca107, 3, 'Disk Scheduling and Page Replacement Lab', 'Disk scheduling and page replacement algorithms.'),
  (UUID(), @mca107, 4, 'Synchronization Lab', 'Producer-consumer and dining philosophers problems.'),
  (UUID(), @mca107, 5, 'Operating System Simulation Practice', 'Additional OS simulation exercises.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

SET @mca101u1 = (SELECT id FROM units WHERE subject_id = @mca101 AND unit_number = 1 LIMIT 1);
SET @mca101u2 = (SELECT id FROM units WHERE subject_id = @mca101 AND unit_number = 2 LIMIT 1);
SET @mca101u3 = (SELECT id FROM units WHERE subject_id = @mca101 AND unit_number = 3 LIMIT 1);
SET @mca101u4 = (SELECT id FROM units WHERE subject_id = @mca101 AND unit_number = 4 LIMIT 1);
SET @mca101u5 = (SELECT id FROM units WHERE subject_id = @mca101 AND unit_number = 5 LIMIT 1);

SET @mca102u1 = (SELECT id FROM units WHERE subject_id = @mca102 AND unit_number = 1 LIMIT 1);
SET @mca102u2 = (SELECT id FROM units WHERE subject_id = @mca102 AND unit_number = 2 LIMIT 1);
SET @mca102u3 = (SELECT id FROM units WHERE subject_id = @mca102 AND unit_number = 3 LIMIT 1);
SET @mca102u4 = (SELECT id FROM units WHERE subject_id = @mca102 AND unit_number = 4 LIMIT 1);
SET @mca102u5 = (SELECT id FROM units WHERE subject_id = @mca102 AND unit_number = 5 LIMIT 1);

SET @mca103u1 = (SELECT id FROM units WHERE subject_id = @mca103 AND unit_number = 1 LIMIT 1);
SET @mca103u2 = (SELECT id FROM units WHERE subject_id = @mca103 AND unit_number = 2 LIMIT 1);
SET @mca103u3 = (SELECT id FROM units WHERE subject_id = @mca103 AND unit_number = 3 LIMIT 1);
SET @mca103u4 = (SELECT id FROM units WHERE subject_id = @mca103 AND unit_number = 4 LIMIT 1);
SET @mca103u5 = (SELECT id FROM units WHERE subject_id = @mca103 AND unit_number = 5 LIMIT 1);

SET @mca104u1 = (SELECT id FROM units WHERE subject_id = @mca104 AND unit_number = 1 LIMIT 1);
SET @mca104u2 = (SELECT id FROM units WHERE subject_id = @mca104 AND unit_number = 2 LIMIT 1);
SET @mca104u3 = (SELECT id FROM units WHERE subject_id = @mca104 AND unit_number = 3 LIMIT 1);
SET @mca104u4 = (SELECT id FROM units WHERE subject_id = @mca104 AND unit_number = 4 LIMIT 1);
SET @mca104u5 = (SELECT id FROM units WHERE subject_id = @mca104 AND unit_number = 5 LIMIT 1);

SET @mca105u1 = (SELECT id FROM units WHERE subject_id = @mca105 AND unit_number = 1 LIMIT 1);
SET @mca105u2 = (SELECT id FROM units WHERE subject_id = @mca105 AND unit_number = 2 LIMIT 1);
SET @mca105u3 = (SELECT id FROM units WHERE subject_id = @mca105 AND unit_number = 3 LIMIT 1);
SET @mca105u4 = (SELECT id FROM units WHERE subject_id = @mca105 AND unit_number = 4 LIMIT 1);
SET @mca105u5 = (SELECT id FROM units WHERE subject_id = @mca105 AND unit_number = 5 LIMIT 1);

SET @mca106u1 = (SELECT id FROM units WHERE subject_id = @mca106 AND unit_number = 1 LIMIT 1);
SET @mca106u2 = (SELECT id FROM units WHERE subject_id = @mca106 AND unit_number = 2 LIMIT 1);
SET @mca106u3 = (SELECT id FROM units WHERE subject_id = @mca106 AND unit_number = 3 LIMIT 1);
SET @mca106u4 = (SELECT id FROM units WHERE subject_id = @mca106 AND unit_number = 4 LIMIT 1);
SET @mca106u5 = (SELECT id FROM units WHERE subject_id = @mca106 AND unit_number = 5 LIMIT 1);

SET @mca107u1 = (SELECT id FROM units WHERE subject_id = @mca107 AND unit_number = 1 LIMIT 1);
SET @mca107u2 = (SELECT id FROM units WHERE subject_id = @mca107 AND unit_number = 2 LIMIT 1);
SET @mca107u3 = (SELECT id FROM units WHERE subject_id = @mca107 AND unit_number = 3 LIMIT 1);
SET @mca107u4 = (SELECT id FROM units WHERE subject_id = @mca107 AND unit_number = 4 LIMIT 1);
SET @mca107u5 = (SELECT id FROM units WHERE subject_id = @mca107 AND unit_number = 5 LIMIT 1);

INSERT INTO syllabus_topics (id, unit_id, title, topic_order)
VALUES
  (UUID(), @mca101u1, 'Structure of a C program', 1),
  (UUID(), @mca101u1, 'Data types, identifiers and keywords', 2),
  (UUID(), @mca101u1, 'Operators, expressions, casting and precedence', 3),
  (UUID(), @mca101u1, 'Control and iteration constructs', 4),
  (UUID(), @mca101u1, 'Functions, prototypes and recursion', 5),
  (UUID(), @mca101u2, 'Arrays and multidimensional arrays', 1),
  (UUID(), @mca101u2, 'Strings and string operations', 2),
  (UUID(), @mca101u2, 'Pointers and pointer arithmetic', 3),
  (UUID(), @mca101u2, 'Structures, unions and file handling', 4),
  (UUID(), @mca101u3, 'Need for data structures', 1),
  (UUID(), @mca101u3, 'Algorithm analysis and complexity', 2),
  (UUID(), @mca101u3, 'Asymptotic notations', 3),
  (UUID(), @mca101u4, 'Stack operations and polish notation', 1),
  (UUID(), @mca101u4, 'Queue, circular queue and operations', 2),
  (UUID(), @mca101u4, 'Singly, doubly and circular linked lists', 3),
  (UUID(), @mca101u5, 'Binary tree definitions and properties', 1),
  (UUID(), @mca101u5, 'Tree traversals', 2),
  (UUID(), @mca101u5, 'Expression trees, threaded binary trees and heaps', 3),

  (UUID(), @mca102u1, 'Rank and consistency of linear equations', 1),
  (UUID(), @mca102u1, 'Row-reduced echelon form', 2),
  (UUID(), @mca102u1, 'Eigenvalues and eigenvectors', 3),
  (UUID(), @mca102u1, 'Cayley-Hamilton theorem and inverse of matrix', 4),
  (UUID(), @mca102u2, 'Limits, continuity and differentiability', 1),
  (UUID(), @mca102u2, 'Mean value theorems and L Hospital rule', 2),
  (UUID(), @mca102u2, 'Maxima, minima, beta and gamma functions', 3),
  (UUID(), @mca102u2, 'Partial derivatives of multiple variables', 4),
  (UUID(), @mca102u3, 'Sampling distributions', 1),
  (UUID(), @mca102u3, 'Normal, t, chi-square and F tests', 2),
  (UUID(), @mca102u3, 'Testing of mean, variance and proportion', 3),
  (UUID(), @mca102u4, 'Axioms and conditional probability', 1),
  (UUID(), @mca102u4, 'Addition and multiplication laws', 2),
  (UUID(), @mca102u4, 'PMF, PDF, binomial, Poisson and normal distributions', 3),
  (UUID(), @mca102u5, 'Sets, subsets and power sets', 1),
  (UUID(), @mca102u5, 'Counting and countability', 2),
  (UUID(), @mca102u5, 'Proof techniques and propositional logic', 3),
  (UUID(), @mca102u5, 'Graphs, trees and maximum flow concepts', 4),

  (UUID(), @mca103u1, 'Register transfer language and bus concepts', 1),
  (UUID(), @mca103u1, 'Data movement among registers and memory', 2),
  (UUID(), @mca103u1, 'ALU and control unit design', 3),
  (UUID(), @mca103u2, 'Instruction format, addressing modes and instruction cycle', 1),
  (UUID(), @mca103u2, '8086 pin diagram and architecture', 2),
  (UUID(), @mca103u2, 'Operating system evolution and types', 3),
  (UUID(), @mca103u2, 'Process concept and scheduling algorithms', 4),
  (UUID(), @mca103u3, 'Swapping and paging', 1),
  (UUID(), @mca103u3, 'Page replacement algorithms', 2),
  (UUID(), @mca103u3, 'Segmentation and segmented paging', 3),
  (UUID(), @mca103u4, 'Mutual exclusion and semaphores', 1),
  (UUID(), @mca103u4, 'Classical synchronization problems', 2),
  (UUID(), @mca103u4, 'Deadlock detection, prevention and avoidance', 3),
  (UUID(), @mca103u5, 'File systems and directories', 1),
  (UUID(), @mca103u5, 'I/O devices, drivers and device controllers', 2),
  (UUID(), @mca103u5, 'Disk hardware and disk scheduling algorithms', 3),

  (UUID(), @mca104u1, 'CDMA, WLL, GSM, Wi-Fi and VOIP', 1),
  (UUID(), @mca104u1, 'Microwave, satellite, radar, fiber optics and ISDN', 2),
  (UUID(), @mca104u1, 'GIS components and applications', 3),
  (UUID(), @mca104u2, 'Malicious programs and cryptography', 1),
  (UUID(), @mca104u2, 'Digital signature, firewall and authentication', 2),
  (UUID(), @mca104u2, 'Mobile commerce and digital marketing', 3),
  (UUID(), @mca104u3, 'Machine learning and neural networks', 1),
  (UUID(), @mca104u3, 'Robotics, NLP, expert systems and fuzzy logic', 2),
  (UUID(), @mca104u4, 'IoT characteristics and design', 1),
  (UUID(), @mca104u4, 'Home automation and industry applications', 2),
  (UUID(), @mca104u4, 'Virtual reality and embedded systems', 3),
  (UUID(), @mca104u5, 'Distributed, cluster and grid computing', 1),
  (UUID(), @mca104u5, 'Cloud models, resources and deployment', 2),

  (UUID(), @mca105u1, 'Barriers and approaches to listening', 1),
  (UUID(), @mca105u1, 'Paralanguage, stress and intonation', 2),
  (UUID(), @mca105u1, 'Conversation and presentation skills', 3),
  (UUID(), @mca105u2, 'Reading difficulties and strategies', 1),
  (UUID(), @mca105u2, 'Paragraphs, essays and reports', 2),
  (UUID(), @mca105u2, 'Letters, notices, agenda and minutes', 3),
  (UUID(), @mca105u3, 'Interpersonal and negotiation skills', 1),
  (UUID(), @mca105u3, 'Non-verbal communication and etiquette', 2),
  (UUID(), @mca105u4, 'Group discussion and team work', 1),
  (UUID(), @mca105u4, 'Leadership, decision making and creativity', 2),
  (UUID(), @mca105u5, 'Types of interviews and preparation', 1),
  (UUID(), @mca105u5, 'CV preparation and mock interview tips', 2),

  (UUID(), @mca106u1, 'Control structure programs', 1),
  (UUID(), @mca106u1, 'Iterative structure programs', 2),
  (UUID(), @mca106u2, 'Array manipulation programs', 1),
  (UUID(), @mca106u2, 'String manipulation programs', 2),
  (UUID(), @mca106u3, 'Stack using arrays and linked lists', 1),
  (UUID(), @mca106u3, 'Queue using pointers', 2),
  (UUID(), @mca106u4, 'Linked list using arrays and pointers', 1),
  (UUID(), @mca106u4, 'Dynamic allocation and file handling', 2),
  (UUID(), @mca106u5, 'Tree programs', 1),

  (UUID(), @mca107u1, 'FCFS CPU scheduling', 1),
  (UUID(), @mca107u1, 'SJF CPU scheduling', 2),
  (UUID(), @mca107u1, 'Round Robin CPU scheduling', 3),
  (UUID(), @mca107u1, 'Priority CPU scheduling', 4),
  (UUID(), @mca107u2, 'Sequential, indexed and linked file allocation', 1),
  (UUID(), @mca107u2, 'Worst fit, best fit and first fit memory allocation', 2),
  (UUID(), @mca107u3, 'FCFS, SCAN and C-SCAN disk scheduling', 1),
  (UUID(), @mca107u3, 'FIFO, LRU and LFU page replacement', 2),
  (UUID(), @mca107u4, 'Producer-consumer using semaphores', 1),
  (UUID(), @mca107u4, 'Dining philosophers problem', 2)
ON DUPLICATE KEY UPDATE
  topic_order = VALUES(topic_order),
  description = VALUES(description);
