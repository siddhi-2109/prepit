
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


# 1. Interview difficulty levels
class DifficultyLevel(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"


# 2. Types of interviews
class InterviewType(models.TextChoices):
    TECHNICAL = "technical", "Technical"
    HR = "hr", "HR / Behavioral"
    PROJECT = "project", "Project Based"
    RESUME = "resume", "Resume Based"


# 3. Types of questions
class QuestionType(models.TextChoices):
    MAIN = "main", "Main Question"
    FOLLOW_UP = "follow_up", "Follow-up Question"
    CLARIFICATION = "clarification", "Clarification Question"


# 4. Source of questions
class QuestionSource(models.TextChoices):
    AI = "ai", "AI Generated"
    QUESTION_BANK = "question_bank", "Question Bank"


# 5. How the candidate answered
class AnswerInputMode(models.TextChoices):
    TEXT = "text", "Text"
    VOICE = "voice", "Voice"


# 6. Who sent the conversation message?
class MessageSpeaker(models.TextChoices):
    AI = "ai", "AI Interviewer"
    USER = "user", "Candidate"


# 7. Interview domain
class InterviewDomain(models.Model):

    name = models.CharField(max_length=120, unique=True)

    category = models.CharField(max_length=100)

    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return self.name


# 8. Optional predefined question bank
class QuestionBankItem(models.Model):

    domain = models.ForeignKey(
        InterviewDomain,
        on_delete=models.PROTECT,
        related_name="question_bank_items"
    )

    question_text = models.TextField()

    topic = models.CharField(max_length=100)

    difficulty = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices
    )

    # Sample answer shown to the candidate
    sample_answer = models.TextField(blank=True)

    # Important points to cover in an answer
    key_points = models.JSONField(default=list, blank=True)

    # Estimated time to answer in minutes
    estimated_minutes = models.PositiveSmallIntegerField(default=3)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.domain.name} - {self.topic}"


class QuestionBankProgress(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="question_bank_progress"
    )

    question = models.ForeignKey(
        QuestionBankItem,
        on_delete=models.CASCADE,
        related_name="user_progress"
    )

    is_bookmarked = models.BooleanField(default=False)

    is_practiced = models.BooleanField(default=False)

    practice_count = models.PositiveIntegerField(default=0)

    last_practiced_at = models.DateTimeField(
        null=True,
        blank=True
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "question"],
                name="unique_user_question_progress"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.question}"


# 9. One complete interview session
class InterviewSession(models.Model):

    class Status(models.TextChoices):
        CREATED = "created", "Created"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interview_sessions"
    )

    domain = models.ForeignKey(
        InterviewDomain,
        on_delete=models.PROTECT,
        related_name="interview_sessions"
    )

    target_role = models.CharField(max_length=100)

    difficulty = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.BEGINNER
    )

    question_count = models.PositiveSmallIntegerField(
        default=5,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(20)
        ]
    )

    interview_type = models.CharField(
        max_length=20,
        choices=InterviewType.choices,
        default=InterviewType.TECHNICAL
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED
    )

    conversation_state = models.JSONField(
        default=dict,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    started_at = models.DateTimeField(null=True, blank=True)

    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.domain.name}"


# 10. Questions asked during an interview
class InterviewQuestion(models.Model):

    session = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name="questions"
    )

    source_question = models.ForeignKey(
        QuestionBankItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="session_questions"
    )

    question_text = models.TextField()

    topic = models.CharField(max_length=100)

    difficulty = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices
    )

    order = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)]
    )

    question_type = models.CharField(
        max_length=20,
        choices=QuestionType.choices,
        default=QuestionType.MAIN
    )

    parent_question = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="follow_up_questions"
    )

    generated_by = models.CharField(
        max_length=20,
        choices=QuestionSource.choices,
        default=QuestionSource.AI
    )

    class Meta:
        ordering = ["order"]

        constraints = [
            models.UniqueConstraint(
                fields=["session", "order"],
                name="unique_question_order_per_session"
            )
        ]

    def __str__(self):
        return f"{self.session} - Question {self.order}"


# 11. Candidate answers
class Answer(models.Model):

    question = models.ForeignKey(
        InterviewQuestion,
        on_delete=models.CASCADE,
        related_name="answers"
    )

    attempt_number = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )

    answer_text = models.TextField()

    input_mode = models.CharField(
        max_length=10,
        choices=AnswerInputMode.choices,
        default=AnswerInputMode.TEXT
    )

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["attempt_number"]

        constraints = [
            models.UniqueConstraint(
                fields=["question", "attempt_number"],
                name="unique_answer_attempt_per_question"
            )
        ]

    def __str__(self):
        return f"Answer to {self.question}"


# 12. Complete conversation between AI and candidate
class ConversationMessage(models.Model):

    session = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    question = models.ForeignKey(
        InterviewQuestion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversation_messages"
    )

    answer = models.ForeignKey(
        Answer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversation_messages"
    )

    speaker = models.CharField(
        max_length=10,
        choices=MessageSpeaker.choices
    )

    content = models.TextField()

    sequence = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    message_mode = models.CharField(
        max_length=10,
        choices=AnswerInputMode.choices,
        default=AnswerInputMode.TEXT
    )

    created_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering = ["sequence"]

        constraints = [
            models.UniqueConstraint(
                fields=["session", "sequence"],
                name="unique_message_sequence_per_session"
            )
        ]

    def __str__(self):
        return f"{self.session} - {self.speaker} - Message {self.sequence}"

# 13. AI-generated evaluation report for a completed interview
class InterviewEvaluation(models.Model):

    # One evaluation belongs to one interview session
    session = models.OneToOneField(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name="evaluation"
    )

    # Overall performance score
    overall_score = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ]
    )

    # Score for technical knowledge
    technical_knowledge_score = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ]
    )

    # Score for answer quality
    answer_quality_score = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ]
    )

    # Score for communication
    communication_score = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ]
    )

    # Overall feedback
    summary = models.TextField()

    # Candidate's strengths
    strengths = models.JSONField(default=list)

    # Areas requiring improvement
    improvement_areas = models.JSONField(default=list)

    # Future preparation recommendations
    recommendations = models.JSONField(default=list)

    # Individual feedback for every question
    question_feedback = models.JSONField(default=list)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"Evaluation - {self.session.user.username} "
            f"- Score: {self.overall_score}/100"
        )
