from django.core.management.base import BaseCommand

from apps.provinces.models import District, Province

# Province → Districts
GEO_DATA = {
    'Sindh': [
        {'name': 'Karachi', 'code': 'D-KHI'},
        {'name': 'Hyderabad', 'code': 'D-HYD'},
        {'name': 'Sukkur', 'code': 'D-SKZ'},
    ],
    'Punjab': [
        {'name': 'Lahore', 'code': 'D-LHE'},
        {'name': 'Faisalabad', 'code': 'D-FSD'},
        {'name': 'Multan', 'code': 'D-MUX'},
    ],
    'Balochistan': [
        {'name': 'Quetta', 'code': 'D-UET'},
        {'name': 'Gwadar', 'code': 'D-GWD'},
        {'name': 'Kech', 'code': 'D-TUK'},
    ],
}


class Command(BaseCommand):
    help = 'Seed districts under each province'

    def handle(self, *args, **options):
        for province_name, districts in GEO_DATA.items():
            try:
                province = Province.objects.get(name=province_name)
            except Province.DoesNotExist:
                self.stderr.write(
                    f"Province '{province_name}' not found — run seed_provinces first."
                )
                continue

            for d in districts:
                district, created = District.objects.update_or_create(
                    province=province,
                    name=d['name'],
                    defaults={'code': d['code']},
                )
                self.stdout.write(
                    f"{'Created' if created else 'Updated'} district: {district}"
                )

        self.stdout.write(self.style.SUCCESS('Geo seed finished.'))