from rest_framework import serializers

from apps.projects.models import Project
from .models import Survey, SurveyItem


class SurveyItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyItem
        fields = ['id', 'row_number', 'data', 'created_at', 'updated_at']


class SurveyItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyItem
        fields = ['row_number', 'data']

    def validate_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('data must be an object of column -> value.')
        return value


class SurveySerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    items_count = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = [
            'id', 'project_id', 'project_name', 'version', 'status',
            'items_count', 'uploaded_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_items_count(self, obj):
        return obj.items.count()

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by_id:
            return None
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.email


class SurveyWriteSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(source='project', queryset=Project.objects.all())

    class Meta:
        model = Survey
        fields = ['project_id', 'version']

    def create(self, validated_data):
        request = self.context.get('request')
        uploaded_by = getattr(request, 'user', None) if request else None
        return Survey.objects.create(status='DRAFT', uploaded_by=uploaded_by, **validated_data)

    def to_representation(self, instance):
        return SurveySerializer(instance, context=self.context).data