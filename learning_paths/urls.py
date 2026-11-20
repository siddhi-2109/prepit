
from django.urls import path

from .views import (
    LearningPathListView,
    LearningPathDetailView,
    LearningPathEnrollView,
    LearningModuleProgressView,
)


urlpatterns = [

    # List all available learning paths
    path(
        "",
        LearningPathListView.as_view(),
        name="learning-path-list"
    ),

    # Retrieve one learning path
    path(
        "<slug:slug>/",
        LearningPathDetailView.as_view(),
        name="learning-path-detail"
    ),

    # Enroll in a learning path
    path(
        "<slug:slug>/enroll/",
        LearningPathEnrollView.as_view(),
        name="learning-path-enroll"
    ),

    # Update module completion
    path(
        "modules/<int:module_id>/progress/",
        LearningModuleProgressView.as_view(),
        name="learning-module-progress"
    ),

]
