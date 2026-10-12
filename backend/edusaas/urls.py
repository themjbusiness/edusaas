from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import RedirectView

from lms import frontend

# The Django panel is for the EduSaas team only (all colleges); college admins use the in-app Admin area (F22).
admin.site.site_header = "EduSaas team admin (all colleges)"
admin.site.site_title = "EduSaas team admin"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("admin", RedirectView.as_view(url="/admin/")),
    path("api/", include("lms.urls")),
    re_path(r"^media/(?P<path>.+)$", frontend.serve_media),
    re_path(r"^app(/.*)?$", RedirectView.as_view(url="/")),  # the new app was previewed at /app/ before the switch-over
    re_path(r"^(?P<path>.*)$", frontend.serve),
]
