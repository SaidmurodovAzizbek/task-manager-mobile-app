/**
 * analyticsUtils.test.js - Analitika hisob-kitoblari testlari
 *
 *     npm test
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBuckets,
  formatChange,
  formatDecimal,
  formatPercent,
  formatRange,
  getAnalytics,
  getInsights,
  getPeriod,
  getPeriodRange,
  getTiming,
  percentChange,
  summarizeRecords,
} from '../utils/analyticsUtils.js';
import { bankTasks, EMPTY_BANK } from '../utils/pointsUtils.js';
import { buildCategoryList } from '../utils/categoryUtils.js';

// Qat'iy "bugun": 2026-10-06 (seshanba), kunning o'rtasi
const NOW = new Date(2026, 9, 6, 12, 0, 0);

const at = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
};

let nextId = 0;

/** Berilgan kunda bajarilgan task */
const done = (day, overrides = {}) => ({
  id: `t${(nextId += 1)}`,
  title: 'Test',
  description: '',
  deadline: null,
  priority: 'medium',
  category: 'work',
  points: 10,
  completed: true,
  completedAt: at(day),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const open = (overrides = {}) => ({
  ...done('2026-10-01', overrides),
  completed: false,
  completedAt: null,
});

const categories = buildCategoryList();

// ---------------------------------------------------------------------------
// Formatlash
// ---------------------------------------------------------------------------

test('formatDecimal, formatPercent, percentChange', () => {
  assert.equal(formatDecimal(2.46), '2,5');
  assert.equal(formatDecimal(3), '3');
  assert.equal(formatPercent(0.724), '72%');
  assert.equal(formatPercent(null), '—');
  assert.equal(percentChange(12, 10), 0.2);
  assert.equal(percentChange(5, 0), null);
  assert.equal(percentChange(0, 0), 0);
  assert.equal(formatChange(0.25), '25%');
  assert.equal(formatChange(-0.4), '40%');
  assert.equal(formatChange(23.6), '24,6×');
});

test('formatRange bir yil ichida yilni bir marta yozadi', () => {
  assert.equal(formatRange('2026-09-07', '2026-10-06'), '7-sen – 6-okt, 2026');
  assert.equal(formatRange('2025-11-01', '2026-10-06'), '1-noy, 2025 – 6-okt, 2026');
  assert.equal(formatRange('2026-10-06', '2026-10-06'), '6-okt, 2026');
});

// ---------------------------------------------------------------------------
// Davrlar
// ---------------------------------------------------------------------------

test('getPeriod noma\'lum kalitda standart davrni beradi', () => {
  assert.equal(getPeriod('year').key, 'year');
  assert.equal(getPeriod('???').key, 'month');
});

test('buildBuckets: hafta - 7 kun, oxirgisi bugun', () => {
  const buckets = buildBuckets(getPeriod('week'), NOW);

  assert.equal(buckets.length, 7);
  assert.equal(buckets[0].start, '2026-09-30');
  assert.equal(buckets[6].start, '2026-10-06');
  assert.equal(buckets[6].label, 'Se');
  assert.ok(buckets[6].isCurrent);
});

test('buildBuckets: 3 oy - 13 ta 7 kunlik ustun, bo\'shliqsiz', () => {
  const buckets = buildBuckets(getPeriod('quarter'), NOW);

  assert.equal(buckets.length, 13);
  assert.equal(buckets[12].end, '2026-10-06');
  assert.equal(buckets[12].start, '2026-09-30');
  assert.equal(buckets[11].end, '2026-09-29');
  // Oxirgi ustun yozuvi doim ko'rinadi
  assert.ok(buckets[12].showLabel);
});

test('buildBuckets: yil - 12 kalendar oyi, joriy oy bugun bilan tugaydi', () => {
  const buckets = buildBuckets(getPeriod('year'), NOW);

  assert.equal(buckets.length, 12);
  assert.equal(buckets[0].start, '2025-11-01');
  assert.equal(buckets[0].end, '2025-11-30');
  assert.equal(buckets[3].end, '2026-02-28');
  assert.equal(buckets[11].start, '2026-10-01');
  assert.equal(buckets[11].end, '2026-10-06');
  assert.equal(buckets[11].title, 'Oktabr 2026');
});

test('getPeriodRange oldingi davrni xuddi shu uzunlikda oladi', () => {
  const range = getPeriodRange(getPeriod('month'), NOW);

  assert.equal(range.start, '2026-09-07');
  assert.equal(range.end, '2026-10-06');
  assert.equal(range.days, 30);
  assert.deepEqual(range.previous, { start: '2026-08-08', end: '2026-09-06' });
});

// ---------------------------------------------------------------------------
// Sanash
// ---------------------------------------------------------------------------

test('getTiming: muddatida, kechikkan, muddatsiz', () => {
  assert.deepEqual(getTiming({ day: '2026-10-05', deadline: '2026-10-05' }), {
    timing: 'onTime',
    lateDays: 0,
  });
  assert.deepEqual(getTiming({ day: '2026-10-08', deadline: '2026-10-05' }), {
    timing: 'late',
    lateDays: 3,
  });
  assert.equal(getTiming({ day: '2026-10-08', deadline: null }).timing, 'none');
});

test('summarizeRecords: muddatsizlar foizga kirmaydi', () => {
  const summary = summarizeRecords([
    { day: '2026-10-01', deadline: '2026-10-02', points: 10 },
    { day: '2026-10-01', deadline: '2026-09-29', points: 5 },
    { day: '2026-10-03', deadline: '2026-10-02', points: 5 },
    { day: '2026-10-03', deadline: null, points: 20 },
  ]);

  assert.equal(summary.completed, 4);
  assert.equal(summary.points, 40);
  assert.equal(summary.onTime, 1);
  assert.equal(summary.late, 2);
  assert.equal(summary.noDeadline, 1);
  assert.equal(summary.onTimeRate, 1 / 3);
  assert.equal(summary.avgLateDays, 1.5);
  assert.equal(summary.activeDays, 2);
});

// ---------------------------------------------------------------------------
// getAnalytics
// ---------------------------------------------------------------------------

test('getAnalytics: davrga tushganlar, muhimlik, kategoriya va ustunlar', () => {
  const tasks = [
    // 25 ball (muddatida, +25%)
    done('2026-10-06', { priority: 'high', points: 20, deadline: '2026-10-06' }),
    // kechikkan
    done('2026-10-05', { priority: 'high', points: 10, deadline: '2026-10-03', category: 'sport' }),
    done('2026-10-01', { priority: 'low', points: 5 }),
    // Haftadan tashqarida
    done('2026-09-20', { points: 50 }),
    open({ deadline: '2026-10-01' }),
    open({ deadline: '2026-12-01' }),
  ];

  const week = getAnalytics(tasks, EMPTY_BANK, { period: 'week', categories, now: NOW });

  assert.equal(week.totals.completed, 3);
  assert.equal(week.totals.points, 40);
  assert.equal(week.totals.onTime, 1);
  assert.equal(week.totals.late, 1);
  assert.equal(week.totals.noDeadline, 1);
  assert.deepEqual(week.pending, { open: 2, overdue: 1 });

  const high = week.byPriority.find((p) => p.key === 'high');
  assert.equal(high.completed, 2);
  assert.equal(high.points, 35);
  assert.equal(high.onTimeRate, 0.5);

  assert.deepEqual(
    week.byCategory.map((c) => [c.key, c.completed, c.points]),
    [['work', 2, 30], ['sport', 1, 10]]
  );

  const today = week.buckets[week.buckets.length - 1];
  assert.equal(today.completed, 1);
  assert.equal(today.points, 25);

  // 30 kunlikda 20-sentabrdagisi ham bor
  const month = getAnalytics(tasks, EMPTY_BANK, { period: 'month', categories, now: NOW });
  assert.equal(month.totals.completed, 4);
  // Oldingi 7 kunlik davr (23-29 sentabr) bo'sh
  assert.equal(week.previous.completed, 0);
});

test('getAnalytics: o\'chirilgan task tarixdan hisoblanadi, eski bank - "untracked"', () => {
  const removed = done('2026-10-04', { priority: 'high', deadline: '2026-10-02' });
  const bank = bankTasks(EMPTY_BANK, [removed]);
  // Tarixsiz eski bankni taqlid qilamiz: yana 3 ta task faqat sonda bor
  bank.tasks += 3;

  const analytics = getAnalytics([], bank, { period: 'week', categories, now: NOW });

  assert.equal(analytics.totals.completed, 1);
  assert.equal(analytics.totals.late, 1);
  assert.equal(analytics.byPriority[0].completed, 1);
  assert.equal(analytics.untracked, 3);
});

test('getAnalytics: o\'chirilgan kategoriya "Boshqa"ga tushadi', () => {
  const analytics = getAnalytics([done('2026-10-05', { category: 'c-yoq' })], EMPTY_BANK, {
    period: 'week',
    categories,
    now: NOW,
  });

  assert.equal(analytics.byCategory[0].key, 'other');
});

test('getAnalytics: hafta kunlari dushanbadan boshlanadi', () => {
  const analytics = getAnalytics(
    [done('2026-10-05'), done('2026-10-05'), done('2026-10-04')],
    EMPTY_BANK,
    { period: 'week', categories, now: NOW }
  );

  // 5-oktabr - dushanba, 4-oktabr - yakshanba
  assert.equal(analytics.weekdays[0].completed, 2);
  assert.equal(analytics.weekdays[6].completed, 1);
});

// ---------------------------------------------------------------------------
// Xulosalar
// ---------------------------------------------------------------------------

test('getInsights: o\'sish, kechikkan muhimlik va eng faol kun', () => {
  const tasks = [
    // Oldingi 30 kunda 2 ta
    done('2026-08-20'),
    done('2026-08-21'),
    // Joriy 30 kunda 6 ta: yuqori muhimlikdagilar kechikkan
    done('2026-10-05', { priority: 'high', deadline: '2026-10-01' }),
    done('2026-09-28', { priority: 'high', deadline: '2026-09-20' }),
    done('2026-09-21', { priority: 'high', deadline: '2026-09-21' }),
    done('2026-09-14', { priority: 'low', deadline: '2026-09-20' }),
    done('2026-09-15', { category: 'sport' }),
    done('2026-09-16'),
  ];

  const analytics = getAnalytics(tasks, EMPTY_BANK, { period: 'month', categories, now: NOW });
  const insights = getInsights(analytics, categories);
  const byKey = Object.fromEntries(insights.map((i) => [i.key, i]));

  assert.match(byKey.trend.text, /3 baravar ko'p/);
  assert.match(byKey.timing.text, /Yuqori muhimlikdagi tasklarning 67% kechikkan/);
  assert.match(byKey.weekday.text, /Dushanba/);
  assert.ok(insights.length <= 4);
});

test('getInsights: bo\'sh davrda faqat kechikayotganlar haqida', () => {
  const analytics = getAnalytics([open({ deadline: '2026-10-01' })], EMPTY_BANK, {
    period: 'week',
    categories,
    now: NOW,
  });

  assert.deepEqual(
    getInsights(analytics, categories).map((i) => i.key),
    ['overdue']
  );
});
