from pathlib import Path
import os
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Core ─────────────────────────────────────────────────────────────────────
SECRET_KEY   = os.environ.get('SECRET_KEY', 'django-dev-secret-key-change-in-production')
DEBUG        = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
    'django_filters',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.listings',
    'apps.bookings',
    'apps.reviews',
    'apps.wishlists',
    'apps.search',
    'apps.seo',
    'apps.messaging',
    'apps.notifications',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

WSGI_APPLICATION = 'config.wsgi.application'

# ─── Database ─────────────────────────────────────────────────────────────────
# PostgreSQL in production, SQLite for local dev (no Docker needed)
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES = {'default': dj_database_url.config(conn_max_age=600)}
elif os.environ.get('POSTGRES_DB'):
    DATABASES = {
        'default': {
            'ENGINE':   'django.db.backends.postgresql',
            'NAME':     os.environ.get('POSTGRES_DB',       'stayfinder'),
            'USER':     os.environ.get('POSTGRES_USER',     'stayfinder'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'stayfinder'),
            'HOST':     os.environ.get('POSTGRES_HOST',     'localhost'),
            'PORT':     os.environ.get('POSTGRES_PORT',     '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

STATIC_URL    = '/static/'
STATIC_ROOT   = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []
WHITENOISE_ROOT = os.path.join(BASE_DIR, 'static', 'frontend')
MEDIA_URL     = '/media/'
MEDIA_ROOT    = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── DRF ──────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
}

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    *([o for o in os.environ.get('CORS_ORIGINS', '').split(',') if o])
]
CORS_ALLOW_CREDENTIALS = True

# ─── Email ────────────────────────────────────────────────────────────────────
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend'  # prints to console in dev
)
EMAIL_HOST          = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT          = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL  = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@stayfinder.com')

# ─── Celery ───────────────────────────────────────────────────────────────────
CELERY_BROKER_URL        = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND    = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT    = ['json']
CELERY_TASK_SERIALIZER   = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE          = 'UTC'

# ─── Cloudinary (image uploads) ───────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY    = os.environ.get('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')

# ─── Cache (Redis) ────────────────────────────────────────────────────────────
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',  # dev
        # For production with Redis:
        # 'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        # 'LOCATION': REDIS_URL,
    }
}

# ─── Elasticsearch ────────────────────────────────────────────────────────────
ELASTICSEARCH_DSL = {
    'default': {'hosts': os.environ.get('ELASTICSEARCH_URL', 'http://localhost:9200')},
}
ELASTICSEARCH_DSL_AUTOSYNC = False

# ─── Security (production) ────────────────────────────────────────────────────
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER        = True
    SECURE_CONTENT_TYPE_NOSNIFF      = True
    X_FRAME_OPTIONS                  = 'DENY'
    SECURE_HSTS_SECONDS              = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS   = True
    SECURE_HSTS_PRELOAD              = True
    SESSION_COOKIE_SECURE            = True
    CSRF_COOKIE_SECURE               = True

# ─── SEO ──────────────────────────────────────────────────────────────────────
SITE_URL = os.environ.get('SITE_URL', 'http://localhost:3000')
