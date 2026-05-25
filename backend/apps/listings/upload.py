"""
Image upload endpoint — supports Cloudinary (production) and local storage (dev).
"""
import os, uuid
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    """
    POST /api/listings/upload-image/
    Accepts: multipart/form-data with 'image' field.
    Returns: { url, public_id }
    """
    file = request.FILES.get('image')
    if not file:
        return Response({'error': 'No image provided.'}, status=400)

    # Validate file type
    allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if file.content_type not in allowed:
        return Response({'error': 'Only JPEG, PNG, WebP, GIF allowed.'}, status=400)

    # Max 10MB
    if file.size > 10 * 1024 * 1024:
        return Response({'error': 'Image too large (max 10MB).'}, status=400)

    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', '')
    api_key    = getattr(settings, 'CLOUDINARY_API_KEY', '')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', '')

    if cloud_name and api_key and api_secret:
        # ── Cloudinary upload ────────────────────────────────────────────────
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
            )
            result = cloudinary.uploader.upload(
                file,
                folder='stayfinder/listings',
                transformation=[
                    {'width': 1200, 'height': 800, 'crop': 'fill', 'quality': 'auto', 'fetch_format': 'auto'}
                ]
            )
            return Response({'url': result['secure_url'], 'public_id': result['public_id']})
        except Exception as e:
            return Response({'error': f'Cloudinary upload failed: {e}'}, status=500)
    else:
        # ── Local storage fallback (dev only) ────────────────────────────────
        ext      = file.name.rsplit('.', 1)[-1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        upload_dir = settings.MEDIA_ROOT / 'listings'
        upload_dir.mkdir(parents=True, exist_ok=True)
        path = upload_dir / filename
        with open(path, 'wb+') as dest:
            for chunk in file.chunks():
                dest.write(chunk)
        url = f"{request.build_absolute_uri('/')[:-1]}{settings.MEDIA_URL}listings/{filename}"
        return Response({'url': url, 'public_id': filename})
