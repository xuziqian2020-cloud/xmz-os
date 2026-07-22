# Local WebM Transcription Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make browser-recorded WebM meeting audio transcribe through local FunASR, use `sensevoice` as the audio-tool default, and expose safe actionable errors.

**Architecture:** Keep the existing OpenAI-compatible local FunASR endpoint. Use the free `imageio-ffmpeg` decoder installed inside `E:\Ollama\funasr-venv`; the FunASR startup script resolves its versioned binary, refreshes the `ffmpeg.exe` compatibility entry, and prepends its directory only to the FunASR process PATH so it can decode WebM before inference. The Next.js route returns only strictly whitelisted safe prompts, never arbitrary local-service details.

**Tech Stack:** Next.js 13, TypeScript, FastAPI/FunASR, local FFmpeg, Node test runner.

---

### Task 1: Lock the UI and error-response regression cases

**Files:**
- Modify: `src/lib/ai/audio.test.ts`
- Modify: `src/app/api/tools/transcribe/route.test.ts`
- Modify: `src/app/tools/transcription/page.tsx`
- Modify: `src/lib/ai/audio.ts`
- Modify: `src/app/api/tools/transcribe/route.ts`

- [x] **Step 1: Write failing tests**

Add an assertion that a missing model in `buildTranscriptionForm` serializes `sensevoice`, and a route test where FunASR returns `{ "detail": "FunASR 转写失败：未找到 ffmpeg" }` with HTTP 500; assert the API response returns the corresponding strictly whitelisted safe prompt rather than the raw detail.

- [x] **Step 2: Run the targeted tests and verify they fail**

Run: `& $nodePath scripts/run-tests.mjs src/lib/ai/audio.test.ts src/app/api/tools/transcribe/route.test.ts`

Expected: the former fails because the fallback is `whisper-1`; the latter fails because the route does not yet return the mapped safe prompt.

- [x] **Step 3: Implement the minimal application fix**

Change the audio-form fallback and audio-tool input default from `whisper-1` to `sensevoice`. Add a small response-message reader in the transcribe route that maps known local decoder failures to strictly whitelisted safe prompts, and otherwise falls back to the HTTP-status wording without exposing arbitrary `detail` or `error.message` strings.

- [x] **Step 4: Run the targeted tests and verify they pass**

Run: `& $nodePath scripts/run-tests.mjs src/lib/ai/audio.test.ts src/app/api/tools/transcribe/route.test.ts`

Expected: all targeted tests pass.

### Task 2: Enable WebM decoding in the local FunASR runtime

**Files:**
- Modify: `E:\Ollama\funasr-server\start-funasr.ps1`
- Verify: `E:\Ollama\funasr-server\server.py`

- [x] **Step 1: Install the local FFmpeg decoder in `E:\Ollama\funasr-venv`**

Use the `imageio-ffmpeg` package in the existing E-disk FunASR virtual environment. Do not change global PATH or install models onto C drive.

- [x] **Step 2: Update the FunASR startup script**

Before starting Python, locate the versioned FFmpeg binary supplied by `imageio-ffmpeg`, refresh the sibling `ffmpeg.exe` compatibility entry, and prepend that directory to the process-local `PATH`. Fail with a readable message if the decoder is absent, so recorded WebM files are never sent to a decoder that cannot read them.

- [x] **Step 3: Restart the local FunASR process**

Stop only the listener on `127.0.0.1:8001`, then start `E:\Ollama\funasr-server\start-funasr.ps1` in a detached local process.

- [x] **Step 4: Verify an actual WebM request**

POST an actual WebM sample to `/v1/audio/transcriptions` with `model=sensevoice`, `response_format=verbose_json`, and `spk=true`; require HTTP 200 and a non-empty transcription. Remove only that explicit temporary WebM afterward.

### Task 3: Full verification and handoff

**Files:**
- Modify: `docs/funasr-local-setup.md`

- [x] **Step 1: Update the setup document**

Document that browser meetings require the local `imageio-ffmpeg` decoder in `E:\Ollama\funasr-venv`, and that the startup script locates it automatically and adds it only for FunASR.

- [x] **Step 2: Run complete verification**

Run the full Node test suite and `next build` using the bundled Node runtime, then check FunASR health, local Ollama models, and a WebM transcription response.

- [x] **Step 3: Commit on `main`**

Run `git diff --check`, stage only the plan, application changes, tests, and setup document, and commit with `fix: support local WebM transcription`.
