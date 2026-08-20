from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import BOQItemViewSet, BOQViewSet, BOQTemplateViewSet, BOQSurveyDataViewSet

router = DefaultRouter()
router.register('boq', BOQViewSet, basename='boq')  # Keep 'boq' prefix
router.register('boq-templates', BOQTemplateViewSet, basename='boq-template')
router.register('boq-survey-data', BOQSurveyDataViewSet, basename='boq-survey-data')

urlpatterns = [
    path('', include(router.urls)),
    
    # Survey data nested routes
    path('boq/<uuid:boq_id>/survey-data/', BOQSurveyDataViewSet.as_view({
        'get': 'list',
        'post': 'create',
    }), name='boq-survey-data-list'),
    
    path('boq/<uuid:boq_id>/survey-data/<uuid:pk>/', BOQSurveyDataViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy',
    }), name='boq-survey-data-detail'),
    
    # BOQ Items routes
    path('items/', BOQItemViewSet.as_view({'get': 'list', 'post': 'create'}), name='boq-item-list'),
    path('items/<uuid:id>/', BOQItemViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='boq-item-detail'),
]