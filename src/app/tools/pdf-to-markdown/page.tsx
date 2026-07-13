import { AiFileTool } from "@/components/tools/ai-file-tool"

export default function PdfToMarkdownPage() {
  return (
    <AiFileTool
      title="PDF 转 Markdown"
      desc="上传 PDF 后提取文本并转换为 Markdown。"
      endpoint="/api/tools/pdf-to-markdown"
      accept="application/pdf,.pdf"
      outputKey="markdown"
    />
  )
}
