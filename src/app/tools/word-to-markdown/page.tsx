import { AiFileTool } from "@/components/tools/ai-file-tool"

export default function WordToMarkdownPage() {
  return (
    <AiFileTool
      title="Word 转 Markdown"
      desc="上传 docx 文档后转换为 Markdown。"
      endpoint="/api/tools/word-to-markdown"
      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      outputKey="markdown"
    />
  )
}
