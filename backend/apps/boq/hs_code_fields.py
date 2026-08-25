"""
Canonical HS-Code-related field list for the per-BOQ HS Code lookup feature.
Order and labels match the standard SC-GIMS BOQ spreadsheet columns.
"""

HS_CODE_FIELDS = [
    ('fob', 'FOB'),
    ('fob_total', 'FOB Total'),                            # property
    ('hs_code_description', 'HS Code Description'),
    ('hs_code', 'HS Code'),
    ('curr', 'CURR'),
    ('tax', 'TAX'),
    ('curr_rate', 'CURR Rate'),
    ('bank_charges_pct', 'Bank Charges %'),
    ('freight_pct', 'Freight %'),
    ('landing_pct', 'Landing %'),
    ('insurance_pct', 'Insurance %'),
    ('cd_pct', 'CD%'),
    ('acd_pct', 'ACD%'),
    ('rd_pct', 'RD%'),
    ('st_pct', 'ST%'),
    ('ast_pct', 'AST%'),
    ('it_pct', 'IT%'),
    ('cess_pct', 'CESS%'),
    ('bank_charges', 'BankCharges'),
    ('freight_insurance', 'F/I'),
    ('price_with_fi', 'PriceWithF/I'),
    ('landing', 'Landing'),
    ('price_with_landing', 'PriceWithLanding (AF+AG)'),     # property
    ('insurance', 'Insurance'),
    ('price_with_insurance', 'PriceWithInsurance(AH+AI)'),  # property
    ('custom_duty', 'CustomDuty'),
    ('addl_custom_duty', 'AddlCustomDuty'),
    ('regulatory_duty', 'RegulatoryDuty'),
    ('sales_tax', 'SalesTax'),
    ('addl_sales_tax', 'AddlSalesTax'),
    ('income_tax', 'IncomeTax'),
    ('cess_tax', 'CessTax'),
    ('ddp_unit_usd', 'DDPUnit USD'),
    ('total_ddp_usd', 'TotalDDP USD'),                      # property
    ('ddp_unit_pkr', 'DDPUnitPKR'),
    ('total_ddp_pkr', 'TotalDDPPKR'),                       # property
]


def build_hs_code_profile(items):
    """
    Merge one or more BOQItem rows sharing an HS code, within a single BOQ,
    into one key-value list. Only fields with a value on at least one row
    are included — a field absent from every row (NULL, meaning the source
    spreadsheet never had that column) is skipped entirely rather than
    shown as 0.

    `items` is expected to be a queryset/list already filtered to one
    BOQ + one hs_code.
    """
    rows = list(items)
    pairs = []
    for field, label in HS_CODE_FIELDS:
        values = []
        for row in rows:
            v = getattr(row, field, None)
            if v not in (None, ''):
                values.append(v)
        if not values:
            continue
        distinct = {str(v) for v in values}
        pairs.append({
            'key': field,
            'label': label,
            'value': values[0],
            'conflict': len(distinct) > 1,
            'all_values': list(distinct) if len(distinct) > 1 else None,
        })

    return {
        'hs_code': rows[0].hs_code,
        'matched_items': [
            {'id': str(r.id), 'item': r.item, 'item_description': r.item_description}
            for r in rows
        ],
        'fields': pairs,
    }