-- XMZ OS 初始数据库 Schema
-- 包含 14 张业务表 + RLS 策略

-- ============================================
-- 1. projects 项目表
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  code          TEXT,
  description   TEXT,
  tech_stack    TEXT[],
  project_type  TEXT,
  status        TEXT DEFAULT 'active',
  git_url       TEXT,
  local_path    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的项目" ON projects FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. work_plans 工作计划表（需求+Bug+自定义）
-- ============================================
CREATE TABLE IF NOT EXISTS work_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('requirement', 'bug', 'custom')),
  title                 TEXT NOT NULL,
  description           TEXT,
  priority              TEXT DEFAULT 'medium',
  status                TEXT NOT NULL,
  progress              INTEGER DEFAULT 0,
  start_date            DATE,
  due_date              DATE,
  completed_at          TIMESTAMPTZ,
  source_person         TEXT,
  source_department     TEXT,
  requirement_background TEXT,
  acceptance_criteria   TEXT,
  bug_severity          TEXT,
  bug_symptom           TEXT,
  bug_error_message     TEXT,
  bug_reason            TEXT,
  bug_solution          TEXT,
  review_summary        TEXT,
  tags                  TEXT[],
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_work_plans_user_id ON work_plans(user_id);
CREATE INDEX idx_work_plans_project_id ON work_plans(project_id);
CREATE INDEX idx_work_plans_type ON work_plans(type);
CREATE INDEX idx_work_plans_status ON work_plans(status);
CREATE INDEX idx_work_plans_priority ON work_plans(priority);
CREATE INDEX idx_work_plans_due_date ON work_plans(due_date);
CREATE INDEX idx_work_plans_deleted_at ON work_plans(deleted_at);
CREATE INDEX idx_work_plans_bug_severity ON work_plans(bug_severity) WHERE type = 'bug';

ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的工作计划" ON work_plans FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. knowledge_documents 知识库文档
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  content     TEXT,
  category    TEXT,
  tags        TEXT[],
  source      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_knowledge_user_id ON knowledge_documents(user_id);
CREATE INDEX idx_knowledge_project_id ON knowledge_documents(project_id);
CREATE INDEX idx_knowledge_deleted_at ON knowledge_documents(deleted_at);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的知识库" ON knowledge_documents FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. prompt_templates Prompt库
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  model_scope TEXT,
  scene       TEXT,
  version     TEXT DEFAULT '1.0',
  rating      INTEGER DEFAULT 0,
  tags        TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_prompts_user_id ON prompt_templates(user_id);
CREATE INDEX idx_prompts_project_id ON prompt_templates(project_id);
CREATE INDEX idx_prompts_deleted_at ON prompt_templates(deleted_at);

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的Prompt" ON prompt_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. process_diagrams 业务流程图
-- ============================================
CREATE TABLE IF NOT EXISTS process_diagrams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  mermaid_content TEXT NOT NULL,
  process_type    TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_diagrams_user_id ON process_diagrams(user_id);
CREATE INDEX idx_diagrams_project_id ON process_diagrams(project_id);
CREATE INDEX idx_diagrams_deleted_at ON process_diagrams(deleted_at);

ALTER TABLE process_diagrams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的流程图" ON process_diagrams FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. files 文件表
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  file_name    TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  file_size    BIGINT,
  storage_path TEXT NOT NULL,
  remark       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_deleted_at ON files(deleted_at);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的文件" ON files FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. ideas 灵感箱
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  content     TEXT,
  category    TEXT DEFAULT '功能想法',
  status      TEXT DEFAULT '未整理',
  tags        TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_project_id ON ideas(project_id);
CREATE INDEX idx_ideas_deleted_at ON ideas(deleted_at);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的灵感" ON ideas FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. ai_providers AI 供应商配置
-- ============================================
CREATE TABLE IF NOT EXISTS ai_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'deepseek', 'claude', 'qwen', 'custom')),
  base_url      TEXT NOT NULL,
  api_key       TEXT NOT NULL,
  default_model TEXT,
  is_enabled    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_ai_providers_user_id ON ai_providers(user_id);
CREATE INDEX idx_ai_providers_deleted_at ON ai_providers(deleted_at);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的AI配置" ON ai_providers FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 9. ai_operation_logs AI 操作日志
-- ============================================
CREATE TABLE IF NOT EXISTS ai_operation_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id   UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  operation     TEXT NOT NULL,
  model_used    TEXT,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  prompt_text   TEXT,
  response_text TEXT,
  status        TEXT DEFAULT 'success',
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_user_id ON ai_operation_logs(user_id);
CREATE INDEX idx_ai_logs_created_at ON ai_operation_logs(created_at);

ALTER TABLE ai_operation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的AI日志" ON ai_operation_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 10. tool_operation_logs 工具操作日志
-- ============================================
CREATE TABLE IF NOT EXISTS tool_operation_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type      TEXT NOT NULL,
  input_file_id  UUID REFERENCES files(id) ON DELETE SET NULL,
  input_text     TEXT,
  output_text    TEXT,
  status         TEXT DEFAULT 'success',
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tool_logs_user_id ON tool_operation_logs(user_id);
CREATE INDEX idx_tool_logs_created_at ON tool_operation_logs(created_at);

ALTER TABLE tool_operation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的工具日志" ON tool_operation_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 11. smart_reminders 智能提醒
-- ============================================
CREATE TABLE IF NOT EXISTS smart_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type   TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  source_type     TEXT,
  source_id       UUID,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  is_dismissed    BOOLEAN DEFAULT FALSE,
  dismissed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_id ON smart_reminders(user_id);
CREATE INDEX idx_reminders_is_dismissed ON smart_reminders(is_dismissed);
CREATE INDEX idx_reminders_created_at ON smart_reminders(created_at);

ALTER TABLE smart_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的提醒" ON smart_reminders FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 12. relation_links 关系链接
-- ============================================
CREATE TABLE IF NOT EXISTS relation_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type   TEXT NOT NULL,
  source_id     UUID NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     UUID NOT NULL,
  relation_type TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relations_user_id ON relation_links(user_id);
CREATE INDEX idx_relations_source ON relation_links(source_type, source_id);
CREATE INDEX idx_relations_target ON relation_links(target_type, target_id);

ALTER TABLE relation_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的关系" ON relation_links FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 13. report_templates 报表模板
-- ============================================
CREATE TABLE IF NOT EXISTS report_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  content     TEXT NOT NULL,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_report_templates_user_id ON report_templates(user_id);
CREATE INDEX idx_report_templates_deleted_at ON report_templates(deleted_at);

ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的报表模板" ON report_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 14. report_histories 报表历史
-- ============================================
CREATE TABLE IF NOT EXISTS report_histories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,
  date_range  TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_histories_user_id ON report_histories(user_id);
CREATE INDEX idx_report_histories_created_at ON report_histories(created_at);

ALTER TABLE report_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的报表历史" ON report_histories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Storage Bucket：文件存储
-- ============================================
-- 注意：bucket 创建需要在 Supabase Dashboard 或 API 完成
-- 以下为手动创建参考：
-- 1. 在 Supabase Dashboard → Storage → New Bucket → 名称: "user-files"
-- 2. 勾选 "Public bucket" 或配置 RLS

-- Storage RLS（需在 Supabase Dashboard 中配置）
-- CREATE POLICY "用户只能访问自己的文件" ON storage.objects FOR ALL
--   USING (auth.uid()::text = (storage.foldername(name))[1])
--   WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
