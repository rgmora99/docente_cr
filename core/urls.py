from django.urls import path
from django.contrib.auth import views as auth_views
from .views import DashboardView, WeeklyPlannerView, MaterialsView, PlanningGeneratorView

urlpatterns = [
    path('', auth_views.LoginView.as_view(template_name='core/login.html'), name='login'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('planificador-semanal/', WeeklyPlannerView.as_view(), name='weekly_planner'),
    path('materiales/', MaterialsView.as_view(), name='materials'),
    path('planeamientos/', PlanningGeneratorView.as_view(), name='planning_generator'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
]
