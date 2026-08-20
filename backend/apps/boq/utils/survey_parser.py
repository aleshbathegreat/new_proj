"""
Survey sheet parser. Validates and extracts district/site allocations.
Easy to modify: change column names, validation rules, or error messages here.
"""
import pandas as pd
from django.core.exceptions import ValidationError
from apps.provinces.models import District
from apps.sites.models import Site
from apps.boq.models import BOQItem


class SurveyParseError(ValidationError):
    """Custom error for survey parsing"""
    pass


class SurveyParser:
    """
    Main parser class. Instantiate once per upload, call parse().
    
    Usage:
        parser = SurveyParser(boq=boq_instance)
        result = parser.parse(excel_buffer)
    """
    
    # These column names are case-insensitive when detected
    REQUIRED_COLUMNS = {'CAMERA TYPE', 'MODEL NAME', 'DISTRICT', 'QTY'}
    OPTIONAL_COLUMNS = {'SITE', 'SITE NAME'}
    
    def __init__(self, boq):
        self.boq = boq
        self.province = boq.project.province if boq.project else None
    
    def parse(self, file_buffer):
        """
        Main entry point. Returns dict ready to store in BOQSurveyData.data
        
        Returns:
            {
                'level': 'DISTRICT' or 'SITE',
                'items': [...]
            }
        
        Raises:
            SurveyParseError: If validation fails
        """
        try:
            df = pd.read_excel(file_buffer, sheet_name=0)
        except Exception as e:
            raise SurveyParseError(f'Failed to read Excel file: {str(e)}')
        
        # Step 1: Validate headers (case-insensitive)
        self._validate_headers(df)
        
        # Step 2: Detect whether survey is DISTRICT or SITE level
        level = self._detect_level(df)
        
        # Step 3: Parse each row and group by item
        items = self._parse_items(df, level)
        
        return {
            'level': level,
            'items': items
        }
    
    def _validate_headers(self, df):
        """Check required columns exist (case-insensitive)"""
        columns_lower = {col.lower().strip() for col in df.columns}
        
        # Check required columns
        required_lower = {col.lower() for col in self.REQUIRED_COLUMNS}
        missing = required_lower - columns_lower
        if missing:
            available = ', '.join(df.columns)
            raise SurveyParseError(
                f'Missing required columns: {missing}. '
                f'Available: {available}'
            )
    
    def _detect_level(self, df):
        """Returns 'DISTRICT' or 'SITE' based on which columns exist"""
        columns_lower = {col.lower().strip() for col in df.columns}
        has_site = any(col in columns_lower for col in {'site', 'site name'})
        return 'SITE' if has_site else 'DISTRICT'
    
    def _get_column_name(self, df, possible_names):
        """Helper: find actual column name (case-insensitive)"""
        columns_lower_to_actual = {col.lower().strip(): col for col in df.columns}
        for name in possible_names:
            if name.lower() in columns_lower_to_actual:
                return columns_lower_to_actual[name.lower()]
        return None
    
    def _parse_items(self, df, level):
        """Group rows by item_id (ITEM_TYPE::MODEL_NAME) and validate"""
        
        # Map column names
        item_type_col = self._get_column_name(df, ['ITEM TYPE', 'CAMERA TYPE', 'ITEM_TYPE'])
        model_col = self._get_column_name(df, ['MODEL NAME', 'MODEL', 'MODEL_NAME'])
        district_col = self._get_column_name(df, ['DISTRICT', 'DISTRICT NAME', 'DISTRICT_NAME'])
        qty_col = self._get_column_name(df, ['QTY', 'QUANTITY', 'QTY'])
        site_col = self._get_column_name(df, ['SITE', 'SITE NAME', 'SITE_NAME'])
        
        if not all([item_type_col, model_col, district_col, qty_col]):
            raise SurveyParseError('Could not map required columns')
        
        # Group rows by item_id
        grouped = {}
        for idx, row in df.iterrows():
            item_type = str(row[item_type_col]).strip()
            model_name = str(row[model_col]).strip()
            district_name = str(row[district_col]).strip()
            qty = row[qty_col]
            site_name = str(row[site_col]).strip() if site_col and pd.notna(row[site_col]) else None
            
            item_id = f'{item_type}::{model_name}'
            
            if item_id not in grouped:
                grouped[item_id] = {
                    'item_type': item_type,
                    'model_name': model_name,
                    'allocations': []
                }
            
            # Resolve district & site UUIDs
            try:
                district = District.objects.get(
                    name__iexact=district_name,
                    province=self.province
                )
            except District.DoesNotExist:
                raise SurveyParseError(
                    f'Row {idx+2}: District "{district_name}" not found. '
                    f'Available: {", ".join(District.objects.filter(province=self.province).values_list("name", flat=True))}'
                )
            
            site_id = None
            if site_name:
                try:
                    site = Site.objects.get(
                        name__iexact=site_name,
                        town__district=district
                    )
                    site_id = str(site.id)
                except Site.DoesNotExist:
                    raise SurveyParseError(
                        f'Row {idx+2}: Site "{site_name}" not found in {district_name}. '
                        f'Available: {", ".join(Site.objects.filter(town__district=district).values_list("name", flat=True))}'
                    )
            
            grouped[item_id]['allocations'].append({
                'district': district_name,
                'district_id': str(district.id),
                'site': site_name,
                'site_id': site_id,
                'qty': int(qty)
            })
        
        # Step 4: Validate each item_id exists in BOQ and sum matches
        items = []
        for item_id, item_data in grouped.items():
            try:
                boq_item = BOQItem.objects.get(
                    boq=self.boq,
                    item_type__iexact=item_data['item_type'],
                    model_name__iexact=item_data['model_name']
                )
            except BOQItem.DoesNotExist:
                raise SurveyParseError(
                    f'Item "{item_id}" in survey not found in BOQ. '
                    f'Available items: {self._available_boq_items()}'
                )
            
            # Validate qty sum
            total_qty = sum(a['qty'] for a in item_data['allocations'])
            if total_qty != boq_item.qty:
                raise SurveyParseError(
                    f'Item "{item_id}": survey total qty ({total_qty}) != BOQ qty ({boq_item.qty})'
                )
            
            item_data['item_id'] = item_id
            item_data['boq_item_id'] = str(boq_item.id)
            items.append(item_data)
        
        return items
    
    def _available_boq_items(self):
        """Helper: list all item_ids in this BOQ for error messages"""
        items = BOQItem.objects.filter(boq=self.boq)
        return ', '.join([f'{i.item_type}::{i.model_name}' for i in items])