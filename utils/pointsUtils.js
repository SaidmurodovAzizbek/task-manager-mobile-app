/**
 * pointsUtils.js - Ballar, darajalar va yutuqlar mantig'i
 *
 * Qoidalar oddiy:
 * - har bir taskning o'z balli bor (qiyinligi: 5, 10, 25 ...);
 * - task bajarilganda shu ball yig'iladi;
 * - muddati bor task muddatida (yoki undan oldin) bajarilsa, +25% bonus;
 * - ballar yig'ilib "daraja" oshadi, ketma-ket kunlar "seriya" (🔥) bo'ladi.
 *
 * Bajarilgan task o'chirilsa (yoki "Bajarilganlarni tozalash" bosilsa),
 * uning balli yo'qolmaydi - "bank"ka o'tkaziladi. Bank - o'chirib
 * yuborilgan bajarilgan tasklardan qolgan ballar yig'indisi:
 *
 *     {
 *       points: 340,                       // jami ball
 *       tasks: 27,                         // nechta task
 *       onTime: 11,                        // shundan nechtasi muddatida
 *       best: 125,                         // eng katta bitta mukofot
 *       days: { '2026-10-05': 45, ... },   // kunlar bo'yicha (seriya va grafik uchun)
 *       categories: { work: 120, ... },    // kategoriyalar bo'yicha
 *     }
 *
 * Umumiy natija = bank + hozir ro'yxatda turgan bajarilgan tasklar.
 *
 * Bu fayl ham React'ga bog'liq emas - `npm test` bilan tekshiriladi.
 */

import { getTaskCategoryKey } from './categoryUtils.js';
import {
  addDays,
  isValidDateString,
  normalizePoints,
  parseDateOnly,
  toDateString,
  todayString,
} from './taskUtils.js';

// ---------------------------------------------------------------------------
// Doimiylar
// ---------------------------------------------------------------------------

/** Muddatida bajarilgan task uchun bonus ulushi (+25%) */
export const ON_TIME_BONUS_RATE = 0.25;

/**
 * Formadagi tez tanlash tugmalari: ball = qiyinlik.
 * Istalgan boshqa sonni (1-999) qo'lda ham kiritish mumkin.
 */
export const POINT_PRESETS = [
  { value: 5, label: 'Oson', icon: '🌱' },
  { value: 10, label: 'Oddiy', icon: '⭐' },
  { value: 25, label: 'Jiddiy', icon: '🔥' },
  { value: 50, label: 'Qiyin', icon: '💎' },
  { value: 100, label: 'Epik', icon: '🏆' },
];

/**
 * Darajalar. N-darajaga chiqish uchun 25 × N × (N − 1) ball kerak:
 *     1 → 0, 2 → 50, 3 → 150, 4 → 300, 5 → 500, ... 10 → 2250
 * Har keyingi daraja avvalgisidan biroz uzoqroq - o'yinlardagidek.
 */
const LEVEL_STEP = 25;

const LEVEL_TITLES = [
  { icon: '🌱', title: 'Boshlovchi' },
  { icon: '🌿', title: 'Harakatchan' },
  { icon: '⚡', title: "G'ayratli" },
  { icon: '🎯', title: 'Izchil' },
  { icon: '🚀', title: 'Uddaburon' },
  { icon: '💪', title: 'Mohir' },
  { icon: '🧠', title: 'Usta' },
  { icon: '💎', title: 'Ekspert' },
  { icon: '🏆', title: 'Chempion' },
  { icon: '👑', title: 'Afsona' }, // 10-daraja va undan yuqori
];

/** Hafta kunlarining qisqa nomlari (getDay() tartibida: 0 = yakshanba) */
const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

/** Bo'sh bank - hali hech narsa o'chirilmagan */
export const EMPTY_BANK = Object.freeze({
  points: 0,
  tasks: 0,
  onTime: 0,
  best: 0,
  days: Object.freeze({}),
  categories: Object.freeze({}),
});

// ---------------------------------------------------------------------------
// Yordamchilar
// ---------------------------------------------------------------------------

/**
 * Ballni o'qishga qulay ko'rinishda: 1240 -> "1 240".
 *
 * toLocaleString ishlatmaymiz - Android'da har xil natija berishi mumkin.
 *
 * @param {number} value
 * @returns {string}
 */
export const formatPoints = (value) => {
  const number = Math.round(Number(value) || 0);
  const sign = number < 0 ? '−' : '';

  return sign + String(Math.abs(number)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/** Manfiy bo'lmagan butun son (buzuq qiymat - 0) */
const count = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0;

/**
 * { kalit: son } obyektini tozalash: faqat musbat sonlar qoladi.
 *
 * @param {*} raw
 * @param {Function} [isValidKey]
 * @returns {Object}
 */
const normalizeCounts = (raw, isValidKey = () => true) => {
  const result = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;

  Object.keys(raw).forEach((key) => {
    const value = count(raw[key]);
    if (value > 0 && isValidKey(key)) result[key] = value;
  });

  return result;
};

/** Ikki { kalit: son } obyektini qo'shish (sign = -1 bo'lsa ayirish) */
const addCounts = (base, extra, sign = 1) => {
  const result = { ...base };

  Object.keys(extra).forEach((key) => {
    const value = (result[key] || 0) + sign * extra[key];
    if (value > 0) result[key] = value;
    else delete result[key];
  });

  return result;
};

// ---------------------------------------------------------------------------
// Bitta task uchun mukofot
// ---------------------------------------------------------------------------

/**
 * Muddatida bajarilganlik uchun bonus (kamida 1 ball).
 *
 * @param {number} points - Taskning balli
 * @returns {number}
 */
export const getOnTimeBonus = (points) =>
  Math.max(1, Math.round(normalizePoints(points) * ON_TIME_BONUS_RATE));

/**
 * Task bajarilgan kun ("YYYY-MM-DD", mahalliy vaqt bo'yicha).
 *
 * @param {Object} task
 * @returns {string|null} - Bajarilmagan bo'lsa null
 */
export const getCompletionDay = (task) => {
  if (!task?.completed) return null;

  const date = new Date(task.completedAt || task.updatedAt);
  return isNaN(date.getTime()) ? null : toDateString(date);
};

/**
 * Task uchun beriladigan mukofot.
 *
 * Bajarilmagan task hech narsa bermaydi (total = 0), lekin `base`
 * baribir qaytadi - kartochkada "nechaga arziydi" deb ko'rsatish uchun.
 *
 * @param {Object} task
 * @returns {Object} - { base, bonus, total, onTime }
 */
export const getTaskReward = (task) => {
  const base = normalizePoints(task?.points);
  const day = getCompletionDay(task);

  if (!day) return { base, bonus: 0, total: 0, onTime: false };

  // "YYYY-MM-DD" satrlarini to'g'ridan-to'g'ri solishtirsa bo'ladi
  const onTime = isValidDateString(task.deadline) && day <= task.deadline;
  const bonus = onTime ? getOnTimeBonus(base) : 0;

  return { base, bonus, total: base + bonus, onTime };
};

// ---------------------------------------------------------------------------
// Bank (o'chirilgan bajarilgan tasklar ballari)
// ---------------------------------------------------------------------------

/**
 * Xotiradan o'qilgan bankni tozalash.
 *
 * @param {*} raw
 * @returns {Object}
 */
export const normalizeBank = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_BANK, days: {}, categories: {} };
  }

  return {
    points: count(raw.points),
    tasks: count(raw.tasks),
    onTime: count(raw.onTime),
    best: count(raw.best),
    days: normalizeCounts(raw.days, isValidDateString),
    categories: normalizeCounts(raw.categories),
  };
};

/**
 * Bajarilgan tasklarning ballini bankka o'tkazish.
 * Bajarilmaganlari e'tiborsiz qoldiriladi.
 *
 * @param {Object} bank
 * @param {Array} tasks - Endi o'chiriladigan tasklar
 * @returns {Object} - Yangi bank
 */
export const bankTasks = (bank, tasks) => {
  const next = normalizeBank(bank);

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    const reward = getTaskReward(task);
    if (reward.total === 0) return;

    const day = getCompletionDay(task);
    const category = task.category || 'other';

    next.points += reward.total;
    next.tasks += 1;
    next.onTime += reward.onTime ? 1 : 0;
    next.best = Math.max(next.best, reward.total);
    next.days = addCounts(next.days, { [day]: reward.total });
    next.categories = addCounts(next.categories, { [category]: reward.total });
  });

  return next;
};

/**
 * "Qaytarish" bosilganda: bankka o'tgan ballni qayta taskka qaytarish.
 *
 * `best` o'zgarmaydi - rekord rekordligicha qoladi.
 *
 * @param {Object} bank
 * @param {Object} task - Qayta tiklanayotgan task
 * @returns {Object} - Yangi bank
 */
export const unbankTask = (bank, task) => {
  const next = normalizeBank(bank);
  const reward = getTaskReward(task);
  if (reward.total === 0) return next;

  const day = getCompletionDay(task);
  const category = task.category || 'other';

  next.points = Math.max(0, next.points - reward.total);
  next.tasks = Math.max(0, next.tasks - 1);
  next.onTime = Math.max(0, next.onTime - (reward.onTime ? 1 : 0));
  next.days = addCounts(next.days, { [day]: reward.total }, -1);
  next.categories = addCounts(next.categories, { [category]: reward.total }, -1);

  return next;
};

/**
 * Zaxiradan tiklashda ikki bankni birlashtirish.
 *
 * Har bir maydon bo'yicha KATTASI olinadi: shunda bitta zaxirani
 * ikki marta tiklasangiz ham ballar ikki baravar bo'lib qolmaydi.
 *
 * @param {Object} current
 * @param {Object} incoming
 * @returns {Object}
 */
export const mergeBanks = (current, incoming) => {
  const a = normalizeBank(current);
  const b = normalizeBank(incoming);

  const maxCounts = (x, y) => {
    const result = { ...x };
    Object.keys(y).forEach((key) => {
      result[key] = Math.max(result[key] || 0, y[key]);
    });
    return result;
  };

  return {
    points: Math.max(a.points, b.points),
    tasks: Math.max(a.tasks, b.tasks),
    onTime: Math.max(a.onTime, b.onTime),
    best: Math.max(a.best, b.best),
    days: maxCounts(a.days, b.days),
    categories: maxCounts(a.categories, b.categories),
  };
};

// ---------------------------------------------------------------------------
// Daraja va seriya
// ---------------------------------------------------------------------------

/**
 * N-darajaga chiqish uchun kerak bo'lgan jami ball.
 *
 * @param {number} level - 1 dan boshlab
 * @returns {number}
 */
export const levelThreshold = (level) => LEVEL_STEP * level * (level - 1);

/**
 * Jami ballga qarab daraja.
 *
 * @param {number} total
 * @returns {Object} - { level, icon, title, floor, next, progress, toNext }
 *   progress - keyingi darajagacha yo'lning qancha qismi bosib o'tilgani (0..1)
 */
export const getLevel = (total) => {
  const points = count(total);

  let level = 1;
  while (levelThreshold(level + 1) <= points) level += 1;

  const floor = levelThreshold(level);
  const next = levelThreshold(level + 1);
  const { icon, title } = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1];

  return {
    level,
    icon,
    title,
    floor,
    next,
    progress: (points - floor) / (next - floor),
    toNext: next - points,
  };
};

/**
 * Kunlar bo'yicha ballar: bank + hozirgi bajarilgan tasklar.
 *
 * @param {Array} tasks
 * @param {Object} bank
 * @returns {Object} - { 'YYYY-MM-DD': ball }
 */
export const getDailyPoints = (tasks, bank) => {
  let days = { ...normalizeBank(bank).days };

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    const reward = getTaskReward(task);
    if (reward.total > 0) {
      days = addCounts(days, { [getCompletionDay(task)]: reward.total });
    }
  });

  return days;
};

/**
 * Seriya - ketma-ket nechta kun kamida bitta task bajarilgani.
 *
 * Bugun hali hech narsa bajarilmagan bo'lsa, seriya uzilmagan hisoblanadi
 * (kecha bilan tugaydi) - kun hali tugamadi-ku.
 *
 * @param {Object} daily - getDailyPoints natijasi
 * @param {Date} [now]
 * @returns {Object} - { current, best, today } - today: bugun ball olinganmi
 */
export const getStreak = (daily, now = new Date()) => {
  const days = daily || {};
  const today = Boolean(days[todayString(now)]);

  // Joriy seriya: bugundan (yoki kechadan) orqaga qarab sanaymiz
  let current = 0;
  let offset = today ? 0 : -1;
  while (days[addDays(offset, now)]) {
    current += 1;
    offset -= 1;
  }

  // Eng uzun seriya: barcha kunlarni tartib bilan ko'rib chiqamiz
  let best = 0;
  let run = 0;
  let previous = null;

  Object.keys(days)
    .sort()
    .forEach((day) => {
      const date = parseDateOnly(day);
      const followsPrevious = previous && addDays(1, previous) === day;

      run = followsPrevious ? run + 1 : 1;
      best = Math.max(best, run);
      previous = date;
    });

  return { current, best: Math.max(best, current), today };
};

/**
 * Oxirgi N kun (grafik uchun), eskisidan yangisiga.
 *
 * @param {Object} daily
 * @param {number} [days]
 * @param {Date} [now]
 * @returns {Array} - [{ day, weekday, date, points, isToday }]
 */
export const getLastDays = (daily, days = 7, now = new Date()) =>
  Array.from({ length: days }, (_, index) => {
    const day = addDays(index - days + 1, now);
    const date = parseDateOnly(day);

    return {
      day,
      weekday: WEEKDAYS[date.getDay()],
      date: date.getDate(),
      points: (daily && daily[day]) || 0,
      isToday: index === days - 1,
    };
  });

// ---------------------------------------------------------------------------
// Umumiy natija
// ---------------------------------------------------------------------------

/**
 * Natijalar ekrani va bosh ekrandagi daraja paneli uchun hamma narsa.
 *
 * @param {Array} tasks - Barcha tasklar
 * @param {Object} bank - O'chirilgan tasklardan qolgan ballar
 * @param {Object} [options]
 * @param {Array} [options.categories] - Noma'lum kategoriyani "Boshqa"ga qo'shish uchun
 * @param {Date} [options.now]
 * @returns {Object}
 */
export const getScoreSummary = (tasks, bank, { categories, now = new Date() } = {}) => {
  const list = Array.isArray(tasks) ? tasks : [];
  const saved = normalizeBank(bank);

  let total = saved.points;
  let completedCount = saved.tasks;
  let onTimeCount = saved.onTime;
  let bestReward = saved.best;
  let potential = 0;
  let byCategory = { ...saved.categories };

  list.forEach((task) => {
    const reward = getTaskReward(task);

    if (!task.completed) {
      potential += reward.base;
      return;
    }

    total += reward.total;
    completedCount += 1;
    onTimeCount += reward.onTime ? 1 : 0;
    bestReward = Math.max(bestReward, reward.total);
    byCategory = addCounts(byCategory, { [task.category || 'other']: reward.total });
  });

  // O'chirilgan kategoriyalar ballini "Boshqa"ga yig'amiz
  if (Array.isArray(categories)) {
    const grouped = {};
    Object.keys(byCategory).forEach((key) => {
      const target = getTaskCategoryKey({ category: key }, categories);
      grouped[target] = (grouped[target] || 0) + byCategory[key];
    });
    byCategory = grouped;
  }

  const daily = getDailyPoints(list, saved);
  const lastWeek = getLastDays(daily, 7, now);
  const streak = getStreak(daily, now);
  const bestDay = Object.values(daily).reduce((max, value) => Math.max(max, value), 0);

  return {
    total,
    today: daily[todayString(now)] || 0,
    week: lastWeek.reduce((sum, day) => sum + day.points, 0),
    lastWeek,
    completedCount,
    onTimeCount,
    bestReward,
    bestDay,
    potential,
    activeCount: list.filter((task) => !task.completed).length,
    streak: streak.current,
    bestStreak: streak.best,
    streakToday: streak.today,
    level: getLevel(total),
    byCategory,
  };
};

// ---------------------------------------------------------------------------
// Yutuqlar (nishonlar)
// ---------------------------------------------------------------------------

/**
 * Yutuqlar ro'yxati. `value` - summary'dan joriy ko'rsatkichni oladi.
 */
export const ACHIEVEMENTS = [
  {
    key: 'first',
    icon: '🌱',
    title: 'Birinchi qadam',
    description: 'Birinchi taskni bajaring',
    target: 1,
    value: (s) => s.completedCount,
  },
  {
    key: 'hundred',
    icon: '💯',
    title: 'Yuzlik',
    description: '100 ball yig\'ing',
    target: 100,
    value: (s) => s.total,
  },
  {
    key: 'ten-tasks',
    icon: '🎯',
    title: "O'ntalik",
    description: '10 ta taskni bajaring',
    target: 10,
    value: (s) => s.completedCount,
  },
  {
    key: 'punctual',
    icon: '⏰',
    title: 'Aniq vaqtida',
    description: '10 ta taskni muddatida bajaring',
    target: 10,
    value: (s) => s.onTimeCount,
  },
  {
    key: 'streak-3',
    icon: '🔥',
    title: 'Uchqun',
    description: '3 kun ketma-ket task bajaring',
    target: 3,
    value: (s) => s.bestStreak,
  },
  {
    key: 'day-100',
    icon: '⚡',
    title: 'Zarbdor kun',
    description: 'Bir kunda 100 ball oling',
    target: 100,
    value: (s) => s.bestDay,
  },
  {
    key: 'epic',
    icon: '🏆',
    title: "Epik g'alaba",
    description: '100+ balli taskni bajaring',
    target: 100,
    value: (s) => s.bestReward,
  },
  {
    key: 'streak-7',
    icon: '☄️',
    title: 'Olovli hafta',
    description: '7 kun ketma-ket task bajaring',
    target: 7,
    value: (s) => s.bestStreak,
  },
  {
    key: 'thousand',
    icon: '💎',
    title: 'Ming ball',
    description: '1 000 ball yig\'ing',
    target: 1000,
    value: (s) => s.total,
  },
  {
    key: 'hundred-tasks',
    icon: '🦾',
    title: 'Temir iroda',
    description: '100 ta taskni bajaring',
    target: 100,
    value: (s) => s.completedCount,
  },
  {
    key: 'streak-30',
    icon: '🌋',
    title: "So'nmas olov",
    description: '30 kun ketma-ket task bajaring',
    target: 30,
    value: (s) => s.bestStreak,
  },
  {
    key: 'legend',
    icon: '👑',
    title: 'Afsona',
    description: '10-darajaga chiqing',
    target: levelThreshold(10),
    value: (s) => s.total,
  },
];

/**
 * Yutuqlar holati: qaysilari ochilgan, qolganlarida qancha qolgan.
 *
 * @param {Object} summary - getScoreSummary natijasi
 * @returns {Array} - [{ key, icon, title, description, target, current, unlocked, progress }]
 */
export const getAchievements = (summary) =>
  ACHIEVEMENTS.map(({ value, ...achievement }) => {
    const current = Math.min(count(value(summary)), achievement.target);

    return {
      ...achievement,
      current,
      unlocked: current >= achievement.target,
      progress: current / achievement.target,
    };
  });

// ---------------------------------------------------------------------------
// Task belgilanganda nima bo'ldi?
// ---------------------------------------------------------------------------

/**
 * Task bajarildi/bajarilmadi deb belgilangandan keyingi o'zgarish -
 * bosh ekrandagi "+31 ball" xabari uchun.
 *
 * @param {Object} task - Belgilangandan KEYINGI task
 * @param {Object} before - Belgilashdan oldingi getScoreSummary
 * @param {Object} after - Belgilashdan keyingi getScoreSummary
 * @returns {Object} - { completed, points, bonus, total, levelUp, streak }
 *   levelUp - yangi daraja (getLevel natijasi) yoki null;
 *   streak - bugun seriya davom ettirildi: necha kun (aks holda null).
 */
export const describeToggle = (task, before, after) => {
  if (!task?.completed) {
    // Bajarilmagan deb qaytarildi - ball qaytib olinadi
    return {
      completed: false,
      points: before.total - after.total,
      bonus: 0,
      total: after.total,
      levelUp: null,
      streak: null,
    };
  }

  const reward = getTaskReward(task);

  return {
    completed: true,
    points: reward.total,
    bonus: reward.bonus,
    total: after.total,
    levelUp: after.level.level > before.level.level ? after.level : null,
    // Bugungi birinchi task seriyani bir kunga uzaytiradi
    streak: !before.streakToday && after.streakToday && after.streak > 1 ? after.streak : null,
  };
};
