export type MeetingMinutesInput = {
  title: string
  attendees: string[]
  transcript: string
}

export type MeetingMinutesDocument = MeetingMinutesInput & {
  minutes: string
  createdAt?: Date
}

export function buildMeetingMinutesPrompt(input: MeetingMinutesInput): string {
  return [
    "请基于以下会议转写内容生成中文会议纪要。",
    `会议主题：${input.title || "未命名会议"}`,
    `参会人员：${input.attendees.length > 0 ? input.attendees.join("、") : "未填写"}`,
    "",
    "输出结构必须包含：",
    "1. 会议概要",
    "2. 关键讨论",
    "3. 决策结论",
    "4. 行动项，包含负责人和截止时间，没有就写待确认",
    "5. 风险和待确认问题",
    "",
    "会议转写：",
    input.transcript,
  ].join("\n")
}

export function buildMeetingMinutesHtml(input: MeetingMinutesDocument): string {
  const createdAt = input.createdAt || new Date()
  const body = markdownToHtml(input.minutes || "暂无会议纪要")
  const transcript = escapeHtml(input.transcript || "暂无转写内容").replace(/\n/g, "<br />")

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(input.title || "会议纪要")}</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; color: #111827; line-height: 1.8; padding: 42px 56px; }
    h1 { text-align: center; font-size: 24px; margin: 0 0 12px; }
    h2 { font-size: 17px; margin: 24px 0 8px; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; }
    p, li { font-size: 14px; }
    .meta { text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 22px; }
    .transcript { margin-top: 28px; background: #f8fafc; border: 1px solid #e5e7eb; padding: 14px 16px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(input.title || "会议纪要")}</h1>
  <p class="meta">生成时间：${escapeHtml(createdAt.toLocaleString("zh-CN"))} | 参会人员：${escapeHtml(input.attendees.join("、") || "未填写")}</p>
  ${body}
  <div class="transcript">
    <h2>原始转写</h2>
    <p>${transcript}</p>
  </div>
</body>
</html>`
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/)
  const output: string[] = []
  let inList = false

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (inList) {
        output.push("</ul>")
        inList = false
      }
      output.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
    } else if (line.startsWith("- ")) {
      if (!inList) {
        output.push("<ul>")
        inList = true
      }
      output.push(`<li>${escapeHtml(line.slice(2))}</li>`)
    } else if (line.trim()) {
      if (inList) {
        output.push("</ul>")
        inList = false
      }
      output.push(`<p>${escapeHtml(line)}</p>`)
    }
  }

  if (inList) output.push("</ul>")
  return output.join("\n")
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
