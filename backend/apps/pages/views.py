from django.http import HttpRequest, HttpResponse
from django.shortcuts import render

from apps.tools.registry import TOOL_REGISTRY, list_categories


def home_page(request: HttpRequest) -> HttpResponse:
    return render(request, "pages/home.html", {"categories": list_categories()})


def privacy_page(request: HttpRequest) -> HttpResponse:
    return render(request, "pages/privacy.html")


def about_page(request: HttpRequest) -> HttpResponse:
    return render(request, "pages/about.html")


def blog_page(request: HttpRequest, slug: str) -> HttpResponse:
    return render(request, "pages/blog.html", {"slug": slug})


def robots_txt(_: HttpRequest) -> HttpResponse:
    content = "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n"
    return HttpResponse(content, content_type="text/plain")


def sitemap_xml(_: HttpRequest) -> HttpResponse:
    tool_urls: list[str] = []
    for category, content in TOOL_REGISTRY.items():
        tool_urls.append(f"  <url><loc>/tools/{category}/</loc></url>")
        tools = content.get("tools", [])
        for tool in tools:
            slug = getattr(tool, "slug", "")
            if slug:
                tool_urls.append(f"  <url><loc>/tools/{category}/{slug}/</loc></url>")

    xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc></url>
  <url><loc>/privacy</loc></url>
%s
</urlset>
""" % ("\n".join(tool_urls))
    return HttpResponse(xml, content_type="application/xml")
