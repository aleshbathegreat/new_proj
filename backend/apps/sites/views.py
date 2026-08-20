from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import HasModulePermission
from .models import Site
from .serializers import SiteSerializer


class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.select_related(
        'project',
        'district',
        'district__province',
        'town',
        'town__district',
        'town__district__province',
    )
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated, HasModulePermission]
    module_key = 'sites'

    def get_queryset(self):
        qs = super().get_queryset()
        for param in ('project_id', 'town_id', 'district_id', 'status'):
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{param: value})
        # district_id above only matches Sites with a direct district link.
        # Also match Sites that reach the same district through town.
        district_id = self.request.query_params.get('district_id')
        if district_id:
            qs = Site.objects.select_related(
                'project', 'district', 'district__province',
                'town', 'town__district', 'town__district__province',
            ).filter(
                Q(district_id=district_id) | Q(town__district_id=district_id)
            )
            for param in ('project_id', 'town_id', 'status'):
                value = self.request.query_params.get(param)
                if value:
                    qs = qs.filter(**{param: value})

        province_id = self.request.query_params.get('province_id')
        if province_id:
            qs = qs.filter(
                Q(district__province_id=province_id) | Q(town__district__province_id=province_id)
            )
        # Backward-compatible alias
        city_id = self.request.query_params.get('city_id')
        if city_id:
            qs = qs.filter(town_id=city_id)
        return qs