USE educonnect_db;

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
ON DUPLICATE KEY UPDATE short_name = VALUES(short_name), description = VALUES(description);

SET @rgpv_id = (SELECT id FROM universities WHERE short_name = 'RGPV' OR name = 'Rajiv Gandhi Proudyogiki Vishwavidyalaya' LIMIT 1);

INSERT INTO courses (id, university_id, name, duration_years, total_semesters, description)
VALUES (UUID(), @rgpv_id, 'MCA', 2, 4, 'Master of Computer Applications')
ON DUPLICATE KEY UPDATE duration_years = VALUES(duration_years), total_semesters = VALUES(total_semesters), description = VALUES(description);

SET @mca_course_id = (SELECT id FROM courses WHERE university_id = @rgpv_id AND name = 'MCA' LIMIT 1);

INSERT INTO branches (id, course_id, name, code, description)
VALUES (UUID(), @mca_course_id, 'General', 'GEN', 'MCA General Programme')
ON DUPLICATE KEY UPDATE code = VALUES(code), description = VALUES(description);

SET @mca_branch_id = (SELECT id FROM branches WHERE course_id = @mca_course_id AND name = 'General' LIMIT 1);

INSERT INTO schemes (id, branch_id, name, year, description, is_active)
VALUES (UUID(), @mca_branch_id, '2024 Scheme', 2024, 'RGPV MCA syllabus scheme', 1)
ON DUPLICATE KEY UPDATE year = VALUES(year), description = VALUES(description), is_active = VALUES(is_active);

SET @mca_scheme_id = (SELECT id FROM schemes WHERE branch_id = @mca_branch_id AND name = '2024 Scheme' LIMIT 1);

INSERT INTO subjects (id, scheme_id, name, code, semester, description, is_free)
VALUES
  (UUID(), @mca_scheme_id, 'Data Base Management System', 'MCA 201', 2, 'Database models, ER design, relational algebra, SQL, normalization, storage, indexing and transactions.', 1),
  (UUID(), @mca_scheme_id, 'Computer Network', 'MCA 202', 2, 'Network architecture, transmission media, LAN, WAN, routing, security and application protocols.', 1),
  (UUID(), @mca_scheme_id, 'Software Engineering and UML', 'MCA 203', 2, 'Software process, requirements, design, metrics, testing, maintenance and UML modeling.', 1),
  (UUID(), @mca_scheme_id, 'Algorithm Design', 'MCA 204', 2, 'Linear and non-linear data structures, searching, sorting, graph algorithms and algorithm design strategies.', 0),
  (UUID(), @mca_scheme_id, 'Object Oriented Programming with Java', 'MCA 205', 2, 'Java OOP, inheritance, interfaces, exceptions, multithreading, applets, JSP and Struts basics.', 0),
  (UUID(), @mca_scheme_id, 'Java and OOPS Lab', 'MCA 206', 2, 'Practical Java programs covering OOP, constructors, inheritance, interfaces, loops, arrays and strings.', 0),
  (UUID(), @mca_scheme_id, 'DBMS Lab', 'MCA 207', 2, 'SQL practice on salesmen, customers and orders database with joins, subqueries and aggregate queries.', 0)
ON DUPLICATE KEY UPDATE
  scheme_id = VALUES(scheme_id),
  name = VALUES(name),
  semester = VALUES(semester),
  description = VALUES(description),
  is_free = VALUES(is_free);

SET @mca201 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 201' LIMIT 1);
SET @mca202 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 202' LIMIT 1);
SET @mca203 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 203' LIMIT 1);
SET @mca204 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 204' LIMIT 1);
SET @mca205 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 205' LIMIT 1);
SET @mca206 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 206' LIMIT 1);
SET @mca207 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 207' LIMIT 1);

INSERT INTO units (id, subject_id, unit_number, name, description)
VALUES
  (UUID(), @mca201, 1, 'Introduction and ER Model', 'DBMS approach, data independence, schemas, users, architecture and ER modeling.'),
  (UUID(), @mca201, 2, 'Relational Model and SQL', 'Domains, relations, keys, relational algebra, SQL and relational calculus.'),
  (UUID(), @mca201, 3, 'Normalization and Database Design', 'Good relational design, dependencies and normalization principles.'),
  (UUID(), @mca201, 4, 'Transactions and Concurrency', 'Transaction management, recovery, concurrency control and database integrity.'),
  (UUID(), @mca201, 5, 'Storage, Indexing and Advanced Models', 'File organization, physical storage, indexing, B-tree, network, hierarchical and multimedia databases.'),

  (UUID(), @mca202, 1, 'Network Fundamentals', 'Computer network basics, OSI model, layered architecture and transmission fundamentals.'),
  (UUID(), @mca202, 2, 'LAN and Internetworking', 'Ethernet, token ring, token bus, FDDI, DQDB and internetworking devices.'),
  (UUID(), @mca202, 3, 'WAN and Routing', 'Wide area networks, routing tables, routing types and routing algorithms.'),
  (UUID(), @mca202, 4, 'Transport and Network Security', 'Protocol concepts, flow control, error control, CRC, hamming code and security basics.'),
  (UUID(), @mca202, 5, 'Internet and Application Services', 'DNS, SNMP, email, WWW, virtual terminal protocol and multimedia networking.'),

  (UUID(), @mca203, 1, 'Software Process and Requirements', 'Software engineering paradigms, lifecycle models, SRS and requirement change management.'),
  (UUID(), @mca203, 2, 'Software Design', 'Abstraction, modularity, architecture, cohesion, coupling and detailed design.'),
  (UUID(), @mca203, 3, 'Software Metrics and Quality Assurance', 'Process/product metrics, reliability, software quality assurance and standards.'),
  (UUID(), @mca203, 4, 'Software Testing and Maintenance', 'Testing fundamentals, testing strategies, maintenance types and maintenance reporting.'),
  (UUID(), @mca203, 5, 'UML Modeling', 'Object-oriented analysis and UML modeling for software design.'),

  (UUID(), @mca204, 1, 'Linear Data Structures', 'ADT, stack, queue, circular queue, deque and applications.'),
  (UUID(), @mca204, 2, 'Non-linear Data Structures', 'Trees, binary trees, search trees, heaps, hashing and sorting.'),
  (UUID(), @mca204, 3, 'Graphs', 'Graph representation, traversal, topological sort and shortest path algorithms.'),
  (UUID(), @mca204, 4, 'Algorithm Design Techniques', 'Divide and conquer, greedy method, dynamic programming and backtracking.'),
  (UUID(), @mca204, 5, 'Advanced Algorithm Analysis', 'Complexity classes, optimization problems and NP-completeness overview.'),

  (UUID(), @mca205, 1, 'Java and OOP Fundamentals', 'OOP concepts, Java environment, data types, operators and control statements.'),
  (UUID(), @mca205, 2, 'Classes, Objects and Packages', 'Classes, objects, packages, constructors, arrays, memory allocation and garbage collection.'),
  (UUID(), @mca205, 3, 'Inheritance and Interfaces', 'Inheritance, overriding, dynamic dispatch, abstract classes and interfaces.'),
  (UUID(), @mca205, 4, 'Multithreading, Exceptions and Applets', 'Threads, synchronization, exception handling, applets and applet lifecycle.'),
  (UUID(), @mca205, 5, 'JSP and Struts Framework', 'JSP architecture, JSP lifecycle, scopes, implicit objects, JavaBeans and Struts flow.'),

  (UUID(), @mca206, 1, 'Java Basics Lab', 'Number programs, factorial, maximum, switch and alphabet checks.'),
  (UUID(), @mca206, 2, 'Control Flow and Constructors Lab', 'Loops, Armstrong number, parameterized constructors and inheritance.'),
  (UUID(), @mca206, 3, 'OOP Features Lab', 'Abstract classes, interfaces and hierarchical inheritance.'),
  (UUID(), @mca206, 4, 'Array and String Lab', 'Arrays, array length, strings and character counting.'),
  (UUID(), @mca206, 5, 'JSP and OOP Practice', 'JSP basics and object-oriented Java practice programs.'),

  (UUID(), @mca207, 1, 'Database Creation Lab', 'Create salesmen, customers and orders database tables.'),
  (UUID(), @mca207, 2, 'Basic SQL Query Lab', 'Select, filter, order and display relational data.'),
  (UUID(), @mca207, 3, 'Join Query Lab', 'Join customers, salesmen and orders tables.'),
  (UUID(), @mca207, 4, 'Aggregate and Group Query Lab', 'Use aggregate functions, grouping and daily order totals.'),
  (UUID(), @mca207, 5, 'Subquery and Set Operation Lab', 'Nested queries, union queries and comparison queries.')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

SET @mca201u1 = (SELECT id FROM units WHERE subject_id = @mca201 AND unit_number = 1 LIMIT 1);
SET @mca201u2 = (SELECT id FROM units WHERE subject_id = @mca201 AND unit_number = 2 LIMIT 1);
SET @mca201u3 = (SELECT id FROM units WHERE subject_id = @mca201 AND unit_number = 3 LIMIT 1);
SET @mca201u4 = (SELECT id FROM units WHERE subject_id = @mca201 AND unit_number = 4 LIMIT 1);
SET @mca201u5 = (SELECT id FROM units WHERE subject_id = @mca201 AND unit_number = 5 LIMIT 1);
SET @mca202u1 = (SELECT id FROM units WHERE subject_id = @mca202 AND unit_number = 1 LIMIT 1);
SET @mca202u2 = (SELECT id FROM units WHERE subject_id = @mca202 AND unit_number = 2 LIMIT 1);
SET @mca202u3 = (SELECT id FROM units WHERE subject_id = @mca202 AND unit_number = 3 LIMIT 1);
SET @mca202u4 = (SELECT id FROM units WHERE subject_id = @mca202 AND unit_number = 4 LIMIT 1);
SET @mca202u5 = (SELECT id FROM units WHERE subject_id = @mca202 AND unit_number = 5 LIMIT 1);
SET @mca203u1 = (SELECT id FROM units WHERE subject_id = @mca203 AND unit_number = 1 LIMIT 1);
SET @mca203u2 = (SELECT id FROM units WHERE subject_id = @mca203 AND unit_number = 2 LIMIT 1);
SET @mca203u3 = (SELECT id FROM units WHERE subject_id = @mca203 AND unit_number = 3 LIMIT 1);
SET @mca203u4 = (SELECT id FROM units WHERE subject_id = @mca203 AND unit_number = 4 LIMIT 1);
SET @mca203u5 = (SELECT id FROM units WHERE subject_id = @mca203 AND unit_number = 5 LIMIT 1);
SET @mca204u1 = (SELECT id FROM units WHERE subject_id = @mca204 AND unit_number = 1 LIMIT 1);
SET @mca204u2 = (SELECT id FROM units WHERE subject_id = @mca204 AND unit_number = 2 LIMIT 1);
SET @mca204u3 = (SELECT id FROM units WHERE subject_id = @mca204 AND unit_number = 3 LIMIT 1);
SET @mca204u4 = (SELECT id FROM units WHERE subject_id = @mca204 AND unit_number = 4 LIMIT 1);
SET @mca204u5 = (SELECT id FROM units WHERE subject_id = @mca204 AND unit_number = 5 LIMIT 1);
SET @mca205u1 = (SELECT id FROM units WHERE subject_id = @mca205 AND unit_number = 1 LIMIT 1);
SET @mca205u2 = (SELECT id FROM units WHERE subject_id = @mca205 AND unit_number = 2 LIMIT 1);
SET @mca205u3 = (SELECT id FROM units WHERE subject_id = @mca205 AND unit_number = 3 LIMIT 1);
SET @mca205u4 = (SELECT id FROM units WHERE subject_id = @mca205 AND unit_number = 4 LIMIT 1);
SET @mca205u5 = (SELECT id FROM units WHERE subject_id = @mca205 AND unit_number = 5 LIMIT 1);
SET @mca206u1 = (SELECT id FROM units WHERE subject_id = @mca206 AND unit_number = 1 LIMIT 1);
SET @mca206u2 = (SELECT id FROM units WHERE subject_id = @mca206 AND unit_number = 2 LIMIT 1);
SET @mca206u3 = (SELECT id FROM units WHERE subject_id = @mca206 AND unit_number = 3 LIMIT 1);
SET @mca206u4 = (SELECT id FROM units WHERE subject_id = @mca206 AND unit_number = 4 LIMIT 1);
SET @mca206u5 = (SELECT id FROM units WHERE subject_id = @mca206 AND unit_number = 5 LIMIT 1);
SET @mca207u1 = (SELECT id FROM units WHERE subject_id = @mca207 AND unit_number = 1 LIMIT 1);
SET @mca207u2 = (SELECT id FROM units WHERE subject_id = @mca207 AND unit_number = 2 LIMIT 1);
SET @mca207u3 = (SELECT id FROM units WHERE subject_id = @mca207 AND unit_number = 3 LIMIT 1);
SET @mca207u4 = (SELECT id FROM units WHERE subject_id = @mca207 AND unit_number = 4 LIMIT 1);
SET @mca207u5 = (SELECT id FROM units WHERE subject_id = @mca207 AND unit_number = 5 LIMIT 1);

INSERT INTO syllabus_topics (id, unit_id, title, topic_order)
VALUES
  (UUID(), @mca201u1, 'Advantages of DBMS approach', 1),
  (UUID(), @mca201u1, 'Data independence, schema and subschema', 2),
  (UUID(), @mca201u1, 'Database languages, transactions and administrator role', 3),
  (UUID(), @mca201u1, 'ER model, keys, weak entities and specialization', 4),
  (UUID(), @mca201u2, 'Domains, relations and relational database', 1),
  (UUID(), @mca201u2, 'Candidate, primary, alternate and foreign keys', 2),
  (UUID(), @mca201u2, 'Relational algebra and SQL structure', 3),
  (UUID(), @mca201u2, 'Joins, views, nested queries and DDL', 4),
  (UUID(), @mca201u3, 'Functional dependencies', 1),
  (UUID(), @mca201u3, 'Normalization and relational design', 2),
  (UUID(), @mca201u3, 'ER schema reduction to tables', 3),
  (UUID(), @mca201u4, 'Transaction states and recovery', 1),
  (UUID(), @mca201u4, 'Concurrency control and integrity', 2),
  (UUID(), @mca201u5, 'Physical storage media and file organization', 1),
  (UUID(), @mca201u5, 'Ordered indices, B-tree and B-plus-tree', 2),
  (UUID(), @mca201u5, 'Network, hierarchical and multimedia databases', 3),

  (UUID(), @mca202u1, 'Computer network introduction', 1),
  (UUID(), @mca202u1, 'Layered architecture and ISO-OSI model', 2),
  (UUID(), @mca202u1, 'Wired, optical and wireless transmission media', 3),
  (UUID(), @mca202u2, 'Ethernet, token ring and token bus', 1),
  (UUID(), @mca202u2, 'FDDI, DQDB and internetworking', 2),
  (UUID(), @mca202u2, 'Repeaters, hubs, bridges, switches, routers and gateways', 3),
  (UUID(), @mca202u3, 'Wide area network routing', 1),
  (UUID(), @mca202u3, 'Dijkstra, Bellman-Ford and Floyd algorithms', 2),
  (UUID(), @mca202u4, 'Parity, CRC and hamming code', 1),
  (UUID(), @mca202u4, 'Sliding window and flow control protocols', 2),
  (UUID(), @mca202u4, 'Network security overview', 3),
  (UUID(), @mca202u5, 'DNS, SNMP, email and WWW', 1),
  (UUID(), @mca202u5, 'Virtual terminal protocol and multimedia', 2),

  (UUID(), @mca203u1, 'Waterfall, spiral and prototype models', 1),
  (UUID(), @mca203u1, 'Requirement elicitation and SRS', 2),
  (UUID(), @mca203u1, 'Project management and requirement change management', 3),
  (UUID(), @mca203u2, 'Abstraction, modularity and software architecture', 1),
  (UUID(), @mca203u2, 'Cohesion, coupling and detailed design', 2),
  (UUID(), @mca203u2, 'Dataflow-oriented design and reuse', 3),
  (UUID(), @mca203u3, 'Software metrics classification', 1),
  (UUID(), @mca203u3, 'Reliability and software quality assurance', 2),
  (UUID(), @mca203u4, 'Black box and white box testing', 1),
  (UUID(), @mca203u4, 'Regression, system, functional and structural testing', 2),
  (UUID(), @mca203u4, 'Software maintenance challenges', 3),
  (UUID(), @mca203u5, 'Use case and class modeling', 1),
  (UUID(), @mca203u5, 'Sequence, activity and component modeling', 2),

  (UUID(), @mca204u1, 'Abstract data types', 1),
  (UUID(), @mca204u1, 'Stack, queue, circular queue and deque', 2),
  (UUID(), @mca204u1, 'Applications of stack and queue', 3),
  (UUID(), @mca204u2, 'Binary trees and traversals', 1),
  (UUID(), @mca204u2, 'AVL, B-tree, splay tree and heaps', 2),
  (UUID(), @mca204u2, 'Hashing and sorting methods', 3),
  (UUID(), @mca204u3, 'Graph representation and traversal', 1),
  (UUID(), @mca204u3, 'Topological sort', 2),
  (UUID(), @mca204u3, 'Shortest path algorithms', 3),
  (UUID(), @mca204u4, 'Divide and conquer', 1),
  (UUID(), @mca204u4, 'Greedy method and dynamic programming', 2),
  (UUID(), @mca204u4, 'Backtracking and branch and bound', 3),
  (UUID(), @mca204u5, 'P, NP and NP-complete problems', 1),
  (UUID(), @mca204u5, 'Approximation and optimization overview', 2),

  (UUID(), @mca205u1, 'OOP concepts and Java environment', 1),
  (UUID(), @mca205u1, 'Class path, data types and operators', 2),
  (UUID(), @mca205u1, 'Control and iterative statements', 3),
  (UUID(), @mca205u2, 'Classes, objects and packages', 1),
  (UUID(), @mca205u2, 'Constructors, this pointer and finalize method', 2),
  (UUID(), @mca205u2, 'Arrays and garbage collection', 3),
  (UUID(), @mca205u3, 'Inheritance and method overriding', 1),
  (UUID(), @mca205u3, 'Abstract classes and interfaces', 2),
  (UUID(), @mca205u4, 'Thread lifecycle and synchronization', 1),
  (UUID(), @mca205u4, 'Exception handling', 2),
  (UUID(), @mca205u4, 'Applet lifecycle and HTML tags for applet', 3),
  (UUID(), @mca205u5, 'JSP architecture and lifecycle', 1),
  (UUID(), @mca205u5, 'JSP scopes and implicit objects', 2),
  (UUID(), @mca205u5, 'Struts architecture and action flow', 3),

  (UUID(), @mca206u1, 'Maximum from given numbers', 1),
  (UUID(), @mca206u1, 'Factorial and digit sum programs', 2),
  (UUID(), @mca206u2, 'Loops and switch statement programs', 1),
  (UUID(), @mca206u2, 'Armstrong and perfect number programs', 2),
  (UUID(), @mca206u3, 'Parameterized constructor', 1),
  (UUID(), @mca206u3, 'Inheritance, abstract class and interface programs', 2),
  (UUID(), @mca206u4, 'Array declaration and display', 1),
  (UUID(), @mca206u4, 'String capital and small letter count', 2),
  (UUID(), @mca206u5, 'JSP and OOP integration practice', 1),

  (UUID(), @mca207u1, 'Create salesmen, customers and orders tables', 1),
  (UUID(), @mca207u2, 'Display customers, salesmen and orders', 1),
  (UUID(), @mca207u2, 'Order by city, name and rating', 2),
  (UUID(), @mca207u3, 'List customers with salesmen names', 1),
  (UUID(), @mca207u3, 'List orders with customer and salesman names', 2),
  (UUID(), @mca207u4, 'Daily order totals', 1),
  (UUID(), @mca207u4, 'Highest rating in each city', 2),
  (UUID(), @mca207u5, 'Nested subquery practice', 1),
  (UUID(), @mca207u5, 'Union query and comparison query practice', 2)
ON DUPLICATE KEY UPDATE topic_order = VALUES(topic_order), description = VALUES(description);

UPDATE subjects
SET scheme_id = @mca_scheme_id, semester = 2
WHERE code IN ('MCA 201', 'MCA 202', 'MCA 203', 'MCA 204', 'MCA 205', 'MCA 206', 'MCA 207');
