import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCsv, detectDelimiter, guessMapping, prepareImport, sanitizeContact, normalizeEmail, isValidEmail,
  normalizeCategory, isSendable, maskEmail, parseTags,
} from '../utils/marketingContacts.ts';

test('CSV: separator ; i , se prepoznaju', () => {
  assert.equal(detectDelimiter('email;firma\na@b.ba;X'), ';');
  assert.equal(detectDelimiter('email,firma\na@b.ba,X'), ',');
  assert.equal(detectDelimiter('email\ta\n'), '\t');
});

test('CSV: navodnici, "" unutar polja, novi red u polju, BOM i prazni redovi', () => {
  const rows = parseCsv('﻿email,firma,napomena\r\n"a@b.ba","Salon ""Lana""","red1\nred2"\r\n\r\nc@d.ba,Frizer,\n');
  assert.deepEqual(rows, [
    ['email', 'firma', 'napomena'],
    ['a@b.ba', 'Salon "Lana"', 'red1\nred2'],
    ['c@d.ba', 'Frizer', ''],
  ]);
});

test('mapiranje kolona prepoznaje bosanske i engleske nazive', () => {
  const m = guessMapping(['E-mail', 'Naziv firme', 'Vlasnik', 'Djelatnost', 'Grad', 'Telefon', 'Web', 'Napomena']);
  assert.equal(m.email, 0);
  assert.equal(m.company_name, 1);
  assert.equal(m.owner_name, 2);
  assert.equal(m.category, 3);
  assert.equal(m.city, 4);
  assert.equal(m.phone, 5);
  assert.equal(m.website, 6);
  assert.equal(m.notes, 7);
  assert.equal(m.tags, -1);
  const en = guessMapping(['Company', 'Email', 'City']);
  assert.equal(en.company_name, 0);
  assert.equal(en.email, 1);
  assert.equal(en.city, 2);
});

test('email: normalizacija i provjera', () => {
  assert.equal(normalizeEmail('  Info@Salon.BA '), 'info@salon.ba');
  assert.equal(normalizeEmail('mailto:a@b.ba'), 'a@b.ba');
  assert.equal(isValidEmail('info@salon.ba'), true);
  for (const bad of ['', 'nije-mejl', 'a@b', 'a@@b.ba', 'a b@c.ba', 'a@b..ba', '.a@b.ba', 'a,b@c.ba']) {
    assert.equal(isValidEmail(bad), false, bad);
  }
});

test('kategorije iz slobodnog teksta', () => {
  assert.equal(normalizeCategory('Frizerski salon'), 'frizer');
  assert.equal(normalizeCategory('Restoran Kod Mehe'), 'restoran');
  assert.equal(normalizeCategory('Apartmani Neum'), 'apartmani');
  assert.equal(normalizeCategory('AUTOSERVIS'), 'autoservis');
  assert.equal(normalizeCategory('Nešto treće'), 'ostalo');
  assert.equal(normalizeCategory(''), null);
});

test('sanitizeContact: čisti polja, dodaje https, ograničava oznake', () => {
  const r = sanitizeContact({ email: ' A@B.ba ', company_name: '  Studio   Lana ', website: 'studiolana.ba', tags: 'Mostar, VIP, mostar' });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.contact.email, 'a@b.ba');
    assert.equal(r.contact.company_name, 'Studio Lana');
    assert.equal(r.contact.website, 'https://studiolana.ba');
    assert.deepEqual(r.contact.tags, ['mostar', 'vip']);
    assert.equal(r.contact.owner_name, null);
  }
  assert.deepEqual(sanitizeContact({ email: '' }), { ok: false, reason: 'Nema email adrese' });
  assert.deepEqual(sanitizeContact({ email: 'x@y' }), { ok: false, reason: 'Neispravan email' });
  assert.equal(parseTags(Array.from({ length: 20 }, (_, i) => `t${i}`)).length, 10);
});

test('prepareImport: ispravni, neispravni i duplikati u fajlu (sa brojem reda)', () => {
  const rows = parseCsv('email;firma\na@b.ba;Jedan\nnije-mejl;Dva\nA@B.ba;Tri\nc@d.ba;Četiri');
  const map = guessMapping(rows[0]);
  const res = prepareImport(rows.slice(1), map);
  assert.deepEqual(res.valid.map((c) => c.email), ['a@b.ba', 'c@d.ba']);
  assert.deepEqual(res.invalid, [{ line: 3, email: 'nije-mejl', reason: 'Neispravan email' }]);
  assert.deepEqual(res.duplicates, [{ line: 4, email: 'a@b.ba', reason: 'Ponavlja se u fajlu' }]);
});

test('slanje je dozvoljeno samo aktivnim kontaktima koji nisu hladni', () => {
  assert.equal(isSendable({ status: 'active', legal_basis: 'consent' }), true);
  assert.equal(isSendable({ status: 'active', legal_basis: 'customer' }), true);
  assert.equal(isSendable({ status: 'active', legal_basis: 'inquiry' }), true);
  assert.equal(isSendable({ status: 'active', legal_basis: 'cold' }), false);
  assert.equal(isSendable({ status: 'unsubscribed', legal_basis: 'consent' }), false);
  assert.equal(isSendable({ status: 'bounced', legal_basis: 'consent' }), false);
});

test('maskEmail ne otkriva cijelu adresu', () => {
  assert.equal(maskEmail('harun@poslo.one'), 'ha***@poslo.one');
});
