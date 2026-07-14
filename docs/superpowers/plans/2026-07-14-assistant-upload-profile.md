# 小美指令、批量上传和个人资料 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成批量上传、小美快捷指令/附件执行和头像资料持久化。

**Architecture:** 前端新增确定性指令解析层，复用现有 REST API 执行业务动作。个人资料新增 `user_profiles` 表和 `/api/profile`，所有头像展示通过共享组件读取并保存。

**Tech Stack:** Next.js 13 App Router, React, Supabase, TypeScript, Node test runner.

---

### Task 1: 测试先行

**Files:**
- Create: `src/lib/assistant/commands.test.ts`
- Create: `src/lib/crud/multi-upload.test.ts`
- Create: `src/lib/profile/profile-api.test.ts`

- [ ] 写失败测试覆盖指令列表、动作解析、多文件上传和资料表/API。
- [ ] 运行 `E:\XMZAI\.tools\node20\node.exe scripts\run-tests.mjs src\lib\assistant\commands.test.ts src\lib\crud\multi-upload.test.ts src\lib\profile\profile-api.test.ts`，确认失败来自功能缺失。

### Task 2: 实现安全指令层和小美 UI

**Files:**
- Create: `src/lib/assistant/commands.ts`
- Modify: `src/app/ai-secretary/page.tsx`
- Modify: `src/components/dashboard/dashboard-client.tsx`

- [ ] 增加 16 个快捷指令按钮。
- [ ] 新增附件选择、预览、删除和消息发送。
- [ ] 新增本地动作执行：创建工作计划、知识/经验、Prompt、灵感、文件，查询各模块摘要。

### Task 3: 实现批量文件上传

**Files:**
- Modify: `src/app/files/page.tsx`
- Modify: `src/app/knowledge/new/page.tsx`
- Modify: `src/app/experiences/page.tsx`

- [ ] 文件页支持 `multiple`，逐个上传并汇总。
- [ ] 经验库显式提供批量导入入口。
- [ ] 知识库上传文案保留多选能力。

### Task 4: 实现个人资料持久化

**Files:**
- Create: `supabase/migrations/002_user_profiles.sql`
- Create: `src/app/api/profile/route.ts`
- Create: `src/components/profile/user-profile-button.tsx`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/app/ai-secretary/page.tsx`
- Modify: `src/components/dashboard/dashboard-client.tsx`

- [ ] 新增资料表、RLS 和 updated_at 维护。
- [ ] 新增 GET/PUT API。
- [ ] 头像点击打开弹窗，支持头像 URL、名字、简介、部门、岗位保存。

### Task 5: 验证和发布

**Files:**
- No production file changes unless verification finds a defect.

- [ ] 跑针对测试和全量测试。
- [ ] 重启本地生产服务并用浏览器验证上传、指令、资料弹窗。
- [ ] 提交、推送 main，等待 Netlify 正式发布完成。
