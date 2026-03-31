from dataclasses import dataclass
from enum import Enum
from typing import Iterable, List, Optional, Sequence, Set


class FlowState(str, Enum):
    START = 'START'
    AWAITING_AUTHORIZATION_FORM = 'AWAITING_AUTHORIZATION_FORM'
    AWAITING_EXONERATION_FORM = 'AWAITING_EXONERATION_FORM'
    AWAITING_ID_IMAGE = 'AWAITING_ID_IMAGE'
    AWAITING_INVOICE_IMAGE = 'AWAITING_INVOICE_IMAGE'
    COMPLETED = 'COMPLETED'


class DocumentType(str, Enum):
    AUTHORIZATION_FORM = 'AUTHORIZATION_FORM'
    EXONERATION_FORM = 'EXONERATION_FORM'
    ID_IMAGE = 'ID_IMAGE'
    INVOICE_IMAGE = 'INVOICE_IMAGE'
    UNKNOWN = 'UNKNOWN'


@dataclass(frozen=True)
class IncomingEvent:
    event_id: str
    filename: str = ''
    mime_type: str = ''
    caption: str = ''


@dataclass(frozen=True)
class ValidationResult:
    previous_state: FlowState
    next_state: FlowState
    accepted_documents: Sequence[DocumentType]
    duplicate_event_ids: Sequence[str]
    ignored_event_ids: Sequence[str]
    outbound_message: str


def classify_document(event: IncomingEvent) -> DocumentType:
    bag = f'{event.filename} {event.caption} {event.mime_type}'.lower()

    if 'autoriz' in bag and '.pdf' in bag:
        return DocumentType.AUTHORIZATION_FORM

    if 'exoner' in bag and '.pdf' in bag:
        return DocumentType.EXONERATION_FORM

    if event.mime_type.startswith('image/'):
        if 'factura' in bag:
            return DocumentType.INVOICE_IMAGE
        if 'ident' in bag or 'cédula' in bag or 'cedula' in bag:
            return DocumentType.ID_IMAGE

    return DocumentType.UNKNOWN


class WhatsAppFlowValidator:
    """Validate inbound batches without coupling to transport/storage layers."""

    _STATE_REQUIREMENT = {
        FlowState.START: DocumentType.AUTHORIZATION_FORM,
        FlowState.AWAITING_AUTHORIZATION_FORM: DocumentType.AUTHORIZATION_FORM,
        FlowState.AWAITING_EXONERATION_FORM: DocumentType.EXONERATION_FORM,
        FlowState.AWAITING_ID_IMAGE: DocumentType.ID_IMAGE,
        FlowState.AWAITING_INVOICE_IMAGE: DocumentType.INVOICE_IMAGE,
    }

    _NEXT_STATE = {
        FlowState.START: FlowState.AWAITING_EXONERATION_FORM,
        FlowState.AWAITING_AUTHORIZATION_FORM: FlowState.AWAITING_EXONERATION_FORM,
        FlowState.AWAITING_EXONERATION_FORM: FlowState.AWAITING_ID_IMAGE,
        FlowState.AWAITING_ID_IMAGE: FlowState.AWAITING_INVOICE_IMAGE,
        FlowState.AWAITING_INVOICE_IMAGE: FlowState.COMPLETED,
        FlowState.COMPLETED: FlowState.COMPLETED,
    }

    _PROMPTS = {
        FlowState.AWAITING_EXONERATION_FORM: 'Gracias. Recibimos el formulario firmado. Ahora envíe su exoneración.',
        FlowState.AWAITING_ID_IMAGE: 'Recibimos su exoneración. Ahora envíe su identificación.',
        FlowState.AWAITING_INVOICE_IMAGE: 'Recibimos su identificación. Ahora envíe la factura.',
        FlowState.COMPLETED: 'Documentación completa recibida. Confirmamos recepción final.',
    }

    @classmethod
    def validate_batch(
        cls,
        current_state: FlowState,
        events: Iterable[IncomingEvent],
        processed_event_ids: Optional[Set[str]] = None,
    ) -> ValidationResult:
        processed_event_ids = processed_event_ids or set()

        duplicates: List[str] = []
        ignored: List[str] = []
        accepted: List[DocumentType] = []

        required_doc = cls._STATE_REQUIREMENT.get(current_state)
        next_state = current_state

        for event in events:
            if event.event_id in processed_event_ids:
                duplicates.append(event.event_id)
                continue

            detected = classify_document(event)

            if required_doc is None or current_state == FlowState.COMPLETED:
                ignored.append(event.event_id)
                continue

            if detected != required_doc:
                ignored.append(event.event_id)
                continue

            accepted.append(detected)
            next_state = cls._NEXT_STATE[current_state]
            break

        outbound = cls._build_outbound_message(current_state, next_state, accepted)

        return ValidationResult(
            previous_state=current_state,
            next_state=next_state,
            accepted_documents=tuple(accepted),
            duplicate_event_ids=tuple(duplicates),
            ignored_event_ids=tuple(ignored),
            outbound_message=outbound,
        )

    @classmethod
    def _build_outbound_message(
        cls,
        previous_state: FlowState,
        next_state: FlowState,
        accepted_documents: Sequence[DocumentType],
    ) -> str:
        if previous_state == FlowState.COMPLETED:
            return 'Su expediente ya está completo.'

        if not accepted_documents:
            requirement = cls._STATE_REQUIREMENT[previous_state]
            required_text = {
                DocumentType.AUTHORIZATION_FORM: 'formulario de autorización (PDF)',
                DocumentType.EXONERATION_FORM: 'formulario de exoneración (PDF)',
                DocumentType.ID_IMAGE: 'imagen de identificación',
                DocumentType.INVOICE_IMAGE: 'imagen de factura',
            }[requirement]
            return f'No pudimos validar esta etapa. Por favor envíe {required_text}.'

        return cls._PROMPTS[next_state]
