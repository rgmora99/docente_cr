# Docente CR - Base inicial

Estructura base para un sistema docente con:

- **Backend:** Django + PostgreSQL
- **Frontend:** Django Templates + Bootstrap 5 + JavaScript
- **UI:** menú lateral, dashboard con tarjetas coloridas, secciones limpias y fondo claro

## Módulos incluidos (v1)

- Login moderno y responsivo
- Dashboard colorido
- Planificador semanal
- Repositorio de materiales
- Generador básico de planeamientos

## Arquitectura reutilizable

Se separó la lógica en **servicios** para evitar duplicación:

- `core/services/dashboard_service.py`: datos del dashboard y tarjetas principales.
- `core/services/ui_theme_service.py`: tokens de diseño y contenido estático reutilizable.
- `core/context_processors.py`: inyecta el tema global (`ui_theme`) en todos los templates.
- `core/templates/core/components/feature_card.html`: componente reutilizable de tarjeta.

## Puesta en marcha

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Variables opcionales

- `POSTGRES_DB` (default: `docente_cr`)
- `POSTGRES_USER` (default: `postgres`)
- `POSTGRES_PASSWORD` (default: `postgres`)
- `POSTGRES_HOST` (default: `localhost`)
- `POSTGRES_PORT` (default: `5432`)
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG` (`1` o `0`)

## Problemas comunes

Si en Windows aparece `You don't have permission to access that port`, inicia en otro puerto:

```bash
python manage.py runserver 127.0.0.1:8080
```
