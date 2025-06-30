
-- Add meal_type column to food_entries table
ALTER TABLE public.food_entries 
ADD COLUMN meal_type TEXT;

-- Add a check constraint to ensure meal_type is one of the valid options
ALTER TABLE public.food_entries 
ADD CONSTRAINT valid_meal_type 
CHECK (meal_type IS NULL OR meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks'));
