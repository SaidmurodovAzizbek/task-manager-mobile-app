/**
 * categoryUtils.js - Kategoriyalar ustidagi "sof" mantiq
 *
 * Kategoriyalar ikki xil bo'ladi:
 * - standart (Ish, Oilaviy, Shaxsiy, Sport, Ta'lim, Boshqa) - ilova bilan
 *   birga keladi, o'chirib ham, o'zgartirib ham bo'lmaydi;
 * - foydalanuvchi qo'shgan - xotirada saqlanadi va shundan keyin
 *   standartlar qatorida doim chiqib turadi.
 *
 * Taskda faqat kategoriya KALITI saqlanadi (masalan "work" yoki "c-...").
 * Nomi, belgisi va rangi shu fayldagi ro'yxatdan topiladi.
 *
 * taskUtils.js kabi bu fayl ham React'ga bog'liq emas - `npm test` bilan
 * tekshiriladi.
 */

// ---------------------------------------------------------------------------
// Doimiylar
// ---------------------------------------------------------------------------

/** Kategoriyasi noma'lum task shu kategoriyaga tushadi */
export const DEFAULT_CATEGORY_KEY = 'other';

/**
 * Standart kategoriyalar.
 *
 * `color` - theme/colors.js dagi CATEGORY_COLORS kaliti.
 * Rangning o'zi u yerda, chunki bu fayl ranglar bilan ishlamaydi.
 */
export const DEFAULT_CATEGORIES = [
  { key: 'work', label: 'Ish', icon: '💼', color: 'blue', custom: false },
  { key: 'family', label: 'Oilaviy', icon: '🏠', color: 'purple', custom: false },
  { key: 'personal', label: 'Shaxsiy', icon: '👤', color: 'teal', custom: false },
  { key: 'sport', label: 'Sport', icon: '🏃', color: 'green', custom: false },
  { key: 'education', label: "Ta'lim", icon: '📚', color: 'orange', custom: false },
  { key: 'other', label: 'Boshqa', icon: '📌', color: 'gray', custom: false },
];

/** Yangi kategoriya uchun tanlanadigan belgilar */
export const CATEGORY_ICONS = [
  '⭐', '🛒', '💰', '🏥', '✈️', '🚗', '🍳', '🎮',
  '🎵', '🎨', '📷', '🐾', '🌱', '🔧', '💻', '🎁',
];

/** Yangi kategoriya uchun tanlanadigan ranglar (theme/colors.js bilan bir xil) */
export const CATEGORY_COLOR_KEYS = [
  'blue', 'purple', 'teal', 'green', 'orange', 'red', 'pink', 'gray',
];

/** Kategoriya nomi uchun chegaralar */
export const CATEGORY_NAME_MIN = 2;
export const CATEGORY_NAME_MAX = 20;

// Standart kalitlar - tez tekshirish uchun
const DEFAULT_KEYS = new Set(DEFAULT_CATEGORIES.map((c) => c.key));

// ---------------------------------------------------------------------------
// Yordamchilar
// ---------------------------------------------------------------------------

/**
 * Nomni solishtirish uchun bir xil ko'rinishga keltirish:
 * "  Uy  ishlari " va "uy ishlari" - bitta nom.
 *
 * @param {string} label
 * @returns {string}
 */
const labelKey = (label) =>
  String(label ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Kalit standart kategoriyaga tegishlimi?
 *
 * @param {string} key
 * @returns {boolean}
 */
export const isDefaultCategory = (key) => DEFAULT_KEYS.has(key);

// ---------------------------------------------------------------------------
// Kategoriya obyekti
// ---------------------------------------------------------------------------

/**
 * Formadan kelgan ma'lumotdan yangi (foydalanuvchi) kategoriyasini yasash.
 *
 * @param {Object} input - { label, icon, color }
 * @returns {Object} - Saqlashga tayyor kategoriya
 */
export const createCategory = (input = {}) => ({
  // "c-" - foydalanuvchi kategoriyasi, standart kalitlar bilan to'qnashmaydi
  key: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  label: String(input.label ?? '').trim().replace(/\s+/g, ' '),
  icon: CATEGORY_ICONS.includes(input.icon) ? input.icon : CATEGORY_ICONS[0],
  color: CATEGORY_COLOR_KEYS.includes(input.color) ? input.color : CATEGORY_COLOR_KEYS[0],
  custom: true,
});

/**
 * Xotiradan o'qilgan foydalanuvchi kategoriyasini "tozalash".
 *
 * @param {Object} raw - Xotiradagi yozuv
 * @returns {Object|null} - To'g'rilangan kategoriya yoki null (yaroqsiz bo'lsa)
 */
export const normalizeCategory = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const key = typeof raw.key === 'string' ? raw.key.trim() : '';
  const label =
    typeof raw.label === 'string' ? raw.label.trim().replace(/\s+/g, ' ') : '';

  // Kalit yoki nomsiz yozuv - kategoriya emas.
  // Standart kalitni egallab olishga ham yo'l qo'ymaymiz.
  if (!key || !label || isDefaultCategory(key)) return null;

  return {
    key,
    label: label.slice(0, CATEGORY_NAME_MAX),
    // Belgi ro'yxatda bo'lmasa ham qabul qilamiz (zaxiradan kelgan bo'lishi
    // mumkin), faqat bo'sh bo'lmasin
    icon: typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon.trim() : '🏷️',
    color: CATEGORY_COLOR_KEYS.includes(raw.color) ? raw.color : 'gray',
    custom: true,
  };
};

/**
 * Foydalanuvchi kategoriyalari ro'yxatini tozalash.
 *
 * Bir xil kalit yoki bir xil nom (standartlar bilan ham) ikkinchi marta
 * uchrasa - tashlab ketiladi. Birinchi uchragani qoladi.
 *
 * @param {*} rawList - Xotiradan kelgan qiymat
 * @returns {Array} - Faqat foydalanuvchi kategoriyalari
 */
export const normalizeCategories = (rawList) => {
  if (!Array.isArray(rawList)) return [];

  const seenKeys = new Set();
  const seenLabels = new Set(DEFAULT_CATEGORIES.map((c) => labelKey(c.label)));

  return rawList.map(normalizeCategory).filter((category) => {
    if (!category) return false;

    const name = labelKey(category.label);
    if (seenKeys.has(category.key) || seenLabels.has(name)) return false;

    seenKeys.add(category.key);
    seenLabels.add(name);
    return true;
  });
};

/**
 * Standart va foydalanuvchi kategoriyalarini bitta ro'yxatga yig'ish.
 *
 * Tartib: standartlar, keyin foydalanuvchinikilar, eng oxirida "Boshqa" -
 * u "hech biriga to'g'ri kelmadi" degani, shuning uchun doim oxirida turadi.
 *
 * @param {Array} customCategories - Foydalanuvchi kategoriyalari
 * @returns {Array} - To'liq ro'yxat
 */
export const buildCategoryList = (customCategories = []) => {
  const main = DEFAULT_CATEGORIES.filter((c) => c.key !== DEFAULT_CATEGORY_KEY);
  const other = DEFAULT_CATEGORIES.find((c) => c.key === DEFAULT_CATEGORY_KEY);

  return [...main, ...normalizeCategories(customCategories), other];
};

/**
 * Kalit bo'yicha kategoriyani topish.
 * Topilmasa (masalan o'chirilgan bo'lsa) - "Boshqa" qaytadi.
 *
 * @param {Array} categories - To'liq ro'yxat
 * @param {string} key
 * @returns {Object}
 */
export const findCategory = (categories, key) => {
  const list = Array.isArray(categories) ? categories : DEFAULT_CATEGORIES;

  return (
    list.find((c) => c.key === key) ||
    list.find((c) => c.key === DEFAULT_CATEGORY_KEY) ||
    DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1]
  );
};

/**
 * Taskning HAQIQIY kategoriya kaliti.
 *
 * Task o'chirilgan yoki noma'lum kategoriyaga ishora qilsa, "Boshqa" deb
 * hisoblanadi - shunda u filtrda ham "Boshqa" ostida chiqadi, yo'qolmaydi.
 *
 * @param {Object} task
 * @param {Array} [categories] - To'liq ro'yxat (berilmasa - tekshirilmaydi)
 * @returns {string}
 */
export const getTaskCategoryKey = (task, categories) => {
  const key = task?.category || DEFAULT_CATEGORY_KEY;
  if (!Array.isArray(categories)) return key;

  return categories.some((c) => c.key === key) ? key : DEFAULT_CATEGORY_KEY;
};

// ---------------------------------------------------------------------------
// Validatsiya
// ---------------------------------------------------------------------------

/**
 * Kategoriya formasini tekshirish.
 *
 * @param {Object} values - { label }
 * @param {Array} categories - Mavjud to'liq ro'yxat (takrorni tekshirish uchun)
 * @param {string} [editingKey] - Tahrirlanayotgan kategoriya (o'zi bilan solishtirmaymiz)
 * @returns {Object} - Xatoliklar. Bo'sh bo'lsa - hammasi joyida.
 */
export const validateCategoryInput = ({ label = '' } = {}, categories = [], editingKey) => {
  const errors = {};
  const name = labelKey(label);

  if (!name) {
    errors.label = 'Kategoriya nomini kiriting';
  } else if (name.length < CATEGORY_NAME_MIN) {
    errors.label = `Nom kamida ${CATEGORY_NAME_MIN} ta belgidan iborat bo'lishi kerak`;
  } else if (name.length > CATEGORY_NAME_MAX) {
    errors.label = `Nom ${CATEGORY_NAME_MAX} ta belgidan oshmasligi kerak`;
  } else {
    const all = [...DEFAULT_CATEGORIES, ...(Array.isArray(categories) ? categories : [])];
    const taken = all.some((c) => c.key !== editingKey && labelKey(c.label) === name);

    if (taken) errors.label = 'Bunday nomli kategoriya allaqachon bor';
  }

  return errors;
};

// ---------------------------------------------------------------------------
// Zaxiradan tiklash
// ---------------------------------------------------------------------------

/**
 * Zaxira nusxadagi kategoriyalarni mavjudlari bilan birlashtirish.
 *
 * Ikki telefonda bir xil nomli ("Uy") lekin har xil kalitli kategoriya
 * bo'lishi mumkin. Bunda yangi kategoriya yaratilmaydi - zaxiradagi
 * tasklar mavjud "Uy" ga o'tkaziladi. `remap` aynan shuni aytadi.
 *
 * @param {Array} current - Mavjud foydalanuvchi kategoriyalari
 * @param {Array} incoming - Zaxiradagi kategoriyalar
 * @returns {Object} - { categories, remap: { eskiKalit: yangiKalit } }
 */
export const mergeCategories = (current, incoming) => {
  const existing = normalizeCategories(current);
  const byLabel = new Map(
    [...DEFAULT_CATEGORIES, ...existing].map((c) => [labelKey(c.label), c.key])
  );
  const knownKeys = new Set(existing.map((c) => c.key));

  const remap = {};
  const added = [];

  // Bu yerda normalizeCategories EMAS: u bir xil nomlilarni shunchaki
  // tashlab yuboradi, bizga esa ularni mavjudiga "ulash" kerak
  const list = (Array.isArray(incoming) ? incoming : []).map(normalizeCategory);

  for (const category of list) {
    if (!category || knownKeys.has(category.key)) continue;

    // Bir xil nomli kategoriya bor (standart yoki foydalanuvchiniki) -
    // yangisini yaratmaymiz, tasklarni o'shanga o'tkazamiz
    const sameName = byLabel.get(labelKey(category.label));
    if (sameName) {
      remap[category.key] = sameName;
      continue;
    }

    added.push(category);
    knownKeys.add(category.key);
    byLabel.set(labelKey(category.label), category.key);
  }

  return { categories: [...existing, ...added], remap };
};

// ---------------------------------------------------------------------------
// Hisob-kitob
// ---------------------------------------------------------------------------

/**
 * Har bir kategoriyada nechta task borligini sanash.
 *
 * @param {Array} tasks
 * @param {Array} [categories] - Berilsa, noma'lum kalitlar "Boshqa" ga qo'shiladi
 * @returns {Object} - { work: 3, sport: 1, ... }
 */
export const countByCategory = (tasks, categories) => {
  const counts = {};

  for (const task of Array.isArray(tasks) ? tasks : []) {
    const key = getTaskCategoryKey(task, categories);
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
};
