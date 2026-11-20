
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.db.models import Q, Prefetch
from django.utils import timezone

from .models import (
    InterviewDomain,
    InterviewSession,
    InterviewQuestion,
    ConversationMessage,
    InterviewEvaluation,
    QuestionBankItem,
    QuestionBankProgress,
)

from .serializers import (
    InterviewDomainSerializer,
    InterviewSessionCreateSerializer,
    InterviewSessionSerializer,
    InterviewQuestionSerializer,
    AnswerSerializer,
    ConversationMessageSerializer,
    ConversationMessageCreateSerializer,
    InterviewEvaluationSerializer,
    QuestionBankItemSerializer,
)

from .services import (
    create_interview_session,
    start_interview_session,
    complete_interview_session,
)

from ai_services.services import (
    generate_first_interview_question,
    process_candidate_answer,
    generate_interview_evaluation,
    AIServiceError,
)


# 1. List all active IT interview domains
class InterviewDomainListView(generics.ListAPIView):

    queryset = InterviewDomain.objects.filter(is_active=True)

    serializer_class = InterviewDomainSerializer

    permission_classes = [IsAuthenticated]


# 2. Create and list interview sessions
class InterviewSessionListCreateView(generics.ListCreateAPIView):

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return InterviewSession.objects.filter(
            user=self.request.user
        ).select_related("domain").order_by("-created_at")

    def get_serializer_class(self):

        if self.request.method == "POST":
            return InterviewSessionCreateSerializer

        return InterviewSessionSerializer

    def perform_create(self, serializer):

        session = create_interview_session(
            user=self.request.user,
            validated_data=serializer.validated_data
        )

        serializer.instance = session


# 3. Retrieve one interview session
class InterviewSessionDetailView(generics.RetrieveAPIView):

    serializer_class = InterviewSessionSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return InterviewSession.objects.filter(
            user=self.request.user
        ).select_related("domain")


# 4. Start an interview and generate the first AI question
class InterviewSessionStartView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        # Find the candidate's interview
        session = get_object_or_404(
            InterviewSession,
            pk=pk,
            user=request.user
        )

        # Start the interview
        session = start_interview_session(
            session=session
        )

        try:

            # Generate the first question using Gemini
            first_question = generate_first_interview_question(
                session=session
            )

        except AIServiceError as error:

            return Response(
                {"detail": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Serialize the interview session
        session_serializer = InterviewSessionSerializer(session)

        # Serialize the generated question
        question_serializer = InterviewQuestionSerializer(first_question)

        # Return the session and question
        return Response(
            {
                "session": session_serializer.data,
                "first_question": question_serializer.data
            },
            status=status.HTTP_200_OK
        )


# 5. Get and save interview conversation messages
class InterviewConversationMessageView(APIView):

    permission_classes = [IsAuthenticated]

    def get_session(self, pk, user):

        return get_object_or_404(
            InterviewSession,
            pk=pk,
            user=user
        )

    # GET: Retrieve the complete conversation
    def get(self, request, pk):

        session = self.get_session(
            pk=pk,
            user=request.user
        )

        messages = ConversationMessage.objects.filter(
            session=session
        ).select_related(
            "question",
            "answer"
        ).order_by("sequence")

        serializer = ConversationMessageSerializer(
            messages,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # POST: Process a candidate's answer using Gemini AI
    def post(self, request, pk):

        # BLOCK 1: Get the interview session
        session = self.get_session(
            pk=pk,
            user=request.user
        )

        # BLOCK 2: Validate the submitted answer
        serializer = ConversationMessageCreateSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data["question"]
        content = serializer.validated_data["content"]
        message_mode = serializer.validated_data["message_mode"]

        # BLOCK 3: Check question ownership
        if question.session_id != session.pk:

            raise ValidationError({
                "question": "This question does not belong to this interview."
            })

        try:

            # BLOCK 4: Process the answer using Gemini
            result = process_candidate_answer(
                session=session,
                current_question=question,
                answer_text=content,
                message_mode=message_mode
            )

        except AIServiceError as error:

            return Response(
                {"detail": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # BLOCK 5: Serialize the saved answer
        answer_serializer = AnswerSerializer(
            result["answer"]
        )

        # BLOCK 6: Serialize the candidate's message
        user_message_serializer = ConversationMessageSerializer(
            result["user_message"]
        )

        # BLOCK 7: Serialize the AI's response
        # Service returns "ai_message", not "ai_response"
        ai_response_serializer = ConversationMessageSerializer(
            result["ai_message"]
        )

        # BLOCK 8: Serialize the next question
        next_question = result["next_question"]

        next_question_data = None

        if next_question is not None:

            next_question_serializer = InterviewQuestionSerializer(
                next_question
            )

            next_question_data = next_question_serializer.data

        # BLOCK 9: Serialize the AI question message
        question_message = result["question_message"]

        question_message_data = None

        if question_message is not None:

            question_message_serializer = ConversationMessageSerializer(
                question_message
            )

            question_message_data = question_message_serializer.data

        # BLOCK 10: Serialize the updated session
        session_serializer = InterviewSessionSerializer(
            result["session"]
        )

        # BLOCK 11: Return the complete interview turn
        return Response(
            {
                "action": result["action"],
                "answer": answer_serializer.data,
                "user_message": user_message_serializer.data,
                "ai_response": ai_response_serializer.data,
                "next_question": next_question_data,
                "question_message": question_message_data,
                "session": session_serializer.data,
            },
            status=status.HTTP_201_CREATED
        )


# 6. Complete an interview
class InterviewSessionCompleteView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        session = get_object_or_404(
            InterviewSession,
            pk=pk,
            user=request.user
        )

        session = complete_interview_session(
            session=session
        )

        serializer = InterviewSessionSerializer(session)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

# 7. Generate and retrieve interview evaluation
class InterviewEvaluationView(APIView):

    permission_classes = [IsAuthenticated]

    # Generate an evaluation for a completed interview
    def post(self, request, pk):

        # BLOCK 1: Get the candidate's interview session
        session = get_object_or_404(
            InterviewSession,
            pk=pk,
            user=request.user
        )

        try:

            # BLOCK 2: Generate or retrieve the evaluation
            evaluation = generate_interview_evaluation(
                session=session
            )

        except AIServiceError as error:

            return Response(
                {"detail": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # BLOCK 3: Convert evaluation into JSON
        serializer = InterviewEvaluationSerializer(
            evaluation
        )

        # BLOCK 4: Return the evaluation report
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # Retrieve an already generated evaluation
    def get(self, request, pk):

        # BLOCK 1: Get the candidate's interview
        session = get_object_or_404(
            InterviewSession,
            pk=pk,
            user=request.user
        )

        # BLOCK 2: Find its evaluation
        evaluation = InterviewEvaluation.objects.filter(
            session=session
        ).first()

        if evaluation is None:

            return Response(
                {
                    "detail": "Evaluation has not been generated yet."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # BLOCK 3: Serialize the evaluation
        serializer = InterviewEvaluationSerializer(
            evaluation
        )

        # BLOCK 4: Return the report
        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    
# 8. List and filter Question Bank items
class QuestionBankListView(generics.ListAPIView):

    serializer_class = QuestionBankItemSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        progress_queryset = QuestionBankProgress.objects.filter(
            user=user
        )

        queryset = QuestionBankItem.objects.filter(
            is_active=True
        ).select_related(
            "domain"
        ).prefetch_related(
            Prefetch(
                "user_progress",
                queryset=progress_queryset,
                to_attr="current_user_progress"
            )
        )

        # Search questions, topics, domains and sample answers
        search = self.request.query_params.get(
            "search", ""
        ).strip()

        if search:
            queryset = queryset.filter(
                Q(question_text__icontains=search)
                | Q(topic__icontains=search)
                | Q(domain__name__icontains=search)
                | Q(sample_answer__icontains=search)
            )

        # Filter by domain name
        domain = self.request.query_params.get("domain")

        if domain and domain.lower() != "all":
            queryset = queryset.filter(
                domain__name__iexact=domain
            )

        # Filter by difficulty
        difficulty = self.request.query_params.get("difficulty")

        if difficulty and difficulty.lower() != "all":
            queryset = queryset.filter(
                difficulty=difficulty.lower()
            )

        # Show bookmarked questions
        bookmarked = self.request.query_params.get("bookmarked")

        if bookmarked and bookmarked.lower() == "true":
            queryset = queryset.filter(
                user_progress__user=user,
                user_progress__is_bookmarked=True
            )

        # Show practised questions
        practiced = self.request.query_params.get("practiced")

        if practiced and practiced.lower() == "true":
            queryset = queryset.filter(
                user_progress__user=user,
                user_progress__is_practiced=True
            )

        return queryset.distinct()


# 9. Update a user's Question Bank progress
class QuestionBankProgressUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        question = get_object_or_404(
            QuestionBankItem,
            pk=pk,
            is_active=True
        )

        allowed_fields = {
            "is_bookmarked",
            "is_practiced"
        }

        submitted_fields = set(request.data.keys())

        if not submitted_fields or not submitted_fields.issubset(allowed_fields):
            return Response(
                {
                    "detail": "Send is_bookmarked or is_practiced."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        for field in submitted_fields:

            if not isinstance(request.data[field], bool):

                return Response(
                    {
                        field: "This field must be true or false."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        progress, created = QuestionBankProgress.objects.get_or_create(
            user=request.user,
            question=question
        )

        # Update bookmark status
        if "is_bookmarked" in request.data:

            progress.is_bookmarked = request.data["is_bookmarked"]

        # Update practice status
        if "is_practiced" in request.data:

            new_practice_status = request.data["is_practiced"]

            if new_practice_status and not progress.is_practiced:

                progress.practice_count += 1
                progress.last_practiced_at = timezone.now()

            progress.is_practiced = new_practice_status

        progress.save()

        return Response(
            {
                "question_id": question.id,
                "is_bookmarked": progress.is_bookmarked,
                "is_practiced": progress.is_practiced,
                "practice_count": progress.practice_count,
                "last_practiced_at": progress.last_practiced_at,
            },
            status=status.HTTP_200_OK
        )