
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from rest_framework.exceptions import ValidationError

from .models import (
    InterviewSession,
    ConversationMessage,
    MessageSpeaker,
    AnswerInputMode,
)


# 1. Create a new interview session
@transaction.atomic
def create_interview_session(*, user, validated_data):

    session = InterviewSession.objects.create(
        user=user,
        **validated_data
    )

    return session


# 2. Start an interview session
@transaction.atomic
def start_interview_session(*, session):

    locked_session = InterviewSession.objects.select_for_update().get(
        pk=session.pk
    )

    if locked_session.status == InterviewSession.Status.IN_PROGRESS:
        return locked_session

    if locked_session.status != InterviewSession.Status.CREATED:
        raise ValidationError(
            "This interview cannot be started."
        )

    locked_session.status = InterviewSession.Status.IN_PROGRESS
    locked_session.started_at = timezone.now()

    locked_session.save(
        update_fields=["status", "started_at"]
    )

    return locked_session


# 3. Save a message in the interview conversation
@transaction.atomic
def save_conversation_message(
    *,
    session,
    speaker,
    content,
    question=None,
    answer=None,
    message_mode=AnswerInputMode.TEXT,
):

    locked_session = InterviewSession.objects.select_for_update().get(
        pk=session.pk
    )

    # Check whether the interview is active
    if locked_session.status != InterviewSession.Status.IN_PROGRESS:
        raise ValidationError(
            "Messages can only be added to an active interview."
        )

    # Validate the message speaker
    if speaker not in MessageSpeaker.values:
        raise ValidationError(
            "Invalid message speaker."
        )

    # Validate the input mode
    if message_mode not in AnswerInputMode.values:
        raise ValidationError(
            "Invalid message mode."
        )

    # Remove unnecessary spaces
    content = content.strip()

    if not content:
        raise ValidationError(
            "Message content cannot be empty."
        )

    # Check that the question belongs to this session
    if question is not None:
        if question.session_id != locked_session.pk:
            raise ValidationError(
                "This question does not belong to this interview."
            )

    # Check that the answer belongs to this session
    if answer is not None:

        if answer.question.session_id != locked_session.pk:
            raise ValidationError(
                "This answer does not belong to this interview."
            )

        if question is None:
            question = answer.question

        elif answer.question_id != question.pk:
            raise ValidationError(
                "The answer does not belong to the selected question."
            )

    # Find the last message sequence number
    last_message = ConversationMessage.objects.filter(
        session=locked_session
    ).aggregate(
        max_sequence=Max("sequence")
    )

    next_sequence = (last_message["max_sequence"] or 0) + 1

    # Save the new conversation message
    message = ConversationMessage.objects.create(
        session=locked_session,
        question=question,
        answer=answer,
        speaker=speaker,
        content=content,
        sequence=next_sequence,
        message_mode=message_mode
    )

    return message


# 4. Complete an interview session
@transaction.atomic
def complete_interview_session(*, session):

    locked_session = InterviewSession.objects.select_for_update().get(
        pk=session.pk
    )

    if locked_session.status == InterviewSession.Status.COMPLETED:
        return locked_session

    if locked_session.status != InterviewSession.Status.IN_PROGRESS:
        raise ValidationError(
            "Only an active interview can be completed."
        )

    locked_session.status = InterviewSession.Status.COMPLETED
    locked_session.completed_at = timezone.now()

    locked_session.save(
        update_fields=["status", "completed_at"]
    )

    return locked_session
