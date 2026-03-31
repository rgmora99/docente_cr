from django.contrib.auth.views import LoginView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from .services.dashboard_service import DashboardService
from .services.ui_theme_service import UIThemeService


class TeacherLoginView(LoginView):
    template_name = 'core/login.html'
    redirect_authenticated_user = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['login_highlights'] = UIThemeService.get_login_highlights()
        return context


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'core/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(DashboardService.get_dashboard_payload())
        return context


class WeeklyPlannerView(LoginRequiredMixin, TemplateView):
    template_name = 'core/weekly_planner.html'


class MaterialsView(LoginRequiredMixin, TemplateView):
    template_name = 'core/materials.html'


class PlanningGeneratorView(LoginRequiredMixin, TemplateView):
    template_name = 'core/planning_generator.html'
