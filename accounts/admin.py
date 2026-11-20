from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
    )

    list_filter = ("is_staff", "is_active", "is_superuser")

    search_fields = ("username", "email", "first_name", "last_name")

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2"),
        }),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "education",
        "experience_level",
        "target_role",
        "created_at",
    )

    list_filter = ("experience_level",)

    search_fields = (
        "user__username",
        "user__email",
        "target_role",
    )