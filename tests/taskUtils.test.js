/**
 * taskUtils.test.js - Ilova mantig'ining testlari
 *
 * Bu testlar telefonsiz, oddiy Node bilan ishlaydi:
 *
 *     npm test
 *
 * Nega kerak? Sana hisobi, saralash va validatsiya - eng ko'p xato
 * chiqadigan joylar. Ularni har safar telefonda qo'lda tekshirish o'rniga
 * bir soniyada tekshirib olamiz.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addDays,
  createTask,
  daysUntil,
  filterTasks,
  formatDate,
  formatDeadline,
  getStats,
  isOverdue,
  isValidDateString,
  maskDateInput,
  normalizeTask,
  normalizeTasks,
  parseDateOnly,
  sortTasks,
  todayString,
  validateTaskInput,
} from '../utils/taskUtils.js';

// Testlarda ishlatiladigan qat'iy "bugun": 2026-09-22 (mahalliy vaqt)
const NOW = new Date(2026, 8, 22, 12, 0, 0);

/** Test uchun qisqa task yasash yordamchisi */
const task = (overrides = {}) => ({
  id: overrides.id || Math.random().toString(36).slice(2),
  title: 'Test',
  description: '',
  deadline: null,
  priority: 'medium',
  completed: false,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Sana
// ---------------------------------------------------------------------------

test('parseDateOnly to\'g\'ri sanani o\'qiydi', () => {
  const date = parseDateOnly('2026-12-31');
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 11); // Dekabr = 11
  assert.equal(date.getDate(), 31);
});

test('parseDateOnly mavjud bo\'lmagan sanani rad etadi', () => {
  assert.equal(parseDateOnly('2026-02-31'), null); // Fevralda 31 kun yo'q
  assert.equal(parseDateOnly('2026-13-01'), null); // 13-oy yo'q
  assert.equal(parseDateOnly('2026-00-10'), null); // 0-oy yo'q
  assert.equal(parseDateOnly('2026-1-1'), null);   // Format noto'g'ri
  assert.equal(parseDateOnly('salom'), null);
  assert.equal(parseDateOnly(null), null);
});

test('parseDateOnly vaqt mintaqasidan qat\'i nazar kunni surib yubormaydi', () => {
  // Eski kod `new Date("2026-01-01")` ishlatgani uchun manfiy UTC
  // mintaqalarida 31-dekabrni ko'rsatardi. Endi bunday emas.
  assert.equal(formatDate('2026-01-01'), '1-yan, 2026');
  assert.equal(formatDate('2026-12-31'), '31-dek, 2026');
});

test('formatDate to\'liq ISO vaqt bilan ham ishlaydi', () => {
  assert.equal(formatDate('2026-09-22T10:15:00.000Z').includes('sen'), true);
  assert.equal(formatDate(''), 'Muddat belgilanmagan');
  assert.equal(formatDate(null), 'Muddat belgilanmagan');
});

test('daysUntil kunlarni to\'g\'ri sanaydi', () => {
  assert.equal(daysUntil('2026-09-22', NOW), 0);   // Bugun
  assert.equal(daysUntil('2026-09-23', NOW), 1);   // Ertaga
  assert.equal(daysUntil('2026-09-20', NOW), -2);  // Ikki kun kechikdi
  assert.equal(daysUntil('yaroqsiz', NOW), null);
});

test('isOverdue faqat o\'tgan sanalarda true qaytaradi', () => {
  assert.equal(isOverdue('2026-09-21', NOW), true);
  assert.equal(isOverdue('2026-09-22', NOW), false); // Bugun hali kechikmagan
  assert.equal(isOverdue('2026-09-23', NOW), false);
  assert.equal(isOverdue(null, NOW), false);
});

test('formatDeadline inson tilida yozadi', () => {
  assert.equal(formatDeadline('2026-09-22', NOW), 'Bugun');
  assert.equal(formatDeadline('2026-09-23', NOW), 'Ertaga');
  assert.equal(formatDeadline('2026-09-21', NOW), 'Kecha');
  assert.equal(formatDeadline('2026-09-19', NOW), '3 kun kechikdi');
  assert.equal(formatDeadline('2026-09-25', NOW), '3 kun qoldi');
  // Bir haftadan uzoq - aniq sana
  assert.equal(formatDeadline('2026-10-30', NOW), '30-okt, 2026');
});

test('addDays va todayString mahalliy sanani beradi', () => {
  assert.equal(todayString(NOW), '2026-09-22');
  assert.equal(addDays(1, NOW), '2026-09-23');
  assert.equal(addDays(7, NOW), '2026-09-29');
  // Oy chegarasidan o'tish
  assert.equal(addDays(9, NOW), '2026-10-01');
  assert.equal(addDays(-22, NOW), '2026-08-31');
});

test('maskDateInput chiziqchani avtomatik qo\'yadi', () => {
  assert.equal(maskDateInput('2026'), '2026');
  assert.equal(maskDateInput('20261'), '2026-1');
  assert.equal(maskDateInput('202612'), '2026-12');
  assert.equal(maskDateInput('20261231'), '2026-12-31');
  // Ortiqcha belgilar tashlanadi
  assert.equal(maskDateInput('2026-12-31-99'), '2026-12-31');
  assert.equal(maskDateInput('abc'), '');
  assert.equal(maskDateInput(undefined), '');
});

test('isValidDateString kabisa yilni to\'g\'ri hisoblaydi', () => {
  assert.equal(isValidDateString('2028-02-29'), true);  // 2028 - kabisa yil
  assert.equal(isValidDateString('2026-02-29'), false); // 2026 - kabisa emas
  assert.equal(isValidDateString('2026-02-28'), true);
});

// ---------------------------------------------------------------------------
// Task obyekti va migratsiya
// ---------------------------------------------------------------------------

test('createTask to\'liq obyekt yasaydi', () => {
  const created = createTask({
    title: '  Sport  ',
    description: '  Ertalab  ',
    deadline: '2026-10-01',
    priority: 'high',
  });

  assert.equal(created.title, 'Sport');           // Bo'shliqlar kesiladi
  assert.equal(created.description, 'Ertalab');
  assert.equal(created.deadline, '2026-10-01');
  assert.equal(created.priority, 'high');
  assert.equal(created.completed, false);
  assert.ok(created.id);
  assert.ok(created.createdAt);
});

test('createTask noma\'lum ustuvorlikni medium ga tushiradi', () => {
  assert.equal(createTask({ title: 'A', priority: 'super' }).priority, 'medium');
  assert.equal(createTask({ title: 'A' }).priority, 'medium');
  assert.equal(createTask({ title: 'A', deadline: '' }).deadline, null);
});

test('generateId takrorlanmaydigan ID beradi', () => {
  const ids = new Set();
  for (let i = 0; i < 500; i += 1) ids.add(createTask({ title: 'A' }).id);
  assert.equal(ids.size, 500);
});

test('normalizeTask eski yozuvlarga yetishmagan maydonlarni qo\'shadi', () => {
  // Ilovaning birinchi versiyasida updatedAt yo'q edi
  const old = { id: '1', title: 'Eski task', createdAt: '2026-01-01T00:00:00.000Z' };
  const fixed = normalizeTask(old);

  assert.equal(fixed.priority, 'medium');
  assert.equal(fixed.completed, false);
  assert.equal(fixed.description, '');
  assert.equal(fixed.deadline, null);
  assert.equal(fixed.updatedAt, '2026-01-01T00:00:00.000Z');
});

test('normalizeTask buzuq yozuvni rad etadi', () => {
  assert.equal(normalizeTask(null), null);
  assert.equal(normalizeTask('matn'), null);
  assert.equal(normalizeTask({ title: 'ID yo\'q' }), null);
  assert.equal(normalizeTask({ id: '1', title: '   ' }), null);
});

test('normalizeTask yaroqsiz muddatni tashlaydi, taskni saqlab qoladi', () => {
  const fixed = normalizeTask({ id: '1', title: 'Task', deadline: '31-12-2026' });
  assert.equal(fixed.deadline, null);
  assert.equal(fixed.title, 'Task');
});

test('normalizeTasks massiv bo\'lmagan qiymatga chidaydi', () => {
  assert.deepEqual(normalizeTasks(null), []);
  assert.deepEqual(normalizeTasks({}), []);
  assert.deepEqual(normalizeTasks('[]'), []);
});

test('normalizeTasks takrorlangan ID larni olib tashlaydi', () => {
  const list = normalizeTasks([
    { id: '1', title: 'Birinchi' },
    { id: '1', title: 'Nusxa' },
    { id: '2', title: 'Ikkinchi' },
    null,
  ]);

  assert.equal(list.length, 2);
  assert.equal(list[0].title, 'Birinchi');
});

// ---------------------------------------------------------------------------
// Validatsiya
// ---------------------------------------------------------------------------

test('validateTaskInput sarlavhani tekshiradi', () => {
  assert.ok(validateTaskInput({ title: '' }).title);
  assert.ok(validateTaskInput({ title: '  ' }).title);
  assert.ok(validateTaskInput({ title: 'ab' }).title);          // 3 tadan kam
  assert.equal(validateTaskInput({ title: 'abc' }).title, undefined);
});

test('validateTaskInput muddatni tekshiradi', () => {
  assert.equal(validateTaskInput({ title: 'Task' }).deadline, undefined);
  assert.equal(validateTaskInput({ title: 'Task', deadline: '' }).deadline, undefined);
  assert.ok(validateTaskInput({ title: 'Task', deadline: '2026-13-01' }).deadline);
  assert.equal(
    validateTaskInput({ title: 'Task', deadline: '2026-12-31' }).deadline,
    undefined
  );
});

test('validateTaskInput yildagi terish xatosini ushlaydi', () => {
  // "2025" o'rniga "2555" - kalendar bo'yicha to'g'ri, lekin ma'nosiz
  assert.ok(validateTaskInput({ title: 'Task', deadline: '2555-12-12' }).deadline);
  assert.ok(validateTaskInput({ title: 'Task', deadline: '0226-01-01' }).deadline);
  // Chegaralar o'zi qabul qilinadi
  assert.equal(
    validateTaskInput({ title: 'Task', deadline: '2000-01-01' }).deadline,
    undefined
  );
  assert.equal(
    validateTaskInput({ title: 'Task', deadline: '2100-12-31' }).deadline,
    undefined
  );
});

test('normalizeTask chegaradan tashqaridagi eski sanani saqlab qoladi', () => {
  // Validatsiya faqat yangi kiritishga tegishli: xotiradagi ma'lumot
  // yo'qolmasligi kerak
  const fixed = normalizeTask({ id: '1', title: 'Eski', deadline: '2555-12-12' });
  assert.equal(fixed.deadline, '2555-12-12');
});

// ---------------------------------------------------------------------------
// Filtrlash va qidiruv
// ---------------------------------------------------------------------------

test('filterTasks holat bo\'yicha ajratadi', () => {
  const tasks = [
    task({ id: 'a', completed: false }),
    task({ id: 'b', completed: true }),
  ];

  assert.equal(filterTasks(tasks, { filter: 'all' }).length, 2);
  assert.equal(filterTasks(tasks, { filter: 'active' })[0].id, 'a');
  assert.equal(filterTasks(tasks, { filter: 'completed' })[0].id, 'b');
});

test('filterTasks katta-kichik harfga qaramay qidiradi', () => {
  const tasks = [
    task({ id: 'a', title: 'Nonushta tayyorlash' }),
    task({ id: 'b', title: 'Kitob', description: 'Ertalab o\'qish' }),
  ];

  assert.equal(filterTasks(tasks, { query: 'NONUSHTA' })[0].id, 'a');
  // Tavsif ichidan ham topadi
  assert.equal(filterTasks(tasks, { query: 'ertalab' })[0].id, 'b');
  assert.equal(filterTasks(tasks, { query: 'yo\'q narsa' }).length, 0);
  assert.equal(filterTasks(tasks, { query: '   ' }).length, 2);
});

test('filterTasks filtr va qidiruvni birga qo\'llaydi', () => {
  const tasks = [
    task({ id: 'a', title: 'Sport', completed: true }),
    task({ id: 'b', title: 'Sport zali', completed: false }),
  ];

  const result = filterTasks(tasks, { filter: 'active', query: 'sport' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'b');
});

// ---------------------------------------------------------------------------
// Saralash
// ---------------------------------------------------------------------------

test('sortTasks bajarilganlarni pastga tushiradi', () => {
  const tasks = [
    task({ id: 'done', completed: true, priority: 'high' }),
    task({ id: 'active', completed: false, priority: 'low' }),
  ];

  const sorted = sortTasks(tasks, 'priority');
  assert.equal(sorted[0].id, 'active');
  assert.equal(sorted[1].id, 'done');
});

test('sortTasks ustuvorlik bo\'yicha saralaydi', () => {
  const tasks = [
    task({ id: 'low', priority: 'low' }),
    task({ id: 'high', priority: 'high' }),
    task({ id: 'medium', priority: 'medium' }),
  ];

  assert.deepEqual(
    sortTasks(tasks, 'priority').map((t) => t.id),
    ['high', 'medium', 'low']
  );
});

test('sortTasks muddat bo\'yicha saralaydi, muddatsizlar oxirida', () => {
  const tasks = [
    task({ id: 'yo\'q', deadline: null }),
    task({ id: 'kech', deadline: '2026-12-31' }),
    task({ id: 'yaqin', deadline: '2026-09-23' }),
  ];

  assert.deepEqual(
    sortTasks(tasks, 'deadline').map((t) => t.id),
    ['yaqin', 'kech', 'yo\'q']
  );
});

test('sortTasks alifbo bo\'yicha saralaydi', () => {
  const tasks = [
    task({ id: 'c', title: 'Sport' }),
    task({ id: 'a', title: 'Dars' }),
    task({ id: 'b', title: 'Kitob' }),
  ];

  assert.deepEqual(
    sortTasks(tasks, 'title').map((t) => t.id),
    ['a', 'b', 'c']
  );
});

test('sortTasks yangi tasklarni tepaga qo\'yadi (standart tartib)', () => {
  const tasks = [
    task({ id: 'eski', createdAt: '2026-01-01T00:00:00.000Z' }),
    task({ id: 'yangi', createdAt: '2026-09-01T00:00:00.000Z' }),
  ];

  assert.equal(sortTasks(tasks, 'created')[0].id, 'yangi');
});

test('sortTasks asl massivni o\'zgartirmaydi', () => {
  const tasks = [
    task({ id: 'a', priority: 'low' }),
    task({ id: 'b', priority: 'high' }),
  ];
  const before = tasks.map((t) => t.id);

  sortTasks(tasks, 'priority');

  assert.deepEqual(tasks.map((t) => t.id), before);
});

// ---------------------------------------------------------------------------
// Statistika
// ---------------------------------------------------------------------------

test('getStats sonlarni to\'g\'ri hisoblaydi', () => {
  const tasks = [
    task({ id: 'a', completed: true }),
    task({ id: 'b', completed: false, deadline: '2026-09-20' }), // kechikkan
    task({ id: 'c', completed: false, deadline: '2026-10-20' }),
    // Bajarilgan task kechikkan hisoblanmaydi
    task({ id: 'd', completed: true, deadline: '2026-01-01' }),
  ];

  assert.deepEqual(getStats(tasks, NOW), {
    total: 4,
    completed: 2,
    active: 2,
    overdue: 1,
  });
});

test('getStats bo\'sh ro\'yxatga chidaydi', () => {
  assert.deepEqual(getStats([], NOW), {
    total: 0,
    completed: 0,
    active: 0,
    overdue: 0,
  });
  assert.equal(getStats(null, NOW).total, 0);
});
