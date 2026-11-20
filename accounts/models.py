
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    email = models.EmailField(unique=True)

    # Kept for compatibility with the existing database.
    email_verified = models.BooleanField(default=True)

    def __str__(self):
        return self.username


class UserProfile(models.Model):

    class ExperienceLevel(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    education = models.CharField(max_length=150, blank=True)

    experience_level = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        default=ExperienceLevel.BEGINNER,
    )

    target_role = models.CharField(max_length=100, blank=True)
    skills = models.JSONField(default=list, blank=True)
    career_goal = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class UserSettings(models.Model):

    class Theme(models.TextChoices):
        LIGHT = "light", "Light"
        DARK = "dark", "Dark"
        SYSTEM = "system", "System default"

    class AccentColor(models.TextChoices):
        BLUE = "blue", "Blue"
        VIOLET = "violet", "Violet"
        TEAL = "teal", "Teal"
        ROSE = "rose", "Rose"

    class Density(models.TextChoices):
        COMFORTABLE = "comfortable", "Comfortable"
        COMPACT = "compact", "Compact"

    class InterviewMode(models.TextChoices):
        TEXT = "text", "Text"
        VOICE = "voice", "Voice"

    class Difficulty(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    class InterviewType(models.TextChoices):
        TECHNICAL = "technical", "Technical"
        HR = "hr", "HR / Behavioral"
        PROJECT = "project", "Project-based"
        RESUME = "resume", "Resume-based"

    QUESTION_COUNT_CHOICES = [
        (5, "5 questions"),
        (8, "8 questions"),
        (10, "10 questions"),
        (15, "15 questions"),
        (20, "20 questions"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="app_settings",
    )

    theme = models.CharField(
        max_length=10,
        choices=Theme.choices,
        default=Theme.SYSTEM,
    )

    accent_color = models.CharField(
        max_length=10,
        choices=AccentColor.choices,
        default=AccentColor.BLUE,
    )

    density = models.CharField(
        max_length=15,
        choices=Density.choices,
        default=Density.COMFORTABLE,
    )

    default_interview_mode = models.CharField(
        max_length=10,
        choices=InterviewMode.choices,
        default=InterviewMode.TEXT,
    )

    default_difficulty = models.CharField(
        max_length=15,
        choices=Difficulty.choices,
        default=Difficulty.INTERMEDIATE,
    )

    default_question_count = models.PositiveSmallIntegerField(
        choices=QUESTION_COUNT_CHOICES,
        default=5,
    )

    default_interview_type = models.CharField(
        max_length=15,
        choices=InterviewType.choices,
        default=InterviewType.TECHNICAL,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Settings"
