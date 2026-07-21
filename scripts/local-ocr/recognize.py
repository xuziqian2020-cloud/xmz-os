import argparse
import json
from pathlib import Path
from typing import Any, Iterable, Mapping

import fitz
from paddleocr import PaddleOCR


def parse_arguments() -> argparse.Namespace:
    """XMZADD 20260721 读取本机识别任务所需的输入、输出和临时目录参数。"""
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--temp-dir", required=True)
    return parser.parse_args()


def collect_texts(result: Mapping[str, Any]) -> str:
    """XMZADD 20260721 从 PaddleOCR 3 的结果对象中整理有效的文字行。"""
    payload = result.get("res", result)
    if not isinstance(payload, Mapping):
        return ""

    texts = payload.get("rec_texts", [])
    if not isinstance(texts, list):
        return ""

    # 排除空行，避免识别引擎的空区域影响业务文本结果。
    return "\n".join(text for text in texts if isinstance(text, str) and text.strip())


def create_ocr() -> PaddleOCR:
    """XMZADD 20260721 创建仅使用本机 CPU 的中文方向校正 OCR 引擎。"""
    return PaddleOCR(
        lang="ch",
        device="cpu",
        enable_mkldnn=False,
        use_doc_orientation_classify=True,
        use_doc_unwarping=False,
        use_textline_orientation=True,
    )


def recognize_image(ocr: PaddleOCR, image_path: Path) -> str:
    """XMZADD 20260721 使用 PaddleOCR 3 的结果格式识别单张本地图片。"""
    page_texts = []
    for result in ocr.predict(str(image_path)):
        # PaddleOCR 3 通过 result.json 的 res 节点提供识别文字。
        page_text = collect_texts(result.json)
        if page_text:
            page_texts.append(page_text)
    return "\n".join(page_texts)


def render_pdf_pages(pdf_path: Path, temp_dir: Path) -> Iterable[Path]:
    """XMZADD 20260721 将扫描 PDF 的每页按 300 DPI 渲染为本地图片。"""
    scale = 300 / 72
    document = fitz.open(pdf_path)
    try:
        for page_index, page in enumerate(document):
            # 300 DPI 保留扫描件中文字笔画，降低中文识别缺字风险。
            pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            page_path = temp_dir / f"page-{page_index + 1}.png"
            pixmap.save(str(page_path))
            yield page_path
    finally:
        document.close()


def recognize_file(input_path: Path, temp_dir: Path) -> str:
    """XMZADD 20260721 识别本地图片或逐页识别扫描 PDF 并汇总文字。"""
    ocr = create_ocr()
    if input_path.suffix.lower() != ".pdf":
        return recognize_image(ocr, input_path)

    page_texts = []
    for page_path in render_pdf_pages(input_path, temp_dir):
        try:
            page_text = recognize_image(ocr, page_path)
            if page_text:
                page_texts.append(page_text)
        finally:
            # 扫描页只服务于当前识别，完成后立即释放磁盘并避免敏感影像残留。
            page_path.unlink(missing_ok=True)
    return "\n\n".join(page_texts)


def write_result(output_path: Path, text: str) -> None:
    """XMZADD 20260721 将识别文字以 UTF-8 JSON 交给 Node 服务读取。"""
    output_path.write_text(json.dumps({"text": text}, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    """XMZADD 20260721 执行单次离线 OCR 任务并写出唯一结果文件。"""
    arguments = parse_arguments()
    input_path = Path(arguments.input)
    output_path = Path(arguments.output)
    temp_dir = Path(arguments.temp_dir)
    temp_dir.mkdir(parents=True, exist_ok=True)

    write_result(output_path, recognize_file(input_path, temp_dir))


if __name__ == "__main__":
    main()
