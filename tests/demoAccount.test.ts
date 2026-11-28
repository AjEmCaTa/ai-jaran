import test from 'node:test';
import assert from 'node:assert/strict';
import { isDemoBlocked, DEMO_BUSINESS_SLUG } from '../utils/demoAccount.ts';

const demo = '7d743066-b5d6-4b64-b891-d449eea89644';
test('demo nalog ne može kod prave firme', () => assert.equal(isDemoBlocked(demo, 'dubinsko-catic'), true));
test('demo nalog može kod demo firme', () => assert.equal(isDemoBlocked(demo, DEMO_BUSINESS_SLUG), false));
test('obični korisnici nisu ograničeni', () => assert.equal(isDemoBlocked('drugi-id', 'dubinsko-catic'), false));
test('neprijavljen nije ograničen', () => assert.equal(isDemoBlocked(null, 'dubinsko-catic'), false));
