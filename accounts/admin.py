
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile, UserSettings


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username", "email", "first_name", "last_name",
        "is_staff", "is_active",
    )
    list_filter = ("is_staff", "is_active", "is_superuser")
    search_fields = ("username", "email", "first_name", "last_name")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user", "education", "experience_level",
        "target_role", "created_at",
    )
    list_filter = ("experience_level",)
    search_fields = ("user__username", "user__email", "target_role")


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "user", "theme", "accent_color", "density",
        "default_interview_mode", "updated_at",
    )
    list_filter = ("theme", "accent_color", "density")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("created_at", "updated_at")
