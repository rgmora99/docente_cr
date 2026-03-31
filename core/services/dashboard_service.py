from datetime import date, timedelta


class DashboardService:
    """Provide reusable dashboard data in a single place."""

    @staticmethod
    def get_dashboard_payload():
        today = date.today()
        return {
            'feature_cards': [
                {
                    'title': 'Planificador semanal',
                    'icon': 'bi-calendar-week',
                    'url_name': 'weekly_planner',
                    'accent': 'accent-purple',
                },
                {
                    'title': 'Planeamientos',
                    'icon': 'bi-pencil-square',
                    'url_name': 'planning_generator',
                    'accent': 'accent-cyan',
                },
                {
                    'title': 'Materiales',
                    'icon': 'bi-folder2-open',
                    'url_name': 'materials',
                    'accent': 'accent-mint',
                },
                {
                    'title': 'Exámenes',
                    'icon': 'bi-ui-checks-grid',
                    'url_name': None,
                    'accent': 'accent-pink',
                },
            ],
            'next_activities': [
                {'title': 'Revisión de tareas 7°A', 'date': today + timedelta(days=1)},
                {'title': 'Laboratorio de ciencias 8°B', 'date': today + timedelta(days=2)},
                {'title': 'Evaluación diagnóstica 9°C', 'date': today + timedelta(days=4)},
            ],
            'recent_materials': [
                'Guía de lectura comprensiva',
                'Presentación: Ecosistemas de Costa Rica',
                'Rúbrica de trabajo colaborativo',
            ],
            'weekly_summary': {
                'classes': 24,
                'materials_uploaded': 6,
                'pending_assessments': 3,
            },
        }
