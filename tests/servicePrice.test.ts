import test from 'node:test';
import assert from 'node:assert/strict';
import { parseServicePrice, formatServicePrice } from '../utils/servicePrice.ts';

test('fiksna cijena', () => {
  assert.deepEqual(parseServicePrice({ price: '25,5' }), { price: 25.5, price_on_request: false });
  assert.deepEqual(parseServicePrice({ price: 0 }), { price: 0, price_on_request: false });
});
test('fiksna cijena odbija neispravne vrijednosti', () => {
  assert.equal(parseServicePrice({}), null);
  assert.equal(parseServicePrice({ price: '' }), null);
  assert.equal(parseServicePrice({ price: -1 }), null);
  assert.equal(parseServicePrice({ price: 'abc' }), null);
});
test('na upit ne traži cijenu', () => {
  assert.deepEqual(parseServicePrice({ price_on_request: true }), { price: null, price_on_request: true });
  assert.deepEqual(parseServicePrice({ price_on_request: true, price: 'x' }), { price: null, price_on_request: true });
});
test('prikaz cijene', () => {
  assert.equal(formatServicePrice({ price: null, price_on_request: true }), 'Na upit');
  assert.match(formatServicePrice({ price: 10, price_on_request: false }), /KM$/);
  assert.equal(formatServicePrice({ price: null }), '');
});
