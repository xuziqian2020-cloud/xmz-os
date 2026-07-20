import { AiFileTool } from "@/components/tools/ai-file-tool"

export default function OcrToolPage() {
  return (
    <AiFileTool
      title="OCR 识别"
      desc="上传图片后使用本地 OCR 识别文字。"
      endpoint="/api/tools/ocr"
      accept="image/*"
      outputKey="text"
      allowOcrLanguage
      outputModes={[
        { key: "text", label: "文本" },
        { key: "markdown", label: "Markdown" },
        { key: "table", label: "表格" },
      ]}
    />
  )
}
