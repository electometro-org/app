-- Additional security measures for quiz_answers table
-- Run this AFTER the initial migration

-- 1. Add check constraints to validate data
ALTER TABLE quiz_answers
  ADD CONSTRAINT valid_user_id_length CHECK (length(user_id) > 0 AND length(user_id) < 100),
  ADD CONSTRAINT valid_responses_not_empty CHECK (jsonb_typeof(responses) = 'object' AND responses != '{}'::jsonb);

-- 2. Create a function to validate responses structure
CREATE OR REPLACE FUNCTION validate_quiz_responses()
RETURNS TRIGGER AS $$
DECLARE
  question_key TEXT;
  question_value JSONB;
  vote_value NUMERIC;
  weight_value INTEGER;
BEGIN
  -- Check that responses is an object
  IF jsonb_typeof(NEW.responses) != 'object' THEN
    RAISE EXCEPTION 'responses must be a JSON object';
  END IF;

  -- Validate each question response
  FOR question_key, question_value IN SELECT * FROM jsonb_each(NEW.responses)
  LOOP
    -- Each value should be an array with 2 elements: [vote, weight]
    IF jsonb_typeof(question_value) != 'array' THEN
      RAISE EXCEPTION 'Each response must be an array [vote, weight]';
    END IF;

    IF jsonb_array_length(question_value) != 2 THEN
      RAISE EXCEPTION 'Each response must have exactly 2 elements [vote, weight]';
    END IF;

    -- Extract vote and weight
    vote_value := (question_value->0)::NUMERIC;
    weight_value := (question_value->1)::INTEGER;

    -- Validate vote is between 0 and 1
    IF vote_value < 0 OR vote_value > 1 THEN
      RAISE EXCEPTION 'Vote must be between 0 and 1, got: %', vote_value;
    END IF;

    -- Validate weight is between 1 and 3
    IF weight_value < 1 OR weight_value > 3 THEN
      RAISE EXCEPTION 'Weight must be between 1 and 3, got: %', weight_value;
    END IF;
  END LOOP;

  -- Limit number of questions (prevent spam with huge payloads)
  IF (SELECT COUNT(*) FROM jsonb_object_keys(NEW.responses)) > 100 THEN
    RAISE EXCEPTION 'Too many questions in response (max 100)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to run validation before insert
CREATE TRIGGER validate_responses_before_insert
  BEFORE INSERT ON quiz_answers
  FOR EACH ROW
  EXECUTE FUNCTION validate_quiz_responses();

-- 4. Validate demographics if present
CREATE OR REPLACE FUNCTION validate_demographics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.demographics IS NOT NULL THEN
    -- Ensure demographics is an object
    IF jsonb_typeof(NEW.demographics) != 'object' THEN
      RAISE EXCEPTION 'demographics must be a JSON object';
    END IF;

    -- Limit size of demographics to prevent abuse
    IF length(NEW.demographics::text) > 5000 THEN
      RAISE EXCEPTION 'demographics payload too large';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_demographics_before_insert
  BEFORE INSERT ON quiz_answers
  FOR EACH ROW
  EXECUTE FUNCTION validate_demographics();

-- 5. Add index to help identify potential abuse patterns
CREATE INDEX IF NOT EXISTS idx_quiz_answers_created_at_user ON quiz_answers(created_at DESC, user_id);

COMMENT ON FUNCTION validate_quiz_responses() IS 'Validates quiz response structure and values before insert';
COMMENT ON FUNCTION validate_demographics() IS 'Validates demographics structure and size before insert';