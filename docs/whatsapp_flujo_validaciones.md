# Validaciones recomendadas para flujo de WhatsApp (adjuntos secuenciales)

## Problema observado
Cuando la persona usuaria envía **varios archivos juntos** (o en segundos de diferencia), el bot:

1. procesa cada evento de forma aislada,
2. dispara la misma respuesta automática varias veces,
3. avanza de etapa sin validar el conjunto esperado,
4. y en ocasiones la confirmación no queda visible en el chat del agente.

## Objetivo
Hacer el flujo más claro y robusto para que:

- se valide el expediente por etapas,
- se eviten respuestas duplicadas,
- y el agente siempre vea la respuesta automática emitida.

## 1) Definir una máquina de estados explícita
Modelar el trámite por estados (ejemplo):

- `START`
- `AWAITING_AUTHORIZATION_FORM`
- `AWAITING_EXONERATION_FORM`
- `AWAITING_ID_IMAGE`
- `AWAITING_INVOICE_IMAGE`
- `COMPLETED`

Regla: un estado solo cambia cuando se cumple su validación.

## 2) Separar “recepción” de “avance de flujo”
Cada evento entrante debe pasar por dos pasos:

- **Recepción técnica**: guardar media, metadatos y hash del archivo.
- **Validación de negocio**: decidir si ese archivo satisface el estado actual.

Esto evita que el estado avance solo por haber llegado un mensaje.

## 3) Ventana de agrupación (batch window)
Cuando llegan 2–3 archivos casi al mismo tiempo, agrupar durante una ventana corta (ej. 3–5 segundos) antes de decidir respuestas.

Recomendación:

- usar `conversation_id + sender + ventana_tiempo` como `batch_key`,
- esperar cierre de ventana,
- luego evaluar el lote completo contra el estado actual.

Con esto, si mandan autorización + exoneración + imagen en ráfaga, se procesa de forma consistente y con un solo mensaje resumen.

## 4) Idempotencia para evitar mensajes duplicados
Crear una clave única por evento (ejemplo `provider_message_id` o hash del payload) y registrar si ya se procesó.

Antes de responder:

- verificar `already_processed(event_key)`,
- si sí, ignorar lógica y no reenviar respuesta.

También aplicar idempotencia al envío de salientes (`outbound_dedup_key`) para no repetir el mismo texto de confirmación.

## 5) Validación por tipo documental
Clasificar adjuntos por reglas simples + fallback manual:

- PDF autorización
- PDF exoneración
- Imagen identificación
- Imagen factura

Si hay ambigüedad, no avanzar estado automáticamente: pedir aclaración con mensaje guiado.

## 6) Mensajería más clara (una confirmación por etapa)
En vez de responder por cada archivo, responder por etapa:

- “Recibimos autorización y exoneración. Ahora envíe su identificación.”
- “Recibimos su identificación. Ahora envíe la factura.”
- “Documentación completa recibida.”

Esto reduce ruido y mejora trazabilidad para usuario y agente.

## 7) Trazabilidad para soporte
Guardar bitácora por conversación:

- estado anterior → estado nuevo,
- archivo que disparó la transición,
- regla aplicada,
- mensaje automático emitido,
- timestamp.

Así se puede auditar por qué se enviaron 1, 2 o 3 respuestas.

## 8) “Respuesta automática no visible” en el chat del agente
Normalmente ocurre por desacople entre canal y UI interna. Validar:

1. **Persistencia primero**: guardar outbound en BD con `status=queued/sent` antes de enviarlo al proveedor.
2. **Reflejo en timeline**: la UI debe leer de la BD interna (no solo del webhook de entrega).
3. **Canal de tiempo real**: emitir evento websocket/SSE al frontend al crear el outbound.
4. **Estados de entrega**: `queued`, `sent`, `delivered`, `failed` visibles para agente.

Con esto, aunque el proveedor tarde en confirmar, el agente ve inmediatamente el mensaje que el bot intentó enviar.

## 9) Casos mínimos de prueba (QA)
1. Enviar 3 archivos en menos de 5 segundos.
2. Reenviar uno de los mismos archivos (duplicado).
3. Enviar archivo incorrecto para la etapa.
4. Enviar todo desordenado (factura antes de identificación).
5. Simular caída temporal del proveedor saliente.

Esperado:

- no duplicar respuestas,
- no saltar etapas,
- siempre mostrar outbound en el chat interno.

## Checklist de implementación rápida
- [ ] Máquina de estados por trámite.
- [ ] `batch window` de 3–5 segundos.
- [ ] Idempotencia inbound y outbound.
- [ ] Confirmación única por etapa.
- [ ] Persistencia outbound antes del envío.
- [ ] Render inmediato del outbound en UI agente.
- [ ] Bitácora de transiciones y reglas.
