import { NextResponse } from "next/server"
import { buildContentDisposition, resolveStoredFileDownload } from "@/lib/files/download"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { data: file, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (error || !file) return NextResponse.json({ error: "文件不存在" }, { status: 404 })

  const download = resolveStoredFileDownload(file)
  if (download.kind === "missing") return NextResponse.json({ error: "文件地址无效" }, { status: 404 })

  if (download.kind === "remote") {
    const remote = await fetch(download.url)
    if (!remote.ok) return NextResponse.json({ error: "文件下载失败" }, { status: 502 })
    const bytes = await remote.arrayBuffer()
    return new NextResponse(bytes, {
      headers: {
        "content-type": remote.headers.get("content-type") || download.contentType,
        "content-disposition": buildContentDisposition(download.fileName),
        "cache-control": "no-store",
      },
    })
  }

  return new NextResponse(toArrayBuffer(download.bytes), {
    headers: {
      "content-type": download.contentType,
      "content-disposition": buildContentDisposition(download.fileName),
      "cache-control": "no-store",
    },
  })
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}
