from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import HasModulePermission
from .models import Survey, SurveyItem
from .serializers import (
    SurveyItemSerializer,
    SurveyItemWriteSerializer,
    SurveySerializer,
    SurveyWriteSerializer,
)


class SurveyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'survey'

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return SurveyWriteSerializer
        return SurveySerializer

    def get_queryset(self):
        qs = Survey.objects.select_related('project', 'uploaded_by').order_by('-updated_at')
        project_id = self.request.query_params.get('project_id')
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    @action(detail=True, methods=['get'], url_path='items')
    def items(self, request, pk=None):
        survey = self.get_object()
        serializer = SurveyItemSerializer(survey.items.all(), many=True)
        return Response({'data': serializer.data})

    @action(detail=True, methods=['post'], url_path='items/bulk')
    def items_bulk(self, request, pk=None):
        """Replace all items on this survey with freshly-parsed spreadsheet rows."""
        survey = self.get_object()
        payload = request.data
        if not isinstance(payload, list):
            return Response(
                {'detail': 'Expected a JSON array of survey rows.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rows = [{'row_number': i + 1, 'data': row} for i, row in enumerate(payload)]
        serializer = SurveyItemWriteSerializer(data=rows, many=True)
        serializer.is_valid(raise_exception=True)

        survey.items.all().delete()
        SurveyItem.objects.bulk_create(
            [SurveyItem(survey=survey, **row) for row in serializer.validated_data]
        )

        if payload and survey.status == 'DRAFT':
            survey.status = 'READY'
            survey.save(update_fields=['status', 'updated_at'])

        return Response(
            {'data': SurveyItemSerializer(survey.items.all(), many=True).data},
            status=status.HTTP_200_OK,
        )