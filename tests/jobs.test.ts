import test from 'node:test';
import assert from 'node:assert/strict';
import { jobsEnabled, owedOf, parseDay, parseMoney, profitOf, stageOf, statusForStage, summarizeJobs } from '../utils/jobs.ts';
import { categoryOf } from '../utils/catalog.ts';

test('stari upiti bez faze: Novi ostaje Novi, Riješen postaje Kontaktiran', () => {
  assert.equal(stageOf({ status: 'new' }), 'new');
  assert.equal(stageOf({ status: 'handled' }), 'contacted');
  assert.equal(stageOf({ status: 'handled', stage: 'done' }), 'done');
  assert.equal(statusForStage('new'), 'new');
  assert.equal(statusForStage('agreed'), 'handled');
});

test('iznosi i datumi iz forme', () => {
  assert.equal(parseMoney(''), null);
  assert.equal(parseMoney(null), null);
  assert.equal(parseMoney('1 250,5'), 1250.5);
  assert.equal(parseMoney('12.345'), 12.35);
  assert.equal(parseMoney('-5'), undefined);
  assert.equal(parseMoney('abc'), undefined);
  assert.equal(parseDay('2026-12-21'), '2026-12-21');
  assert.equal(parseDay(''), null);
  assert.equal(parseDay('21.12.2026'), undefined);
});

test('dug, zarada i pregled po mjesecu', () => {
  const now = new Date('2026-11-27T12:00:00');
  assert.equal(owedOf({ stage: 'agreed', quote: 5000, deposit: 1500 }), 3500);
  assert.equal(owedOf({ stage: 'done', quote: 5000, deposit: 1500, paid: 5000 }), 0);
  assert.equal(profitOf({ paid: 5000, costs: '1800' }), 3200);
  const s = summarizeJobs(
    [
      { stage: 'done', paid: 5000, costs: 1800, finished_on: '2026-11-10' },
      { stage: 'done', paid: 2000, costs: null, finished_on: '2026-03-02' },
      { stage: 'done', paid: 900, costs: 100, finished_on: '2025-12-30' },
      { stage: 'agreed', quote: 4000, deposit: 1000 },
      { status: 'new' },
      { stage: 'lost' },
    ],
    now,
  );
  assert.equal(s.monthRevenue, 5000);
  assert.equal(s.monthProfit, 3200);
  assert.equal(s.monthDone, 1);
  assert.equal(s.yearProfit, 5200);
  assert.equal(s.yearDone, 2);
  assert.equal(s.avgPerJob, 3500);
  assert.equal(s.owed, 3000);
  assert.equal(s.won, 4);
  assert.equal(s.open, 2);
  assert.equal(s.total, 6);
});

test('ko vidi Poslove: građevina, sve usluge na upit ili ručni izbor', () => {
  assert.equal(jobsEnabled({ category: 'Građevinski radovi' }, [], categoryOf), true);
  assert.equal(jobsEnabled({ category: 'gradjevina-i-radovi' }, [{ price_on_request: false }], categoryOf), true);
  assert.equal(jobsEnabled({ category: 'Frizerski salon' }, [{ price_on_request: false }], categoryOf), false);
  assert.equal(jobsEnabled({ category: 'Solarni sistemi' }, [{ price_on_request: true }, { price_on_request: false }], categoryOf), false);
  assert.equal(jobsEnabled({ category: 'Ostalo' }, [{ price_on_request: true }, { price_on_request: true }], categoryOf), true);
  assert.equal(jobsEnabled({ category: 'Ostalo' }, [], categoryOf), false);
  assert.equal(jobsEnabled({ category: 'Građevina', jobs_mode: 'off' }, [], categoryOf), false);
  assert.equal(jobsEnabled({ category: 'Frizer', jobs_mode: 'on' }, [], categoryOf), true);
});
