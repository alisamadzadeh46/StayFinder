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

# 🏠 StayFinder — Airbnb Clone v2

A production-grade full-stack Airbnb clone with a **Django REST API** backend and a **React + Vite** frontend. Features separate Django apps per domain, Elasticsearch integration, OpenStreetMap, and a full host dashboard.

---

## ✨ What's New in v2

| Feature | Details |
|---------|---------|
| **Separated Django apps** | `accounts`, `listings`, `bookings`, `reviews`, `wishlists`, `search` |
| **Elasticsearch** | Full-text fuzzy search with auto-fallback to Django ORM |
| **OpenStreetMap** | Interactive map on listing detail pages (Leaflet.js) |
| **Host Dashboard** | Stats, manage listings, confirm/view bookings |
| **Multi-page React** | React Router — dedicated pages per section |
| **JWT Auth** | Access + refresh tokens (auto-refresh on 401) |
| **New Listing form** | Hosts can create listings from the UI |
| **Autocomplete** | City/country suggestions in search bar |
| **Sub-ratings** | Reviews now include cleanliness, accuracy, communication scores |

---


## 🗂 Project Structure

```
airbnb-v2/
├── backend/
│   ├── config/               # Django config (settings, urls, wsgi)
│   ├── apps/
│   │   ├── accounts/         # Custom User model, JWT auth
│   │   ├── listings/         # Listing + Image models, host dashboard API
│   │   ├── bookings/         # Booking model, availability, confirm
│   │   ├── reviews/          # Review model with sub-ratings
│   │   ├── wishlists/        # Save/unsave listings
│   │   └── search/           # Elasticsearch document + search view
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx          # Browse + filter listings
    │   │   ├── ListingDetailPage.jsx # Full detail, map, booking, reviews
    │   │   ├── HostDashboard.jsx     # Host stats + listing/booking mgmt
    │   │   ├── NewListingPage.jsx    # Create listing form
    │   │   └── TripsAndSaved.jsx     # My trips + wishlist
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   ├── AuthModal.jsx
    │   │   ├── ListingCard.jsx
    │   │   ├── FilterBar.jsx
    │   │   ├── MapView.jsx           # Leaflet + OpenStreetMap
    │   │   └── UI.jsx                # Shared components
    │   ├── hooks/
    │   │   └── useAuth.jsx           # Auth context
    │   └── utils/
    │       └── api.js                # JWT-aware fetch + token refresh
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

pip install -r requirements.txt

python manage.py makemigrations accounts listings bookings reviews wishlists
python manage.py migrate
python manage.py seed_data

python manage.py runserver
```

API: `http://localhost:8000`
Admin: `http://localhost:8000/admin`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:3000`

---

## 🔐 Test Accounts

| Role  | Email                | Password    |
|-------|----------------------|-------------|
| Host  | host@example.com     | password123 |
| Guest | guest@example.com    | password123 |

---

## 🔍 Elasticsearch (optional)

The search API gracefully falls back to Django ORM if Elasticsearch is unavailable. To enable it:

```bash
# Install and start Elasticsearch 8.x
# macOS
brew install elastic/tap/elasticsearch-full
brew services start elasticsearch-full

# Or via Docker
docker run -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0

# Index your data
python manage.py search_index --rebuild
```

---

## 📡 API Reference

### Auth — `/api/auth/`
| Method | Path | Description |
|--------|------|-------------|
| POST | `register/` | Create account → returns JWT tokens |
| POST | `login/` | Login → returns JWT tokens |
| POST | `token/refresh/` | Refresh access token |
| GET/PATCH | `profile/` | View or update own profile |

### Listings — `/api/listings/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all active listings (filterable) |
| POST | `/` | Create listing (auth required) |
| GET | `/{id}/` | Listing detail |
| PATCH | `/{id}/` | Update listing (host only) |
| DELETE | `/{id}/` | Delete listing (host only) |
| GET | `host/my-listings/` | Host's own listings |
| GET | `host/stats/` | Host dashboard stats |
| GET | `host/bookings/` | All bookings on host's listings |

### Search — `/api/search/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Search listings (ES or ORM fallback) |
| GET | `autocomplete/?q=par` | City/country autocomplete |

**Query params**: `q`, `property_type`, `city`, `country`, `min_price`, `max_price`, `min_guests`, `min_bedrooms`, `has_wifi`, `has_pool`, `has_kitchen`, `has_parking`, `has_ac`, `has_gym`, `ordering`, `page`

### Bookings — `/api/bookings/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | My bookings |
| POST | `/` | Create booking |
| POST | `/{id}/cancel/` | Cancel booking (guest) |
| POST | `/{id}/confirm/` | Confirm booking (host) |
| GET | `availability/{listing_id}/` | Get booked date ranges |

### Reviews — `/api/reviews/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `listings/{id}/reviews/` | Get listing reviews |
| POST | `listings/{id}/reviews/` | Post review |

### Wishlists — `/api/wishlists/`
| Method | Path | Description |
|--------|------|-------------|
| GET | `saved/` | Get saved listings |
| GET | `saved/ids/` | Get saved listing IDs |
| POST | `toggle/{id}/` | Toggle save |

---

## 🛠 Tech Stack

**Backend**
- Django 4.2 + DRF
- JWT via `djangorestframework-simplejwt`
- Elasticsearch 8 via `django-elasticsearch-dsl`
- SQLite (dev), PostgreSQL-ready (prod)
- 6 separate Django apps

**Frontend**
- React 18 + Vite
- React Router v6 (multi-page)
- Leaflet + react-leaflet + OpenStreetMap
- DM Sans + Playfair Display fonts
- Zero CSS framework — custom design system

---

## 🔧 Production Checklist

- [ ] Set `SECRET_KEY` via env var
- [ ] Set `DEBUG=False`
- [ ] Switch to PostgreSQL
- [ ] Configure media storage (S3/Cloudinary)
- [ ] Run `collectstatic`
- [ ] Update `CORS_ALLOWED_ORIGINS`
- [ ] Deploy Elasticsearch cluster
- [ ] Use Gunicorn + Nginx
#   S t a y F i n d e r 
 
 
