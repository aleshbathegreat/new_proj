from rest_framework import serializers

from apps.projects.models import Project
from apps.sites.models import Site
from .models import BOQ, BOQItem, BOQTemplate, BOQSurveyData


class BOQItemSerializer(serializers.ModelSerializer):
    boq_id = serializers.UUIDField(read_only=True)
    site_id = serializers.UUIDField(source='boq.site_id', read_only=True)
    site_name = serializers.CharField(source='boq.site.name', read_only=True)
    project_id = serializers.UUIDField(source='boq.project_id', read_only=True)
    project_name = serializers.CharField(source='boq.project.name', read_only=True)
    district_id = serializers.UUIDField(source='boq.site.town.district_id', read_only=True)
    district_name = serializers.CharField(source='boq.site.town.district.name', read_only=True)
    province_id = serializers.UUIDField(
        source='boq.site.town.district.province_id', read_only=True
    )
    province_name = serializers.CharField(
        source='boq.site.town.district.province.name', read_only=True
    )

    fob_total = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    price_with_landing = serializers.DecimalField(
        max_digits=14, decimal_places=4, read_only=True
    )
    price_with_insurance = serializers.DecimalField(
        max_digits=14, decimal_places=4, read_only=True
    )
    total_ddp_usd = serializers.DecimalField(
        max_digits=18, decimal_places=4, read_only=True
    )
    total_ddp_pkr = serializers.DecimalField(
        max_digits=18, decimal_places=2, read_only=True
    )
    item_code = serializers.CharField(source='item', read_only=True)
    description = serializers.CharField(source='item_description', read_only=True)
    planned_quantity = serializers.DecimalField(
        source='qty', max_digits=14, decimal_places=2, read_only=True
    )
    amount = serializers.DecimalField(
        source='total_ddp_pkr', max_digits=18, decimal_places=2, read_only=True
    )

    class Meta:
        model = BOQItem
        fields = [
            'id',
            'boq_id',
            'site_id',
            'site_name',
            'project_id',
            'project_name',
            'district_id',
            'district_name',
            'province_id',
            'province_name',
            'pc1',
            'no',
            'item_type',
            'item',
            'item_code',
            'item_description',
            'description',
            'model_name',
            'model',
            'oem',
            'unit',
            'package_qty',
            'qty',
            'planned_quantity',
            'actual_quantity',
            'fob',
            'fob_total',
            'hs_code_description',
            'hs_code',
            'curr',
            'tax',
            'curr_rate',
            'bank_charges_pct',
            'freight_pct',
            'landing_pct',
            'insurance_pct',
            'cd_pct',
            'acd_pct',
            'rd_pct',
            'st_pct',
            'ast_pct',
            'it_pct',
            'cess_pct',
            'bank_charges',
            'freight_insurance',
            'price_with_fi',
            'landing',
            'price_with_landing',
            'insurance',
            'price_with_insurance',
            'custom_duty',
            'addl_custom_duty',
            'regulatory_duty',
            'sales_tax',
            'addl_sales_tax',
            'income_tax',
            'cess_tax',
            'ddp_unit_usd',
            'total_ddp_usd',
            'ddp_unit_pkr',
            'total_ddp_pkr',
            'amount',
            'quantity_tolerance_pct',
            'created_at',
            'updated_at',
        ]


class BOQItemWriteSerializer(serializers.ModelSerializer):
    boq_id = serializers.PrimaryKeyRelatedField(
        source='boq', queryset=BOQ.objects.all(), required=False
    )

    class Meta:
        model = BOQItem
        validators = []
        
        fields = [
            'boq_id',
            'pc1',
            'no',
            'item_type',
            'item',
            'item_description',
            'model_name',
            'model',
            'oem',
            'unit',
            'package_qty',
            'qty',
            'actual_quantity',
            'fob',
            'hs_code_description',
            'hs_code',
            'curr',
            'tax',
            'curr_rate',
            'bank_charges_pct',
            'freight_pct',
            'landing_pct',
            'insurance_pct',
            'cd_pct',
            'acd_pct',
            'rd_pct',
            'st_pct',
            'ast_pct',
            'it_pct',
            'cess_pct',
            'bank_charges',
            'freight_insurance',
            'price_with_fi',
            'landing',
            'insurance',
            'custom_duty',
            'addl_custom_duty',
            'regulatory_duty',
            'sales_tax',
            'addl_sales_tax',
            'income_tax',
            'cess_tax',
            'ddp_unit_usd',
            'ddp_unit_pkr',
            'quantity_tolerance_pct',
        ]


class BOQSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    site_id = serializers.UUIDField(read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    total_amount = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    template_id = serializers.UUIDField(source='template.id', read_only=True, default=None)
    template_name = serializers.CharField(source='template.name', read_only=True, default=None)

    class Meta:
        model = BOQ
        fields = [
            'id', 'project_id', 'project_name', 'site_id', 'site_name',
            'version', 'status', 'template_id', 'template_name', 'total_amount', 'items_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_total_amount(self, obj):
        return sum((item.total_ddp_pkr for item in obj.items.all()), 0)

    def get_items_count(self, obj):
        if hasattr(obj, 'items_count_ann'):
            return obj.items_count_ann
        return obj.items.count()


class BOQWriteSerializer(serializers.ModelSerializer):
    template_id = serializers.PrimaryKeyRelatedField(
        source='template', queryset=BOQTemplate.objects.all(), required=False, allow_null=True
    )
    project_id = serializers.PrimaryKeyRelatedField(
        source='project', queryset=Project.objects.all()
    )
    site_id = serializers.PrimaryKeyRelatedField(
        source='site', queryset=Site.objects.all()
    )

    class Meta:
        model = BOQ
        fields = ['project_id', 'site_id', 'version', 'template_id']

    def validate(self, attrs):
        project = attrs.get('project') or getattr(self.instance, 'project', None)
        site = attrs.get('site') or getattr(self.instance, 'site', None)
        if project and site and site.project_id != project.id:
            raise serializers.ValidationError(
                {'site_id': 'Selected site does not belong to the selected project.'}
            )
        return attrs

    def create(self, validated_data):
        return BOQ.objects.create(status='DRAFT', **validated_data)

    def to_representation(self, instance):
        instance = (
            BOQ.objects.select_related('project', 'site')
            .prefetch_related('items')
            .get(pk=instance.pk)
        )
        return BOQSerializer(instance, context=self.context).data


class BOQTemplateSerializer(serializers.ModelSerializer):
    field_count = serializers.SerializerMethodField()

    class Meta:
        model = BOQTemplate
        fields = [
            'id', 'name', 'code', 'description', 'is_active',
            'source', 'fields', 'field_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_field_count(self, obj):
        return len(obj.fields or [])


class BOQTemplateWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BOQTemplate
        fields = ['name', 'code', 'description', 'is_active', 'source', 'fields']

    def validate_fields(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('fields must be a list.')
        allowed_types = {'text', 'number', 'decimal', 'date', 'boolean', 'select'}
        seen_keys = set()
        for f in value:
            if not isinstance(f, dict) or 'key' not in f or 'label' not in f or 'data_type' not in f:
                raise serializers.ValidationError('Each field needs key, label, data_type.')
            if f['data_type'] not in allowed_types:
                raise serializers.ValidationError(f"Invalid data_type: {f['data_type']}")
            if f['key'] in seen_keys:
                raise serializers.ValidationError(f"Duplicate field key: {f['key']}")
            seen_keys.add(f['key'])
        return value

    def to_representation(self, instance):
        # After create/update, return the full read serializer with all fields including id
        return BOQTemplateSerializer(instance, context=self.context).data

class BOQSurveyDataSerializer(serializers.ModelSerializer):
    """Read: Full survey data with all allocations"""
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = BOQSurveyData
        fields = ['id', 'level', 'file_name', 'data', 'item_count', 'created_at', 'created_by']
        read_only_fields = fields

    def get_item_count(self, obj):
        return len(obj.data.get('items', []))


class BOQSurveyDataWriteSerializer(serializers.ModelSerializer):
    """Write: Accept Excel file and parse it"""
    file = serializers.FileField(write_only=True, required=True)

    class Meta:
        model = BOQSurveyData
        fields = ['file']

    def create(self, validated_data):
        from apps.boq.utils.survey_parser import SurveyParser, SurveyParseError
        
        boq = self.context['boq']
        file_obj = validated_data['file']
        
        try:
            parser = SurveyParser(boq=boq)
            parsed_data = parser.parse(file_obj.read())
        except SurveyParseError as e:
            raise serializers.ValidationError({'file': str(e)})
        
        # Delete old survey if exists (one survey per BOQ)
        BOQSurveyData.objects.filter(boq=boq).delete()
        
        # Create new one
        survey = BOQSurveyData.objects.create(
            boq=boq,
            level=parsed_data['level'],
            data=parsed_data,
            file_name=file_obj.name,
            created_by=self.context['request'].user
        )
        
        return survey