
from django.contrib import admin

from .models import (
    LearningPath,
    LearningModule,
    LearningPathEnrollment,
    LearningModuleProgress,
)


class LearningModuleInline(admin.TabularInline):
    model = LearningModule
    extra = 0
    fields = (
        "title",
        "order",
        "estimated_minutes",
        "is_published",
    )
    ordering = ("order",)


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "target_role",
        "level",
        "estimated_hours",
        "is_published",
    )
    list_filter = ("level", "is_published")
    search_fields = ("title", "target_role", "description")
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("title",)
    inlines = [LearningModuleInline]


@admin.register(LearningModule)
class LearningModuleAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "learning_path",
        "order",
        "estimated_minutes",
        "is_published",
    )
    list_filter = ("is_published", "learning_path")
    search_fields = (
        "title",
        "description",
        "content",
        "learning_path__title",
    )
    ordering = ("learning_path", "order")


@admin.register(LearningPathEnrollment)
class LearningPathEnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "learning_path",
        "started_at",
        "last_accessed_at",
        "is_completed",
        "completed_at",
    )
    list_filter = ("is_completed", "learning_path")
    search_fields = (
        "user__username",
        "user__email",
        "learning_path__title",
    )
    readonly_fields = (
        "started_at",
        "last_accessed_at",
    )


@admin.register(LearningModuleProgress)
class LearningModuleProgressAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "module",
        "is_completed",
        "completed_at",
        "updated_at",
    )
    list_filter = (
        "is_completed",
        "module__learning_path",
    )
    search_fields = (
        "user__username",
        "user__email",
        "module__title",
        "module__learning_path__title",
    )
    readonly_fields = ("updated_at",)
