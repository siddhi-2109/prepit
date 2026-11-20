
from django.contrib import admin
from django.urls import path, include
from accounts.views import ProfileView, UserSettingsView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/profile/", ProfileView.as_view(), name="profile"),
    path("api/v1/settings/", UserSettingsView.as_view(), name="user-settings"),
    path("api/v1/interviews/", include("interviews.urls")),
    path("api/v1/learning-paths/", include("learning_paths.urls")),
]
