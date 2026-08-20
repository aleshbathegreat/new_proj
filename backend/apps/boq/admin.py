from django.contrib import admin
from .models import BOQ, BOQItem, BOQTemplate

@admin.register(BOQTemplate)
class BOQTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'source', 'is_active', 'created_at')
    list_filter = ('source', 'is_active')
    search_fields = ('name', 'code')