import { AiFileTool } from "@/components/tools/ai-file-tool"

export default function TranscriptionPage() {
  return (
    <AiFileTool
      title="音视频转文字"
      desc="上传音频或视频文件后调用当前启用供应商的转写接口。"
      endpoint="/api/tools/transcribe"
      accept="audio/*,video/*,.mp3,.mp4,.m4a,.wav,.webm"
      outputKey="text"
      promptPlaceholder="可选：输入识别提示，例如专有名词、会议主题或语言。"
      modelPlaceholder="转写模型，例如 sensevoice"
      defaultModel="sensevoice"
      allowDiarize
    />
  )
}
