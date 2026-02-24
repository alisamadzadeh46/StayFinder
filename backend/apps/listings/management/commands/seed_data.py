import random
from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.listings.models import Listing, ListingImage
from apps.reviews.models import Review

IMAGES = {
    'beach_house': [
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=900',
        'https://images.unsplash.com/photo-1505881502353-a1986add3762?w=900',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900',
    ],
    'villa': [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900',
    ],
    'apartment': [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900',
    ],
    'cabin': [
        'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=900',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900',
        'https://images.unsplash.com/photo-1542718610-a1e656d1884b?w=900',
    ],
    'house': [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900',
    ],
    'treehouse': [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900',
    ],
    'studio': [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900',
    ],
    'condo': [
        'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=900',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900',
    ],
}

LISTINGS_DATA = [
    {
        'title': 'Beachfront Paradise with Private Pool',
        'property_type': 'beach_house',
        'city': 'Miami', 'state': 'Florida', 'country': 'USA',
        'address': '1 Ocean Drive, Miami Beach, FL 33139',
        'price_per_night': '380', 'guests': 8, 'bedrooms': 4, 'beds': 5, 'bathrooms': 3,
        'description': 'Wake up to breathtaking Atlantic Ocean views in this spectacular beachfront estate. Featuring direct beach access, a heated private pool, and a gourmet kitchen. Perfect for large groups seeking the ultimate Miami experience.',
        'has_wifi': True, 'has_pool': True, 'has_ac': True, 'has_kitchen': True, 'has_tv': True, 'has_bbq': True, 'has_washer': True,
        'latitude': 25.7617, 'longitude': -80.1918,
    },
    {
        'title': 'Iconic Caldera Villa – Santorini',
        'property_type': 'villa',
        'city': 'Santorini', 'country': 'Greece',
        'address': 'Oia, Santorini 847 02, Greece',
        'price_per_night': '560', 'guests': 4, 'bedrooms': 2, 'beds': 3, 'bathrooms': 2,
        'description': 'Perched on the famous Santorini caldera, this whitewashed villa offers the most iconic views in the world. The infinity pool seems to merge with the Aegean Sea. Experience the legendary Santorini sunset from your private terrace.',
        'has_wifi': True, 'has_pool': True, 'has_ac': True, 'has_kitchen': True, 'has_workspace': True,
        'latitude': 36.4618, 'longitude': 25.3753,
    },
    {
        'title': 'Ski-In Luxury Mountain Cabin',
        'property_type': 'cabin',
        'city': 'Aspen', 'state': 'Colorado', 'country': 'USA',
        'address': '42 Mountain View Rd, Aspen, CO 81611',
        'price_per_night': '320', 'guests': 6, 'bedrooms': 3, 'beds': 4, 'bathrooms': 2,
        'description': 'A stunning log cabin with ski-in/ski-out access to Aspen Mountain. Hand-crafted interiors, a stone fireplace, hot tub, and sweeping mountain views. Pure Colorado mountain luxury.',
        'has_wifi': True, 'has_kitchen': True, 'has_washer': True, 'has_fireplace': True, 'has_tv': True, 'has_parking': True,
        'latitude': 39.1911, 'longitude': -106.8175,
    },
    {
        'title': 'SoHo Designer Loft – Manhattan',
        'property_type': 'apartment',
        'city': 'New York', 'state': 'New York', 'country': 'USA',
        'address': '88 Spring Street, SoHo, New York, NY 10012',
        'price_per_night': '220', 'guests': 2, 'bedrooms': 1, 'beds': 1, 'bathrooms': 1,
        'description': 'Sleek designer loft in iconic SoHo. Exposed brick, chef\'s kitchen, polished concrete floors. Surrounded by world-class galleries, restaurants, and boutiques. The quintessential New York experience.',
        'has_wifi': True, 'has_ac': True, 'has_kitchen': True, 'has_gym': True, 'has_workspace': True,
        'latitude': 40.7248, 'longitude': -74.0028,
    },
    {
        'title': 'Balinese Jungle Treehouse',
        'property_type': 'treehouse',
        'city': 'Ubud', 'country': 'Indonesia',
        'address': 'Jl. Raya Ubud No. 12, Ubud, Bali 80571',
        'price_per_night': '165', 'guests': 2, 'bedrooms': 1, 'beds': 1, 'bathrooms': 1,
        'description': 'Sleep amongst the jungle canopy in this magical treehouse. Surrounded by terraced rice paddies and tropical flora, with a cascading waterfall just steps away. The sounds of nature will be your alarm clock.',
        'has_wifi': True, 'has_kitchen': True, 'has_ac': True,
        'latitude': -8.5069, 'longitude': 115.2625,
    },
    {
        'title': 'Montmartre Artist Studio – Paris',
        'property_type': 'studio',
        'city': 'Paris', 'country': 'France',
        'address': '14 Rue Lepic, Montmartre, Paris 75018',
        'price_per_night': '145', 'guests': 2, 'bedrooms': 1, 'beds': 1, 'bathrooms': 1,
        'description': 'A beautifully renovated artist\'s studio in bohemian Montmartre. Skylights flood the space with Parisian light. Walk to the Sacré-Cœur, charming cafes, and the Moulin Rouge.',
        'has_wifi': True, 'has_ac': True, 'has_kitchen': True, 'has_workspace': True,
        'latitude': 48.8867, 'longitude': 2.3391,
    },
    {
        'title': 'Harbour View Penthouse – Sydney',
        'property_type': 'condo',
        'city': 'Sydney', 'country': 'Australia',
        'address': '1 Macquarie Street, Sydney NSW 2000',
        'price_per_night': '450', 'guests': 4, 'bedrooms': 2, 'beds': 2, 'bathrooms': 2,
        'description': 'Spectacular Opera House and Harbour Bridge views from this ultra-modern penthouse. Floor-to-ceiling glass, private rooftop terrace, and 5-star hotel amenities. The Sydney Harbour is your backdrop.',
        'has_wifi': True, 'has_gym': True, 'has_pool': True, 'has_ac': True, 'has_workspace': True, 'has_ev_charger': True,
        'latitude': -33.8568, 'longitude': 151.2153,
    },
    {
        'title': 'Tuscan Vineyard Farmhouse',
        'property_type': 'villa',
        'city': 'Florence', 'country': 'Italy',
        'address': 'Via del Chianti 45, 50026 San Casciano, FI',
        'price_per_night': '410', 'guests': 10, 'bedrooms': 5, 'beds': 7, 'bathrooms': 4,
        'description': 'A stunning 16th-century farmhouse surrounded by Chianti vineyards and olive groves. Stone walls, terracotta floors, and a private pool overlooking rolling Tuscan hills. The ultimate Italian countryside escape.',
        'has_wifi': True, 'has_pool': True, 'has_kitchen': True, 'has_parking': True, 'has_bbq': True, 'has_fireplace': True,
        'latitude': 43.6532, 'longitude': 11.1782,
    },
    {
        'title': 'Desert Modern Oasis – Scottsdale',
        'property_type': 'house',
        'city': 'Scottsdale', 'state': 'Arizona', 'country': 'USA',
        'address': '7200 E Camelback Rd, Scottsdale, AZ 85251',
        'price_per_night': '310', 'guests': 8, 'bedrooms': 4, 'beds': 4, 'bathrooms': 3,
        'description': 'Contemporary desert home with McDowell Mountain views. Striking architecture, a heated pool and spa, and an outdoor kitchen. Arizona living at its finest — stargazing from your private courtyard is unforgettable.',
        'has_wifi': True, 'has_pool': True, 'has_ac': True, 'has_parking': True, 'has_bbq': True, 'has_kitchen': True,
        'latitude': 33.4942, 'longitude': -111.9261,
    },
    {
        'title': 'Como Lake Heritage Villa',
        'property_type': 'villa',
        'city': 'Lake Como', 'country': 'Italy',
        'address': 'Via Regina Vecchia 20, Cernobbio CO 22012',
        'price_per_night': '680', 'guests': 6, 'bedrooms': 3, 'beds': 4, 'bathrooms': 3,
        'description': 'A magnificent lakefront villa with private dock, manicured Italian gardens, and panoramic views of the Alps. This heritage property exudes old-world elegance with every modern comfort.',
        'has_wifi': True, 'has_pool': True, 'has_kitchen': True, 'has_parking': True, 'has_fireplace': True, 'has_workspace': True,
        'latitude': 45.9853, 'longitude': 9.0800,
    },
    {
        'title': 'Shinjuku Micro-Luxury Suite',
        'property_type': 'studio',
        'city': 'Tokyo', 'country': 'Japan',
        'address': '3-1-1 Nishi-Shinjuku, Shinjuku-ku, Tokyo 160-0023',
        'price_per_night': '95', 'guests': 2, 'bedrooms': 1, 'beds': 1, 'bathrooms': 1,
        'description': 'A marvel of Japanese space efficiency in the heart of Shinjuku. Smart home technology, heated floors, Japanese soaking tub. Walk to Kabukicho, Golden Gai, and Shinjuku Gyoen park.',
        'has_wifi': True, 'has_ac': True, 'has_workspace': True, 'has_tv': True,
        'latitude': 35.6938, 'longitude': 139.7036,
    },
    {
        'title': 'Scottish Highland Castle Stay',
        'property_type': 'house',
        'city': 'Inverness', 'country': 'UK',
        'address': 'Loch Ness Road, Inverness IV3 8JN',
        'price_per_night': '520', 'guests': 12, 'bedrooms': 6, 'beds': 8, 'bathrooms': 5,
        'description': 'Stay in a genuine 18th-century Scottish castle with original turrets, a grand great hall, and breathtaking views of Loch Ness. Rich in history, surrounded by highlands, and stocked with fine Scottish whisky.',
        'has_wifi': True, 'has_kitchen': True, 'has_parking': True, 'has_fireplace': True, 'has_tv': True,
        'latitude': 57.4778, 'longitude': -4.2247,
    },
    {
        'title': 'Malibu Cliffside Retreat',
        'property_type': 'house',
        'city': 'Malibu', 'state': 'California', 'country': 'USA',
        'address': '24000 Pacific Coast Hwy, Malibu, CA 90265',
        'price_per_night': '495', 'guests': 6, 'bedrooms': 3, 'beds': 4, 'bathrooms': 2,
        'description': 'Dramatic cliffside home with unobstructed Pacific Ocean views. A private staircase leads to your own stretch of beach. Sunsets here are legendary. Modern interiors with warm California vibes.',
        'has_wifi': True, 'has_ac': True, 'has_kitchen': True, 'has_bbq': True, 'has_parking': True, 'has_pool': True,
        'latitude': 34.0259, 'longitude': -118.7798,
    },
    {
        'title': 'Copenhagen Design Apartment',
        'property_type': 'apartment',
        'city': 'Copenhagen', 'country': 'Denmark',
        'address': 'Nørrebrogade 40, 2200 København N',
        'price_per_night': '175', 'guests': 3, 'bedrooms': 2, 'beds': 2, 'bathrooms': 1,
        'description': 'Exquisite Scandinavian design in the trendy Nørrebro neighborhood. Bespoke furniture, clean lines, and beautiful natural light. Walking distance to the best coffee shops, design stores, and the Little Mermaid.',
        'has_wifi': True, 'has_ac': True, 'has_kitchen': True, 'has_workspace': True, 'has_washer': True,
        'latitude': 55.6977, 'longitude': 12.5529,
    },
    {
        'title': 'Buenos Aires Palermo Loft',
        'property_type': 'apartment',
        'city': 'Buenos Aires', 'country': 'Argentina',
        'address': 'Armenia 1540, Palermo, Buenos Aires C1414',
        'price_per_night': '88', 'guests': 4, 'bedrooms': 2, 'beds': 2, 'bathrooms': 1,
        'description': 'Vibrant loft in the heart of Palermo Soho, Buenos Aires\' most fashionable neighborhood. High ceilings, exposed brick, a rooftop terrace. Tango clubs, craft beer bars, and parrillas are all steps away.',
        'has_wifi': True, 'has_ac': True, 'has_kitchen': True, 'has_workspace': True,
        'latitude': -34.5853, 'longitude': -58.4298,
    },
]

REVIEW_COMMENTS = [
    "Absolutely stunning! The photos don't do it justice — even more beautiful in person.",
    "Perfect stay from start to finish. The host was incredibly responsive and welcoming.",
    "Breathtaking views, immaculate space. This is now our go-to destination every year.",
    "Everything was exactly as described and more. The location is unbeatable.",
    "Such a unique and memorable experience. We can't wait to come back!",
    "Impeccably clean, beautifully designed, and in the perfect location.",
    "The host thought of every detail. We felt completely at home.",
    "One of the best Airbnb experiences we've ever had. Highly recommend!",
]


class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding database...')

        # Create host
        host, created = User.objects.get_or_create(
            email='host@example.com',
            defaults={
                'username': 'superhost',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'is_host': True,
                'bio': 'Superhost with 5+ years experience. I love sharing beautiful spaces with travelers from around the world.',
                'avatar': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
            }
        )
        if created:
            host.set_password('password123')
            host.save()
            self.stdout.write(f'  ✓ Host: {host.email}')

        # Create guest
        guest, created = User.objects.get_or_create(
            email='guest@example.com',
            defaults={
                'username': 'world_traveler',
                'first_name': 'Alex',
                'last_name': 'Chen',
                'bio': 'Passionate traveler who has visited 40+ countries.',
                'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
            }
        )
        if created:
            guest.set_password('password123')
            guest.save()
            self.stdout.write(f'  ✓ Guest: {guest.email}')

        # Create listings
        for data in LISTINGS_DATA:
            if Listing.objects.filter(title=data['title']).exists():
                continue

            prop_type = data.pop('property_type')
            images_urls = IMAGES.get(prop_type, [f'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900'])

            listing = Listing.objects.create(
                host=host,
                property_type=prop_type,
                **data
            )

            for i, url in enumerate(images_urls):
                ListingImage.objects.create(
                    listing=listing, url=url, is_primary=(i == 0), order=i
                )

            # Add 1-4 reviews
            for comment in random.sample(REVIEW_COMMENTS, random.randint(1, 4)):
                Review.objects.get_or_create(
                    listing=listing,
                    author=guest,
                    defaults={
                        'rating': random.randint(4, 5),
                        'cleanliness': random.randint(4, 5),
                        'accuracy': random.randint(4, 5),
                        'communication': random.randint(4, 5),
                        'location': random.randint(4, 5),
                        'value': random.randint(4, 5),
                        'comment': comment,
                    }
                )
                break  # one review per guest per listing

            self.stdout.write(f'  ✓ Listing: {listing.title}')

        self.stdout.write(self.style.SUCCESS('\n✅ Seeding complete!'))
        self.stdout.write('Test accounts:')
        self.stdout.write('  Host:  host@example.com  / password123')
        self.stdout.write('  Guest: guest@example.com / password123')
