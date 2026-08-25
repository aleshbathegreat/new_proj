# apps/survey/admin.py
from django.contrib import admin
from .models import Survey, SurveyItem

admin.site.register(Survey)
admin.site.register(SurveyItem)