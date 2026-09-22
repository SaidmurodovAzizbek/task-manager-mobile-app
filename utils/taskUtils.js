/**
 * taskUtils.js - Tasklar ustidagi "sof" mantiq
 *
 * Bu yerdagi funksiyalar React'ga ham, telefonga ham bog'liq emas.
 * Shuning uchun ularni oddiy Node bilan test qilsa bo'ladi:
 *
 *     npm test
 *
 * Qoida: ekranlarda hisob-kitob yozmaymiz - hammasi shu faylga tushadi.
 */

// ---------------------------------------------------------------------------
// Doimiylar
// ---------------------------------------------------------------------------

/** Ro'yxat filtrlari (Barchasi / Faol / Bajarilgan) */
export const TASK_FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'active', label: 'Faol' },
  { key: 'completed', label: 'Bajarilgan' },
];

/** Saralash variantlari */
export const SORT_OPTIONS = [
  { key: 'created', label: 'Yangi' },        // Eng oxirgi qo'shilgan - tepada
  { key: 'deadline', label: 'Muddat' },      // Eng yaqin muddat - tepada
  { key: 'priority', label: 'Muhimlik' },    // Yuqori ustuvorlik - tepada
  { key: 'title', label: 'Alifbo' },         // A-Z
];

/** Ustuvorlik og'irliklari (saralash uchun) */
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

/** Sarlavha va tavsif uchun chegaralar */
export const TITLE_MIN = 3;
export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;

/**
 * Muddat uchun aqlli yil chegarasi.
 *
 * "2025" o'rniga "2555" deb terib yuborish oson - kalendar bo'yicha bu
 * to'g'ri sana, lekin task uchun ma'nosiz. Shuning uchun foydalanuvchi
 * kiritgan sanani shu oraliqqa cheklaymiz.
 *
 * Diqqat: bu chegara faqat YANGI kiritilgan sanaga tegishli. Xotirada
 * allaqachon saqlangan ma'lumot bundan qat'i nazar o'qilaveradi -
 * eski task o'chib ketmasligi kerak.
 */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

// O'zbekcha qisqartirilgan oy nomlari
const MONTHS = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

// ---------------------------------------------------------------------------
// Sana bilan ishlash
// ---------------------------------------------------------------------------

/**
 * "YYYY-MM-DD" satrini MAHALLIY vaqt bo'yicha Date obyektiga aylantirish.
 *
 * Nega `new Date("2026-01-05")` ishlatmaymiz? Chunki JavaScript bu satrni
 * UTC deb o'qiydi va ba'zi vaqt mintaqalarida sana bir kunga surilib ketadi.
 *
 * @param {string} value - "YYYY-MM-DD" ko'rinishidagi sana
 * @returns {Date|null} - Sana yoki null (format noto'g'ri bo'lsa)
 */
export const parseDateOnly = (value) => {
  if (typeof value !== 'string') return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Oy va kun umuman mantiqiymi?
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);

  // 31-fevral kabi "yo'q" sanalarni ushlaymiz: Date obyekti ularni
  // keyingi oyga surib yuboradi, biz esa buni taqqoslab sezamiz.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

/**
 * Sana satri haqiqiy kalendar sanasimi?
 *
 * @param {string} value - "YYYY-MM-DD"
 * @returns {boolean}
 */
export const isValidDateString = (value) => parseDateOnly(value) !== null;

/**
 * Date obyektini "YYYY-MM-DD" satriga aylantirish (mahalliy vaqt bo'yicha).
 *
 * @param {Date} date
 * @returns {string}
 */
export const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Bugungi sana - "YYYY-MM-DD" ko'rinishida.
 *
 * @param {Date} [now] - Testlar uchun "soxta bugun" berish mumkin
 * @returns {string}
 */
export const todayString = (now = new Date()) => toDateString(now);

/**
 * Bugundan N kun keyingi sana.
 *
 * @param {number} days - Kunlar soni (manfiy ham bo'lishi mumkin)
 * @param {Date} [now]
 * @returns {string} - "YYYY-MM-DD"
 */
export const addDays = (days, now = new Date()) => {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() + days);
  return toDateString(date);
};

/**
 * Muddat bilan bugun orasidagi kunlar farqi.
 *
 * @param {string} deadline - "YYYY-MM-DD"
 * @param {Date} [now]
 * @returns {number|null} - 0 = bugun, 1 = ertaga, -2 = ikki kun kechikdi
 */
export const daysUntil = (deadline, now = new Date()) => {
  const target = parseDateOnly(deadline);
  if (!target) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();

  // Bir kun = 86 400 000 millisekund. Yozgi/qishki vaqt siljishi
  // bir necha soat farq berishi mumkin, shuning uchun yaxlitlaymiz.
  return Math.round(diffMs / 86400000);
};

/**
 * Muddat o'tib ketganmi?
 *
 * @param {string} deadline - "YYYY-MM-DD"
 * @param {Date} [now]
 * @returns {boolean}
 */
export const isOverdue = (deadline, now = new Date()) => {
  const diff = daysUntil(deadline, now);
  return diff !== null && diff < 0;
};

/**
 * Sanani o'qishga qulay ko'rinishga o'tkazish: "31-dek, 2026".
 *
 * Ham "YYYY-MM-DD", ham to'liq ISO vaqt (createdAt) bilan ishlaydi.
 *
 * @param {string} value
 * @returns {string}
 */
export const formatDate = (value) => {
  if (!value) return 'Muddat belgilanmagan';

  // Avval qisqa formatni sinaymiz (vaqt mintaqasi muammosisiz)
  let date = parseDateOnly(value);

  // Bo'lmasa - to'liq ISO vaqt (masalan "2026-09-22T10:15:00.000Z")
  if (!date) {
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return String(value);
    date = parsed;
  }

  return `${date.getDate()}-${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
};

/**
 * Muddatni "inson tilida" ko'rsatish: "Bugun", "Ertaga", "3 kun kechikdi".
 *
 * @param {string} deadline - "YYYY-MM-DD"
 * @param {Date} [now]
 * @returns {string}
 */
export const formatDeadline = (deadline, now = new Date()) => {
  const diff = daysUntil(deadline, now);
  if (diff === null) return formatDate(deadline);

  if (diff === 0) return 'Bugun';
  if (diff === 1) return 'Ertaga';
  if (diff === -1) return 'Kecha';
  if (diff < 0) return `${Math.abs(diff)} kun kechikdi`;
  if (diff <= 7) return `${diff} kun qoldi`;

  // Bir haftadan uzoq bo'lsa - aniq sanani ko'rsatamiz
  return formatDate(deadline);
};

/**
 * Foydalanuvchi yozayotganda sanani avtomatik formatlash.
 *
 * Telefonning raqamli klaviaturasida "-" belgisi yo'q, shuning uchun
 * foydalanuvchi faqat raqam yozadi, chiziqchani biz qo'shamiz:
 *
 *     "2026"     -> "2026"
 *     "20261"    -> "2026-1"
 *     "20261231" -> "2026-12-31"
 *
 * @param {string} text - Foydalanuvchi kiritgan matn
 * @returns {string} - Formatlangan matn
 */
export const maskDateInput = (text) => {
  // Faqat raqamlarni qoldiramiz, maksimal 8 ta (YYYYMMDD)
  const digits = String(text ?? '').replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

// ---------------------------------------------------------------------------
// Task obyekti
// ---------------------------------------------------------------------------

/**
 * Noyob ID yaratish: vaqt + tasodifiy qism.
 *
 * @returns {string}
 */
export const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Formadan kelgan ma'lumotdan to'liq task obyekti yasash.
 *
 * @param {Object} input - { title, description, deadline, priority }
 * @returns {Object} - Saqlashga tayyor task
 */
export const createTask = (input = {}) => {
  const now = new Date().toISOString();

  return {
    id: generateId(),
    title: String(input.title ?? '').trim(),
    description: String(input.description ?? '').trim(),
    deadline: input.deadline ? String(input.deadline).trim() : null,
    priority: PRIORITY_WEIGHT[input.priority] ? input.priority : 'medium',
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Xotiradan o'qilgan taskni "tozalash".
 *
 * Eski versiyada saqlangan tasklarda ba'zi maydonlar yo'q bo'lishi mumkin
 * (masalan updatedAt). Bu funksiya ularni to'ldiradi va buzuq yozuvlarni
 * rad etadi - shunda ilova eski ma'lumot ustida ham qulab tushmaydi.
 *
 * @param {Object} raw - Xotiradagi yozuv
 * @returns {Object|null} - To'g'rilangan task yoki null (yaroqsiz bo'lsa)
 */
export const normalizeTask = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  // ID va sarlavhasi yo'q yozuv - bu task emas
  const id = raw.id != null ? String(raw.id) : null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!id || !title) return null;

  const createdAt =
    typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();

  return {
    id,
    title,
    description: typeof raw.description === 'string' ? raw.description : '',
    // Faqat haqiqiy sanani qabul qilamiz, aks holda - muddatsiz
    deadline: isValidDateString(raw.deadline) ? raw.deadline.trim() : null,
    priority: PRIORITY_WEIGHT[raw.priority] ? raw.priority : 'medium',
    completed: raw.completed === true,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  };
};

/**
 * Massivdagi barcha tasklarni tozalash va yaroqsizlarini chiqarib tashlash.
 *
 * @param {*} rawList - Xotiradan kelgan qiymat (massiv bo'lmasligi ham mumkin)
 * @returns {Array} - Tozalangan tasklar massivi
 */
export const normalizeTasks = (rawList) => {
  if (!Array.isArray(rawList)) return [];

  const seenIds = new Set();

  return rawList.map(normalizeTask).filter((task) => {
    if (!task) return false;
    // Bir xil ID ikki marta uchrasa (FlatList uchun xavfli) - tashlab ketamiz
    if (seenIds.has(task.id)) return false;
    seenIds.add(task.id);
    return true;
  });
};

// ---------------------------------------------------------------------------
// Validatsiya
// ---------------------------------------------------------------------------

/**
 * Forma ma'lumotlarini tekshirish.
 *
 * @param {Object} values - { title, deadline }
 * @returns {Object} - Xatoliklar obyekti. Bo'sh bo'lsa - hammasi joyida.
 */
export const validateTaskInput = ({ title = '', deadline = '' } = {}) => {
  const errors = {};
  const cleanTitle = String(title).trim();
  const cleanDeadline = String(deadline ?? '').trim();

  if (!cleanTitle) {
    errors.title = 'Sarlavha kiritish majburiy';
  } else if (cleanTitle.length < TITLE_MIN) {
    errors.title = `Sarlavha kamida ${TITLE_MIN} ta belgidan iborat bo'lishi kerak`;
  }

  if (cleanDeadline) {
    const parsed = parseDateOnly(cleanDeadline);

    if (!parsed) {
      errors.deadline = 'Sana formati: YYYY-MM-DD (masalan: 2026-12-31)';
    } else if (parsed.getFullYear() < MIN_YEAR || parsed.getFullYear() > MAX_YEAR) {
      // Terish xatosini ushlaymiz: "2555" yoki "0226" kabi yillar
      errors.deadline = `Yil ${MIN_YEAR}-${MAX_YEAR} oralig'ida bo'lishi kerak`;
    }
  }

  return errors;
};

// ---------------------------------------------------------------------------
// Ro'yxatni filtrlash va saralash
// ---------------------------------------------------------------------------

/**
 * Tasklarni filtr va qidiruv so'zi bo'yicha ajratish.
 *
 * @param {Array} tasks - Barcha tasklar
 * @param {Object} options - { filter: 'all'|'active'|'completed', query: string }
 * @returns {Array} - Mos keladigan tasklar
 */
export const filterTasks = (tasks, { filter = 'all', query = '' } = {}) => {
  const search = String(query).trim().toLowerCase();

  return (Array.isArray(tasks) ? tasks : []).filter((task) => {
    // 1-bosqich: holat bo'yicha
    if (filter === 'active' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;

    // 2-bosqich: qidiruv (sarlavha yoki tavsif ichidan)
    if (!search) return true;

    const haystack = `${task.title} ${task.description || ''}`.toLowerCase();
    return haystack.includes(search);
  });
};

/**
 * Tasklarni saralash.
 *
 * Muhim: asl massivni o'zgartirmaydi, yangi massiv qaytaradi.
 * Bajarilgan tasklar tanlangan tartibdan qat'i nazar pastga tushadi.
 *
 * @param {Array} tasks - Tasklar
 * @param {string} sortKey - 'created' | 'deadline' | 'priority' | 'title'
 * @returns {Array} - Saralangan yangi massiv
 */
export const sortTasks = (tasks, sortKey = 'created') => {
  const list = Array.isArray(tasks) ? [...tasks] : [];

  return list.sort((a, b) => {
    // Bajarilganlar doimo pastda
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    switch (sortKey) {
      case 'priority': {
        const diff =
          (PRIORITY_WEIGHT[b.priority] || 2) - (PRIORITY_WEIGHT[a.priority] || 2);
        if (diff !== 0) return diff;
        break; // Teng bo'lsa - pastdagi "yangi tepada" qoidasiga tushadi
      }

      case 'deadline': {
        // Muddati borlar tepada, muddatsizlar pastda
        if (!a.deadline && !b.deadline) break;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        if (a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
        break;
      }

      case 'title': {
        const diff = a.title.localeCompare(b.title, 'uz');
        if (diff !== 0) return diff;
        break;
      }

      default:
        break;
    }

    // Standart (va teng holatlar uchun zaxira) qoida: yangi - tepada
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
};

/**
 * Ro'yxat bo'yicha qisqa statistika.
 *
 * @param {Array} tasks - Barcha tasklar
 * @param {Date} [now]
 * @returns {Object} - { total, completed, active, overdue }
 */
export const getStats = (tasks, now = new Date()) => {
  const list = Array.isArray(tasks) ? tasks : [];
  const completed = list.filter((t) => t.completed).length;
  const overdue = list.filter((t) => !t.completed && isOverdue(t.deadline, now))
    .length;

  return {
    total: list.length,
    completed,
    active: list.length - completed,
    overdue,
  };
};
