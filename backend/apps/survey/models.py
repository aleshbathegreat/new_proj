from django.conf import settings
from django.db import models

from apps.core.models import BaseModel
from apps.projects.models import Project


class Survey(BaseModel):
    """A survey belongs to a whole project - no site or BOQ scoping."""

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('READY', 'Ready'),
    ]

    project = models.ForeignKey(Project, related_name='surveys', on_delete=models.CASCADE)
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Survey v{self.version} - {self.project.name}"


class SurveyItem(BaseModel):
    """
    A single row from an uploaded survey spreadsheet. Survey sheets have no
    fixed schema - every column from the source file is preserved verbatim,
    keyed by its original header text, in `data`.
    """

    survey = models.ForeignKey(Survey, related_name='items', on_delete=models.CASCADE)
    row_number = models.PositiveIntegerField(default=1)
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['row_number']

    def __str__(self):
        return f"Row {self.row_number} - Survey {self.survey_id}"