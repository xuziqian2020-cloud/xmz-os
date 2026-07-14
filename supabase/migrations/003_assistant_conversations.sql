-- XMZADD 20260714 小美对话历史和消息记忆

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '新的对话',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON assistant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_updated_at ON assistant_conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_deleted_at ON assistant_conversations(deleted_at);

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能访问自己的小美对话" ON assistant_conversations;
CREATE POLICY "用户只能访问自己的小美对话" ON assistant_conversations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  attachments     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation_id ON assistant_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_id ON assistant_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_created_at ON assistant_messages(created_at);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能访问自己的小美消息" ON assistant_messages;
CREATE POLICY "用户只能访问自己的小美消息" ON assistant_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
