from django.conf import settings
from django.db import models


class PlanningRecord(models.Model):
    class Status(models.TextChoices):
        BORRADOR = 'borrador', 'Borrador'
        EN_CURSO = 'en_curso', 'En curso'
        CERRADO = 'cerrado', 'Cerrado'
        ARCHIVADO = 'archivado', 'Archivado'

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='planning_records',
    )
    title = models.CharField(max_length=140)
    subject = models.CharField(max_length=80)
    level = models.CharField(max_length=40)
    learning_objective = models.TextField()
    learning_sequence = models.TextField(
        help_text='Inicio, desarrollo y cierre sugeridos.'
    )
    assessment_strategy = models.TextField(
        help_text='Cómo comprobarás el logro del objetivo.'
    )
    resources = models.TextField(blank=True)
    follow_up_notes = models.TextField(
        blank=True,
        help_text='Pendientes para dar continuidad y mantenimiento a la planeación.',
    )
    week_start = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.BORRADOR,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self) -> str:
        return f'{self.subject} - {self.title}'
