# Knowledge Import and Experience Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 停用经验库，并支持按文件创建知识库记录的多文件和文件夹导入。

**Architecture:** 将批量导入负载构造提取为纯函数，页面用它在每个文件提取完成后调用既有 `/api/knowledge`。经验库不再有入口和模块配置，保留路由跳转以兼容历史地址。

**Tech Stack:** Next.js 13、React 18、TypeScript、Node 内置测试运行器、tsx。

---

### Task 1: Batch import payload helper

**Files:**
- Create: `src/lib/knowledge/import-documents.ts`
- Test: `src/lib/knowledge/import-documents.test.ts`

- [ ] **Step 1: Write failing tests for one imported file and a directory file**

```ts
assert.deepEqual(buildKnowledgeImportPayload({ title: "ignored", content: "body" }, makeFile("docs/a.md")), {
  title: "a.md", content: "body", category: "技术文档", source: "docs/a.md", project_id: null,
})
```

- [ ] **Step 2: Run the focused test and verify it fails because the helper does not exist**

Run: `npm test -- src/lib/knowledge/import-documents.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the minimal payload helper**

```ts
export function buildKnowledgeImportPayload(data, file) {
  const relativePath = file.webkitRelativePath || file.name
  return { title: file.name, content: data.content || "", category: "技术文档", source: relativePath, project_id: null }
}
```

- [ ] **Step 4: Re-run the focused test and verify it passes**

Run: `npm test -- src/lib/knowledge/import-documents.test.ts`
Expected: PASS.

### Task 2: Knowledge page directory import

**Files:**
- Modify: `src/app/knowledge/new/page.tsx`
- Test: `src/lib/knowledge/knowledge-import-page.test.ts`

- [ ] **Step 1: Write failing source-level tests for directory selection and fixed batch payload use**

```ts
assert.match(page, /webkitdirectory/)
assert.match(page, /buildKnowledgeImportPayload\(data, file\)/)
assert.doesNotMatch(page, /function buildDocumentPayload/)
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/lib/knowledge/knowledge-import-page.test.ts`
Expected: FAIL because the folder selector and helper integration are absent.

- [ ] **Step 3: Implement the minimal page change**

```tsx
<input type="file" multiple webkitdirectory="" onChange={(event) => handleImportFiles(event.target.files)} />
```

Use the helper only in the multi-file path. Keep the one-file path as form population.

- [ ] **Step 4: Re-run the focused test and verify it passes**

Run: `npm test -- src/lib/knowledge/knowledge-import-page.test.ts`
Expected: PASS.

### Task 3: Retire the experience library

**Files:**
- Modify: `src/lib/menu-items.ts`
- Modify: `src/app/projects/[id]/page.tsx`
- Modify: `src/components/project/project-module-view.tsx`
- Modify: `src/app/experiences/page.tsx`
- Modify: `src/app/projects/[id]/experiences/page.tsx`
- Modify: `src/lib/crud/module-audit.test.ts`
- Test: `src/lib/knowledge/experience-retirement.test.ts`

- [ ] **Step 1: Write failing tests for removed navigation and compatibility redirects**

```ts
assert.doesNotMatch(menu, /href: "\/experiences"/)
assert.doesNotMatch(projectPage, /\/experiences/)
assert.doesNotMatch(moduleView, /\| "experiences"/)
assert.match(experiencesPage, /redirect\("\/knowledge"\)/)
assert.match(projectExperiencesPage, /redirect\(`\/projects\/\$\{params.id\}\/knowledge`\)/)
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/lib/knowledge/experience-retirement.test.ts`
Expected: FAIL because the experience library is still active.

- [ ] **Step 3: Implement the minimal retirement changes**

Remove the two navigation entries and the `experiences` module configuration. Replace both legacy pages with Next.js server redirects. Remove the obsolete experience entry from the CRUD audit list.

- [ ] **Step 4: Re-run the focused test and verify it passes**

Run: `npm test -- src/lib/knowledge/experience-retirement.test.ts`
Expected: PASS.

### Task 4: File preview and folder operations

**Files:**
- Create: `src/lib/files/file-manager.test.ts`
- Create: `src/app/api/files/bulk/route.ts`
- Modify: `src/app/files/page.tsx`
- Modify: `src/lib/files/folder-upload.test.ts`

- [ ] **Step 1: Write failing tests for text previews, top-level folder grouping, folder selection, and one-request folder deletion**

```ts
assert.equal(getPreviewType({ file_name: "readme.md", file_type: "md" }), "text")
assert.deepEqual(buildFolderGroups(files)[0].files.map((file) => file.id), ["1", "2"])
assert.match(page, /handleDeleteFolder/)
assert.match(bulkRoute, /\.in\("id", ids\)/)
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- src/lib/files/file-manager.test.ts src/lib/files/folder-upload.test.ts`
Expected: FAIL because text preview and folder deletion are absent.

- [ ] **Step 3: Implement text preview and folder operations**

Use `fetch(previewUrl).then(response => response.text())` for text formats and render the result in a themed `<pre>`. Add a checkbox and delete button to each folder header, and post folder file IDs to `/api/files/bulk` for one-request soft deletion.

- [ ] **Step 4: Re-run the focused tests and verify they pass**

Run: `npm test -- src/lib/files/file-manager.test.ts src/lib/files/folder-upload.test.ts`
Expected: PASS.

### Task 5: Full regression verification

**Files:**
- Modify: only files required by failed verification.

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: Next.js build completes with exit code 0.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check` and `git diff -- <changed paths>`
Expected: no whitespace errors and only scoped changes.
