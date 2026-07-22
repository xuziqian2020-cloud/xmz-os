"use client"

import { useRef, useState } from "react"
import { selectBrowserAiProvider, selectBrowserAudioProvider } from "@/lib/ai/local-providers"

export default function MeetingMinutesPage() {
  const [title, setTitle] = useState("会议纪要")
  const [attendees, setAttendees] = useState("")
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState("")
  const [minutes, setMinutes] = useState("")
  const [wordHtml, setWordHtml] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState("")
  const [speechHint, setSpeechHint] = useState("")
  const [liveTranscribing, setLiveTranscribing] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const recognitionRef = useRef<any>(null)

  function startLiveTranscription(): boolean {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return false

    const recognition = new SpeechRecognition()
    recognition.lang = "zh-CN"
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      let text = ""
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          text += event.results[index][0]?.transcript || ""
        }
      }
      if (text.trim()) setTranscript((current) => appendTranscript(current, text))
    }
    recognition.onerror = () => setLiveTranscribing(false)
    recognition.onend = () => setLiveTranscribing(false)
    recognition.start()
    recognitionRef.current = recognition
    setLiveTranscribing(true)
    return true
  }

  async function startMeeting() {
    setError("")
    setSpeechHint("")
    setTranscript("")
    setMinutes("")
    setWordHtml("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }
      recorder.start()
      const liveStarted = startLiveTranscription()
      setSpeechHint(liveStarted ? "实时转写已开启，停止记录后可以直接生成纪要。" : "当前浏览器不支持实时转写，停止后可使用供应商转写。")
      setRecording(true)
    } catch (e: any) {
      setError(e.message || "无法启动麦克风")
    }
  }

  function stopMeeting() {
    recorderRef.current?.stop()
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setLiveTranscribing(false)
    setRecording(false)
  }

  /** XMZADD 20260722 使用音频供应商完成录音转写并提示未返回的发言人标识 */
  async function transcribeMeeting() {
    if (!audioBlob) return
    setLoading("正在转写会议录音...")
    setError("")
    const audioProvider = selectBrowserAudioProvider()
    const formData = new FormData()
    formData.append("file", new File([audioBlob], "meeting.webm", { type: audioBlob.type || "audio/webm" }))
    formData.append("provider", JSON.stringify(audioProvider))
    formData.append("model", audioProvider?.default_model || "sensevoice")
    formData.append("prompt", `${title}；参会人员：${attendees}`)
    formData.append("diarize", "true")

    try {
      const res = await fetch("/api/tools/transcribe", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "会议转写失败")
        return
      }
      setTranscript(data.text || "")
      setSpeechHint(data.hasSpeakerLabels ? "" : "转写完成，但当前服务未返回发言人区分。")
    } catch (e: any) {
      setError(e.message || "会议转写失败")
    } finally {
      setLoading("")
    }
  }

  async function generateMinutes() {
    if (!transcript.trim()) return
    setLoading("正在生成会议纪要...")
    setError("")
    try {
      const res = await fetch("/api/tools/meeting-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          attendees: parseAttendees(attendees),
          transcript,
          provider: selectBrowserAiProvider(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "会议纪要生成失败")
        return
      }
      setMinutes(data.minutes || "")
      setWordHtml(data.html || "")
    } catch (e: any) {
      setError(e.message || "会议纪要生成失败")
    } finally {
      setLoading("")
    }
  }

  function downloadWord() {
    if (!wordHtml) return
    const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${title || "会议纪要"}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">会议纪要</h1>
        <p className="mt-2 text-base text-muted-foreground">开会时实时转写，或录音后转写，再生成可下载的 Word 会议纪要。</p>
      </div>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-6 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">会议主题</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="form-input h-11" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">参会人员</span>
          <input value={attendees} onChange={(event) => setAttendees(event.target.value)} placeholder="用逗号分隔" className="form-input h-11" />
        </label>

        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button type="button" onClick={startMeeting} disabled={recording} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            点击开会
          </button>
          <button type="button" onClick={stopMeeting} disabled={!recording} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">
            停止记录
          </button>
          <button type="button" onClick={transcribeMeeting} disabled={!audioBlob || Boolean(loading)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">
            转为文字
          </button>
          <button type="button" onClick={generateMinutes} disabled={!transcript.trim() || Boolean(loading)} className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-40">
            生成纪要
          </button>
          <button type="button" onClick={downloadWord} disabled={!wordHtml} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">
            下载 Word
          </button>
          {recording && <span className="text-sm text-red-500">记录中</span>}
          {liveTranscribing && <span className="text-sm text-emerald-600">实时转写中</span>}
          {loading && <span className="text-sm text-muted-foreground">{loading}</span>}
        </div>

        {speechHint && <p className="text-sm text-muted-foreground lg:col-span-2">{speechHint}</p>}
        {error && <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive lg:col-span-2">{error}</p>}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4 text-base font-semibold">会议文字</div>
          <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} className="min-h-[28rem] w-full resize-y bg-transparent p-5 text-sm leading-7 outline-none" />
        </div>
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4 text-base font-semibold">会议纪要</div>
          <textarea value={minutes} onChange={(event) => setMinutes(event.target.value)} className="min-h-[28rem] w-full resize-y bg-transparent p-5 text-sm leading-7 outline-none" />
        </div>
      </section>
    </div>
  )
}

function parseAttendees(value: string): string[] {
  return value.split(/[,，、\n]/).map((item) => item.trim()).filter(Boolean)
}

function appendTranscript(current: string, next: string): string {
  const text = next.trim()
  if (!text) return current
  return [current.trim(), text].filter(Boolean).join("\n")
}
