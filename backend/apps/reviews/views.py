from rest_framework import generics, permissions
from .models import Review
from .serializers import ReviewSerializer
from apps.listings.models import Listing


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def _get_listing_id(self):
        # Support both /reviews/listings/42/ and /reviews/listings/my-slug/
        pk = self.kwargs.get('listing_pk')
        if pk:
            return pk
        slug = self.kwargs.get('listing_slug')
        return Listing.objects.get(slug=slug).id

    def get_queryset(self):
        return Review.objects.filter(
            listing_id=self._get_listing_id()
        ).select_related('author').order_by('-created_at')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, listing_id=self._get_listing_id())


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(author=self.request.user)
