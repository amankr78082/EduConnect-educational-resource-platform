USE educonnect_db;

INSERT INTO questions (id, quiz_id, question_text, marks, question_order)
SELECT
  UUID(),
  q.id,
  CONCAT(
    CASE
      WHEN q.title LIKE '%C Programming%' THEN 'C programming practice '
      WHEN q.title LIKE '%Operating System%' THEN 'Operating system practice '
      WHEN q.title LIKE '%DBMS%' THEN 'DBMS practice '
      WHEN q.title LIKE '%Network%' THEN 'Computer network practice '
      WHEN q.title LIKE '%Java%' THEN 'Java OOP practice '
      WHEN q.title LIKE '%Artificial Intelligence%' THEN 'AI practice '
      ELSE 'Subject practice '
    END,
    n.n,
    ': choose the most appropriate answer.'
  ),
  1,
  n.n
FROM quizzes q
JOIN (
  SELECT 6 n UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
  UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
) n
WHERE NOT EXISTS (
  SELECT 1
  FROM questions existing
  WHERE existing.quiz_id = q.id
    AND existing.question_order = n.n
);

INSERT INTO options (id, question_id, option_text, is_correct, option_order)
SELECT UUID(), ques.id, 'Correct concept', TRUE, 1
FROM questions ques
WHERE ques.question_order BETWEEN 6 AND 20
  AND NOT EXISTS (SELECT 1 FROM options opt WHERE opt.question_id = ques.id)
UNION ALL
SELECT UUID(), ques.id, 'Partially related concept', FALSE, 2
FROM questions ques
WHERE ques.question_order BETWEEN 6 AND 20
  AND NOT EXISTS (SELECT 1 FROM options opt WHERE opt.question_id = ques.id)
UNION ALL
SELECT UUID(), ques.id, 'Incorrect concept', FALSE, 3
FROM questions ques
WHERE ques.question_order BETWEEN 6 AND 20
  AND NOT EXISTS (SELECT 1 FROM options opt WHERE opt.question_id = ques.id)
UNION ALL
SELECT UUID(), ques.id, 'Not related to this topic', FALSE, 4
FROM questions ques
WHERE ques.question_order BETWEEN 6 AND 20
  AND NOT EXISTS (SELECT 1 FROM options opt WHERE opt.question_id = ques.id);
