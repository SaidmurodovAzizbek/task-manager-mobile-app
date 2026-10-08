/**
 * analyticsUtils.js - Analitika ekrani uchun hisob-kitoblar
 *
 * Tanlangan davr (hafta, oy, 3 oy, 6 oy, yil) bo'yicha:
 * - nechta task bajarildi, nechtasi muddatida / kechikib / muddatsiz;
 * - muhimlik (Yuqori / O'rta / Past) bo'yicha;
 * - kategoriyalar bo'yicha;
 * - ballar va ularning vaqt bo'yicha o'zgarishi;
 * - hafta kunlari bo'yicha faollik;
 * - oldingi xuddi shunday davr bilan solishtirish va qisqa xulosalar.
 *
 * Manba - getCompletionRecords: hozirgi bajarilgan tasklar + o'chirilgan
 * tasklar tarixi (ballar banki). Shuning uchun task o'chirilsa ham
 * analitika o'zgarmaydi.
 *
 * Davrlar "bugun bilan tugaydigan" oraliqlar: "Oy" - oxirgi 30 kun,
 * "Yil" - joriy oy bilan birga oxirgi 12 oy.
 *
 * Bu fayl React'ga bog'liq emas - `npm test` bilan tekshiriladi.
 */

import { findCategory, getTaskCategoryKey } from './categoryUtils.js';
import { formatPoints, getCompletionRecords, normalizeBank } from './pointsUtils.js';
import {
  addDays,
  daysUntil,
  formatDate,
  isOverdue,
  MONTHS,
  parseDateOnly,
  toDateString,
} from './taskUtils.js';

// ---------------------------------------------------------------------------
// Doimiylar
// ---------------------------------------------------------------------------

/**
 * Davrlar.
 *
 * unit/count - grafik ustunlari: 'day' - kunlik, 'week' - 7 kunlik,
 * 'month' - kalendar oyi. labelEvery - har nechanchi ustun ostiga yozuv.
 */
export const ANALYTICS_PERIODS = [
  { key: 'week', label: 'Hafta', title: 'Oxirgi 7 kun', unit: 'day', count: 7, labelEvery: 1 },
  { key: 'month', label: 'Oy', title: 'Oxirgi 30 kun', unit: 'day', count: 30, labelEvery: 5 },
  { key: 'quarter', label: '3 oy', title: 'Oxirgi 3 oy', unit: 'week', count: 13, labelEvery: 4 },
  { key: 'half', label: '6 oy', title: 'Oxirgi 6 oy', unit: 'week', count: 26, labelEvery: 6 },
  { key: 'year', label: 'Yil', title: 'Oxirgi 12 oy', unit: 'month', count: 12, labelEvery: 1 },
];

export const DEFAULT_PERIOD = 'month';

/** Ustuvorliklar tartibi va nomlari (xulosa matnlari uchun) */
const PRIORITY_ORDER = ['high', 'medium', 'low'];
const PRIORITY_NAMES = { high: 'Yuqori', medium: "O'rta", low: 'Past' };

/** Hafta kunlari - DUSHANBADAN boshlab */
export const WEEKDAY_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
export const WEEKDAY_NAMES = [
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
  'Yakshanba',
];

const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

// ---------------------------------------------------------------------------
// Yordamchilar
// ---------------------------------------------------------------------------

/**
 * Davrni kaliti bo'yicha topish (noma'lum kalit - standart davr).
 *
 * @param {string} key
 * @returns {Object}
 */
export const getPeriod = (key) =>
  ANALYTICS_PERIODS.find((p) => p.key === key) ||
  ANALYTICS_PERIODS.find((p) => p.key === DEFAULT_PERIOD);

/**
 * Ikki "YYYY-MM-DD" orasidagi kunlar: b - a.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
const daysBetween = (a, b) => daysUntil(b, parseDateOnly(a));

/**
 * Kasr sonni o'zbekcha ko'rinishda: 2.5 -> "2,5", 3.0 -> "3".
 *
 * @param {number} value
 * @returns {string}
 */
export const formatDecimal = (value) =>
  (Math.round((Number(value) || 0) * 10) / 10).toString().replace('.', ',');

/**
 * Ulush foizda: 0.724 -> "72%". Qiymat yo'q bo'lsa - "—".
 *
 * @param {number|null} rate - 0..1
 * @returns {string}
 */
export const formatPercent = (rate) =>
  rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)}%`;

/**
 * Oldingi davrga nisbatan o'zgarish (ulush).
 *
 * @param {number} current
 * @param {number} previous
 * @returns {number|null} - 0.25 = +25%; oldin 0 bo'lgan bo'lsa null
 */
export const percentChange = (current, previous) => {
  if (!previous) return current ? null : 0;
  return (current - previous) / previous;
};

/**
 * O'zgarishni qisqa yozish: +25% -> "25%", ikki baravardan ko'p bo'lsa -
 * "2360%" o'rniga "24,6×" (o'qish oson).
 *
 * @param {number} change - percentChange natijasi (null emas)
 * @returns {string}
 */
export const formatChange = (change) =>
  change >= 1 ? `${formatDecimal(change + 1)}×` : `${Math.round(Math.abs(change) * 100)}%`;

/**
 * Qisqa sana: "5-okt".
 *
 * @param {string} day - "YYYY-MM-DD"
 * @returns {string}
 */
const shortDate = (day) => {
  const date = parseDateOnly(day);
  return `${date.getDate()}-${MONTHS[date.getMonth()]}`;
};

/**
 * Oraliq yozuvi: "9-sen – 8-okt, 2026" (yillar har xil bo'lsa ikkalasida).
 *
 * @param {string} start
 * @param {string} end
 * @returns {string}
 */
export const formatRange = (start, end) => {
  if (start === end) return formatDate(start);
  if (start.slice(0, 4) !== end.slice(0, 4)) return `${formatDate(start)} – ${formatDate(end)}`;
  return `${shortDate(start)} – ${formatDate(end)}`;
};

// ---------------------------------------------------------------------------
// Davr va grafik ustunlari
// ---------------------------------------------------------------------------

/**
 * Davr ustunlari (eskisidan yangisiga).
 *
 * @param {Object} period - ANALYTICS_PERIODS elementi
 * @param {Date} now
 * @returns {Array} - [{ key, start, end, label, title, showLabel, isCurrent }]
 */
export const buildBuckets = (period, now = new Date()) => {
  const { unit, count, labelEvery } = period;
  const today = toDateString(now);

  return Array.from({ length: count }, (_, index) => {
    const back = count - 1 - index; // Bugundan nechta ustun oldin
    // Oxirgi ustundan orqaga sanaymiz - shunda eng yangisining yozuvi doim bor
    const showLabel = back % labelEvery === 0;
    const isCurrent = back === 0;

    if (unit === 'day') {
      const day = addDays(-back, now);
      const date = parseDateOnly(day);

      return {
        key: day,
        start: day,
        end: day,
        label: count <= 7 ? WEEKDAY_SHORT[(date.getDay() + 6) % 7] : String(date.getDate()),
        title: `${WEEKDAY_SHORT[(date.getDay() + 6) % 7]}, ${formatDate(day)}`,
        showLabel,
        isCurrent,
      };
    }

    if (unit === 'week') {
      const end = addDays(-back * 7, now);
      const start = addDays(-back * 7 - 6, now);

      return {
        key: start,
        start,
        end,
        label: shortDate(start),
        title: formatRange(start, end),
        showLabel,
        isCurrent,
      };
    }

    // Kalendar oyi. Joriy oy bugun bilan tugaydi.
    const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const start = toDateString(first);
    const end = isCurrent ? today : toDateString(last);

    return {
      key: start.slice(0, 7),
      start,
      end,
      label: MONTHS[first.getMonth()],
      title: `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`,
      showLabel,
      isCurrent,
    };
  });
};

/**
 * Davr chegaralari va undan oldingi xuddi shunday uzunlikdagi davr.
 *
 * @param {Object} period
 * @param {Date} now
 * @returns {Object} - { start, end, days, previous: { start, end } }
 */
export const getPeriodRange = (period, now = new Date()) => {
  const buckets = buildBuckets(period, now);
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;
  const days = daysBetween(start, end) + 1;
  const from = parseDateOnly(start);

  return {
    start,
    end,
    days,
    previous: { start: addDays(-days, from), end: addDays(-1, from) },
  };
};

// ---------------------------------------------------------------------------
// Yozuvlarni sanash
// ---------------------------------------------------------------------------

/**
 * Yozuv muddatga nisbatan qanday bajarilgan.
 *
 * @param {Object} record
 * @returns {Object} - { timing: 'onTime' | 'late' | 'none', lateDays }
 */
export const getTiming = (record) => {
  if (!record.deadline) return { timing: 'none', lateDays: 0 };

  const lateDays = daysBetween(record.deadline, record.day);
  return lateDays > 0 ? { timing: 'late', lateDays } : { timing: 'onTime', lateDays: 0 };
};

/**
 * Yozuvlar to'plami bo'yicha jamlanma.
 *
 * @param {Array} records
 * @returns {Object} - { completed, points, onTime, late, noDeadline, withDeadline,
 *   onTimeRate, avgLateDays, activeDays }
 */
export const summarizeRecords = (records) => {
  let points = 0;
  let onTime = 0;
  let late = 0;
  let lateDaysSum = 0;
  const days = new Set();

  records.forEach((record) => {
    const { timing, lateDays } = getTiming(record);

    points += record.points;
    days.add(record.day);

    if (timing === 'onTime') onTime += 1;
    if (timing === 'late') {
      late += 1;
      lateDaysSum += lateDays;
    }
  });

  const withDeadline = onTime + late;

  return {
    completed: records.length,
    points,
    onTime,
    late,
    noDeadline: records.length - withDeadline,
    withDeadline,
    // Muddatsiz tasklar foizga kirmaydi - ular na o'z vaqtida, na kech
    onTimeRate: withDeadline ? onTime / withDeadline : null,
    avgLateDays: late ? lateDaysSum / late : null,
    activeDays: days.size,
  };
};

/** Oraliqqa tushgan yozuvlar ("YYYY-MM-DD" satrlari to'g'ridan-to'g'ri solishtiriladi) */
const inRange = (records, start, end) =>
  records.filter((record) => record.day >= start && record.day <= end);

// ---------------------------------------------------------------------------
// Asosiy hisob
// ---------------------------------------------------------------------------

/**
 * Analitika ekrani uchun hamma narsa.
 *
 * @param {Array} tasks - Barcha tasklar
 * @param {Object} bank - Ballar banki
 * @param {Object} [options]
 * @param {string} [options.period] - ANALYTICS_PERIODS kaliti
 * @param {Array} [options.categories] - To'liq kategoriyalar ro'yxati
 * @param {Date} [options.now]
 * @returns {Object}
 */
export const getAnalytics = (tasks, bank, { period: periodKey, categories, now = new Date() } = {}) => {
  const period = getPeriod(periodKey);
  const list = Array.isArray(tasks) ? tasks : [];
  const saved = normalizeBank(bank);

  // O'chirilgan kategoriyadagi yozuvlar "Boshqa"ga tushadi
  const all = getCompletionRecords(list, saved).map((record) => ({
    ...record,
    category: getTaskCategoryKey(record, categories),
  }));

  const range = getPeriodRange(period, now);
  const records = inRange(all, range.start, range.end);
  const totals = summarizeRecords(records);
  const previous = summarizeRecords(inRange(all, range.previous.start, range.previous.end));

  // Grafik ustunlari
  const buckets = buildBuckets(period, now).map((bucket) => ({
    ...bucket,
    ...summarizeRecords(inRange(records, bucket.start, bucket.end)),
  }));

  // Muhimlik bo'yicha
  const byPriority = PRIORITY_ORDER.map((key) => ({
    key,
    ...summarizeRecords(records.filter((record) => record.priority === key)),
  }));

  // Kategoriyalar bo'yicha - ballari ko'pidan oziga
  const groups = {};
  records.forEach((record) => {
    (groups[record.category] = groups[record.category] || []).push(record);
  });
  const byCategory = Object.keys(groups)
    .map((key) => {
      const summary = summarizeRecords(groups[key]);
      return { key, ...summary, share: totals.points ? summary.points / totals.points : 0 };
    })
    .sort((a, b) => b.points - a.points || b.completed - a.completed);

  // Hafta kunlari (dushanbadan)
  const weekdays = WEEKDAY_SHORT.map((label, index) => ({
    index,
    label,
    name: WEEKDAY_NAMES[index],
    completed: 0,
    points: 0,
  }));
  records.forEach((record) => {
    const weekday = weekdays[(parseDateOnly(record.day).getDay() + 6) % 7];
    weekday.completed += 1;
    weekday.points += record.points;
  });

  // Hozirgi holat (davrga bog'liq emas)
  const open = list.filter((task) => !task.completed);

  return {
    period,
    range: { ...range, label: formatRange(range.start, range.end) },
    totals,
    previous,
    buckets,
    byPriority,
    byCategory,
    weekdays,
    pending: {
      open: open.length,
      overdue: open.filter((task) => isOverdue(task.deadline, now)).length,
    },
    // Ancha eski o'chirilgan tasklar: balli bor, tafsiloti saqlanmagan
    untracked: Math.max(0, saved.tasks - saved.history.length),
    hasAnyData: all.length > 0,
  };
};

// ---------------------------------------------------------------------------
// Xulosalar
// ---------------------------------------------------------------------------

/**
 * Raqamlardan chiqadigan qisqa, amaliy xulosalar (ko'pi bilan 4 ta).
 *
 * @param {Object} analytics - getAnalytics natijasi
 * @param {Array} [categories] - Kategoriya nomlari uchun
 * @returns {Array} - [{ key, icon, text, tone: 'good' | 'bad' | 'neutral' }]
 */
export const getInsights = (analytics, categories) => {
  const { totals, previous, weekdays, byCategory, byPriority, pending, period } = analytics;
  const insights = [];

  if (totals.completed === 0) {
    if (pending.overdue > 0) {
      insights.push({
        key: 'overdue',
        icon: '⚠️',
        text: `${pending.overdue} ta faol taskning muddati o'tgan - shulardan boshlang.`,
        tone: 'bad',
      });
    }
    return insights;
  }

  // 1. Oldingi davr bilan solishtirish
  const change = percentChange(totals.completed, previous.completed);
  if (change === null) {
    insights.push({
      key: 'trend',
      icon: '🚀',
      text: `Oldingi davrda bajarilgan task yo'q edi - bu safar ${totals.completed} ta!`,
      tone: 'good',
    });
  } else if (Math.abs(change) >= 0.1) {
    const more = change > 0;
    const amount =
      change >= 1
        ? `${formatDecimal(change + 1)} baravar ko'p`
        : `${Math.round(Math.abs(change) * 100)}% ${more ? "ko'proq" : 'kamroq'}`;

    insights.push({
      key: 'trend',
      icon: more ? '📈' : '📉',
      text: `Oldingi davrga nisbatan ${amount} task bajardingiz (${previous.completed} → ${totals.completed}).`,
      tone: more ? 'good' : 'bad',
    });
  }

  // 2. Muddat intizomi
  if (totals.withDeadline >= 3) {
    // Eng zaif muhimlik: kamida 2 ta muddatli task bo'lgan, foizi eng past
    const weakest = byPriority
      .filter((p) => p.withDeadline >= 2 && p.late > 0)
      .sort((a, b) => a.onTimeRate - b.onTimeRate)[0];

    if (totals.onTimeRate >= 0.9) {
      insights.push({
        key: 'timing',
        icon: '⏰',
        text: `Muddatli tasklarning ${formatPercent(totals.onTimeRate)} vaqtida bajarilgan - a'lo intizom!`,
        tone: 'good',
      });
    } else if (weakest && weakest.onTimeRate < 0.7) {
      insights.push({
        key: 'timing',
        icon: '⏳',
        text: `${PRIORITY_NAMES[weakest.key]} muhimlikdagi tasklarning ${formatPercent(
          1 - weakest.onTimeRate
        )} kechikkan${
          weakest.avgLateDays ? ` (o'rtacha ${formatDecimal(weakest.avgLateDays)} kun)` : ''
        }.`,
        tone: 'bad',
      });
    }
  }

  // 3. Eng samarali hafta kuni (bir haftalik davrda ma'nosi kam)
  if (period.key !== 'week' && totals.completed >= 5) {
    const best = [...weekdays].sort((a, b) => b.completed - a.completed || b.points - a.points)[0];
    const share = best.completed / totals.completed;

    insights.push({
      key: 'weekday',
      icon: '📅',
      text: `Eng samarali kuningiz - ${best.name}: tasklarning ${formatPercent(share)} shu kuni.`,
      tone: 'neutral',
    });
  }

  // 4. Ballar qayerdan kelyapti
  if (byCategory.length >= 2 && totals.points > 0) {
    const top = byCategory[0];
    const category = findCategory(categories, top.key);

    insights.push({
      key: 'category',
      icon: category.icon,
      text: `Ballarning ${formatPercent(top.share)} - "${category.label}" kategoriyasidan (${formatPoints(
        top.points
      )} ball).`,
      tone: 'neutral',
    });
  }

  // 5. Hozir kechikayotganlar
  if (pending.overdue > 0) {
    insights.push({
      key: 'overdue',
      icon: '⚠️',
      text: `Hozir ${pending.overdue} ta faol taskning muddati o'tgan.`,
      tone: 'bad',
    });
  }

  return insights.slice(0, 4);
};
