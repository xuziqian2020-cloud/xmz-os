import json
import logging
import sys
from pathlib import Path
from typing import Any, Mapping

import fitz
from rapidocr import RapidOCR

MAX_PDF_PAGES = 100
LOW_CONFIDENCE_SCORE = 0.70


def emit(payload: Mapping[str, Any]) -> None:
    """XMZADD 20260721 向 Node 后台队列输出单行任务事件，保持进度消息可被稳定解析。"""
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def emit_failure(job_id: str, code: str, message: str) -> None:
    """XMZADD 20260721 将本机文件和识别异常转换为页面可展示的中文任务失败。"""
    emit({"type": "failed", "jobId": job_id, "code": code, "message": message})


def collect_result(output: Any) -> tuple[str, bool]:
    """XMZADD 20260721 汇总 RapidOCR 单页文字与置信度，标记需要人工复核的扫描页。"""
    texts = getattr(output, "txts", ()) or ()
    scores = getattr(output, "scores", ()) or ()
    lines = [text.strip() for text in texts if isinstance(text, str) and text.strip()]
    is_low_confidence = any(isinstance(score, (float, int)) and score < LOW_CONFIDENCE_SCORE for score in scores)
    return "\n".join(lines), is_low_confidence


def recognize_image(engine: RapidOCR, image_path: Path) -> tuple[str, bool]:
    """XMZADD 20260721 使用已加载的本机 RapidOCR 引擎识别单页图像，避免重复初始化模型。"""
    return collect_result(engine(str(image_path)))


def render_page(page: fitz.Page, page_path: Path) -> None:
    """XMZADD 20260721 以 300 DPI 渲染扫描页，优先保证中文笔画和数字字段的识别清晰度。"""
    scale = 300 / 72
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    pixmap.save(str(page_path))


def recognize_pdf(job_id: str, input_path: Path, engine: RapidOCR) -> None:
    """XMZADD 20260721 按页识别扫描 PDF 并逐页发送进度，阻止超过一百页的本机任务占用资源。"""
    document = fitz.open(input_path)
    try:
        total_pages = document.page_count
        if total_pages > MAX_PDF_PAGES:
            emit_failure(job_id, "page_limit", "PDF 页数不能超过 100 页")
            return

        page_texts: list[str] = []
        low_confidence_pages: list[int] = []
        temp_dir = input_path.parent
        for page_number, page in enumerate(document, start=1):
            page_path = temp_dir / f"page-{page_number}.png"
            try:
                render_page(page, page_path)
                text, is_low_confidence = recognize_image(engine, page_path)
                if text:
                    page_texts.append(text)
                if is_low_confidence:
                    low_confidence_pages.append(page_number)
            finally:
                # 页面图像只用于当前识别，立刻删除以减少本机业务扫描件残留。
                page_path.unlink(missing_ok=True)

            emit({
                "type": "progress",
                "jobId": job_id,
                "completedPages": page_number,
                "totalPages": total_pages,
                "lowConfidencePages": low_confidence_pages,
            })

        emit({
            "type": "completed",
            "jobId": job_id,
            "text": "\n\n".join(page_texts),
            "totalPages": total_pages,
            "lowConfidencePages": low_confidence_pages,
        })
    finally:
        document.close()


def recognize_job(job: Mapping[str, Any], engine: RapidOCR) -> None:
    """XMZADD 20260721 分流图片和 PDF 本机任务，保证非法输入只影响当前任务。"""
    job_id = job.get("jobId")
    input_value = job.get("inputPath")
    if not isinstance(job_id, str) or not isinstance(input_value, str):
        return

    input_path = Path(input_value)
    if not input_path.is_file():
        emit_failure(job_id, "invalid_file", "OCR 文件不存在或已被清理，请重新上传")
        return

    try:
        if input_path.suffix.lower() == ".pdf":
            recognize_pdf(job_id, input_path, engine)
            return

        text, is_low_confidence = recognize_image(engine, input_path)
        emit({
            "type": "completed",
            "jobId": job_id,
            "text": text,
            "totalPages": 1,
            "lowConfidencePages": [1] if is_low_confidence else [],
        })
    except Exception:
        emit_failure(job_id, "recognition_failed", "本机 RapidOCR 识别失败，请检查扫描件后重试")


def main() -> None:
    """XMZADD 20260721 持续监听 Node 队列，复用一次初始化的本机 RapidOCR 模型处理后续任务。"""
    logging.disable(logging.CRITICAL)
    engine = RapidOCR()
    emit({"type": "ready"})

    for line in sys.stdin:
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue

        if isinstance(payload, Mapping):
            recognize_job(payload, engine)


if __name__ == "__main__":
    main()
