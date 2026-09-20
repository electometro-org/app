-- Analysis view for quiz_answers_regional (same idea as quiz_answers_duplicates).
-- Run in your Supabase SQL Editor after db/regional.sql. Safe to re-run.

CREATE OR REPLACE VIEW quiz_answers_regional_duplicates
WITH (security_invoker = true) AS
SELECT
    fingerprint,
    stats_id,
    COUNT(*) as submission_count,
    MIN(created_at) as first_submission,
    MAX(created_at) as last_submission,
    ARRAY_AGG(id ORDER BY created_at) as submission_ids,
    ARRAY_AGG(DISTINCT region_id) as region_ids
FROM quiz_answers_regional
WHERE fingerprint IS NOT NULL
GROUP BY fingerprint, stats_id
HAVING COUNT(*) > 1
ORDER BY submission_count DESC;

-- Contains fingerprints: never expose through the public API
REVOKE ALL ON quiz_answers_regional_duplicates FROM anon, authenticated;

COMMENT ON VIEW quiz_answers_regional_duplicates IS 'Identifies potential duplicate regional submissions by fingerprint and stats_id';
