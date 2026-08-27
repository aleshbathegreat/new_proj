from django.conf import settings
from django.db import models
from django.db.models import Sum

from apps.boq.models import BOQ, BOQItem
from apps.core.models import BaseModel
from apps.sites.models import Site


class ProgressTaskTemplate(BaseModel):
    """
    Admin-controlled catalog of reusable progress activities / KPIs.
    Example keys: fiber_digging, hdpe_pipe, backfilling, fiber_laying, civil_work.
    """

    key = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=80, blank=True, default='')
    unit = models.CharField(max_length=30, default='m')
    description = models.TextField(blank=True, default='')
    # [{ "key": "crew_count", "label": "Crew", "value_type": "number" }, ...]
    kpi_schema = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} ({self.key})'


class KPICategory(BaseModel):
    """
    Admin-defined grouping of subtasks (SiteProgressTask rows).
    Scoped to project + district always; site is optional — when null,
    this Module applies at the district level with no specific site.
    """

    project = models.ForeignKey(
        'projects.Project', related_name='kpi_categories', on_delete=models.CASCADE
    )
    district = models.ForeignKey(
        'provinces.District', related_name='kpi_categories', on_delete=models.CASCADE
    )
    site = models.ForeignKey(
        Site, related_name='kpi_categories', on_delete=models.CASCADE,
        null=True, blank=True,
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = [('project', 'district', 'site', 'name')]
        verbose_name_plural = 'KPI categories'

    def __str__(self):
        scope = self.site.name if self.site_id else self.district.name
        return f'{scope}: {self.name}'

class ModuleCatalogEntry(BaseModel):
    """Global, cross-site catalog of Module names — grows automatically
    whenever a new Module name is used anywhere, powers autocomplete."""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Module catalog entries'

    def __str__(self):
        return self.name


class ItemCatalogEntry(BaseModel):
    """Global, cross-site catalog of Item names — grows automatically
    whenever a new Item name is used anywhere, powers autocomplete."""
    name = models.CharField(max_length=255, unique=True)
    default_unit = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Item catalog entries'

    def __str__(self):
        return self.name

class SiteProgressTask(BaseModel):
    """
    Progress tasks scoped to project + district always; site is optional —
    when null, this task tracks progress at the district level with no
    specific site (e.g. a project that hasn't broken ground into individual
    sites yet, or work that is inherently district-wide).
    """

    project = models.ForeignKey(
        'projects.Project', related_name='progress_tasks', on_delete=models.CASCADE
    )
    district = models.ForeignKey(
        'provinces.District', related_name='progress_tasks', on_delete=models.CASCADE
    )
    site = models.ForeignKey(
        Site, related_name='progress_tasks', on_delete=models.CASCADE,
        null=True, blank=True,
    )
    template = models.ForeignKey(
        ProgressTaskTemplate,
        related_name='site_tasks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    kpi_category = models.ForeignKey(
        KPICategory,
        related_name='subtasks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    boq = models.ForeignKey(
        BOQ,
        related_name='progress_tasks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    boq_item = models.ForeignKey(
        BOQItem,
        related_name='progress_tasks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='When set, planned qty defaults from BOQ item and daily logs update actual_quantity.',
    )
    key = models.SlugField(max_length=80)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=80, blank=True, default='')
    unit = models.CharField(max_length=30, default='m')
    planned_quantity = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    kpi_schema = models.JSONField(default=list, blank=True)
    attributes = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = [('project', 'district', 'site', 'key')]

    def __str__(self):
        scope = self.site.name if self.site_id else self.district.name
        return f'{scope}: {self.name}'

    def sync_boq_actual(self):
        if not self.boq_item_id:
            return
        total = self.entries.aggregate(s=Sum('quantity'))['s'] or 0
        BOQItem.objects.filter(pk=self.boq_item_id).update(actual_quantity=total)

class DailyProgressEntry(BaseModel):
    """
    One day's reported quantity for a task. `site` is nullable and, when
    present, is always derived from `site_task.site` (kept for convenient
    filtering/select_related) — project/district scope always comes via
    `site_task`.
    """

    site = models.ForeignKey(
        Site, related_name='daily_progress', on_delete=models.CASCADE,
        null=True, blank=True,
    )
    site_task = models.ForeignKey(
        SiteProgressTask,
        related_name='entries',
        on_delete=models.PROTECT,
    )
    date = models.DateField()
    quantity = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    kpi_values = models.JSONField(default=dict, blank=True)
    remarks = models.TextField(blank=True, default='')
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='daily_progress_entries',
        on_delete=models.PROTECT,
    )

    class Meta:
        ordering = ['-date', '-created_at']
        unique_together = [('site_task', 'date')]

    def save(self, *args, **kwargs):
        # Keep `site` in sync with the task's site (may be None) so
        # queries filtering DailyProgressEntry by site_id stay correct
        # without every caller needing to join through site_task.
        if self.site_task_id and self.site_id != self.site_task.site_id:
            self.site_id = self.site_task.site_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.site_task.key} @ {self.date}: {self.quantity}'