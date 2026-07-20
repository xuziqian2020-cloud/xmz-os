import { AiFileTool } from "@/components/tools/ai-file-tool"

/** XMZADD 20260720 展示支持图片与 PDF 上传的百度 Unlimited-OCR 页面。 */
export default function OcrToolPage() {
  return (
    <AiFileTool
      title="OCR 识别"
      desc="上传图片或 PDF 后，使用百度 Unlimited-OCR 识别文字。"
      endpoint="/api/tools/ocr"
      accept="image/*,application/pdf,.pdf"
      outputKey="text"
      outputModes={[
        { key: "text", label: "文本" },
        { key: "markdown", label: "Markdown" },
        { key: "table", label: "表格" },
      ]}
    />
  )
}
