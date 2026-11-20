from django.test import TestCase
from django.contrib.auth import get_user_model


class UserModelTests(TestCase):

    def test_user_can_be_created(self):
        User = get_user_model()

        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="StrongTest123!"
        )

        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(
            user.check_password("StrongTest123!")
        )

    def test_email_must_be_unique(self):
        User = get_user_model()

        User.objects.create_user(
            username="user1",
            email="test@example.com",
            password="StrongTest123!"
        )

        with self.assertRaises(Exception):
            User.objects.create_user(
                username="user2",
                email="test@example.com",
                password="StrongTest123!"
            )