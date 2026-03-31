import unittest

from core.services.whatsapp_flow_validator import (
    DocumentType,
    FlowState,
    IncomingEvent,
    WhatsAppFlowValidator,
    classify_document,
)


class WhatsAppFlowValidatorTests(unittest.TestCase):
    def test_classify_authorization_pdf(self):
        event = IncomingEvent(event_id='1', filename='formulario_autorizacion.pdf', mime_type='application/pdf')
        self.assertEqual(classify_document(event), DocumentType.AUTHORIZATION_FORM)

    def test_batch_with_duplicates_and_correct_file(self):
        events = [
            IncomingEvent(event_id='dupe', filename='autorizacion.pdf', mime_type='application/pdf'),
            IncomingEvent(event_id='ok', filename='autorizacion.pdf', mime_type='application/pdf'),
        ]

        result = WhatsAppFlowValidator.validate_batch(
            current_state=FlowState.AWAITING_AUTHORIZATION_FORM,
            events=events,
            processed_event_ids={'dupe'},
        )

        self.assertEqual(result.next_state, FlowState.AWAITING_EXONERATION_FORM)
        self.assertEqual(result.duplicate_event_ids, ('dupe',))
        self.assertEqual(result.accepted_documents, (DocumentType.AUTHORIZATION_FORM,))
        self.assertIn('exoneración', result.outbound_message)

    def test_wrong_document_does_not_advance_state(self):
        events = [IncomingEvent(event_id='x1', filename='factura.jpg', mime_type='image/jpeg')]

        result = WhatsAppFlowValidator.validate_batch(
            current_state=FlowState.AWAITING_ID_IMAGE,
            events=events,
            processed_event_ids=set(),
        )

        self.assertEqual(result.next_state, FlowState.AWAITING_ID_IMAGE)
        self.assertEqual(result.accepted_documents, ())
        self.assertEqual(result.ignored_event_ids, ('x1',))
        self.assertIn('imagen de identificación', result.outbound_message)

    def test_completed_state_returns_terminal_message(self):
        result = WhatsAppFlowValidator.validate_batch(
            current_state=FlowState.COMPLETED,
            events=[IncomingEvent(event_id='z1', filename='algo.pdf', mime_type='application/pdf')],
        )

        self.assertEqual(result.next_state, FlowState.COMPLETED)
        self.assertEqual(result.outbound_message, 'Su expediente ya está completo.')


if __name__ == '__main__':
    unittest.main()
