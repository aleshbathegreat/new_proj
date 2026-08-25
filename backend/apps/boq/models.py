from django.db import models

from apps.core.models import BaseModel
from apps.projects.models import Project
from django.conf import settings


class BOQTemplate(BaseModel):
    SOURCE_CHOICES = [('MANUAL', 'Manual'), ('IMPORT', 'Excel Import')]

    name = models.CharField(max_length=255)
    code = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='MANUAL')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    # [{ "key": "hs_code", "label": "HS Code", "data_type": "text",
    #    "unit": null, "required": false, "default": "", "options": [], "sort_order": 1 }, ...]
    fields = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['name']


class BOQ(BaseModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('UPLOADING', 'Uploading'),
        ('PARSING', 'Parsing'),
        ('READY', 'Ready'),
        ('PUBLISHED', 'Published'),
    ]

    project = models.ForeignKey(Project, related_name='boqs', on_delete=models.CASCADE)
    site = models.ForeignKey(
        'sites.Site', related_name='boqs', on_delete=models.PROTECT,
        null=True, blank=True,
    )
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    template = models.ForeignKey(
        BOQTemplate, related_name='boqs', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"BOQ v{self.version} - {self.project.name}"


class BOQItem(BaseModel):
    """
    Line item matching the SC-GIMS import BOQ spreadsheet columns.
    Derived fields (fob_total, price_with_*, total_ddp_*) are computed properties.

    Cost/duty/rate fields are nullable: `None` means the source spreadsheet
    for this BOQ never had that column, distinct from an explicit value of 0.
    This lets the HS-Code lookup feature show only fields actually present
    in a given BOQ instead of a wall of zeroes.
    """

    boq = models.ForeignKey(BOQ, related_name='items', on_delete=models.CASCADE)

    # Identity / catalogue
    pc1 = models.CharField(max_length=50, blank=True, default='')
    no = models.PositiveIntegerField(default=1)
    item_type = models.CharField(max_length=100, blank=True, default='')
    item = models.CharField(max_length=100)
    item_description = models.TextField()
    model_name = models.CharField(max_length=150, blank=True, default='')
    model = models.CharField(max_length=150, blank=True, default='')
    oem = models.CharField(max_length=150, blank=True, default='')
    unit = models.CharField(max_length=20)
    package_qty = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    qty = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # FOB / HS / currency
    fob = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    hs_code_description = models.TextField(blank=True, default='')
    hs_code = models.CharField(max_length=50, blank=True, default='')
    curr = models.CharField(max_length=10, blank=True, default='')
    tax = models.CharField(max_length=50, blank=True, default='')
    curr_rate = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)

    # Percentage inputs
    bank_charges_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    freight_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    landing_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    insurance_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    cd_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    acd_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    rd_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    st_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    ast_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    it_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    cess_pct = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)

    # Absolute cost columns
    bank_charges = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    freight_insurance = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True,
        help_text='F/I',
    )
    price_with_fi = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True,
        help_text='PriceWithF/I',
    )
    landing = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    insurance = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    custom_duty = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    addl_custom_duty = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    regulatory_duty = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    sales_tax = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    addl_sales_tax = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    income_tax = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    cess_tax = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    ddp_unit_usd = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    ddp_unit_pkr = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    # App tracking (not in spreadsheet) — these stay non-nullable, they're
    # app-managed values, not data that comes-or-doesn't from a spreadsheet.
    actual_quantity = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    quantity_tolerance_pct = models.DecimalField(max_digits=5, decimal_places=2, default=5)

    class Meta:
        ordering = ['no', 'item']

    # --- Derived (Excel formulas) ---
    # Each property now returns None if any required input is missing,
    # instead of raising or silently treating a missing column as zero.

    @property
    def fob_total(self):
        if self.fob is None:
            return None
        return self.fob * self.qty

    @property
    def price_with_landing(self):
        """PriceWithLanding (AF+AG) = PriceWithF/I + Landing."""
        if self.price_with_fi is None or self.landing is None:
            return None
        return self.price_with_fi + self.landing

    @property
    def price_with_insurance(self):
        """PriceWithInsurance (AH+AI) = PriceWithLanding + Insurance."""
        pwl = self.price_with_landing
        if pwl is None or self.insurance is None:
            return None
        return pwl + self.insurance

    @property
    def total_ddp_usd(self):
        if self.ddp_unit_usd is None:
            return None
        return self.ddp_unit_usd * self.qty

    @property
    def total_ddp_pkr(self):
        if self.ddp_unit_pkr is None:
            return None
        return self.ddp_unit_pkr * self.qty

    # Aliases used by progress / variance UIs
    @property
    def item_code(self):
        return self.item

    @property
    def description(self):
        return self.item_description

    @property
    def planned_quantity(self):
        return self.qty

    @property
    def amount(self):
        return self.total_ddp_pkr

    def __str__(self):
        return f"{self.item} - {self.item_description[:30]}"