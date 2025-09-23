-- Expand valid context values to match AI generation
ALTER TABLE tasks DROP CONSTRAINT tasks_context_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_context_check 
  CHECK (context = ANY (ARRAY[
    'desk', 'gym', 'errand', 'reading', 'quiet', 
    'kitchen', 'outdoor', 'mobile', 'anywhere', 'couch'
  ]));