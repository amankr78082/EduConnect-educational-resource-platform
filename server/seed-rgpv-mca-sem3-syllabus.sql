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
  (UUID(), @mca_scheme_id, 'Data Mining', 'MCA 301', 3, 'Data mining concepts, data warehouse, OLAP, data analysis, classification, clustering and association mining.', 1),
  (UUID(), @mca_scheme_id, 'Artificial Intelligence', 'MCA 302', 3, 'AI problems, search, knowledge representation, reasoning and AI applications.', 1),
  (UUID(), @mca_scheme_id, 'Python Programming', 'MCA 303(1)', 3, 'Python interpreter, control flow, functions, strings, lists, dictionaries, files and object-oriented Python.', 1),
  (UUID(), @mca_scheme_id, 'Advanced DBMS', 'MCA 303(2)', 3, 'Object databases, deductive databases, parallel/distributed databases and distributed transactions.', 0),
  (UUID(), @mca_scheme_id, 'Internet Web Technology', 'MCA 303(3)', 3, 'Internet concepts, HTML, CSS, JavaScript, web protocols and web application design.', 0),
  (UUID(), @mca_scheme_id, 'Data Science and Big Data', 'MCA 304(1)', 3, 'Data science process, big data, R analysis, visualization and scalable analytics.', 0),
  (UUID(), @mca_scheme_id, 'Machine Learning', 'MCA 304(2)', 3, 'Machine learning models, regression, optimization, neural networks, CNN and deep learning basics.', 0),
  (UUID(), @mca_scheme_id, 'Soft Computing', 'MCA 304(3)', 3, 'Soft computing, neural networks, fuzzy logic and genetic algorithms.', 0),
  (UUID(), @mca_scheme_id, 'Computer Ethics', 'MCA 305(1)', 3, 'Ethics in IT organizations, computer crime, privacy, social networks and professional responsibility.', 0),
  (UUID(), @mca_scheme_id, 'Internet of Things', 'MCA 305(2)', 3, 'IoT architecture, connected devices, communication protocols, sensing, industrial IoT and applications.', 0),
  (UUID(), @mca_scheme_id, 'Distributed Systems', 'MCA 305(3)', 3, 'Distributed system goals, communication, synchronization, consistency, replication, fault tolerance and distributed files.', 0)
ON DUPLICATE KEY UPDATE
  scheme_id = VALUES(scheme_id),
  name = VALUES(name),
  semester = VALUES(semester),
  description = VALUES(description),
  is_free = VALUES(is_free);

SET @mca301 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 301' LIMIT 1);
SET @mca302 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 302' LIMIT 1);
SET @mca3031 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 303(1)' LIMIT 1);
SET @mca3032 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 303(2)' LIMIT 1);
SET @mca3033 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 303(3)' LIMIT 1);
SET @mca3041 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 304(1)' LIMIT 1);
SET @mca3042 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 304(2)' LIMIT 1);
SET @mca3043 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 304(3)' LIMIT 1);
SET @mca3051 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 305(1)' LIMIT 1);
SET @mca3052 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 305(2)' LIMIT 1);
SET @mca3053 = (SELECT id FROM subjects WHERE scheme_id = @mca_scheme_id AND code = 'MCA 305(3)' LIMIT 1);

INSERT INTO units (id, subject_id, unit_number, name, description)
VALUES
  (UUID(), @mca301, 1, 'Introduction to Data Mining', 'Motivation, data types, data mining functionalities and major data mining issues.'),
  (UUID(), @mca301, 2, 'Data Warehouse and OLAP', 'Operational databases, data warehouses, multidimensional model, warehouse architecture and OLAP.'),
  (UUID(), @mca301, 3, 'Data Preprocessing and Association Mining', 'Data cleaning, transformation and association rule mining.'),
  (UUID(), @mca301, 4, 'Classification and Prediction', 'Classification methods, decision trees, Bayesian classification and prediction.'),
  (UUID(), @mca301, 5, 'Clustering and Advanced Mining', 'Cluster analysis, outlier analysis, evolution analysis and social network mining.'),

  (UUID(), @mca302, 1, 'AI Overview and LISP Basics', 'AI problems, AI techniques, AI applications and LISP programming basics.'),
  (UUID(), @mca302, 2, 'Problem Solving and Search', 'Production systems, control strategies, blind search and heuristic search.'),
  (UUID(), @mca302, 3, 'Knowledge Representation', 'Predicate logic, resolution, semantic networks, frames and conceptual dependency.'),
  (UUID(), @mca302, 4, 'Reasoning and Expert Systems', 'Inference, planning, uncertainty and expert system concepts.'),
  (UUID(), @mca302, 5, 'AI Applications', 'Natural language processing, robotics, learning and AI application areas.'),

  (UUID(), @mca3031, 1, 'Introduction to Python', 'Python interpreter, values, data types, variables, expressions and statements.'),
  (UUID(), @mca3031, 2, 'Control Flow and Functions', 'Conditionals, loops, fruitful functions, scope and recursion.'),
  (UUID(), @mca3031, 3, 'Strings, Lists and Tuples', 'String slicing, methods, lists, tuples and list manipulation.'),
  (UUID(), @mca3031, 4, 'Dictionaries, Files and Modules', 'Dictionaries, file handling, modules and exceptions.'),
  (UUID(), @mca3031, 5, 'Object Oriented Python', 'Classes, objects, inheritance and Python program design.'),

  (UUID(), @mca3032, 1, 'Object and Object Relational Databases', 'Object identity, object modeling, persistence and object relational concepts.'),
  (UUID(), @mca3032, 2, 'Deductive Databases', 'Datalog, recursion, recursive queries and negation.'),
  (UUID(), @mca3032, 3, 'Parallel and Distributed Databases', 'Parallel architectures, partitioning and distributed database design.'),
  (UUID(), @mca3032, 4, 'Distributed Query and Transaction Processing', 'Distributed query processing, optimization, concurrency and commit protocols.'),
  (UUID(), @mca3032, 5, 'Advanced DBMS Case Studies', 'Gemstone, O2, ObjectStore, SQL3, Oracle and DB2 overview.'),

  (UUID(), @mca3033, 1, 'Internet and Web Design Basics', 'Client/server model, Internet, WWW, IP, URL, ISP, DNS and web design principles.'),
  (UUID(), @mca3033, 2, 'HTML and CSS', 'HTML tags, forms, XHTML, meta tags, CSS syntax, selectors and layout properties.'),
  (UUID(), @mca3033, 3, 'JavaScript', 'JavaScript data types, variables, expressions, operators, statements, objects and arrays.'),
  (UUID(), @mca3033, 4, 'DOM and Client Side Scripting', 'Functions, loops, classes, modules, DOM and form validation.'),
  (UUID(), @mca3033, 5, 'Web Application Technologies', 'Web protocols, responsive design and web application concepts.'),

  (UUID(), @mca3041, 1, 'Introduction to Data Science and Big Data', 'Data science process, EDA, big data definitions, risks and structures.'),
  (UUID(), @mca3041, 2, 'Data Analysis Using R', 'Univariate, bivariate and multivariate analysis using R.'),
  (UUID(), @mca3041, 3, 'Visualization and Reporting', 'Bar plot, histogram, box plot, line plot, scatter plot and lattice plot.'),
  (UUID(), @mca3041, 4, 'Big Data Analytics', 'Analytic scalability, modern data analytic tools and advanced analytics.'),
  (UUID(), @mca3041, 5, 'Big Data Tools and Applications', 'Big data processing ecosystem and practical analytics applications.'),

  (UUID(), @mca3042, 1, 'Machine Learning Fundamentals', 'Scope, limitations, probability, statistics, linear algebra and optimization.'),
  (UUID(), @mca3042, 2, 'Supervised and Unsupervised Learning', 'Regression, classification, clustering and model evaluation.'),
  (UUID(), @mca3042, 3, 'Neural Network Basics', 'Artificial neuron, activation functions, gradient descent and backpropagation.'),
  (UUID(), @mca3042, 4, 'Deep Learning', 'CNN, pooling, loss layers, inception networks and transfer learning.'),
  (UUID(), @mca3042, 5, 'Advanced Neural Models', 'RNN, LSTM, GRU, autoencoders and regularization.'),

  (UUID(), @mca3043, 1, 'Soft Computing Overview', 'Soft computing, hard computing and soft computing components.'),
  (UUID(), @mca3043, 2, 'Artificial Neural Networks', 'ANN architecture, perceptron, ADALINE and MADALINE.'),
  (UUID(), @mca3043, 3, 'Unsupervised Neural Networks', 'Hebbian learning, competitive learning and self-organizing maps.'),
  (UUID(), @mca3043, 4, 'Fuzzy Logic', 'Fuzzy sets, membership functions, fuzzy rules and fuzzy inference.'),
  (UUID(), @mca3043, 5, 'Genetic Algorithms', 'Genetic algorithm operations and soft computing applications.'),

  (UUID(), @mca3051, 1, 'Ethics Overview', 'Ethics, morals, laws, integrity and ethics in business.'),
  (UUID(), @mca3051, 2, 'Ethics for IT Organizations', 'Ethical work environment, decision making, contingent workers and outsourcing.'),
  (UUID(), @mca3051, 3, 'Ethics for IT Workers and Users', 'Professional ethics, certification, malpractice and user responsibilities.'),
  (UUID(), @mca3051, 4, 'Computer and Internet Crime', 'Security incidents, exploits, perpetrators and trustworthy computing.'),
  (UUID(), @mca3051, 5, 'Social Network Ethics', 'Social networking, advertising, hiring, cyberbullying and privacy issues.'),

  (UUID(), @mca3052, 1, 'Introduction to IoT', 'IoT definition, characteristics, framework, architecture and applications.'),
  (UUID(), @mca3052, 2, 'IoT Networking and Services', 'M2M, SDN, NFV, IoT data storage and cloud based services.'),
  (UUID(), @mca3052, 3, 'IoT Web Connectivity', 'SOAP, REST, HTTP, WebSockets and Internet connectivity principles.'),
  (UUID(), @mca3052, 4, 'IoT Communication and Sensing', 'IP addressing, media access control, sensors, actuators and participatory sensing.'),
  (UUID(), @mca3052, 5, 'Industrial IoT Applications', 'Industrial IoT, automotive IoT and IoT application design.'),

  (UUID(), @mca3053, 1, 'Distributed System Introduction', 'Goals, hardware/software concepts, client/server model and remote invocation.'),
  (UUID(), @mca3053, 2, 'Process and Synchronization', 'Threads, clients, servers, migration, clocks, mutual exclusion and election algorithms.'),
  (UUID(), @mca3053, 3, 'Consistency, Replication and Security', 'Consistency models, replication, fault tolerance, Kerberos and secure sockets.'),
  (UUID(), @mca3053, 4, 'Distributed Objects and Files', 'CORBA, distributed objects and distributed file systems.'),
  (UUID(), @mca3053, 5, 'Distributed Transactions', 'Distributed concurrency control, deadlock, commit protocols and parallel databases.')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

SET @mca301u1 = (SELECT id FROM units WHERE subject_id = @mca301 AND unit_number = 1 LIMIT 1);
SET @mca301u2 = (SELECT id FROM units WHERE subject_id = @mca301 AND unit_number = 2 LIMIT 1);
SET @mca301u3 = (SELECT id FROM units WHERE subject_id = @mca301 AND unit_number = 3 LIMIT 1);
SET @mca301u4 = (SELECT id FROM units WHERE subject_id = @mca301 AND unit_number = 4 LIMIT 1);
SET @mca301u5 = (SELECT id FROM units WHERE subject_id = @mca301 AND unit_number = 5 LIMIT 1);
SET @mca302u1 = (SELECT id FROM units WHERE subject_id = @mca302 AND unit_number = 1 LIMIT 1);
SET @mca302u2 = (SELECT id FROM units WHERE subject_id = @mca302 AND unit_number = 2 LIMIT 1);
SET @mca302u3 = (SELECT id FROM units WHERE subject_id = @mca302 AND unit_number = 3 LIMIT 1);
SET @mca302u4 = (SELECT id FROM units WHERE subject_id = @mca302 AND unit_number = 4 LIMIT 1);
SET @mca302u5 = (SELECT id FROM units WHERE subject_id = @mca302 AND unit_number = 5 LIMIT 1);
SET @mca3031u1 = (SELECT id FROM units WHERE subject_id = @mca3031 AND unit_number = 1 LIMIT 1);
SET @mca3031u2 = (SELECT id FROM units WHERE subject_id = @mca3031 AND unit_number = 2 LIMIT 1);
SET @mca3031u3 = (SELECT id FROM units WHERE subject_id = @mca3031 AND unit_number = 3 LIMIT 1);
SET @mca3031u4 = (SELECT id FROM units WHERE subject_id = @mca3031 AND unit_number = 4 LIMIT 1);
SET @mca3031u5 = (SELECT id FROM units WHERE subject_id = @mca3031 AND unit_number = 5 LIMIT 1);
SET @mca3032u1 = (SELECT id FROM units WHERE subject_id = @mca3032 AND unit_number = 1 LIMIT 1);
SET @mca3032u2 = (SELECT id FROM units WHERE subject_id = @mca3032 AND unit_number = 2 LIMIT 1);
SET @mca3032u3 = (SELECT id FROM units WHERE subject_id = @mca3032 AND unit_number = 3 LIMIT 1);
SET @mca3032u4 = (SELECT id FROM units WHERE subject_id = @mca3032 AND unit_number = 4 LIMIT 1);
SET @mca3032u5 = (SELECT id FROM units WHERE subject_id = @mca3032 AND unit_number = 5 LIMIT 1);
SET @mca3033u1 = (SELECT id FROM units WHERE subject_id = @mca3033 AND unit_number = 1 LIMIT 1);
SET @mca3033u2 = (SELECT id FROM units WHERE subject_id = @mca3033 AND unit_number = 2 LIMIT 1);
SET @mca3033u3 = (SELECT id FROM units WHERE subject_id = @mca3033 AND unit_number = 3 LIMIT 1);
SET @mca3033u4 = (SELECT id FROM units WHERE subject_id = @mca3033 AND unit_number = 4 LIMIT 1);
SET @mca3033u5 = (SELECT id FROM units WHERE subject_id = @mca3033 AND unit_number = 5 LIMIT 1);
SET @mca3041u1 = (SELECT id FROM units WHERE subject_id = @mca3041 AND unit_number = 1 LIMIT 1);
SET @mca3041u2 = (SELECT id FROM units WHERE subject_id = @mca3041 AND unit_number = 2 LIMIT 1);
SET @mca3041u3 = (SELECT id FROM units WHERE subject_id = @mca3041 AND unit_number = 3 LIMIT 1);
SET @mca3041u4 = (SELECT id FROM units WHERE subject_id = @mca3041 AND unit_number = 4 LIMIT 1);
SET @mca3041u5 = (SELECT id FROM units WHERE subject_id = @mca3041 AND unit_number = 5 LIMIT 1);
SET @mca3042u1 = (SELECT id FROM units WHERE subject_id = @mca3042 AND unit_number = 1 LIMIT 1);
SET @mca3042u2 = (SELECT id FROM units WHERE subject_id = @mca3042 AND unit_number = 2 LIMIT 1);
SET @mca3042u3 = (SELECT id FROM units WHERE subject_id = @mca3042 AND unit_number = 3 LIMIT 1);
SET @mca3042u4 = (SELECT id FROM units WHERE subject_id = @mca3042 AND unit_number = 4 LIMIT 1);
SET @mca3042u5 = (SELECT id FROM units WHERE subject_id = @mca3042 AND unit_number = 5 LIMIT 1);
SET @mca3043u1 = (SELECT id FROM units WHERE subject_id = @mca3043 AND unit_number = 1 LIMIT 1);
SET @mca3043u2 = (SELECT id FROM units WHERE subject_id = @mca3043 AND unit_number = 2 LIMIT 1);
SET @mca3043u3 = (SELECT id FROM units WHERE subject_id = @mca3043 AND unit_number = 3 LIMIT 1);
SET @mca3043u4 = (SELECT id FROM units WHERE subject_id = @mca3043 AND unit_number = 4 LIMIT 1);
SET @mca3043u5 = (SELECT id FROM units WHERE subject_id = @mca3043 AND unit_number = 5 LIMIT 1);
SET @mca3051u1 = (SELECT id FROM units WHERE subject_id = @mca3051 AND unit_number = 1 LIMIT 1);
SET @mca3051u2 = (SELECT id FROM units WHERE subject_id = @mca3051 AND unit_number = 2 LIMIT 1);
SET @mca3051u3 = (SELECT id FROM units WHERE subject_id = @mca3051 AND unit_number = 3 LIMIT 1);
SET @mca3051u4 = (SELECT id FROM units WHERE subject_id = @mca3051 AND unit_number = 4 LIMIT 1);
SET @mca3051u5 = (SELECT id FROM units WHERE subject_id = @mca3051 AND unit_number = 5 LIMIT 1);
SET @mca3052u1 = (SELECT id FROM units WHERE subject_id = @mca3052 AND unit_number = 1 LIMIT 1);
SET @mca3052u2 = (SELECT id FROM units WHERE subject_id = @mca3052 AND unit_number = 2 LIMIT 1);
SET @mca3052u3 = (SELECT id FROM units WHERE subject_id = @mca3052 AND unit_number = 3 LIMIT 1);
SET @mca3052u4 = (SELECT id FROM units WHERE subject_id = @mca3052 AND unit_number = 4 LIMIT 1);
SET @mca3052u5 = (SELECT id FROM units WHERE subject_id = @mca3052 AND unit_number = 5 LIMIT 1);
SET @mca3053u1 = (SELECT id FROM units WHERE subject_id = @mca3053 AND unit_number = 1 LIMIT 1);
SET @mca3053u2 = (SELECT id FROM units WHERE subject_id = @mca3053 AND unit_number = 2 LIMIT 1);
SET @mca3053u3 = (SELECT id FROM units WHERE subject_id = @mca3053 AND unit_number = 3 LIMIT 1);
SET @mca3053u4 = (SELECT id FROM units WHERE subject_id = @mca3053 AND unit_number = 4 LIMIT 1);
SET @mca3053u5 = (SELECT id FROM units WHERE subject_id = @mca3053 AND unit_number = 5 LIMIT 1);

INSERT INTO syllabus_topics (id, unit_id, title, topic_order)
VALUES
  (UUID(), @mca301u1, 'Data mining motivation and importance', 1),
  (UUID(), @mca301u1, 'Data types and data mining functionalities', 2),
  (UUID(), @mca301u1, 'Classification of data mining systems', 3),
  (UUID(), @mca301u2, 'Data warehouse versus operational database', 1),
  (UUID(), @mca301u2, 'Multidimensional data model and OLAP', 2),
  (UUID(), @mca301u2, 'Data cube technology', 3),
  (UUID(), @mca301u3, 'Data preprocessing and transformation', 1),
  (UUID(), @mca301u3, 'Association analysis', 2),
  (UUID(), @mca301u4, 'Classification and prediction', 1),
  (UUID(), @mca301u4, 'Decision tree and Bayesian classification', 2),
  (UUID(), @mca301u5, 'Cluster and outlier analysis', 1),
  (UUID(), @mca301u5, 'Evolution and social network mining', 2),

  (UUID(), @mca302u1, 'AI problems and AI techniques', 1),
  (UUID(), @mca302u1, 'Characteristics of AI applications', 2),
  (UUID(), @mca302u1, 'LISP syntax and basic functions', 3),
  (UUID(), @mca302u2, 'Production systems and control strategies', 1),
  (UUID(), @mca302u2, 'Depth-first and breadth-first search', 2),
  (UUID(), @mca302u2, 'Hill climbing, branch and bound and A star', 3),
  (UUID(), @mca302u2, 'AO star and constraint satisfaction', 4),
  (UUID(), @mca302u3, 'First order predicate calculus', 1),
  (UUID(), @mca302u3, 'Skolemization, resolution and unification', 2),
  (UUID(), @mca302u3, 'Semantic networks, frames and scripts', 3),
  (UUID(), @mca302u4, 'Reasoning under uncertainty', 1),
  (UUID(), @mca302u4, 'Expert system components', 2),
  (UUID(), @mca302u5, 'NLP, robotics and learning applications', 1),

  (UUID(), @mca3031u1, 'Python interpreter and interactive mode', 1),
  (UUID(), @mca3031u1, 'Values, types, variables and expressions', 2),
  (UUID(), @mca3031u1, 'Modules, functions and arguments', 3),
  (UUID(), @mca3031u2, 'Boolean operators and conditionals', 1),
  (UUID(), @mca3031u2, 'While, for, break, continue and pass', 2),
  (UUID(), @mca3031u2, 'Function composition and recursion', 3),
  (UUID(), @mca3031u3, 'String slicing and string methods', 1),
  (UUID(), @mca3031u3, 'Lists, tuples and list operations', 2),
  (UUID(), @mca3031u4, 'Dictionaries and file handling', 1),
  (UUID(), @mca3031u4, 'Modules and exceptions', 2),
  (UUID(), @mca3031u5, 'Classes, objects and inheritance', 1),

  (UUID(), @mca3032u1, 'Object identity and object reference', 1),
  (UUID(), @mca3032u1, 'Object relational architecture and persistence', 2),
  (UUID(), @mca3032u2, 'Datalog and recursive queries', 1),
  (UUID(), @mca3032u2, 'Recursive queries with negation', 2),
  (UUID(), @mca3032u3, 'Shared nothing, shared disk and shared memory architectures', 1),
  (UUID(), @mca3032u3, 'Data partitioning and parallel query evaluation', 2),
  (UUID(), @mca3032u4, 'Distributed query processing and optimization', 1),
  (UUID(), @mca3032u4, 'Distributed concurrency, deadlock and commit protocols', 2),
  (UUID(), @mca3032u5, 'Object database case studies', 1),

  (UUID(), @mca3033u1, 'Internet, WWW, IP, URL, ISP and DNS', 1),
  (UUID(), @mca3033u1, 'Effective web design and responsive design', 2),
  (UUID(), @mca3033u2, 'HTML tags, hyperlinks, tables, images and forms', 1),
  (UUID(), @mca3033u2, 'CSS syntax, class, id, colors and positioning', 2),
  (UUID(), @mca3033u3, 'JavaScript data types, variables and operators', 1),
  (UUID(), @mca3033u3, 'Objects, arrays, functions and loops', 2),
  (UUID(), @mca3033u4, 'DOM and form validation', 1),
  (UUID(), @mca3033u4, 'Classes and modules', 2),
  (UUID(), @mca3033u5, 'Web application technologies', 1),

  (UUID(), @mca3041u1, 'Data science process and EDA', 1),
  (UUID(), @mca3041u1, 'Big data definition, risks and structure', 2),
  (UUID(), @mca3041u2, 'Frequency, mean, median and mode', 1),
  (UUID(), @mca3041u2, 'Variance, standard deviation, skewness and kurtosis', 2),
  (UUID(), @mca3041u2, 'Correlation and regression modeling', 3),
  (UUID(), @mca3041u3, 'Bar plot, histogram and box plot', 1),
  (UUID(), @mca3041u3, 'Line plot, scatter plot and lattice plot', 2),
  (UUID(), @mca3041u4, 'Analytic scalability and modern analytic tools', 1),
  (UUID(), @mca3041u5, 'Big data analytics applications', 1),

  (UUID(), @mca3042u1, 'Regression, probability and statistics for ML', 1),
  (UUID(), @mca3042u1, 'Linear algebra, convex optimization and visualization', 2),
  (UUID(), @mca3042u2, 'Data preprocessing and augmentation', 1),
  (UUID(), @mca3042u2, 'Supervised and unsupervised learning models', 2),
  (UUID(), @mca3042u3, 'Activation functions, weights and bias', 1),
  (UUID(), @mca3042u3, 'Gradient descent and backpropagation', 2),
  (UUID(), @mca3042u4, 'CNN layers, padding, stride and pooling', 1),
  (UUID(), @mca3042u4, 'Inception network and transfer learning', 2),
  (UUID(), @mca3042u5, 'Autoencoders, dropout and regularization', 1),
  (UUID(), @mca3042u5, 'RNN, LSTM and GRU', 2),

  (UUID(), @mca3043u1, 'Soft computing versus hard computing', 1),
  (UUID(), @mca3043u1, 'AI, neural networks, fuzzy logic and genetic algorithms', 2),
  (UUID(), @mca3043u2, 'Biological versus artificial neural networks', 1),
  (UUID(), @mca3043u2, 'McCulloch-Pitts, perceptron, ADALINE and MADALINE', 2),
  (UUID(), @mca3043u3, 'Hebbian and competitive learning', 1),
  (UUID(), @mca3043u3, 'Self-organizing computational maps', 2),
  (UUID(), @mca3043u4, 'Fuzzy sets and membership functions', 1),
  (UUID(), @mca3043u4, 'Fuzzy rules and fuzzy inference', 2),
  (UUID(), @mca3043u5, 'Genetic algorithm operators', 1),

  (UUID(), @mca3051u1, 'Ethics, morals and laws', 1),
  (UUID(), @mca3051u1, 'Integrity and business ethics', 2),
  (UUID(), @mca3051u2, 'Ethical work environment', 1),
  (UUID(), @mca3051u2, 'Outsourcing and contingent workers', 2),
  (UUID(), @mca3051u3, 'Professional codes and certification', 1),
  (UUID(), @mca3051u3, 'IT users and ethical practices', 2),
  (UUID(), @mca3051u4, 'IT security incidents and exploits', 1),
  (UUID(), @mca3051u4, 'Trustworthy computing and risk assessment', 2),
  (UUID(), @mca3051u5, 'Social networking applications and ethics', 1),
  (UUID(), @mca3051u5, 'Cyberbullying, cyberstalking and inappropriate material', 2),

  (UUID(), @mca3052u1, 'IoT definition and characteristics', 1),
  (UUID(), @mca3052u1, 'IoT physical and logical design', 2),
  (UUID(), @mca3052u2, 'M2M, SDN and NFV for IoT', 1),
  (UUID(), @mca3052u2, 'IoT data storage and cloud services', 2),
  (UUID(), @mca3052u3, 'SOAP, REST, HTTP and WebSockets', 1),
  (UUID(), @mca3052u3, 'Internet connectivity principles', 2),
  (UUID(), @mca3052u4, 'IP addressing and media access control', 1),
  (UUID(), @mca3052u4, 'Sensor and actuator technology', 2),
  (UUID(), @mca3052u5, 'Industrial IoT and automotive IoT', 1),

  (UUID(), @mca3053u1, 'Goals and architecture of distributed systems', 1),
  (UUID(), @mca3053u1, 'Client-server model and remote procedure call', 2),
  (UUID(), @mca3053u2, 'Threads, clients, servers and code migration', 1),
  (UUID(), @mca3053u2, 'Clock synchronization, mutual exclusion and election algorithms', 2),
  (UUID(), @mca3053u3, 'Consistency models and replication', 1),
  (UUID(), @mca3053u3, 'Fault tolerance and distributed security', 2),
  (UUID(), @mca3053u4, 'Distributed object based systems', 1),
  (UUID(), @mca3053u4, 'Distributed file systems', 2),
  (UUID(), @mca3053u5, 'Distributed transaction and deadlock control', 1),
  (UUID(), @mca3053u5, 'Commit protocols and parallel databases', 2)
ON DUPLICATE KEY UPDATE topic_order = VALUES(topic_order), description = VALUES(description);

UPDATE subjects
SET scheme_id = @mca_scheme_id, semester = 3
WHERE code IN (
  'MCA 301',
  'MCA 302',
  'MCA 303(1)',
  'MCA 303(2)',
  'MCA 303(3)',
  'MCA 304(1)',
  'MCA 304(2)',
  'MCA 304(3)',
  'MCA 305(1)',
  'MCA 305(2)',
  'MCA 305(3)'
);
