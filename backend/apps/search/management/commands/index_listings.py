from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Index all listings into Elasticsearch (only run when ES is running)'

    def handle(self, *args, **options):
        self.stdout.write('Connecting to Elasticsearch...')
        try:
            from apps.search.documents import build_index
            count = build_index()
            self.stdout.write(self.style.SUCCESS(f'✅ Indexed {count} listings into Elasticsearch'))
        except ConnectionError as e:
            self.stdout.write(self.style.ERROR(f'❌ Elasticsearch not reachable: {e}'))
            self.stdout.write('Start Elasticsearch first, then re-run this command.')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
