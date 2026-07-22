# 本地 FunASR 会议转写服务

本服务与 Ollama 均只在本机运行，不需要 DeepSeek 或其他付费 AI API。

## 目录与模型缓存

- Python 虚拟环境：`E:\Ollama\funasr-venv`
- FunASR 服务：`E:\Ollama\funasr-server`
- FunASR/ModelScope 模型缓存：`E:\Ollama\modelscope-cache`
- Hugging Face 模型缓存：`E:\Ollama\huggingface-cache`
- Ollama 模型：`E:\Ollama\models`

所有大文件模型与缓存均在 E 盘。FunASR 首次启动会下载 `SenseVoiceSmall` 模型，下载完成后可离线转写。

## 启动与检查

每次电脑重启后，在 PowerShell 运行：

```powershell
powershell -ExecutionPolicy Bypass -File "E:\Ollama\funasr-server\start-funasr.ps1"
```

等待模型加载完成后，另开一个 PowerShell 检查：

```powershell
Invoke-WebRequest http://127.0.0.1:8001/health -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:8001/v1/models -UseBasicParsing
```

两个接口都返回 HTTP 200 即表示服务可用。服务只监听 `127.0.0.1:8001`，不会对局域网开放；8000 是当前 Windows 系统保留端口，不能使用。

## AI 设置

在“AI 设置”新增并启用以下两项：

| 用途 | 预设 | API 地址 | 模型 | API Key |
| --- | --- | --- | --- | --- |
| 录音转文字 | 本地 FunASR | `http://127.0.0.1:8001/v1` | `sensevoice` | `local` |
| 生成会议纪要 | 本地 Ollama | `http://127.0.0.1:11434/v1` | `qwen3:4b` | `ollama` |

两项必须同时启用。会议页会自动使用 FunASR 转写，再用 Ollama 生成纪要。

## 发言人区分

会议页会请求说话人分段，并在服务返回时显示为“发言人 SPK0：文本”。若本次录音未返回说话人数据，仍可生成纪要，页面会给出明确提示。
