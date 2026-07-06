// 数据库类型定义 — 与 Supabase 表结构对应

// ============================================
// 枚举类型
// ============================================
export type ProjectStatus = "active" | "archived" | "paused"
export type WorkPlanType = "requirement" | "bug" | "custom"
export type WorkPlanPriority = "high" | "medium" | "low"

export type RequirementStatus =
  | "待确认" | "待开发" | "开发中" | "待测试" | "已完成" | "已上线" | "已取消"
export type BugStatus =
  | "待分析" | "处理中" | "已修复" | "无法复现" | "已归档"
export type CustomWorkStatus =
  | "未开始" | "进行中" | "已完成" | "已暂停" | "已取消"
export type WorkPlanStatus = RequirementStatus | BugStatus | CustomWorkStatus

export type BugSeverity = "high" | "medium" | "low"

export type IdeaCategory =
  | "功能想法" | "优化想法" | "AI想法" | "业务想法" | "技术想法"
export type IdeaStatus =
  | "未整理" | "已采纳" | "已放弃" | "已转计划" | "已转知识库"

export type AIProviderType = "openai" | "deepseek" | "claude" | "qwen" | "custom"
export type ReminderType = "bug_severe" | "plan_overdue" | "weekly_candidate" | "custom"

export type ReportType =
  | "weekly" | "monthly" | "yearly" | "project_summary" | "bug_review"

// ============================================
// 表行类型
// ============================================

export interface Project {
  id: string
  user_id: string
  name: string | null
  code: string | null
  description: string | null
  tech_stack: string[] | null
  project_type: string | null
  status: ProjectStatus
  git_url: string | null
  local_path: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface WorkPlan {
  id: string
  user_id: string
  project_id: string
  type: WorkPlanType
  title: string
  description: string | null
  priority: WorkPlanPriority
  status: string
  progress: number
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  // 需求字段
  source_person: string | null
  source_department: string | null
  requirement_background: string | null
  acceptance_criteria: string | null
  // Bug 字段
  bug_severity: BugSeverity | null
  bug_symptom: string | null
  bug_error_message: string | null
  bug_reason: string | null
  bug_solution: string | null
  // 通用
  review_summary: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface KnowledgeDocument {
  id: string
  user_id: string
  project_id: string | null
  title: string
  content: string | null
  category: string | null
  tags: string[] | null
  source: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PromptTemplate {
  id: string
  user_id: string
  project_id: string | null
  title: string
  content: string
  model_scope: string | null
  scene: string | null
  version: string
  rating: number
  tags: string[] | null
  is_favorite: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProcessDiagram {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  mermaid_content: string
  process_type: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface FileRecord {
  id: string
  user_id: string
  project_id: string | null
  file_name: string
  file_type: string
  file_size: number | null
  storage_path: string
  remark: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Idea {
  id: string
  user_id: string
  project_id: string | null
  title: string
  content: string | null
  category: IdeaCategory
  status: IdeaStatus
  tags: string[] | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AIProvider {
  id: string
  user_id: string
  provider_name: string
  provider_type: AIProviderType
  base_url: string
  api_key: string
  default_model: string | null
  is_enabled: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AIOperationLog {
  id: string
  user_id: string
  provider_id: string | null
  operation: string
  model_used: string | null
  input_tokens: number | null
  output_tokens: number | null
  prompt_text: string | null
  response_text: string | null
  status: string
  error_message: string | null
  created_at: string
}

export interface ToolOperationLog {
  id: string
  user_id: string
  tool_type: string
  input_file_id: string | null
  input_text: string | null
  output_text: string | null
  status: string
  error_message: string | null
  created_at: string
}

export interface SmartReminder {
  id: string
  user_id: string
  reminder_type: ReminderType
  title: string
  description: string | null
  source_type: string | null
  source_id: string | null
  project_id: string | null
  is_dismissed: boolean
  dismissed_at: string | null
  created_at: string
}

export interface RelationLink {
  id: string
  user_id: string
  source_type: string
  source_id: string
  target_type: string
  target_id: string
  relation_type: string | null
  created_at: string
}

export interface ReportTemplate {
  id: string
  user_id: string
  name: string
  type: ReportType
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ReportHistory {
  id: string
  user_id: string
  template_id: string | null
  title: string
  type: ReportType
  date_range: string | null
  content: string
  created_at: string
}

// ============================================
// Supabase Database 完整类型（用于 supabase.from() 类型推断）
// ============================================
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<Project, "id">>
      }
      work_plans: {
        Row: WorkPlan
        Insert: Omit<WorkPlan, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<WorkPlan, "id">>
      }
      knowledge_documents: {
        Row: KnowledgeDocument
        Insert: Omit<KnowledgeDocument, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<KnowledgeDocument, "id">>
      }
      prompt_templates: {
        Row: PromptTemplate
        Insert: Omit<PromptTemplate, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<PromptTemplate, "id">>
      }
      process_diagrams: {
        Row: ProcessDiagram
        Insert: Omit<ProcessDiagram, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<ProcessDiagram, "id">>
      }
      files: {
        Row: FileRecord
        Insert: Omit<FileRecord, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<FileRecord, "id">>
      }
      ideas: {
        Row: Idea
        Insert: Omit<Idea, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<Idea, "id">>
      }
      ai_providers: {
        Row: AIProvider
        Insert: Omit<AIProvider, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<AIProvider, "id">>
      }
      ai_operation_logs: {
        Row: AIOperationLog
        Insert: Omit<AIOperationLog, "id" | "created_at">
        Update: Partial<Omit<AIOperationLog, "id">>
      }
      tool_operation_logs: {
        Row: ToolOperationLog
        Insert: Omit<ToolOperationLog, "id" | "created_at">
        Update: Partial<Omit<ToolOperationLog, "id">>
      }
      smart_reminders: {
        Row: SmartReminder
        Insert: Omit<SmartReminder, "id" | "created_at">
        Update: Partial<Omit<SmartReminder, "id">>
      }
      relation_links: {
        Row: RelationLink
        Insert: Omit<RelationLink, "id" | "created_at">
        Update: Partial<Omit<RelationLink, "id">>
      }
      report_templates: {
        Row: ReportTemplate
        Insert: Omit<ReportTemplate, "id" | "created_at" | "updated_at" | "deleted_at">
        Update: Partial<Omit<ReportTemplate, "id">>
      }
      report_histories: {
        Row: ReportHistory
        Insert: Omit<ReportHistory, "id" | "created_at">
        Update: Partial<Omit<ReportHistory, "id">>
      }
    }
  }
}
