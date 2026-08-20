from rest_framework import serializers

from apps.projects.models import Project
from apps.provinces.models import District, Town
from .models import Site


class SiteSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        source='project', queryset=Project.objects.all()
    )
    district_id = serializers.PrimaryKeyRelatedField(
        source='district', queryset=District.objects.all(),
        required=False, allow_null=True,
    )
    town_id = serializers.PrimaryKeyRelatedField(
        source='town', queryset=Town.objects.all(),
        required=False, allow_null=True,
    )
    town_name = serializers.CharField(source='town.name', read_only=True, default=None)
    district_name = serializers.SerializerMethodField()
    province_id = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()

    class Meta:
        model = Site
        fields = [
            'id',
            'project_id',
            'district_id',
            'town_id',
            'town_name',
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

    def _resolved_district(self, obj):
        return obj.district or (obj.town.district if obj.town else None)

    def get_district_name(self, obj):
        district = self._resolved_district(obj)
        return district.name if district else None

    def get_province_id(self, obj):
        district = self._resolved_district(obj)
        return district.province_id if district else None

    def get_province_name(self, obj):
        district = self._resolved_district(obj)
        return district.province.name if district else None

    def validate(self, attrs):
        project = attrs.get('project') or getattr(self.instance, 'project', None)
        district = attrs.get('district') or getattr(self.instance, 'district', None)
        town = attrs.get('town') or getattr(self.instance, 'town', None)
        effective_district = district or (town.district if town else None)
        if project and effective_district and effective_district.province_id != project.province_id:
            raise serializers.ValidationError(
                {'district_id': 'District must belong to the same province as the project.'}
            )
        return attrs
    