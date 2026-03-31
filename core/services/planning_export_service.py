from __future__ import annotations

from datetime import datetime

from core.models import PlanningRecord


class PlanningExportService:
    @staticmethod
    def build_word_document(plan: PlanningRecord) -> bytes:
        sections = [
            ('Tema / Unidad', plan.title),
            ('Asignatura', plan.subject),
            ('Nivel', plan.level),
            ('Semana de trabajo', plan.week_start.strftime('%d/%m/%Y') if plan.week_start else 'No definida'),
            ('Aprendizajes esperados', plan.learning_objective),
            ('Mediación didáctica', plan.learning_sequence),
            ('Indicadores de evaluación', plan.assessment_strategy),
            ('Recursos', plan.resources or 'No especificados'),
            ('Observaciones de seguimiento', plan.follow_up_notes or 'Sin observaciones'),
            ('Estado', plan.get_status_display()),
            ('Actualizado', datetime.strftime(plan.updated_at, '%d/%m/%Y %H:%M')),
        ]

        body_html = ''.join(
            f'<h3>{title}</h3><p>{value.replace(chr(10), "<br>")}</p>'
            for title, value in sections
        )

        document_html = f"""
<!DOCTYPE html>
<html lang=\"es\">
<head>
  <meta charset=\"utf-8\">
  <title>Planeamiento - {plan.title}</title>
  <style>
    body {{ font-family: Arial, sans-serif; line-height: 1.4; color: #111; }}
    h1 {{ margin-bottom: 0; }}
    small {{ color: #666; }}
    h3 {{ margin-top: 22px; margin-bottom: 6px; }}
    p {{ margin: 0; white-space: normal; }}
  </style>
</head>
<body>
  <h1>Planeamiento didáctico</h1>
  <small>Docente CR · Exportación Word</small>
  {body_html}
</body>
</html>
""".strip()
        return document_html.encode('utf-8')

    @staticmethod
    def build_pdf_document(plan: PlanningRecord) -> bytes:
        lines = [
            'Planeamiento didáctico - Docente CR',
            f'Tema / Unidad: {plan.title}',
            f'Asignatura: {plan.subject}',
            f'Nivel: {plan.level}',
            f'Semana: {plan.week_start.strftime("%d/%m/%Y") if plan.week_start else "No definida"}',
            f'Estado: {plan.get_status_display()}',
            '',
            'Aprendizajes esperados:',
            *plan.learning_objective.splitlines(),
            '',
            'Mediación didáctica:',
            *plan.learning_sequence.splitlines(),
            '',
            'Indicadores de evaluación:',
            *plan.assessment_strategy.splitlines(),
            '',
            'Recursos:',
            *(plan.resources.splitlines() if plan.resources else ['No especificados']),
            '',
            'Observaciones:',
            *(plan.follow_up_notes.splitlines() if plan.follow_up_notes else ['Sin observaciones']),
        ]

        return PlanningExportService._simple_pdf(lines)

    @staticmethod
    def _simple_pdf(lines: list[str]) -> bytes:
        def esc(text: str) -> str:
            return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

        y_start = 800
        line_height = 14
        max_lines = 50
        content_lines = ['BT', '/F1 11 Tf', f'50 {y_start} Td']

        for idx, raw in enumerate(lines[:max_lines]):
            line = esc(raw[:110])
            if idx == 0:
                content_lines.append(f'({line}) Tj')
            else:
                content_lines.append(f'0 -{line_height} Td ({line}) Tj')

        content_lines.append('ET')
        stream = '\n'.join(content_lines).encode('latin-1', errors='replace')

        objects = [
            b'1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
            b'2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
            b'3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n',
            b'4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
            f'5 0 obj << /Length {len(stream)} >> stream\n'.encode('ascii') + stream + b'\nendstream endobj\n',
        ]

        pdf = b'%PDF-1.4\n'
        offsets: list[int] = []
        for obj in objects:
            offsets.append(len(pdf))
            pdf += obj

        xref_start = len(pdf)
        pdf += f'xref\n0 {len(objects) + 1}\n'.encode('ascii')
        pdf += b'0000000000 65535 f \n'
        for offset in offsets:
            pdf += f'{offset:010d} 00000 n \n'.encode('ascii')

        pdf += (
            b'trailer << /Size ' + str(len(objects) + 1).encode('ascii') + b' /Root 1 0 R >>\n'
            b'startxref\n' + str(xref_start).encode('ascii') + b'\n%%EOF'
        )
        return pdf
