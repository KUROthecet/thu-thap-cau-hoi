import html
import re

_TAG_PATTERN = re.compile(r"<[^>]+>")
_WHITESPACE_PATTERN = re.compile(r"[ \t]+")
_BLANK_LINES_PATTERN = re.compile(r"\n{3,}")


def strip_html_tags(raw: str) -> str:
    without_tags = _TAG_PATTERN.sub(" ", raw)
    unescaped = html.unescape(without_tags)
    collapsed = _WHITESPACE_PATTERN.sub(" ", unescaped)
    return _BLANK_LINES_PATTERN.sub("\n\n", collapsed).strip()
