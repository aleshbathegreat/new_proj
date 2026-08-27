from django.db import migrations


def backfill_scope(apps, schema_editor):
    for model_name in ('KPICategory', 'SiteProgressTask'):
        Model = apps.get_model('progress', model_name)
        for obj in Model.objects.filter(site__isnull=False).select_related('site'):
            obj.project_id = obj.site.project_id
            obj.district_id = obj.site.district_id
            obj.save(update_fields=['project', 'district'])


class Migration(migrations.Migration):
    dependencies = [
        ('progress', '0006_alter_kpicategory_unique_together_and_more'),
    ]
    operations = [
        migrations.RunPython(backfill_scope, migrations.RunPython.noop),
    ]