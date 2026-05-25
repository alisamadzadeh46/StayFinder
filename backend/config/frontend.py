"""
Serves the built React app for all non-API routes.
React Router handles client-side routing.
"""
from django.http import FileResponse, HttpResponse
from django.conf import settings
import os

FRONTEND_DIR = os.path.join(settings.BASE_DIR, 'static', 'frontend')


def serve_react(request, path=''):
    """Serve React index.html for all frontend routes."""
    index = os.path.join(FRONTEND_DIR, 'index.html')
    if os.path.exists(index):
        with open(index, 'rb') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse(
        '<h2>Frontend not built yet.</h2>'
        '<p>Run: <code>docker-compose up --build</code></p>',
        status=503
    )
