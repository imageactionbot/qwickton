from dataclasses import dataclass


@dataclass(frozen=True)
class ToolMeta:
    slug: str
    title: str
    description: str


TOOL_REGISTRY: dict[str, dict[str, object]] = {
    "pdf": {
        "label": "PDF Tools",
        "tools": [
            ToolMeta("merge-pdf", "Merge PDF", "Combine multiple PDF files locally."),
            ToolMeta("split-pdf", "Split PDF", "Split into first or second half of pages."),
            ToolMeta("rotate-pdf", "Rotate PDF", "Rotate every page in the document."),
            ToolMeta("watermark-pdf", "Watermark PDF", "Stamp text watermark on pages."),
            ToolMeta("extract-pages", "Extract Pages", "Save only selected pages as a new PDF."),
            ToolMeta("remove-pages", "Remove Pages", "Delete selected pages and export the rest."),
            ToolMeta("resave-pdf", "Re-save / Repair PDF", "Re-export to fix some broken PDFs (no password unlock)."),
            ToolMeta("add-text-to-pdf", "Add text to PDF", "Overlay typed text on every page in the browser."),
            ToolMeta("strip-pdf-metadata", "Strip PDF metadata", "Remove author/title properties before sharing."),
        ],
    },
    "image": {
        "label": "Image Tools",
        "tools": [
            ToolMeta("compress-image", "Compress Image", "Reduce image size in browser."),
            ToolMeta("resize-image", "Resize Image", "Change dimensions quickly."),
            ToolMeta("convert-image", "Convert Image", "Convert JPG, PNG, WEBP formats."),
            ToolMeta("rotate-flip", "Rotate / Flip", "Rotate and mirror images locally."),
            ToolMeta("batch-image", "Batch Process", "Apply operations to multiple images."),
            ToolMeta("enhance-image", "Enhance Image", "Auto-adjust sharpness and contrast."),
        ],
    },
    "passport-photo": {
        "label": "Passport Photo Studio",
        "tools": [
            ToolMeta("passport-india", "India Passport Photo", "35x45 mm, print-ready layout."),
            ToolMeta("passport-usa", "USA Passport Photo", "2x2 inch standard output."),
            ToolMeta("passport-uk", "UK Passport Photo", "UK compliant photo sizing."),
        ],
    },
    "converter": {
        "label": "Converter Hub",
        "tools": [
            ToolMeta("image-formats", "Image formats", "Switch between JPG, PNG, and WEBP."),
            ToolMeta("excel-csv", "Excel and CSV", "Spreadsheet conversion in the browser."),
        ],
    },
    "text": {
        "label": "Text Utilities",
        "tools": [
            ToolMeta("json-format", "JSON format", "Pretty-print or minify JSON."),
            ToolMeta("base64", "Base64", "Encode or decode text safely offline."),
        ],
    },
}


def category_exists(category: str) -> bool:
    return category in TOOL_REGISTRY


def list_categories() -> list[dict[str, str]]:
    return [{"id": key, "label": value["label"]} for key, value in TOOL_REGISTRY.items()]


def list_tools_for_category(category: str) -> list[ToolMeta]:
    if category not in TOOL_REGISTRY:
        return []
    tools = TOOL_REGISTRY[category]["tools"]
    return tools if isinstance(tools, list) else []


def tool_exists(category: str, tool_slug: str) -> bool:
    return any(tool.slug == tool_slug for tool in list_tools_for_category(category))


def get_tool_meta(category: str, tool_slug: str) -> ToolMeta | None:
    for tool in list_tools_for_category(category):
        if tool.slug == tool_slug:
            return tool
    return None
