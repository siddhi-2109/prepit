from rest_framework import serializers
from .models import LearningPath, LearningModule


class LearningModuleSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = LearningModule
        fields = [
            "id", "title", "description", "content", "order",
            "estimated_minutes", "resource_url", "resource_label",
            "practice_tasks", "is_completed",
        ]
        read_only_fields = fields

    def get_is_completed(self, obj):
        progress = getattr(obj, "current_user_progress", [])
        return bool(progress and progress[0].is_completed)


class LearningPathSerializer(serializers.ModelSerializer):
    modules = serializers.SerializerMethodField()
    module_count = serializers.SerializerMethodField()
    completed_modules = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = LearningPath
        fields = [
            "id", "title", "slug", "description", "target_role", "level",
            "estimated_hours", "module_count", "completed_modules",
            "progress_percent", "is_enrolled", "is_completed", "modules",
        ]
        read_only_fields = fields

    def _modules(self, obj):
        modules = getattr(obj, "visible_modules", None)
        if modules is not None:
            return modules
        return list(obj.modules.filter(is_published=True))

    def get_modules(self, obj):
        return LearningModuleSerializer(self._modules(obj), many=True).data

    def get_module_count(self, obj):
        return len(self._modules(obj))

    def get_completed_modules(self, obj):
        return sum(
            1 for module in self._modules(obj)
            if getattr(module, "current_user_progress", [])
            and module.current_user_progress[0].is_completed
        )

    def get_progress_percent(self, obj):
        total = self.get_module_count(obj)
        if not total:
            return 0
        return round(self.get_completed_modules(obj) * 100 / total)

    def get_is_enrolled(self, obj):
        return bool(getattr(obj, "current_user_enrollment", []))

    def get_is_completed(self, obj):
        enrollment = getattr(obj, "current_user_enrollment", [])
        return bool(enrollment and enrollment[0].is_completed)
