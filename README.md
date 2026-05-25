<div align="center">

# 🏠 StayFinder

**A full-stack vacation rental platform built with Django & React**

[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)

[Features](#-features) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Tech Stack](#-tech-stack) · [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🏡 Core
- Browse, search and filter vacation listings worldwide
- Full booking system with date conflict validation
- Review system with star ratings
- Wishlist / save listings
- JWT authentication (register, login, token refresh)
- Full-text search with Elasticsearch (falls back to Django ORM)

### 🚀 Advanced
- **Real image upload** — Cloudinary (production) or local storage (dev)
- **Messaging system** — guest ↔ host chat with unread badges
- **Email notifications** — booking requests, confirmations, new messages (Celery + SMTP)
- **Host dashboard** — stats, revenue, booking management, listing activation
- **Interactive map** — OpenStreetMap with location picker in admin panel
- **Rate limiting** — API throttling (100/hr anon, 1000/hr authenticated)
- **Security headers** — HSTS, XSS protection, CSRF (production mode)

### 🔍 SEO
- Dynamic meta tags + Open Graph + Twitter Card per page
- JSON-LD structured data (LodgingBusiness, AggregateRating, BreadcrumbList)
- Auto-generated `sitemap.xml` + `sitemap-images.xml`
- `robots.txt`
- Canonical URLs with slug-based routes
- SSR meta shell for crawlers at `/meta/listing/<slug>/`

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### One command

```bash
git clone https://github.com/alisamadzadeh46/StayFinder.git
cd stayfinder
docker-compose up --build
```

That's it. Visit **http://localhost:8000**

> First build takes ~3 minutes. Subsequent starts are instant.

### Demo accounts

| Role  | Email | Password |
|-------|-------|----------|
| Host  | host@example.com  | password123 |
| Guest | guest@example.com | password123 |
| Admin | http://localhost:8000/admin | (create with `createsuperuser`) |

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | dev key |
| `DEBUG` | Debug mode | `True` |
| `POSTGRES_*` | PostgreSQL credentials | stayfinder/stayfinder |
| `CLOUDINARY_*` | Image uploads (optional) | local storage fallback |
| `EMAIL_HOST_USER` | Gmail address for notifications | console output |
| `EMAIL_HOST_PASSWORD` | Gmail App Password | — |
| `SITE_URL` | Your domain | http://localhost:8000 |

---

## 📁 Project Structure

```
stayfinder/
├── backend/                  # Django REST API
│   ├── apps/
│   │   ├── accounts/         # Auth, user profiles
│   │   ├── listings/         # Properties, image upload
│   │   ├── bookings/         # Reservations
│   │   ├── reviews/          # Ratings & reviews
│   │   ├── wishlists/        # Saved listings
│   │   ├── messaging/        # Guest ↔ host chat
│   │   ├── notifications/    # Email tasks (Celery)
│   │   ├── search/           # Full-text search
│   │   └── seo/              # Sitemap, robots, JSON-LD
│   ├── config/               # Django settings, URLs, Celery
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 # React 18 + Vite
│   ├── src/
│   │   ├── pages/            # HomePage, ListingDetail, Dashboard...
│   │   ├── components/       # Header, ListingCard, MapView...
│   │   ├── hooks/            # useAuth, useSEO
│   │   └── utils/            # apiFetch, formatPrice
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── .env.example
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Create account |
| `POST` | `/api/auth/login/` | Login → JWT tokens |
| `POST` | `/api/auth/token/refresh/` | Refresh access token |
| `GET`  | `/api/auth/profile/` | Get current user |
| `PATCH`| `/api/auth/profile/update/` | Update profile |
| `POST` | `/api/auth/profile/password/` | Change password |
| `GET`  | `/api/auth/profile/stats/` | User/host stats |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/listings/` | Browse listings |
| `POST` | `/api/listings/` | Create listing (host) |
| `GET`  | `/api/listings/<slug>/` | Listing detail |
| `POST` | `/api/listings/upload-image/` | Upload image |
| `GET`  | `/api/listings/host/stats/` | Host dashboard stats |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/bookings/` | My bookings |
| `POST` | `/api/bookings/` | Create booking |
| `POST` | `/api/bookings/<id>/confirm/` | Confirm (host) |
| `POST` | `/api/bookings/<id>/cancel/` | Cancel |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/search/?q=paris` | Full-text search |
| `GET`  | `/api/search/?city=tokyo&property_type=apartment` | Filter |
| `GET`  | `/api/search/autocomplete/?q=san` | City autocomplete |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/messages/` | All conversations |
| `POST` | `/api/messages/start/` | Start conversation |
| `GET`  | `/api/messages/<id>/` | Get messages |
| `POST` | `/api/messages/<id>/send/` | Send message |
| `GET`  | `/api/messages/unread/` | Unread count |

### SEO
| Endpoint | Description |
|----------|-------------|
| `/sitemap.xml` | Full sitemap |
| `/sitemap-images.xml` | Image sitemap |
| `/robots.txt` | Robots rules |
| `/api/seo/listing/<slug>/` | JSON-LD structured data |

---

## 🛠 Tech Stack

### Backend
- **Django 4.2** + **Django REST Framework**
- **PostgreSQL 16** — primary database
- **Redis 7** — Celery broker + cache
- **Celery** — async email notifications
- **SimpleJWT** — JWT authentication
- **Gunicorn** — production WSGI server
- **Whitenoise** — static file serving
- **Cloudinary** — image storage (optional)
- **Elasticsearch** — full-text search (optional, ORM fallback)

### Frontend
- **React 18** + **Vite**
- **React Router 6** — client-side routing
- **Leaflet** + **OpenStreetMap** — interactive maps
- **date-fns** — date formatting
- Custom design system (no UI library)

### Infrastructure
- **Docker Compose** — one-command setup
- PostgreSQL + Redis + Django + Celery + React all containerized

---

## 🗺 Architecture

```
Browser
   │
   └── http://localhost:8000
            │
         Django (Gunicorn)
            ├── /api/*          → REST API (DRF)
            ├── /admin/         → Django Admin
            ├── /sitemap.xml    → SEO endpoints
            └── /*              → React build (index.html)
                                   └── React Router (client-side)

Background:
   Celery Worker ← Redis ← Django (email notifications)
```

---

## 🚢 Production Deployment

1. Set environment variables in `.env`:
```bash
DEBUG=False
SECRET_KEY=your-random-50-char-secret
ALLOWED_HOSTS=yourdomain.com
SITE_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

2. Configure Cloudinary for image uploads
3. Set up Gmail App Password for email notifications
4. Run:
```bash
docker-compose up -d --build
```

---

## 📄 License

MIT — feel free to use this project for learning or as a base for your own product.

---

