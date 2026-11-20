from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from .models import User,UserProfile

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password2",
        ]

        read_only_fields = ["id"]

    def validate(self, attrs):

        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({
                "password2": "Passwords do not match."
            })

        return attrs

    def create(self, validated_data):

        validated_data.pop("password2")

        with transaction.atomic():

            user = User.objects.create_user(**validated_data)

            UserProfile.objects.create(user=user)

        return user

class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserProfile

        fields = [
            "id",
            "education",
            "experience_level",
            "target_role",
            "skills",
            "career_goal",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_skills(self, value):

        if not isinstance(value, list):
            raise serializers.ValidationError(
                "Skills must be provided as a list."
            )

        if not all(isinstance(skill, str) for skill in value):
            raise serializers.ValidationError(
                "Each skill must be text."
            )

        return [skill.strip() for skill in value if skill.strip()]