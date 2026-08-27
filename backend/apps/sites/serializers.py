from rest_framework import serializers

from apps.projects.models import Project
from apps.provinces.models import District
from .models import Site


class SiteSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        source='project', queryset=Project.objects.all()
    )
    district_id = serializers.PrimaryKeyRelatedField(
        source='district', queryset=District.objects.all()
    )
    district_name = serializers.CharField(source='district.name', read_only=True)
    province_id = serializers.UUIDField(source='district.province_id', read_only=True)
    province_name = serializers.CharField(source='district.province.name', read_only=True)

    class Meta:
        model = Site
        fields = [
            'id',
            'project_id',
            'district_id',
            'district_name',
            'province_id',
            'province_name',
            'name',
            'location',
            'latitude',
            'longitude',
            'geofence_radius_m',
            'status',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        project = attrs.get('project') or getattr(self.instance, 'project', None)
        district = attrs.get('district') or getattr(self.instance, 'district', None)
        if project and district and district.province_id != project.province_id:
            raise serializers.ValidationError(
                {'district_id': 'District must belong to the same province as the project.'}
            )
        return attrs