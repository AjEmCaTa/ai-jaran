import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorText } from '../utils/authErrors.ts';

test('poznate greške prijave dobiju jasnu poruku na bosanskom', () => {
  assert.match(authErrorText(new Error('Invalid login credentials'), 'bs', 'x'), /Pogrešan e-mail ili lozinka/);
  assert.match(authErrorText(new Error('User already registered'), 'bs', 'x'), /već ima nalog/);
  assert.match(authErrorText(new Error('Email not confirmed'), 'en', 'x'), /not confirmed/);
});

test('nepoznata greška daje rezervnu poruku', () => {
  assert.equal(authErrorText(new Error('something odd'), 'bs', 'Pokušajte ponovo.'), 'Pokušajte ponovo.');
  assert.equal(authErrorText(null, 'bs', 'R'), 'R');
});
