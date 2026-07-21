import unittest
from unittest.mock import patch

from recognize import collect_texts, create_ocr


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


if __name__ == "__main__":
    unittest.main()
