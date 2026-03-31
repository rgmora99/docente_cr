from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import TemplateView

from .forms import PlanningRecordForm
from .models import PlanningRecord
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

    def dispatch(self, request, *args, **kwargs):
        self.selected_planning = None
        plan_id = request.GET.get('plan') or request.POST.get('plan_id')
        if plan_id:
            self.selected_planning = get_object_or_404(
                PlanningRecord,
                id=plan_id,
                teacher=request.user,
            )
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['planning_items'] = PlanningRecord.objects.filter(teacher=self.request.user)

        if 'planning_form' in kwargs:
            context['planning_form'] = kwargs['planning_form']
        elif self.selected_planning:
            context['planning_form'] = PlanningRecordForm(instance=self.selected_planning)
        else:
            context['planning_form'] = PlanningRecordForm(
                initial={
                    'status': PlanningRecord.Status.BORRADOR,
                    'learning_sequence': (
                        'Inicio: activar conocimientos previos.\n'
                        'Desarrollo: actividad guiada y práctica colaborativa.\n'
                        'Cierre: reflexión y evidencia final corta.'
                    ),
                    'assessment_strategy': 'Lista de cotejo + pregunta de salida.',
                }
            )

        context['selected_planning'] = self.selected_planning
        return context

    def post(self, request, *args, **kwargs):
        action = request.POST.get('action', 'save')

        if action == 'delete' and self.selected_planning:
            self.selected_planning.delete()
            messages.success(request, 'Planeación eliminada del historial.')
            return redirect('planning_generator')

        form = PlanningRecordForm(request.POST, instance=self.selected_planning)
        if not form.is_valid():
            messages.error(request, 'Revisa los campos obligatorios para guardar la planeación.')
            return self.render_to_response(self.get_context_data(planning_form=form))

        planning = form.save(commit=False)
        planning.teacher = request.user
        planning.save()

        if self.selected_planning:
            messages.success(request, 'Planeación actualizada correctamente.')
        else:
            messages.success(request, 'Borrador de planeación creado.')

        return redirect('planning_generator')


class TeacherProfilesView(LoginRequiredMixin, TemplateView):
    template_name = 'core/teacher_profiles.html'
