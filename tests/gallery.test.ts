import test from 'node:test';
import assert from 'node:assert/strict';
import { isGalleryName, sortKey, galleryFolder } from '../utils/gallery.ts';

test('ime slike u galeriji: samo sigurna imena', () => {
  assert.equal(isGalleryName('1795000000000-ab12cd34.webp'), true);
  assert.equal(isGalleryName('0000000000000-ab12cd.jpg'), true);
  assert.equal(isGalleryName('../logo.png'), false);
  assert.equal(isGalleryName('1795000000000-ab12cd34.svg'), false);
  assert.equal(isGalleryName('1795000000000-AB12CD34.webp'), false);
  assert.equal(isGalleryName('abc/1795000000000-ab12cd34.webp'), false);
  assert.equal(isGalleryName(null), false);
});

test('ključ redoslijeda ima 13 cifara i ne ide ispod nule', () => {
  assert.equal(sortKey(42), '0000000000042');
  assert.equal(sortKey(-5), '0000000000000');
  assert.equal(sortKey(1795000000000).length, 13);
  assert.ok(sortKey(1) < sortKey(2));
});

test('folder galerije je uvijek pod id-jem firme', () => {
  assert.equal(galleryFolder('abc'), 'abc/gallery');
});
