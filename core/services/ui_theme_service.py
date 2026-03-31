class UIThemeService:
    """Centralized design tokens and static UI content."""

    @staticmethod
    def get_theme_tokens():
        return {
            'brand_name': 'Docente CR',
            'palette': {
                'purple': '#7C3AED',
                'cyan': '#38BDF8',
                'yellow': '#FACC15',
                'pink': '#F472B6',
                'mint': '#34D399',
                'light': '#F8FAFC',
            },
        }

    @staticmethod
    def get_login_highlights():
        return [
            'Diseño moderno y limpio para uso diario.',
            'Planeación semanal rápida y organizada.',
            'Recursos y materiales centralizados.',
        ]
