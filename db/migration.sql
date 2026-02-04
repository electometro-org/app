-- Migration script for Electometro quiz_answers table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Create the quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  responses JSONB NOT NULL,
  demographics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user_id ON quiz_answers(user_id);

-- Create an index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_quiz_answers_created_at ON quiz_answers(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to insert (since this is a public quiz)
-- Using 'public' role instead of 'anon' for unauthenticated access
CREATE POLICY "Allow public insert" ON quiz_answers
  FOR INSERT
  TO public
  WITH CHECK (true);

COMMENT ON TABLE quiz_answers IS 'Stores user responses from the political quiz';
COMMENT ON COLUMN quiz_answers.user_id IS 'Client-generated user identifier stored in localStorage';
COMMENT ON COLUMN quiz_answers.responses IS 'Map of question_id to [vote_numeric, weight]';
COMMENT ON COLUMN quiz_answers.demographics IS 'Optional demographic information provided by user';