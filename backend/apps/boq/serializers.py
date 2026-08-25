from rest_framework import serializers

from apps.projects.models import Project
from .models import BOQ, BOQItem, BOQTemplate


class BOQItemSerializer(serializers.ModelSerializer):
    boq_id = serializers.UUIDField(read_only=True)
    site_id = serializers.SerializerMethodField()
    site_name = serializers.SerializerMethodField()
    project_id = serializers.UUIDField(source='boq.project_id', read_only=True)
    project_name = serializers.CharField(source='boq.project.name', read_only=True)
    district_id = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()
    province_id = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()

    fob_total = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    price_with_landing = serializers.DecimalField(max_digits=14, decimal_places=4, read_only=True)
    price_with_insurance = serializers.DecimalField(max_digits=14, decimal_places=4, read_only=True)
    total_ddp_usd = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    total_ddp_pkr = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True)
    item_code = serializers.CharField(source='item', read_only=True)
    description = serializers.CharField(source='item_description', read_only=True)
    planned_quantity = serializers.DecimalField(source='qty', max_digits=14, decimal_places=2, read_only=True)
    amount = serializers.DecimalField(source='total_ddp_pkr', max_digits=18, decimal_places=2, read_only=True)

    class Meta:
        model = BOQItem
        fields = [
            'id', 'boq_id', 'site_id', 'site_name', 'project_id', 'project_name',
            'district_id', 'district_name', 'province_id', 'province_name',
            'pc1', 'no', 'item_type', 'item', 'item_code', 'item_description', 'description',
            'model_name', 'model', 'oem', 'unit', 'package_qty', 'qty', 'planned_quantity',
            'actual_quantity', 'fob', 'fob_total', 'hs_code_description', 'hs_code', 'curr',
            'tax', 'curr_rate', 'bank_charges_pct', 'freight_pct', 'landing_pct',
            'insurance_pct', 'cd_pct', 'acd_pct', 'rd_pct', 'st_pct', 'ast_pct', 'it_pct',
            'cess_pct', 'bank_charges', 'freight_insurance', 'price_with_fi', 'landing',
            'price_with_landing', 'insurance', 'price_with_insurance', 'custom_duty',
            'addl_custom_duty', 'regulatory_duty', 'sales_tax', 'addl_sales_tax',
            'income_tax', 'cess_tax', 'ddp_unit_usd', 'total_ddp_usd', 'ddp_unit_pkr',
            'total_ddp_pkr', 'amount', 'quantity_tolerance_pct', 'created_at', 'updated_at',
        ]

    def get_site_id(self, obj):
        return obj.boq.site_id

    def get_site_name(self, obj):
        return obj.boq.site.name if obj.boq.site_id else None

    def get_district_id(self, obj):
        site = obj.boq.site
        return site.town.district_id if site and site.town_id else None

    def get_district_name(self, obj):
        site = obj.boq.site
        return site.town.district.name if site and site.town_id else None

    def get_province_id(self, obj):
        site = obj.boq.site
        return site.town.district.province_id if site and site.town_id else None

    def get_province_name(self, obj):
        site = obj.boq.site
        return site.town.district.province.name if site and site.town_id else None
    

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
    site_id = serializers.SerializerMethodField()
    site_name = serializers.SerializerMethodField()
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
        return sum((item.total_ddp_pkr or 0 for item in obj.items.all()), 0)

    def get_items_count(self, obj):
        if hasattr(obj, 'items_count_ann'):
            return obj.items_count_ann
        return obj.items.count()

    def get_site_id(self, obj):
        return obj.site_id

    def get_site_name(self, obj):
        return obj.site.name if obj.site_id else None

    
class BOQWriteSerializer(serializers.ModelSerializer):
    template_id = serializers.PrimaryKeyRelatedField(
        source='template', queryset=BOQTemplate.objects.all(), required=False, allow_null=True
    )
    project_id = serializers.PrimaryKeyRelatedField(
        source='project', queryset=Project.objects.all()
    )

    class Meta:
        model = BOQ
        fields = ['project_id', 'version', 'template_id']   # site_id removed

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
