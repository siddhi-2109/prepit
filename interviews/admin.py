
from django.contrib import admin

from .models import (
    InterviewDomain,
    QuestionBankItem,
    InterviewSession,
    InterviewQuestion,
    Answer,
    ConversationMessage,
)


# 1. Interview Domain Admin
@admin.register(InterviewDomain)
class InterviewDomainAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "category",
        "is_active",
        "created_at",
    )

    list_filter = (
        "category",
        "is_active",
    )

    search_fields = (
        "name",
        "category",
        "description",
    )


# 2. Question Bank Admin
@admin.register(QuestionBankItem)
class QuestionBankItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "domain",
        "topic",
        "difficulty",
        "is_active",
        "created_at",
    )

    list_filter = (
        "domain",
        "difficulty",
        "is_active",
    )

    search_fields = (
        "question_text",
        "topic",
        "domain__name",
    )


# 3. Interview Session Admin
@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "domain",
        "target_role",
        "difficulty",
        "interview_type",
        "question_count",
        "status",
        "created_at",
    )

    list_filter = (
        "domain",
        "difficulty",
        "interview_type",
        "status",
    )

    search_fields = (
        "user__username",
        "user__email",
        "target_role",
    )


# 4. Interview Question Admin
@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "session",
        "topic",
        "difficulty",
        "question_type",
        "generated_by",
        "order",
    )

    list_filter = (
        "difficulty",
        "topic",
        "question_type",
        "generated_by",
    )

    search_fields = (
        "question_text",
        "topic",
        "session__user__username",
    )


# 5. Answer Admin
@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "question",
        "attempt_number",
        "input_mode",
        "submitted_at",
    )

    list_filter = (
        "input_mode",
        "submitted_at",
    )

    search_fields = (
        "answer_text",
        "question__question_text",
    )


# 6. Complete Conversation Message Admin
@admin.register(ConversationMessage)
class ConversationMessageAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "session",
        "sequence",
        "speaker",
        "message_mode",
        "created_at",
    )

    list_filter = (
        "speaker",
        "message_mode",
        "created_at",
    )

    search_fields = (
        "content",
        "session__user__username",
        "session__domain__name",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = (
        "session",
        "sequence",
    )

    list_select_related = (
        "session",
        "question",
        "answer",
    )
