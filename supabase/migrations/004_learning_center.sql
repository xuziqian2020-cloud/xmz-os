-- XMZADD 20260819 学习中心进度、笔记、练习与项目交付证据

CREATE TABLE IF NOT EXISTS learning_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type    TEXT NOT NULL CHECK (content_type IN ('lesson', 'practice', 'project')),
  content_slug    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'accepted')),
  score           NUMERIC(5,2),
  attempt_count   INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_type, content_slug)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_content ON learning_progress(user_id, content_type, content_slug);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_status ON learning_progress(user_id, status);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能访问自己的学习进度" ON learning_progress;
CREATE POLICY "用户读取自己的学习进度" ON learning_progress FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "用户新增自己的学习进度" ON learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status IN ('in_progress', 'completed'));
CREATE POLICY "用户更新自己的学习进度" ON learning_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('in_progress', 'completed'));
CREATE POLICY "用户删除自己的学习进度" ON learning_progress FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY "reviewer reads learning progress" ON learning_progress FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'learning_reviewer') = 'true');
CREATE POLICY "reviewer accepts graduation projects" ON learning_progress FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'learning_reviewer') = 'true' AND user_id <> auth.uid() AND content_type = 'project' AND status IN ('completed', 'accepted'));
CREATE POLICY "reviewer updates graduation projects" ON learning_progress FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'learning_reviewer') = 'true' AND user_id <> auth.uid() AND content_type = 'project')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'learning_reviewer') = 'true' AND user_id <> auth.uid() AND content_type = 'project' AND status IN ('completed', 'accepted'));

CREATE TABLE IF NOT EXISTS learning_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL CHECK (target_type IN ('lesson', 'practice', 'project')),
  target_slug     TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_slug)
);

CREATE INDEX IF NOT EXISTS idx_learning_notes_user_target ON learning_notes(user_id, target_type, target_slug);

ALTER TABLE learning_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能访问自己的学习笔记" ON learning_notes;
CREATE POLICY "用户只能访问自己的学习笔记" ON learning_notes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS learning_code_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type    TEXT NOT NULL CHECK (content_type IN ('lesson', 'practice')),
  content_slug    TEXT NOT NULL,
  code            TEXT NOT NULL,
  output          TEXT NOT NULL DEFAULT '',
  passed          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_code_attempts_user_content ON learning_code_attempts(user_id, content_type, content_slug, passed, created_at DESC);

ALTER TABLE learning_code_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能访问自己的代码练习" ON learning_code_attempts;
CREATE POLICY "用户只能访问自己的代码练习" ON learning_code_attempts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS learning_project_evidence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_slug    TEXT NOT NULL,
  evidence_type   TEXT NOT NULL CHECK (evidence_type IN ('repository', 'deployment', 'screenshot', 'test_result', 'retrospective')),
  title           TEXT NOT NULL,
  url             TEXT,
  notes           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_project_evidence_user_project ON learning_project_evidence(user_id, project_slug, created_at DESC);

ALTER TABLE learning_project_evidence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能访问自己的项目证据" ON learning_project_evidence;
CREATE POLICY "用户只能访问自己的项目证据" ON learning_project_evidence FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviewer reads project evidence" ON learning_project_evidence FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'learning_reviewer') = 'true');

CREATE TABLE IF NOT EXISTS learning_project_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_slug    TEXT NOT NULL,
  reviewer_name   TEXT NOT NULL DEFAULT '',
  checklist       JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision        TEXT NOT NULL DEFAULT 'draft' CHECK (decision IN ('draft', 'changes_requested', 'accepted')),
  review_notes    TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, project_slug, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_project_reviews_user_project ON learning_project_reviews(user_id, project_slug, updated_at DESC);

ALTER TABLE learning_project_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能访问自己的项目评审" ON learning_project_reviews;
CREATE POLICY "用户读取自己的项目评审" ON learning_project_reviews FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "reviewer manages project reviews" ON learning_project_reviews FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'learning_reviewer') = 'true')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'learning_reviewer') = 'true' AND reviewer_id = auth.uid());
