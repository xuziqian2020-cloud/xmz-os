import { AiFileTool } from "@/components/tools/ai-file-tool"

export default function PdfToWordToolPage() {
  return (
    <AiFileTool
      title="PDF 转 Word"
      desc="上传 PDF 后提取可复制文本，并生成 Word 可打开的文档。"
      endpoint="/api/tools/pdf-to-word"
      accept=".pdf,application/pdf"
      outputKey="text"
      downloadLabel="下载 Word"
    />
  )
}
