import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClientMessage, formatReservationDate } from '../utils/clientNotify.ts';

test('datum se formatira dd.mm.gggg. u hh:mm', () => {
  assert.equal(formatReservationDate('2026-10-28T10:00'), '28.10.2026. u 10:00');
});

test('poruke za sve vrste obavijesti i escape HTML-a', () => {
  const row = { customer_name: '<b>Ana</b>', service_name: 'Basic', reservation_date: '2026-10-28T10:00' };
  for (const kind of ['confirmed', 'cancelled', 'declined', 'rescheduled'] as const) {
    const m = buildClientMessage(kind, 'Firma <x>', row);
    assert.ok(m.subject.includes('Firma <x>'));
    assert.ok(!m.html.includes('<b>Ana</b>'));
    assert.ok(m.html.includes('&lt;b&gt;Ana&lt;/b&gt;'));
    assert.ok(m.html.includes('28.10.2026. u 10:00'));
  }
});
