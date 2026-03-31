from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PlanningRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=140)),
                ('subject', models.CharField(max_length=80)),
                ('level', models.CharField(max_length=40)),
                ('learning_objective', models.TextField()),
                ('learning_sequence', models.TextField(help_text='Inicio, desarrollo y cierre sugeridos.')),
                ('assessment_strategy', models.TextField(help_text='Cómo comprobarás el logro del objetivo.')),
                ('resources', models.TextField(blank=True)),
                ('follow_up_notes', models.TextField(blank=True, help_text='Pendientes para dar continuidad y mantenimiento a la planeación.')),
                ('week_start', models.DateField(blank=True, null=True)),
                ('status', models.CharField(choices=[('borrador', 'Borrador'), ('en_curso', 'En curso'), ('cerrado', 'Cerrado'), ('archivado', 'Archivado')], default='borrador', max_length=12)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='planning_records', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
    ]
