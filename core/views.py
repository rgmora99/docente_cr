from datetime import date, timedelta
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'core/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        today = date.today()
        context['next_activities'] = [
            {'title': 'Revisión de tareas 7°A', 'date': today + timedelta(days=1)},
            {'title': 'Laboratorio de ciencias 8°B', 'date': today + timedelta(days=2)},
            {'title': 'Evaluación diagnóstica 9°C', 'date': today + timedelta(days=4)},
        ]
        context['recent_materials'] = [
            'Guía de lectura comprensiva',
            'Presentación: Ecosistemas de Costa Rica',
            'Rúbrica de trabajo colaborativo',
        ]
        context['weekly_summary'] = {
            'classes': 24,
            'materials_uploaded': 6,
            'pending_assessments': 3,
        }
        return context


class WeeklyPlannerView(LoginRequiredMixin, TemplateView):
    template_name = 'core/weekly_planner.html'


class MaterialsView(LoginRequiredMixin, TemplateView):
    template_name = 'core/materials.html'


class PlanningGeneratorView(LoginRequiredMixin, TemplateView):
    template_name = 'core/planning_generator.html'
