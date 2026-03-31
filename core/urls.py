from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    TeacherLoginView,
    DashboardView,
    WeeklyPlannerView,
    MaterialsView,
    PlanningGeneratorView,
    PlanningExportView,
    TeacherProfilesView,
)

urlpatterns = [
    path('', TeacherLoginView.as_view(), name='login'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('planificador-semanal/', WeeklyPlannerView.as_view(), name='weekly_planner'),
    path('materiales/', MaterialsView.as_view(), name='materials'),
    path('planeamientos/', PlanningGeneratorView.as_view(), name='planning_generator'),
    path(
        'planeamientos/<int:plan_id>/exportar/<str:export_format>/',
        PlanningExportView.as_view(),
        name='planning_export',
    ),
    path('configuracion-planeaciones/', TeacherProfilesView.as_view(), name='teacher_profiles'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
]
