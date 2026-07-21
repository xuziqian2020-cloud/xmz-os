import sys

sys.dont_write_bytecode = True

import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

from recognize import collect_texts, create_ocr, recognize_file


class CollectTextsTests(unittest.TestCase):
    """XMZADD 20260721 验证 PaddleOCR 结果文字整理及 CPU 引擎配置。"""

    def test_collects_non_empty_recognition_texts(self):
        """XMZADD 20260721 确保有效识别行按原始顺序交给业务文本。"""
        result = collect_texts({"res": {"rec_texts": ["标题", "", "合同编号 1001"]}})

        self.assertEqual(result, "标题\n合同编号 1001")

    def test_returns_empty_string_for_empty_recognition_texts(self):
        """XMZADD 20260721 确保无文字页面不会生成无意义的空白行。"""
        result = collect_texts({"res": {"rec_texts": []}})

        self.assertEqual(result, "")

    def test_creates_cpu_engine_with_mkldnn_disabled(self):
        """XMZADD 20260721 确保 CPU 识别避开当前 oneDNN 执行器兼容性故障。"""
        with patch("recognize.PaddleOCR") as paddle_ocr:
            create_ocr()

        self.assertFalse(paddle_ocr.call_args.kwargs["enable_mkldnn"])


class RenderedPdfPageCleanupTests(unittest.TestCase):
    """XMZADD 20260721 验证扫描 PDF 每页渲染图片不会残留在任务目录。"""

    def test_deletes_each_rendered_page_after_successful_recognition(self):
        """XMZADD 20260721 确保多页扫描件逐页处理后立即释放临时图片。"""
        with tempfile.TemporaryDirectory() as directory:
            temp_dir = Path(directory)
            first_page = temp_dir / "page-1.png"
            second_page = temp_dir / "page-2.png"
            first_page.write_bytes(b"first")
            second_page.write_bytes(b"second")

            def render_pages(_input_path, _temp_dir):
                yield first_page
                self.assertFalse(first_page.exists())
                yield second_page
                self.assertFalse(second_page.exists())

            with patch("recognize.create_ocr", return_value=object()), patch(
                "recognize.render_pdf_pages", side_effect=render_pages
            ), patch("recognize.recognize_image", side_effect=["第一页", "第二页"]):
                result = recognize_file(Path("扫描件.pdf"), temp_dir)

            self.assertEqual(result, "第一页\n\n第二页")
            self.assertFalse(second_page.exists())

    def test_deletes_current_rendered_page_when_recognition_fails(self):
        """XMZADD 20260721 确保识别异常不会遗留当前正在处理的扫描页。"""
        with tempfile.TemporaryDirectory() as directory:
            temp_dir = Path(directory)
            current_page = temp_dir / "page-1.png"
            current_page.write_bytes(b"page")

            with patch("recognize.create_ocr", return_value=object()), patch(
                "recognize.render_pdf_pages", return_value=iter([current_page])
            ), patch("recognize.recognize_image", side_effect=RuntimeError("识别异常")):
                with self.assertRaisesRegex(RuntimeError, "识别异常"):
                    recognize_file(Path("扫描件.pdf"), temp_dir)

            self.assertFalse(current_page.exists())


if __name__ == "__main__":
    unittest.main()
