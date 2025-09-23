-- Add missing categories to task_category enum
ALTER TYPE task_category ADD VALUE 'health';
ALTER TYPE task_category ADD VALUE 'learning'; 
ALTER TYPE task_category ADD VALUE 'creative';