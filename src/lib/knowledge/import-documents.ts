export type ExtractedKnowledgeDocument = {
  title?: string
  source?: string
  content?: string
}

export type KnowledgeImportFile = {
  name: string
  webkitRelativePath?: string
}

/** XMZADD 20260720 为批量知识导入生成不受手工表单影响的固定记录。 */
export function buildKnowledgeImportPayload(data: ExtractedKnowledgeDocument, file: KnowledgeImportFile) {
  // 批量导入必须保持一文件一记录，避免手工表单值污染整批文档。
  return {
    title: file.name,
    content: data.content || "",
    category: "技术文档",
    source: file.webkitRelativePath || file.name,
    project_id: null,
  }
}
