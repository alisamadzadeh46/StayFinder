from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_name   = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = [
            'id', 'listing', 'author', 'author_name', 'author_avatar',
            'rating', 'cleanliness', 'accuracy', 'communication', 'location', 'value',
            'comment', 'created_at',
        ]
        read_only_fields = ['id', 'author', 'created_at']

    def get_author_name(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def get_author_avatar(self, obj):
        return obj.author.avatar

    def validate(self, data):
        request = self.context.get('request')
        listing = data.get('listing') or (self.instance.listing if self.instance else None)
        if request and listing:
            existing = Review.objects.filter(listing=listing, author=request.user)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError('You have already reviewed this listing.')
        return data
