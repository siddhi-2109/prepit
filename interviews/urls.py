
from django.urls import path

from .views import (
    InterviewDomainListView,
    InterviewSessionListCreateView,
    InterviewSessionDetailView,
    InterviewSessionStartView,
    InterviewConversationMessageView,
    InterviewSessionCompleteView,
    InterviewEvaluationView,
    QuestionBankListView,
    QuestionBankProgressUpdateView,
)


urlpatterns = [

    # List available IT domains
    path(
        "domains/",
        InterviewDomainListView.as_view(),
        name="interview-domains"
    ),

    # Question Bank
path(
    "question-bank/",
    QuestionBankListView.as_view(),
    name="question-bank-list"
),

path(
    "question-bank/<int:pk>/progress/",
    QuestionBankProgressUpdateView.as_view(),
    name="question-bank-progress"
),

    # Create and list interviews
    path(
        "",
        InterviewSessionListCreateView.as_view(),
        name="interview-list-create"
    ),

    # Start an interview
    path(
        "<int:pk>/start/",
        InterviewSessionStartView.as_view(),
        name="interview-start"
    ),

    # Get and save conversation messages
    path(
        "<int:pk>/messages/",
        InterviewConversationMessageView.as_view(),
        name="interview-messages"
    ),

    # Complete an interview
    path(
        "<int:pk>/complete/",
        InterviewSessionCompleteView.as_view(),
        name="interview-complete"
    ),

    # Generate and retrieve interview evaluation
    path(
        "<int:pk>/evaluate/",
        InterviewEvaluationView.as_view(),
        name="interview-evaluation"
    ),

    # Retrieve one interview
    path(
        "<int:pk>/",
        InterviewSessionDetailView.as_view(),
        name="interview-detail"
    ),

]


