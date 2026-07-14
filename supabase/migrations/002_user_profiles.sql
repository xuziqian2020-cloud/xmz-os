-- 用户个人资料
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  department   TEXT,
  role_title   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能访问自己的个人资料" ON user_profiles;
CREATE POLICY "用户只能访问自己的个人资料" ON user_profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
