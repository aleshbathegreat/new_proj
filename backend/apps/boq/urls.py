from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import BOQItemViewSet, BOQViewSet, BOQTemplateViewSet

router = DefaultRouter()
router.register('boq', BOQViewSet, basename='boq')
router.register('boq-templates', BOQTemplateViewSet, basename='boq-template')

urlpatterns = [
    path('', include(router.urls)),
    path('items/', BOQItemViewSet.as_view({'get': 'list', 'post': 'create'}), name='boq-item-list'),
    path('items/<uuid:id>/', BOQItemViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='boq-item-detail'),
]