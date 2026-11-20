from django.contrib import admin
from django.urls import path,include
from accounts.views import ProfileView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/",include("accounts.urls")),
     path("api/v1/profile/", ProfileView.as_view(), name="profile"),
     path("api/v1/interviews/",include("interviews.urls")),
]
