
from django.db import transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    LearningPath,
    LearningModule,
    LearningPathEnrollment,
    LearningModuleProgress,
)

from .serializers import LearningPathSerializer


def learning_path_queryset(user):

    module_progress = LearningModuleProgress.objects.filter(
        user=user
    )

    modules = LearningModule.objects.filter(
        is_published=True
    ).prefetch_related(
        Prefetch(
            "user_progress",
            queryset=module_progress,
            to_attr="current_user_progress",
        )
    )

    enrollments = LearningPathEnrollment.objects.filter(
        user=user
    )

    return LearningPath.objects.filter(
        is_published=True
    ).prefetch_related(
        Prefetch(
            "modules",
            queryset=modules,
            to_attr="visible_modules",
        ),
        Prefetch(
            "enrollments",
            queryset=enrollments,
            to_attr="current_user_enrollment",
        ),
    )


# 1. List all published learning paths
class LearningPathListView(generics.ListAPIView):

    serializer_class = LearningPathSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return learning_path_queryset(
            self.request.user
        )


# 2. Retrieve one learning path
class LearningPathDetailView(generics.RetrieveAPIView):

    serializer_class = LearningPathSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "slug"

    def get_queryset(self):

        return learning_path_queryset(
            self.request.user
        )


# 3. Enroll a candidate in a learning path
class LearningPathEnrollView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, slug):

        learning_path = get_object_or_404(
            LearningPath,
            slug=slug,
            is_published=True
        )

        enrollment, created = (
            LearningPathEnrollment.objects.get_or_create(
                user=request.user,
                learning_path=learning_path
            )
        )

        if not created:

            enrollment.last_accessed_at = timezone.now()

            enrollment.save(
                update_fields=["last_accessed_at"]
            )

        return Response(
            {
                "detail": "Learning path enrolled successfully.",
                "is_enrolled": True,
                "learning_path": learning_path.slug,
            },
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            )
        )


# 4. Update a candidate's module completion
class LearningModuleProgressView(APIView):

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, module_id):

        module = get_object_or_404(
            LearningModule.objects.select_related(
                "learning_path"
            ),
            pk=module_id,
            is_published=True,
            learning_path__is_published=True
        )

        is_completed = request.data.get(
            "is_completed"
        )

        if not isinstance(is_completed, bool):

            return Response(
                {
                    "is_completed": (
                        "This field must be true or false."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment, _ = (
            LearningPathEnrollment.objects.get_or_create(
                user=request.user,
                learning_path=module.learning_path
            )
        )

        progress, _ = (
            LearningModuleProgress.objects.get_or_create(
                user=request.user,
                module=module
            )
        )

        progress.is_completed = is_completed

        progress.completed_at = (
            timezone.now() if is_completed else None
        )

        progress.save()

        published_modules = LearningModule.objects.filter(
            learning_path=module.learning_path,
            is_published=True
        )

        total = published_modules.count()

        completed = LearningModuleProgress.objects.filter(
            user=request.user,
            module__in=published_modules,
            is_completed=True
        ).count()

        enrollment.is_completed = (
            total > 0 and completed == total
        )

        enrollment.completed_at = (
            timezone.now()
            if enrollment.is_completed
            else None
        )

        enrollment.last_accessed_at = timezone.now()

        enrollment.save(
            update_fields=[
                "is_completed",
                "completed_at",
                "last_accessed_at"
            ]
        )

        return Response(
            {
                "module_id": module.id,
                "is_completed": progress.is_completed,
                "completed_modules": completed,
                "module_count": total,
                "progress_percent": (
                    round(completed * 100 / total)
                    if total else 0
                ),
                "path_completed": enrollment.is_completed,
            },
            status=status.HTTP_200_OK
        )
