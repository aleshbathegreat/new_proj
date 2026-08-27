from rest_framework import serializers

from .models import District, Province


class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ['id', 'name', 'code', 'created_at', 'updated_at']


class DistrictSerializer(serializers.ModelSerializer):
    province_id = serializers.PrimaryKeyRelatedField(
        source='province', queryset=Province.objects.all()
    )
    province_name = serializers.CharField(source='province.name', read_only=True)

    class Meta:
        model = District
        fields = [
            'id',
            'name',
            'code',
            'province_id',
            'province_name',
            'created_at',
            'updated_at',
        ]
