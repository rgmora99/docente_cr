# Docente CR - Base inicial

Estructura base para un sistema docente con:

- **Backend:** Django + PostgreSQL
- **Frontend:** Django Templates + Bootstrap 5 + JavaScript
- **UI:** menú lateral, dashboard con tarjetas coloridas, secciones limpias y fondo claro

## Módulos incluidos (v1)

- Login
- Dashboard colorido
- Planificador semanal
- Repositorio de materiales
- Generador básico de planeamientos

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

