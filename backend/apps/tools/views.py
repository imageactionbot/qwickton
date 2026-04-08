import json

from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .registry import category_exists, get_tool_meta, list_tools_for_category, tool_exists


def tool_category_page(request: HttpRequest, category: str) -> HttpResponse:
    if not category_exists(category):
        return HttpResponse(status=404)
    tools = list_tools_for_category(category)
    category_title = category.replace("-", " ").title()
    return render(
        request,
        "tools/category.html",
        {
            "category": category,
            "category_title": category_title,
            "tools": tools,
            "seo_title": f"{category_title} Tools",
            "seo_description": f"Free {category_title.lower()} tools for beginners and pros. No login, privacy-first, in-browser processing.",
        },
    )


def tool_detail_page(request: HttpRequest, category: str, tool: str) -> HttpResponse:
    if not category_exists(category):
        return HttpResponse(status=404)
    if not tool_exists(category, tool):
        return HttpResponse(status=404)
    tool_meta = get_tool_meta(category, tool)
    human_tool_name = tool_meta.title if tool_meta else tool.replace("-", " ").title()
    description = (
        tool_meta.description
        if tool_meta
        else "Free browser-based processing tool with privacy-first design and no login required."
    )
    return render(
        request,
        "tools/detail.html",
        {
            "category": category,
            "category_title": category.replace("-", " ").title(),
            "tool": tool,
            "tool_title": human_tool_name,
            "tool_description": description,
            "seo_title": f"{human_tool_name} Tool",
            "seo_description": f"{description} Works locally in browser with beginner-friendly flow.",
        },
    )


@csrf_exempt
@require_http_methods(["POST"])
def analytics_event(request: HttpRequest) -> JsonResponse:
    # This endpoint intentionally accepts only metadata, never file data.
    payload = json.loads(request.body.decode("utf-8"))
    allowed_keys = {"event", "tool", "durationMs", "success"}
    sanitized = {k: payload.get(k) for k in allowed_keys}
    return JsonResponse({"ok": True, "received": sanitized})
