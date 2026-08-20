from django.core.management.base import BaseCommand

from apps.progress.models import KPICategory, SiteProgressTask


class Command(BaseCommand):
    help = (
        "One-time backfill: turns existing SiteProgressTask.category free-text "
        "values into real, site-scoped KPICategory rows, and links each task to it."
    )

    def handle(self, *args, **options):
        tasks = SiteProgressTask.objects.filter(
            kpi_category__isnull=True
        ).exclude(category='').select_related('site')

        if not tasks:
            self.stdout.write('Nothing to backfill — no tasks with an unset kpi_category.')
            return

        created_count = 0
        linked_count = 0

        for task in tasks:
            category_name = task.category.strip().title()
            kpi_category, created = KPICategory.objects.get_or_create(
                site=task.site,
                name=category_name,
            )
            if created:
                created_count += 1
                self.stdout.write(f'Created KPI category: {kpi_category}')

            task.kpi_category = kpi_category
            task.save(update_fields=['kpi_category'])
            linked_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Done. Created {created_count} KPI categories, '
                f'linked {linked_count} subtasks.'
            )
        )