-- Regional elections migration for the quiz_answers_regional table
-- Run this ALONE in your Supabase SQL Editor, after the quiz_answers migrations have been applied.

-- =====================================================================
-- Regional elections: separate table (quiz ids are region-specific)
-- Written by the Worker when the submission carries a region_id.
-- Run AFTER the quiz_answers migrations (it clones that table and reuses its trigger functions).
-- =====================================================================

-- Same columns, defaults, constraints, indexes and comments as quiz_answers
CREATE TABLE IF NOT EXISTS quiz_answers_regional (
    LIKE quiz_answers INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES INCLUDING COMMENTS
);

-- Region the answers belong to (e.g. r1). Mirrors the Worker's validation.
ALTER TABLE quiz_answers_regional
    ADD COLUMN IF NOT EXISTS region_id TEXT NOT NULL;

ALTER TABLE quiz_answers_regional
    ADD CONSTRAINT valid_region_id CHECK (region_id ~ '^r[0-9]{1,3}$');

CREATE INDEX IF NOT EXISTS idx_quiz_answers_regional_region_id
    ON quiz_answers_regional (region_id);

COMMENT ON TABLE quiz_answers_regional IS 'Stores user responses from the regional elections quiz';
COMMENT ON COLUMN quiz_answers_regional.region_id IS 'Region id (e.g. r1) the responses belong to';

-- Row Level Security: anyone may insert (public quiz), nobody can read via the API
ALTER TABLE quiz_answers_regional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON quiz_answers_regional
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Reuse the existing validation functions (triggers are not copied by LIKE)
CREATE TRIGGER validate_responses_before_insert
    BEFORE INSERT ON quiz_answers_regional
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_responses();

CREATE TRIGGER validate_demographics_before_insert
    BEFORE INSERT ON quiz_answers_regional
    FOR EACH ROW
    EXECUTE FUNCTION validate_demographics();

-- Rate limiting must see submissions from both tables, otherwise a fingerprint
-- could double its allowance by alternating elections.
CREATE OR REPLACE FUNCTION check_submission_rate(
  p_fingerprint TEXT,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS TABLE (
  fingerprint TEXT,
  submission_count BIGINT,
  time_span INTERVAL,
  is_suspicious BOOLEAN
) AS $$
BEGIN
RETURN QUERY
SELECT
    s.fingerprint,
    COUNT(*) as submission_count,
    MAX(s.created_at) - MIN(s.created_at) as time_span,
    (COUNT(*) > 15 AND (MAX(s.created_at) - MIN(s.created_at)) < p_time_window) as is_suspicious
FROM (
    SELECT a.fingerprint, a.created_at FROM quiz_answers a
    UNION ALL
    SELECT r.fingerprint, r.created_at FROM quiz_answers_regional r
) s
WHERE s.fingerprint = p_fingerprint
  AND s.created_at >= NOW() - p_time_window
GROUP BY s.fingerprint;
END;
$$ LANGUAGE plpgsql;
