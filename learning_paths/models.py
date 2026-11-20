
from django.db import models
from django.conf import settings


class LearningLevel(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"


class LearningPath(models.Model):

    title = models.CharField(max_length=150)

    slug = models.SlugField(unique=True)

    description = models.TextField()

    target_role = models.CharField(max_length=120)

    level = models.CharField(
        max_length=20,
        choices=LearningLevel.choices,
        default=LearningLevel.BEGINNER
    )

    estimated_hours = models.PositiveSmallIntegerField(default=10)

    is_published = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class LearningModule(models.Model):

    learning_path = models.ForeignKey(
        LearningPath,
        on_delete=models.CASCADE,
        related_name="modules"
    )

    title = models.CharField(max_length=150)

    description = models.TextField(blank=True)

    content = models.TextField(blank=True)

    order = models.PositiveSmallIntegerField()

    estimated_minutes = models.PositiveSmallIntegerField(default=30)

    resource_url = models.URLField(blank=True)

    resource_label = models.CharField(
        max_length=150,
        blank=True
    )

    practice_tasks = models.JSONField(
        default=list,
        blank=True
    )

    is_published = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]

        constraints = [
            models.UniqueConstraint(
                fields=["learning_path", "order"],
                name="unique_module_order_per_learning_path"
            )
        ]

    def __str__(self):
        return f"{self.learning_path.title} - {self.title}"


class LearningPathEnrollment(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_path_enrollments"
    )

    learning_path = models.ForeignKey(
        LearningPath,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    started_at = models.DateTimeField(auto_now_add=True)

    last_accessed_at = models.DateTimeField(auto_now=True)

    is_completed = models.BooleanField(default=False)

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "learning_path"],
                name="unique_user_learning_path_enrollment"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.learning_path.title}"


class LearningModuleProgress(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_module_progress"
    )

    module = models.ForeignKey(
        LearningModule,
        on_delete=models.CASCADE,
        related_name="user_progress"
    )

    is_completed = models.BooleanField(default=False)

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "module"],
                name="unique_user_learning_module_progress"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.module.title}"
