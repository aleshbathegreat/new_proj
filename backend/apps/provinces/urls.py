from rest_framework.routers import DefaultRouter

from .views import DistrictViewSet, ProvinceViewSet

router = DefaultRouter()
router.register('provinces', ProvinceViewSet)
router.register('districts', DistrictViewSet)

urlpatterns = router.urls
