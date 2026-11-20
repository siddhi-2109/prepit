
from rest_framework import serializers

from .models import (
    InterviewDomain,
    InterviewSession,
    InterviewQuestion,
    Answer,
    ConversationMessage,
    InterviewEvaluation,
    AnswerInputMode,
    InterviewType,
    QuestionBankItem,
    QuestionBankProgress,
    
)


# 1. Interview domain serializer
class InterviewDomainSerializer(serializers.ModelSerializer):

    class Meta:
        model = InterviewDomain

        fields = [
            "id",
            "name",
            "category",
            "description",
        ]


# 2. Create a new interview session
class InterviewSessionCreateSerializer(serializers.ModelSerializer):

    domain = serializers.PrimaryKeyRelatedField(
        queryset=InterviewDomain.objects.filter(is_active=True)
    )

    class Meta:
        model = InterviewSession

        fields = [
            "id",
            "domain",
            "target_role",
            "difficulty",
            "question_count",
            "interview_type",
            "status",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "created_at",
        ]

    def validate_question_count(self, value):

        if not 1 <= value <= 20:
            raise serializers.ValidationError(
                "Choose between 1 and 20 questions."
            )

        return value

    def create(self, validated_data):

        user = self.context["request"].user

        return InterviewSession.objects.create(
            user=user,
            **validated_data
        )


# 3. Retrieve interview session details
class InterviewSessionSerializer(serializers.ModelSerializer):

    domain = InterviewDomainSerializer(read_only=True)

    class Meta:
        model = InterviewSession

        fields = [
            "id",
            "domain",
            "target_role",
            "difficulty",
            "question_count",
            "interview_type",
            "status",
            "created_at",
            "started_at",
            "completed_at",
        ]


# 4. Retrieve questions asked during an interview
class InterviewQuestionSerializer(serializers.ModelSerializer):

    class Meta:
        model = InterviewQuestion

        fields = [
            "id",
            "question_text",
            "topic",
            "difficulty",
            "order",
            "question_type",
            "parent_question",
            "generated_by",
        ]

        read_only_fields = fields


# 5. Validate a candidate's answer
class AnswerCreateSerializer(serializers.Serializer):

    answer_text = serializers.CharField(
        trim_whitespace=True,
        allow_blank=False
    )

    input_mode = serializers.ChoiceField(
        choices=AnswerInputMode.choices,
        default=AnswerInputMode.TEXT
    )


# 6. Retrieve saved answers
class AnswerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Answer

        fields = [
            "id",
            "attempt_number",
            "answer_text",
            "input_mode",
            "submitted_at",
        ]

        read_only_fields = fields


# 7. Retrieve complete interview conversation
class ConversationMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ConversationMessage

        fields = [
            "id",
            "session",
            "question",
            "answer",
            "speaker",
            "content",
            "sequence",
            "message_mode",
            "created_at",
        ]

        read_only_fields = fields


# Validate a new candidate conversation message
class ConversationMessageCreateSerializer(serializers.Serializer):

    question = serializers.PrimaryKeyRelatedField(
        queryset=InterviewQuestion.objects.all()
    )

    content = serializers.CharField(
        trim_whitespace=True,
        allow_blank=False
    )

    message_mode = serializers.ChoiceField(
        choices=AnswerInputMode.choices,
        default=AnswerInputMode.TEXT
    )

# Evaluation report serializer
class InterviewEvaluationSerializer(serializers.ModelSerializer):

    class Meta:

        model = InterviewEvaluation

        fields = [
            "id",
            "session",
            "overall_score",
            "technical_knowledge_score",
            "answer_quality_score",
            "communication_score",
            "summary",
            "strengths",
            "improvement_areas",
            "recommendations",
            "question_feedback",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

# 8. Question Bank serializer
class QuestionBankItemSerializer(serializers.ModelSerializer):

    domain = serializers.CharField(
        source="domain.name",
        read_only=True
    )

    minutes = serializers.IntegerField(
        source="estimated_minutes",
        read_only=True
    )

    question = serializers.CharField(
        source="question_text",
        read_only=True
    )

    answer = serializers.CharField(
        source="sample_answer",
        read_only=True
    )

    keyPoints = serializers.ListField(
        source="key_points",
        read_only=True
    )

    is_bookmarked = serializers.SerializerMethodField()

    is_practiced = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBankItem

        fields = [
            "id",
            "domain",
            "topic",
            "difficulty",
            "minutes",
            "question",
            "answer",
            "keyPoints",
            "is_bookmarked",
            "is_practiced",
        ]

        read_only_fields = fields

    def get_is_bookmarked(self, obj):

        progress = getattr(obj, "current_user_progress", [])

        return progress[0].is_bookmarked if progress else False

    def get_is_practiced(self, obj):

        progress = getattr(obj, "current_user_progress", [])

        return progress[0].is_practiced if progress else False