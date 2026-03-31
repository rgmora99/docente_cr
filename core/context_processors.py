from .services.ui_theme_service import UIThemeService


def ui_theme(_request):
    return {
        'ui_theme': UIThemeService.get_theme_tokens(),
    }
