from django import forms

from .models import PlanningRecord


class PlanningRecordForm(forms.ModelForm):
    class Meta:
        model = PlanningRecord
        fields = [
            'title',
            'subject',
            'level',
            'week_start',
            'learning_objective',
            'learning_sequence',
            'assessment_strategy',
            'resources',
            'follow_up_notes',
            'status',
        ]
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control rounded-3'}),
            'subject': forms.TextInput(attrs={'class': 'form-control rounded-3'}),
            'level': forms.TextInput(attrs={'class': 'form-control rounded-3'}),
            'week_start': forms.DateInput(attrs={'class': 'form-control rounded-3', 'type': 'date'}),
            'learning_objective': forms.Textarea(attrs={'class': 'form-control rounded-3', 'rows': 3}),
            'learning_sequence': forms.Textarea(attrs={'class': 'form-control rounded-3', 'rows': 4}),
            'assessment_strategy': forms.Textarea(attrs={'class': 'form-control rounded-3', 'rows': 3}),
            'resources': forms.Textarea(attrs={'class': 'form-control rounded-3', 'rows': 2}),
            'follow_up_notes': forms.Textarea(attrs={'class': 'form-control rounded-3', 'rows': 2}),
            'status': forms.Select(attrs={'class': 'form-select rounded-3'}),
        }
        labels = {
            'title': 'Tema o nombre de la clase',
            'subject': 'Asignatura',
            'level': 'Nivel',
            'week_start': 'Semana de trabajo (opcional)',
            'learning_objective': 'Objetivo de aprendizaje',
            'learning_sequence': 'Secuencia didáctica',
            'assessment_strategy': 'Estrategia de evaluación',
            'resources': 'Recursos',
            'follow_up_notes': 'Notas de mantenimiento',
            'status': 'Estado',
        }
