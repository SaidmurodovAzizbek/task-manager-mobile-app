/**
 * colors.js - Ilovaning yagona rang palitrasi
 *
 * Ilgari ranglar har bir faylda alohida yozilgan edi. Endi hammasi
 * shu yerda turadi - bitta joyni o'zgartirsangiz, butun ilova o'zgaradi.
 *
 * Palitra Jira (Atlassian) dizayn tizimidan olingan.
 */

export const colors = {
  // Asosiy brend rangi (header, tugmalar, FAB)
  primary: '#0052CC',
  primaryDark: '#0747A6',
  primaryLight: '#B3D4FF',
  primarySurface: '#DEEBFF',

  // Fon ranglari
  background: '#F4F5F7',   // Ekran foni
  surface: '#FFFFFF',      // Kartochka foni
  surfaceAlt: '#EBECF0',   // Ajratuvchi chiziqlar

  // Matn ranglari
  text: '#172B4D',         // Asosiy matn (quyuq ko'k)
  textMuted: '#6B778C',    // Ikkinchi darajali matn
  textSubtle: '#A5ADBA',   // Eng och matn (placeholder, hisoblagich)
  textInverse: '#FFFFFF',  // Ko'k fon ustidagi matn

  // Chegara ranglari
  border: '#DFE1E6',

  // Holat ranglari
  danger: '#DE350B',
  dangerSurface: '#FFEBE6',
  warning: '#FF991F',
  warningSurface: '#FFF7E6',
  success: '#00875A',
  successSurface: '#E3FCEF',
};

/**
 * Ustuvorlik (priority) darajalari - butun ilova uchun yagona manba.
 *
 * Tartib muhim: ro'yxat saralashda va formada shu ketma-ketlik ishlatiladi.
 */
export const PRIORITIES = [
  {
    key: 'high',
    label: 'Yuqori',
    icon: '🔴',
    color: colors.danger,
    bgColor: colors.dangerSurface,
    description: 'Shoshilinch!',
    weight: 3,               // Saralashda ishlatiladi (katta = tepada)
  },
  {
    key: 'medium',
    label: "O'rta",
    icon: '🟡',
    color: colors.warning,
    bgColor: colors.warningSurface,
    description: 'Normal muddat',
    weight: 2,
  },
  {
    key: 'low',
    label: 'Past',
    icon: '🟢',
    color: colors.success,
    bgColor: colors.successSurface,
    description: 'Shoshilish kerak emas',
    weight: 1,
  },
];

/**
 * Ustuvorlik kaliti bo'yicha konfiguratsiyani olish.
 * Noma'lum qiymat kelsa - "medium" qaytaradi (ilova qulab tushmaydi).
 *
 * @param {string} key - 'low' | 'medium' | 'high'
 * @returns {Object} - Ustuvorlik konfiguratsiyasi
 */
export const getPriority = (key) =>
  PRIORITIES.find((p) => p.key === key) || PRIORITIES[1];

export default colors;
