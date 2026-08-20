from rest_framework.routers import DefaultRouter

from .views import (
    DailyProgressEntryViewSet,
    KPICategoryViewSet,
    ProgressTaskTemplateViewSet,
    SiteProgressTaskViewSet,
    ModuleCatalogViewSet,
    ItemCatalogViewSet,
)

router = DefaultRouter()
router.register('kpi-categories', KPICategoryViewSet, basename='kpi-category')
router.register(
    'progress-task-templates',
    ProgressTaskTemplateViewSet,
    basename='progress-task-template',
)
router.register(
    'site-progress-tasks',
    SiteProgressTaskViewSet,
    basename='site-progress-task',
)
router.register('daily-progress', DailyProgressEntryViewSet, basename='daily-progress')
router.register('module-catalog', ModuleCatalogViewSet, basename='module-catalog')
router.register('item-catalog', ItemCatalogViewSet, basename='item-catalog')

urlpatterns = router.urls
