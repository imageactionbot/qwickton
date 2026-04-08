from django.urls import path

from .views import about_page, blog_page, home_page, privacy_page, robots_txt, sitemap_xml

urlpatterns = [
    path("", home_page, name="home"),
    path("privacy", privacy_page, name="privacy"),
    path("about", about_page, name="about"),
    path("blog/<slug:slug>", blog_page, name="blog-detail"),
    path("robots.txt", robots_txt, name="robots"),
    path("sitemap.xml", sitemap_xml, name="sitemap"),
]
