import { AiFileTool } from "@/components/tools/ai-file-tool"

export default function WordToPdfToolPage() {
  return (
    <AiFileTool
      title="Word 转 PDF"
      desc="上传 .docx 后生成 PDF 文件，适合把会议纪要、需求说明固定成可分发版本。"
      endpoint="/api/tools/word-to-pdf"
      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      outputKey="text"
      downloadLabel="下载 PDF"
    />
  )
}
