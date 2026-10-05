/**
 * pointsUtils.test.js - Ballar, darajalar va yutuqlar testlari
 *
 *     npm test
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bankTasks,
  describeToggle,
  EMPTY_BANK,
  formatPoints,
  getAchievements,
  getLastDays,
  getLevel,
  getOnTimeBonus,
  getScoreSummary,
  getStreak,
  getTaskReward,
  levelThreshold,
  mergeBanks,
  normalizeBank,
  unbankTask,
} from '../utils/pointsUtils.js';
import {
  createTask,
  DEFAULT_POINTS,
  normalizePoints,
  normalizeTask,
  sortTasks,
  suggestPoints,
  validateTaskInput,
} from '../utils/taskUtils.js';

// Qat'iy "bugun": 2026-10-06, kunning o'rtasi (mahalliy vaqt)
const NOW = new Date(2026, 9, 6, 12, 0, 0);

/** Berilgan kunning tushki vaqti - ISO ko'rinishda */
const at = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
};

/** Test uchun qisqa task */
const task = (overrides = {}) => ({
  id: overrides.id || Math.random().toString(36).slice(2),
  title: 'Test',
  description: '',
  deadline: null,
  priority: 'medium',
  category: 'work',
  points: 10,
  completed: false,
  completedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

/** Bajarilgan task (berilgan kunda) */
const done = (day, overrides = {}) =>
  task({ completed: true, completedAt: at(day), ...overrides });

// ---------------------------------------------------------------------------
// Task modelidagi ball
// ---------------------------------------------------------------------------

test('normalizePoints noto\'g\'ri qiymatni standart ballga aylantiradi', () => {
  assert.equal(normalizePoints(25), 25);
  assert.equal(normalizePoints('40'), 40);
  assert.equal(normalizePoints(12.6), 13);
  assert.equal(normalizePoints(5000), 999);
  assert.equal(normalizePoints(0), DEFAULT_POINTS);
  assert.equal(normalizePoints(-3), DEFAULT_POINTS);
  assert.equal(normalizePoints('abc'), DEFAULT_POINTS);
  assert.equal(normalizePoints(''), DEFAULT_POINTS);
  assert.equal(normalizePoints(undefined), DEFAULT_POINTS);
});

test('createTask ball va completedAt bilan yaratiladi', () => {
  const created = createTask({ title: 'Yugurish', points: 25 });
  assert.equal(created.points, 25);
  assert.equal(created.completedAt, null);

  assert.equal(createTask({ title: 'Ballsiz' }).points, DEFAULT_POINTS);
});

test('normalizeTask eski tasklarga ball va completedAt qo\'shadi', () => {
  const old = normalizeTask({
    id: '1',
    title: 'Eski task',
    completed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  });

  assert.equal(old.points, DEFAULT_POINTS);
  // Bajarilgan vaqt yo'q - oxirgi tahrir vaqti olinadi
  assert.equal(old.completedAt, '2026-01-02T00:00:00.000Z');

  const active = normalizeTask({ id: '2', title: 'Faol', completedAt: 'x' });
  assert.equal(active.completedAt, null);
});

test('suggestPoints ustuvorlikka qarab ball tavsiya qiladi', () => {
  assert.equal(suggestPoints('high'), 25);
  assert.equal(suggestPoints('medium'), 10);
  assert.equal(suggestPoints('low'), 5);
  assert.equal(suggestPoints('???'), DEFAULT_POINTS);
});

test('validateTaskInput ballni tekshiradi', () => {
  assert.equal(validateTaskInput({ title: 'Task', points: '25' }).points, undefined);
  assert.equal(validateTaskInput({ title: 'Task', points: 999 }).points, undefined);
  assert.ok(validateTaskInput({ title: 'Task', points: '' }).points);
  assert.ok(validateTaskInput({ title: 'Task', points: '0' }).points);
  assert.ok(validateTaskInput({ title: 'Task', points: 1000 }).points);
  assert.ok(validateTaskInput({ title: 'Task', points: 2.5 }).points);
  // Ball berilmasa - tekshirilmaydi (eski chaqiruvlar uchun)
  assert.deepEqual(validateTaskInput({ title: 'Task' }), {});
});

test('sortTasks ball bo\'yicha saralaydi, bajarilganlar pastda', () => {
  const sorted = sortTasks(
    [
      task({ id: 'a', points: 5 }),
      task({ id: 'b', points: 100, completed: true }),
      task({ id: 'c', points: 50 }),
    ],
    'points'
  );
  assert.deepEqual(sorted.map((t) => t.id), ['c', 'a', 'b']);
});

// ---------------------------------------------------------------------------
// Mukofot
// ---------------------------------------------------------------------------

test('formatPoints minglarni bo\'sh joy bilan ajratadi', () => {
  assert.equal(formatPoints(0), '0');
  assert.equal(formatPoints(999), '999');
  assert.equal(formatPoints(1240), '1 240');
  assert.equal(formatPoints(1234567), '1 234 567');
  assert.equal(formatPoints(-31), '−31');
});

test('getTaskReward: bajarilmagan task ball bermaydi', () => {
  assert.deepEqual(getTaskReward(task({ points: 25 })), {
    base: 25,
    bonus: 0,
    total: 0,
    onTime: false,
  });
});

test('getTaskReward: muddatida bajarilsa +25% bonus', () => {
  const onTime = getTaskReward(done('2026-10-05', { points: 40, deadline: '2026-10-05' }));
  assert.deepEqual(onTime, { base: 40, bonus: 10, total: 50, onTime: true });

  const late = getTaskReward(done('2026-10-06', { points: 40, deadline: '2026-10-05' }));
  assert.deepEqual(late, { base: 40, bonus: 0, total: 40, onTime: false });

  const noDeadline = getTaskReward(done('2026-10-06', { points: 40 }));
  assert.equal(noDeadline.total, 40);
});

test('getOnTimeBonus kamida 1 ball beradi', () => {
  assert.equal(getOnTimeBonus(1), 1);
  assert.equal(getOnTimeBonus(5), 1);
  assert.equal(getOnTimeBonus(10), 3);
  assert.equal(getOnTimeBonus(100), 25);
});

// ---------------------------------------------------------------------------
// Bank
// ---------------------------------------------------------------------------

test('normalizeBank buzuq ma\'lumotni tozalaydi', () => {
  assert.deepEqual(normalizeBank(null), { ...EMPTY_BANK, days: {}, categories: {} });
  assert.deepEqual(
    normalizeBank({
      points: 50,
      tasks: -2,
      onTime: 'x',
      best: 30,
      days: { '2026-10-01': 20, 'yomon': 5, '2026-10-02': -1 },
      categories: { work: 50 },
    }),
    {
      points: 50,
      tasks: 0,
      onTime: 0,
      best: 30,
      days: { '2026-10-01': 20 },
      categories: { work: 50 },
    }
  );
});

test('bankTasks faqat bajarilganlarni bankka o\'tkazadi, unbankTask qaytaradi', () => {
  const finished = done('2026-10-05', { points: 20, deadline: '2026-10-06' });
  const banked = bankTasks(EMPTY_BANK, [finished, task({ points: 99 })]);

  assert.deepEqual(banked, {
    points: 25,
    tasks: 1,
    onTime: 1,
    best: 25,
    days: { '2026-10-05': 25 },
    categories: { work: 25 },
  });

  const restored = unbankTask(banked, finished);
  assert.equal(restored.points, 0);
  assert.equal(restored.tasks, 0);
  assert.deepEqual(restored.days, {});
  assert.deepEqual(restored.categories, {});
  // Rekord saqlanib qoladi
  assert.equal(restored.best, 25);
});

test('mergeBanks bir zaxirani ikki marta tiklasa ham ikkilanmaydi', () => {
  const bank = bankTasks(EMPTY_BANK, [done('2026-10-05', { points: 30 })]);
  const merged = mergeBanks(mergeBanks(EMPTY_BANK, bank), bank);
  assert.deepEqual(merged, bank);
});

// ---------------------------------------------------------------------------
// Daraja va seriya
// ---------------------------------------------------------------------------

test('levelThreshold va getLevel', () => {
  assert.equal(levelThreshold(1), 0);
  assert.equal(levelThreshold(2), 50);
  assert.equal(levelThreshold(5), 500);

  assert.equal(getLevel(0).level, 1);
  assert.equal(getLevel(49).level, 1);
  assert.equal(getLevel(50).level, 2);

  const level = getLevel(400);
  assert.equal(level.level, 4); // 300..500
  assert.equal(level.title, 'Izchil');
  assert.equal(level.toNext, 100);
  assert.equal(level.progress, 0.5);

  // 10-darajadan keyin ham nom bor
  assert.equal(getLevel(1_000_000).title, 'Afsona');
});

test('getStreak bugun bajarilmagan bo\'lsa ham seriyani uzmaydi', () => {
  const days = { '2026-10-03': 10, '2026-10-04': 10, '2026-10-05': 10 };

  assert.deepEqual(getStreak(days, NOW), { current: 3, best: 3, today: false });
  assert.deepEqual(
    getStreak({ ...days, '2026-10-06': 5 }, NOW),
    { current: 4, best: 4, today: true }
  );

  // Kecha ham bo'lmasa - seriya uzilgan
  assert.equal(getStreak({ '2026-10-04': 10 }, NOW).current, 0);
});

test('getStreak eng uzun seriyani topadi', () => {
  const days = {
    '2026-09-01': 1,
    '2026-09-02': 1,
    '2026-09-03': 1,
    '2026-09-04': 1,
    '2026-09-10': 1,
    '2026-10-06': 1,
  };
  assert.deepEqual(getStreak(days, NOW), { current: 1, best: 4, today: true });
});

test('getLastDays oxirgi 7 kunni hafta kunlari bilan qaytaradi', () => {
  const days = getLastDays({ '2026-10-06': 15, '2026-09-30': 5 }, 7, NOW);

  assert.equal(days.length, 7);
  assert.equal(days[0].day, '2026-09-30');
  assert.equal(days[0].points, 5);
  assert.equal(days[6].day, '2026-10-06');
  assert.equal(days[6].weekday, 'Se'); // 2026-10-06 - seshanba
  assert.equal(days[6].isToday, true);
});

// ---------------------------------------------------------------------------
// Umumiy natija va yutuqlar
// ---------------------------------------------------------------------------

test('getScoreSummary bank va hozirgi tasklarni qo\'shib hisoblaydi', () => {
  const bank = bankTasks(EMPTY_BANK, [done('2026-10-04', { points: 30, category: 'sport' })]);
  const tasks = [
    done('2026-10-05', { points: 10 }),
    done('2026-10-06', { points: 20, deadline: '2026-10-06' }),
    task({ points: 50 }),
  ];

  const summary = getScoreSummary(tasks, bank, { now: NOW });

  assert.equal(summary.total, 30 + 10 + 25);
  assert.equal(summary.today, 25);
  assert.equal(summary.week, 65);
  assert.equal(summary.completedCount, 3);
  assert.equal(summary.onTimeCount, 1);
  assert.equal(summary.potential, 50);
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.streak, 3);
  assert.equal(summary.streakToday, true);
  assert.equal(summary.level.level, 2);
  assert.deepEqual(summary.byCategory, { sport: 30, work: 35 });
});

test('getScoreSummary o\'chirilgan kategoriya ballini "Boshqa"ga yig\'adi', () => {
  const categories = [
    { key: 'work', label: 'Ish' },
    { key: 'other', label: 'Boshqa' },
  ];
  const summary = getScoreSummary(
    [done('2026-10-06', { category: 'deleted-cat' }), done('2026-10-06', { category: 'other' })],
    EMPTY_BANK,
    { categories, now: NOW }
  );
  assert.deepEqual(summary.byCategory, { other: 20 });
});

test('getAchievements ochilgan va qolgan yutuqlarni ko\'rsatadi', () => {
  const summary = getScoreSummary(
    [done('2026-10-06', { points: 120 })],
    EMPTY_BANK,
    { now: NOW }
  );
  const byKey = Object.fromEntries(getAchievements(summary).map((a) => [a.key, a]));

  assert.equal(byKey.first.unlocked, true);
  assert.equal(byKey.hundred.unlocked, true);
  assert.equal(byKey.epic.unlocked, true);
  assert.equal(byKey['ten-tasks'].unlocked, false);
  assert.equal(byKey['ten-tasks'].current, 1);
  assert.equal(byKey['ten-tasks'].progress, 0.1);
  // Joriy qiymat maqsaddan oshmaydi
  assert.equal(byKey.hundred.current, 100);
});

test('describeToggle: ball, bonus, yangi daraja va seriya', () => {
  const yesterday = done('2026-10-05', { id: 'y', points: 45 });
  const before = getScoreSummary([yesterday, task({ id: 't', points: 4 })], EMPTY_BANK, { now: NOW });

  const finished = done('2026-10-06', { id: 't', points: 4, deadline: '2026-10-07' });
  const after = getScoreSummary([yesterday, finished], EMPTY_BANK, { now: NOW });

  const result = describeToggle(finished, before, after);
  assert.equal(result.completed, true);
  assert.equal(result.points, 5); // 4 + 1 bonus
  assert.equal(result.bonus, 1);
  assert.equal(result.total, 50);
  assert.equal(result.levelUp.level, 2); // 45 -> 50
  assert.equal(result.streak, 2);

  // Qaytarib olinganda - ayirma
  const undone = describeToggle(task({ id: 't' }), after, before);
  assert.equal(undone.completed, false);
  assert.equal(undone.points, 5);
  assert.equal(undone.levelUp, null);
});
