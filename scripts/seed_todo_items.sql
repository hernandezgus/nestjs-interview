-- Seed 100,000 TodoItems for todoListId = 1
-- Usage: psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f scripts/seed_todo_items.sql

\echo 'Starting seed: ensure todo_list with id=1 exists and delete existing items'
BEGIN;

INSERT INTO todo_list (id, name)
SELECT 1, 'Seed TodoList'
WHERE NOT EXISTS (SELECT 1 FROM todo_list WHERE id = 1);

DELETE FROM todo_item WHERE "todoListId" = 1;

\echo 'Inserting 100000 todo items (this may take a moment)'
INSERT INTO todo_item (name, completed, "todoListId")
SELECT 'Task #' || g, false, 1
FROM generate_series(1,100000) AS g;

COMMIT;
\echo 'Seed completed.'
