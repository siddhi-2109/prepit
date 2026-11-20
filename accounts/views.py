from rest_framework import generics
from rest_framework.permissions import AllowAny,  IsAuthenticated

from .models import User, UserProfile
from .serializers import RegisterSerializer , ProfileSerializer


class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()

    serializer_class = RegisterSerializer

    permission_classes = [AllowAny]

class ProfileView(generics.RetrieveUpdateAPIView):

    serializer_class = ProfileSerializer

    permission_classes = [IsAuthenticated]

    def get_object(self):

        profile, created = UserProfile.objects.get_or_create(
            user=self.request.user
        )

        return profile