USE educonnect_db;

-- Source PDF copied into the frontend public folder:
-- public/notes/dbms-unit-1-notes.pdf
-- These notes map the DBMS Unit 1 PDF into the existing RGPV MCA 201 syllabus topics.

SET @teacher_priya_id = '11111111-1111-4111-8111-222222222222';
SET @mca201_subject_id = (SELECT id FROM subjects WHERE code = 'MCA 201' LIMIT 1);
SET @mca201_unit1_id = (
  SELECT u.id
  FROM units u
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 201' AND u.unit_number = 1
  LIMIT 1
);

SET @topic_advantages_id = (
  SELECT t.id
  FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 201'
    AND u.unit_number = 1
    AND t.title = 'Advantages of DBMS approach'
  LIMIT 1
);

SET @topic_independence_id = (
  SELECT t.id
  FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 201'
    AND u.unit_number = 1
    AND t.title = 'Data independence, schema and subschema'
  LIMIT 1
);

SET @topic_languages_id = (
  SELECT t.id
  FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 201'
    AND u.unit_number = 1
    AND t.title = 'Database languages, transactions and administrator role'
  LIMIT 1
);

SET @topic_er_id = (
  SELECT t.id
  FROM syllabus_topics t
  JOIN units u ON u.id = t.unit_id
  JOIN subjects s ON s.id = u.subject_id
  WHERE s.code = 'MCA 201'
    AND u.unit_number = 1
    AND t.title = 'ER model, keys, weak entities and specialization'
  LIMIT 1
);

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '77777777-7777-4777-8777-000000000201',
  @mca201_subject_id,
  @mca201_unit1_id,
  @topic_advantages_id,
  'Advantages of DBMS Approach - PDF Smart Notes',
  'Clean topic-wise notes prepared from the DBMS Unit 1 PDF.',
  'notes',
  '/notes/dbms-unit-1-notes.pdf',
  NULL,
  '# Advantages of DBMS Approach

## Meaning of DBMS
A Database Management System is software that helps users define, create, store, update, retrieve and control data in a structured database.

## Why DBMS was needed
Traditional file processing stores data in separate files for separate applications. This creates duplication, inconsistency, difficult sharing, weak security and hard recovery. DBMS solves these problems by keeping data in a controlled central system.

## Main advantages
- Reduced data redundancy because common data is stored once and shared.
- Improved consistency because updates are controlled through the database.
- Concurrent access so many users can work with the same data safely.
- Better security through authentication, authorization and access control.
- Data integrity using rules, keys and constraints.
- Backup and recovery support after failure.
- Data independence so application logic is less affected by storage changes.
- Better data sharing between departments and applications.
- Transaction management for reliable insert, update and delete operations.

## DBMS compared with file system
- Redundancy: file systems usually have high redundancy, while DBMS keeps redundancy controlled.
- Sharing: file systems make sharing difficult, while DBMS supports easy and controlled sharing.
- Security: file systems provide limited security, while DBMS supports strong access control.
- Recovery: file systems need manual recovery, while DBMS provides backup and recovery tools.
- Data relation: file systems have weak relation handling, while DBMS manages relations through keys and constraints.

## Exam focus
When writing an answer, first explain file system limitations, then write DBMS advantages with examples like student records, course records and fee records managed in one system.',
  @teacher_priya_id
WHERE @mca201_subject_id IS NOT NULL AND @mca201_unit1_id IS NOT NULL AND @topic_advantages_id IS NOT NULL
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

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '77777777-7777-4777-8777-000000000202',
  @mca201_subject_id,
  @mca201_unit1_id,
  @topic_independence_id,
  'Data Independence, Schema and Subschema - PDF Smart Notes',
  'Schema-level DBMS notes prepared from the DBMS Unit 1 PDF.',
  'notes',
  '/notes/dbms-unit-1-notes.pdf',
  NULL,
  '# Data Independence, Schema and Subschema

## Data abstraction
DBMS hides storage complexity by showing data at different abstraction levels.

## Three levels of DBMS architecture
- Internal level: describes how data is physically stored on disk.
- Conceptual level: describes the complete logical structure of the database.
- External level: describes user-specific views of the database.

## Schema
A schema is the overall design or structure of a database. It defines tables, attributes, relationships, keys, constraints and views.

Example: Student(id, name, email, semester_id) is part of a database schema.

## Instance
An instance is the actual data stored in the database at a particular time.

Example: Aman, Riya and Rahul records currently stored in Student table.

## Subschema
A subschema is a smaller user-specific view of the database. It shows only the part of the database needed by a user or application.

Example: A teacher may see students of assigned subjects, while admin can see all students.

## Data independence
Data independence means changes in one level of database design should not force unnecessary changes in another level.

## Physical data independence
Physical data independence means physical storage changes do not affect the logical schema.

Examples:
- Changing file organization.
- Adding indexes.
- Moving data to another storage device.

## Logical data independence
Logical data independence means conceptual schema changes do not affect external views or application programs.

Examples:
- Adding a new column to a table.
- Splitting one table into two tables.
- Adding a new relationship.

## Exam focus
Draw the three-level architecture and explain schema, instance, subschema, physical data independence and logical data independence with examples.',
  @teacher_priya_id
WHERE @mca201_subject_id IS NOT NULL AND @mca201_unit1_id IS NOT NULL AND @topic_independence_id IS NOT NULL
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

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '77777777-7777-4777-8777-000000000203',
  @mca201_subject_id,
  @mca201_unit1_id,
  @topic_languages_id,
  'Database Languages, Transactions and DBA - PDF Smart Notes',
  'DBMS language, transaction and administrator notes prepared from the DBMS Unit 1 PDF.',
  'notes',
  '/notes/dbms-unit-1-notes.pdf',
  NULL,
  '# Database Languages, Transactions and Administrator Role

## Database languages
DBMS provides languages to define, manipulate, control and manage database operations.

## DDL
Data Definition Language is used to define database structure.

Common commands:
- CREATE
- ALTER
- DROP
- TRUNCATE

## DML
Data Manipulation Language is used to insert, update, delete and retrieve records.

Common commands:
- SELECT
- INSERT
- UPDATE
- DELETE

## DCL
Data Control Language is used to control permissions.

Common commands:
- GRANT
- REVOKE

## TCL
Transaction Control Language is used to manage database transactions.

Common commands:
- COMMIT
- ROLLBACK
- SAVEPOINT

## Transaction
A transaction is a logical unit of work. It contains one or more database operations that must complete correctly as a group.

Example: Fee payment should update payment table and student subscription status together.

## ACID properties
- Atomicity: all operations happen or none happen.
- Consistency: transaction keeps the database valid.
- Isolation: concurrent transactions do not disturb each other.
- Durability: committed data remains saved after failure.

## Database administrator role
The DBA controls and maintains the database system.

Important responsibilities:
- Define schema and storage structure.
- Manage users and permissions.
- Maintain security.
- Apply backup and recovery policies.
- Monitor performance.
- Enforce integrity constraints.
- Plan database growth.

## Query processor and storage manager
The query processor translates and optimizes database queries. The storage manager controls physical data storage, indexing, buffering and file access.

## Exam focus
For long answers, connect DDL, DML, DCL and TCL with examples. For DBA, write both technical duties and security responsibilities.',
  @teacher_priya_id
WHERE @mca201_subject_id IS NOT NULL AND @mca201_unit1_id IS NOT NULL AND @topic_languages_id IS NOT NULL
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

INSERT INTO content (
  id, subject_id, unit_id, syllabus_topic_id, title, description, content_type,
  file_url, video_url, notes_content, created_by
)
SELECT
  '55555555-5555-4555-8555-000000000201',
  @mca201_subject_id,
  @mca201_unit1_id,
  @topic_er_id,
  'ER Model, Keys, Weak Entities and Specialization - PDF Smart Notes',
  'ER modeling notes prepared from the DBMS Unit 1 PDF and aligned to the RGPV MCA topic.',
  'notes',
  '/notes/dbms-unit-1-notes.pdf',
  NULL,
  '# ER Model, Keys, Weak Entities and Specialization

## ER model
The Entity Relationship model is a high-level conceptual model used to design a database before converting it into tables.

## Entity
An entity is a real-world object that can be identified separately.

Examples:
- Student
- Teacher
- Subject
- Department

## Entity set
An entity set is a collection of similar entities.

Example: all student records form the Student entity set.

## Attributes
Attributes describe properties of an entity.

Types of attributes:
- Simple attribute: cannot be divided further.
- Composite attribute: can be divided into smaller parts.
- Single-valued attribute: has one value for one entity.
- Multi-valued attribute: can have multiple values.
- Derived attribute: calculated from another attribute.
- Key attribute: uniquely identifies an entity.

## Relationship
A relationship shows association between entities.

Examples:
- Student enrolls in Subject.
- Teacher teaches Subject.
- Department offers Course.

## Cardinality
Cardinality defines how many instances of one entity can be associated with another entity.

Common types:
- One to one
- One to many
- Many to many

## Keys
- Super key: any attribute set that uniquely identifies a record.
- Candidate key: minimal super key.
- Primary key: candidate key selected as main identifier.
- Alternate key: candidate keys not selected as primary key.
- Foreign key: attribute that refers to primary key of another table.

## Weak entity
A weak entity cannot be uniquely identified by its own attributes. It depends on an owner entity.

Example: Dependent may depend on Employee. Dependent name alone may not be unique, so employee id plus dependent name identifies it.

## Partial key
A partial key identifies weak entity records within the owner entity.

## Specialization
Specialization is a top-down process where a general entity is divided into specific sub-entities.

Example: User can be specialized into Student, Teacher and Admin.

## Generalization
Generalization is a bottom-up process where similar entities are combined into a higher-level entity.

Example: Student and Teacher can be generalized as User.

## ER diagram notation
- Entity: rectangle.
- Weak entity: double rectangle.
- Relationship: diamond.
- Identifying relationship: double diamond.
- Attribute: oval.
- Key attribute: underlined oval.
- Multi-valued attribute: double oval.
- Derived attribute: dashed oval.

## Exam focus
Practice ER diagrams with entities, attributes, keys, cardinality and participation. Always mention weak entity depends on owner entity and uses an identifying relationship.',
  @teacher_priya_id
WHERE @mca201_subject_id IS NOT NULL AND @mca201_unit1_id IS NOT NULL AND @topic_er_id IS NOT NULL
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
