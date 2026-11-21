import test from 'node:test';
import assert from 'node:assert/strict';
import { isServicePhotoName, isCoverName, serviceIdOf, keyOf, sortKey, servicesFolder, coverFolder, isUuid } from '../utils/gallery.ts';

const SID = '9b2f8132-82e2-4d99-8114-5f4a71e154fc';

test('ime slike usluge: samo sigurna imena s id-jem usluge', () => {
  assert.equal(isServicePhotoName(`${SID}__1795000000000-ab12cd34.webp`), true);
  assert.equal(isServicePhotoName(`${SID}__1795000000000-ab12cd34.svg`), false);
  assert.equal(isServicePhotoName(`../${SID}__1795000000000-ab12cd34.webp`), false);
  assert.equal(isServicePhotoName(`x__1795000000000-ab12cd34.webp`), false);
  assert.equal(isServicePhotoName(null), false);
  assert.equal(serviceIdOf(`${SID}__1795000000000-ab12cd34.webp`), SID);
  assert.equal(keyOf(`${SID}__0000000000042-ab12cd34.webp`), 42);
});

test('naslovna slika: samo ključ i nasumični dio', () => {
  assert.equal(isCoverName('1795000000000-ab12cd34.jpg'), true);
  assert.equal(isCoverName('cover.jpg'), false);
  assert.equal(isCoverName(`${SID}__1795000000000-ab12cd34.webp`), false);
});

test('ključ redoslijeda ima 13 cifara i ne ide ispod nule', () => {
  assert.equal(sortKey(42), '0000000000042');
  assert.equal(sortKey(-5), '0000000000000');
  assert.ok(sortKey(1) < sortKey(2));
});

test('folderi su uvijek pod id-jem firme', () => {
  assert.equal(servicesFolder('abc'), 'abc/services');
  assert.equal(coverFolder('abc'), 'abc/cover');
  assert.equal(isUuid(SID), true);
  assert.equal(isUuid('abc'), false);
});
