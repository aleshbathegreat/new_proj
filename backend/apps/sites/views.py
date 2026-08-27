from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import HasModulePermission
from .models import Site
from .serializers import SiteSerializer


class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.select_related('project', 'district', 'district__province')
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'sites'

    def get_queryset(self):
        qs = super().get_queryset()
        for param in ('project_id', 'district_id', 'status'):
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{param: value})
        province_id = self.request.query_params.get('province_id')
        if province_id:
            qs = qs.filter(district__province_id=province_id)
        return qs