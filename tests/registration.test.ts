import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSlug, parseRegistration, slugify } from '../utils/registration.ts';

const valid = {
  ownerName: 'Ana Anić',
  businessName: 'Frizerski salon Ana',
  email: 'Ana@Example.com ',
  password: 'lozinka123',
  phone: '061 123 456',
  city: 'Mostar',
  category: 'frizer',
};

test('ispravna registracija: email se normalizuje, polja se čiste', () => {
  const r = parseRegistration(valid);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.email, 'ana@example.com');
    assert.equal(r.value.businessName, 'Frizerski salon Ana');
  }
});

test('klijent ne može poslati status, business_id ni id: ta polja se ignorišu', () => {
  const r = parseRegistration({ ...valid, status: 'active', business_id: 'tudji-id', id: 'x', role: 'admin' });
  assert.ok(r.ok);
  if (r.ok) {
    const keys = Object.keys(r.value).sort();
    assert.deepEqual(keys, ['businessName', 'category', 'city', 'email', 'ownerName', 'password', 'phone']);
  }
});

test('neispravni podaci se odbijaju', () => {
  for (const bad of [
    null,
    'tekst',
    { ...valid, ownerName: '' },
    { ...valid, businessName: '!!!' },
    { ...valid, email: 'nije-email' },
    { ...valid, password: '123' },
    { ...valid, password: 'x'.repeat(73) },
    { ...valid, phone: 'x'.repeat(31) },
    { ...valid, city: 5 },
  ]) {
    assert.equal(parseRegistration(bad).ok, false);
  }
});

test('opcionalna polja mogu biti prazna', () => {
  const r = parseRegistration({ ...valid, phone: '', city: undefined, category: null });
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual([r.value.phone, r.value.city, r.value.category], [null, null, null]);
});

test('slug: dijakritici i sufiks', () => {
  assert.equal(slugify('Čišćenje & Šišanje Đuro'), 'ciscenje-sisanje-djuro');
  assert.equal(buildSlug('Salon Ana', () => 0.5), 'salon-ana-5000');
});
