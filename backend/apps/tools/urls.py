from django.urls import path

from .views import analytics_event, tool_category_page, tool_detail_page

urlpatterns = [
    path("api/analytics-event", analytics_event, name="analytics-event"),
    path("<slug:category>/", tool_category_page, name="tool-category"),
    path("<slug:category>/<slug:tool>/", tool_detail_page, name="tool-detail"),
]
