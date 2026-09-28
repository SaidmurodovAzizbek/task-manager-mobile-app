/**
 * categoryUtils.test.js - Kategoriyalar mantig'ining testlari
 *
 *     npm test
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCategoryList,
  countByCategory,
  createCategory,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_KEY,
  findCategory,
  getTaskCategoryKey,
  isDefaultCategory,
  mergeCategories,
  normalizeCategories,
  normalizeCategory,
  validateCategoryInput,
} from '../utils/categoryUtils.js';
import { createTask, filterTasks, normalizeTask } from '../utils/taskUtils.js';

/** Foydalanuvchi kategoriyasi yasash yordamchisi */
const custom = (key, label, extra = {}) => ({
  key,
  label,
  icon: '⭐',
  color: 'blue',
  custom: true,
  ...extra,
});

/** Test uchun qisqa task */
const task = (overrides = {}) => ({
  id: overrides.id || Math.random().toString(36).slice(2),
  title: 'Test',
  description: '',
  deadline: null,
  priority: 'medium',
  category: DEFAULT_CATEGORY_KEY,
  completed: false,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Standart kategoriyalar
// ---------------------------------------------------------------------------

test('standart kategoriyalar: Ish, Oilaviy, Shaxsiy, Sport, Ta\'lim, Boshqa', () => {
  assert.deepEqual(
    DEFAULT_CATEGORIES.map((c) => c.label),
    ['Ish', 'Oilaviy', 'Shaxsiy', 'Sport', "Ta'lim", 'Boshqa']
  );
  assert.ok(isDefaultCategory('work'));
  assert.ok(!isDefaultCategory('c-123'));
});

test('buildCategoryList foydalanuvchinikilarni qo\'shadi, "Boshqa" doim oxirida', () => {
  const list = buildCategoryList([custom('c-1', 'Uy ishlari')]);

  assert.equal(list.length, DEFAULT_CATEGORIES.length + 1);
  assert.equal(list[list.length - 1].key, 'other');
  assert.equal(list[list.length - 2].key, 'c-1');
  assert.equal(buildCategoryList().length, DEFAULT_CATEGORIES.length);
});

// ---------------------------------------------------------------------------
// Yaratish va tozalash
// ---------------------------------------------------------------------------

test('createCategory noyob "c-" kalit va tozalangan nom beradi', () => {
  const a = createCategory({ label: '  Uy   ishlari ', icon: '🛒', color: 'green' });
  const b = createCategory({ label: 'Boshqasi' });

  assert.match(a.key, /^c-/);
  assert.notEqual(a.key, b.key);
  assert.equal(a.label, 'Uy ishlari');
  assert.equal(a.icon, '🛒');
  assert.equal(a.color, 'green');
  assert.equal(a.custom, true);

  // Noma'lum belgi va rang - standart qiymatga tushadi
  const c = createCategory({ label: 'X1', icon: 'yo\'q', color: 'neon' });
  assert.equal(c.icon, '⭐');
  assert.equal(c.color, 'blue');
});

test('normalizeCategory buzuq va standart kalitli yozuvni rad etadi', () => {
  assert.equal(normalizeCategory(null), null);
  assert.equal(normalizeCategory({ key: 'c-1', label: '  ' }), null);
  assert.equal(normalizeCategory({ label: 'Kalitsiz' }), null);
  // Standart kalitni egallab bo'lmaydi
  assert.equal(normalizeCategory({ key: 'work', label: 'Soxta ish' }), null);

  const fixed = normalizeCategory({ key: 'c-1', label: 'Uy', color: 'neon' });
  assert.equal(fixed.color, 'gray');
  assert.equal(fixed.icon, '🏷️');
});

test('normalizeCategories takroriy kalit va nomlarni tashlaydi', () => {
  const list = normalizeCategories([
    custom('c-1', 'Uy'),
    custom('c-1', 'Boshqa nom'), // Kalit takror
    custom('c-2', ' uy '),       // Nom takror (katta-kichik harf, bo'shliq)
    custom('c-3', 'sport'),      // Standart nom bilan to'qnashadi
    custom('c-4', 'Xarid'),
  ]);

  assert.deepEqual(list.map((c) => c.key), ['c-1', 'c-4']);
  assert.deepEqual(normalizeCategories('buzuq'), []);
});

// ---------------------------------------------------------------------------
// Qidirish
// ---------------------------------------------------------------------------

test('findCategory topilmasa "Boshqa" qaytaradi', () => {
  const list = buildCategoryList([custom('c-1', 'Uy')]);

  assert.equal(findCategory(list, 'sport').label, 'Sport');
  assert.equal(findCategory(list, 'c-1').label, 'Uy');
  assert.equal(findCategory(list, 'c-o\'chirilgan').key, 'other');
  assert.equal(findCategory(undefined, 'work').key, 'work');
});

test('getTaskCategoryKey noma\'lum kategoriyani "Boshqa" deb hisoblaydi', () => {
  const list = buildCategoryList();

  assert.equal(getTaskCategoryKey({ category: 'sport' }, list), 'sport');
  assert.equal(getTaskCategoryKey({ category: 'c-yo\'q' }, list), 'other');
  assert.equal(getTaskCategoryKey({}, list), 'other');
  // Ro'yxat berilmasa - tekshirmasdan qaytaradi
  assert.equal(getTaskCategoryKey({ category: 'c-yo\'q' }), 'c-yo\'q');
});

// ---------------------------------------------------------------------------
// Validatsiya
// ---------------------------------------------------------------------------

test('validateCategoryInput nomni tekshiradi', () => {
  const list = buildCategoryList([custom('c-1', 'Uy')]);

  assert.ok(validateCategoryInput({ label: '' }, list).label);
  assert.ok(validateCategoryInput({ label: 'A' }, list).label);
  assert.ok(validateCategoryInput({ label: 'x'.repeat(21) }, list).label);
  assert.deepEqual(validateCategoryInput({ label: 'Xarid' }, list), {});
});

test('validateCategoryInput takroriy nomni ushlaydi, tahrirlashda o\'zini emas', () => {
  const list = buildCategoryList([custom('c-1', 'Uy')]);

  assert.ok(validateCategoryInput({ label: 'SPORT' }, list).label);   // Standart
  assert.ok(validateCategoryInput({ label: ' uy ' }, list).label);    // Foydalanuvchiniki
  assert.deepEqual(validateCategoryInput({ label: 'Uy' }, list, 'c-1'), {});
});

// ---------------------------------------------------------------------------
// Zaxiradan tiklash
// ---------------------------------------------------------------------------

test('mergeCategories yangilarini qo\'shadi, bir xil nomlilarni birlashtiradi', () => {
  const { categories, remap } = mergeCategories(
    [custom('c-1', 'Uy')],
    [
      custom('c-1', 'Uy'),        // Aynan o'zi - o'zgarishsiz
      custom('c-9', 'uy'),        // Boshqa telefondagi "Uy" -> c-1 ga
      custom('c-8', 'Sport'),     // Standart nom bilan -> standart "sport" ga
      custom('c-7', 'Xarid'),     // Yangi
      custom('c-6', 'xarid'),     // Zaxiraning o'zida takror -> c-7 ga
      null,                       // Buzuq yozuv - e'tiborsiz
    ]
  );

  assert.deepEqual(categories.map((c) => c.key), ['c-1', 'c-7']);
  assert.deepEqual(remap, { 'c-9': 'c-1', 'c-8': 'sport', 'c-6': 'c-7' });
  assert.deepEqual(mergeCategories([], 'buzuq'), { categories: [], remap: {} });
});

// ---------------------------------------------------------------------------
// Task bilan bog'liqlik
// ---------------------------------------------------------------------------

test('createTask kategoriyani saqlaydi, bo\'lmasa "Boshqa"', () => {
  assert.equal(createTask({ title: 'A', category: 'sport' }).category, 'sport');
  assert.equal(createTask({ title: 'A' }).category, 'other');
  assert.equal(createTask({ title: 'A', category: '  ' }).category, 'other');
});

test('normalizeTask eski (kategoriyasiz) taskni "Boshqa" ga qo\'yadi', () => {
  assert.equal(normalizeTask({ id: '1', title: 'Eski' }).category, 'other');
  assert.equal(normalizeTask({ id: '1', title: 'A', category: 'c-1' }).category, 'c-1');
});

test('filterTasks kategoriya bo\'yicha ajratadi', () => {
  const list = buildCategoryList([custom('c-1', 'Uy')]);
  const tasks = [
    task({ id: '1', category: 'sport' }),
    task({ id: '2', category: 'sport', completed: true }),
    task({ id: '3', category: 'c-1' }),
    task({ id: '4', category: 'c-o\'chirilgan' }),
    task({ id: '5', category: 'other' }),
  ];

  const ids = (options) =>
    filterTasks(tasks, { categories: list, ...options }).map((t) => t.id);

  assert.deepEqual(ids({ category: 'sport' }), ['1', '2']);
  assert.deepEqual(ids({ category: 'sport', filter: 'active' }), ['1']);
  assert.deepEqual(ids({ category: 'c-1' }), ['3']);
  // O'chirilgan kategoriyadagi task yo'qolmaydi - "Boshqa" da chiqadi
  assert.deepEqual(ids({ category: 'other' }), ['4', '5']);
  assert.equal(ids({ category: 'all' }).length, 5);
  assert.equal(ids({}).length, 5);
});

test('filterTasks kategoriya va qidiruvni birga qo\'llaydi', () => {
  const tasks = [
    task({ id: '1', title: 'Yugurish', category: 'sport' }),
    task({ id: '2', title: 'Suzish', category: 'sport' }),
    task({ id: '3', title: 'Yugurish kiyimi olish', category: 'personal' }),
  ];

  const found = filterTasks(tasks, { category: 'sport', query: 'yugur' });
  assert.deepEqual(found.map((t) => t.id), ['1']);
});

test('countByCategory har bir kategoriyani sanaydi', () => {
  const list = buildCategoryList();
  const tasks = [
    task({ category: 'work' }),
    task({ category: 'work' }),
    task({ category: 'sport' }),
    task({ category: 'c-yo\'q' }), // Noma'lum -> Boshqa
    task({ category: 'other' }),
  ];

  assert.deepEqual(countByCategory(tasks, list), { work: 2, sport: 1, other: 2 });
  assert.deepEqual(countByCategory([], list), {});
  assert.deepEqual(countByCategory(null), {});
});
