/**
 * taskStorage.js - Tasklarni telefon xotirasida saqlash (offline)
 *
 * Barcha CRUD (Create, Read, Update, Delete) amallari shu yerda.
 * Ma'lumot AsyncStorage'da, ya'ni telefonning o'zida turadi -
 * internet ham, server ham, hisob qaydnomasi ham kerak emas.
 *
 * Muhim qoida: bu fayl faqat "saqlash/o'qish" bilan shug'ullanadi.
 * Hisob-kitob va tekshiruvlar utils/taskUtils.js da.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { createTask, normalizeTasks } from '../utils/taskUtils';

// Tasklar saqlanadigan kalit
const STORAGE_KEY = '@task_manager_tasks';

// Sozlamalar (tanlangan saralash tartibi va h.k.) saqlanadigan kalit
const SETTINGS_KEY = '@task_manager_settings';

/**
 * Tasklar massivini xotiraga yozish (ichki yordamchi funksiya).
 *
 * @param {Array} tasks - Saqlanadigan tasklar
 * @returns {Array} - O'sha massivning o'zi (zanjir qilish qulay bo'lsin)
 */
const persist = async (tasks) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  return tasks;
};

/**
 * Barcha tasklarni olish (READ).
 *
 * Xotiradagi ma'lumot buzilgan bo'lsa ham ilova qulab tushmasligi kerak,
 * shuning uchun o'qilgan hamma narsa normalizeTasks'dan o'tkaziladi.
 *
 * @returns {Promise<Array>} - Tasklar massivi (xato bo'lsa - bo'sh massiv)
 */
export const getAllTasks = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue == null) return [];

    // JSON.parse buzuq matnda xato tashlaydi - pastdagi catch ushlaydi
    return normalizeTasks(JSON.parse(jsonValue));
  } catch (error) {
    console.error('Tasklarni olishda xatolik:', error);
    return [];
  }
};

/**
 * Yangi task qo'shish (CREATE).
 *
 * @param {Object} input - { title, description, deadline, priority }
 * @returns {Promise<Array>} - Yangilangan to'liq ro'yxat
 */
export const addTask = async (input) => {
  const tasks = await getAllTasks();

  // Yangi task ro'yxat BOSHIGA qo'shiladi (eng yangi - birinchi)
  return persist([createTask(input), ...tasks]);
};

/**
 * Taskni yangilash (UPDATE).
 *
 * @param {string} taskId - Yangilanadigan task ID'si
 * @param {Object} changes - O'zgaradigan maydonlar
 * @returns {Promise<Array>} - Yangilangan ro'yxat
 */
export const updateTask = async (taskId, changes) => {
  const tasks = await getAllTasks();

  const updated = tasks.map((task) =>
    task.id === taskId
      ? // Eski qiymatlar ustiga yangilarini qo'yamiz va
        // "oxirgi tahrir" vaqtini yangilaymiz
        { ...task, ...changes, id: task.id, updatedAt: new Date().toISOString() }
      : task
  );

  return persist(updated);
};

/**
 * Taskni o'chirish (DELETE).
 *
 * @param {string} taskId - O'chiriladigan task ID'si
 * @returns {Promise<Array>} - Yangilangan ro'yxat
 */
export const deleteTask = async (taskId) => {
  const tasks = await getAllTasks();
  return persist(tasks.filter((task) => task.id !== taskId));
};

/**
 * O'chirilgan taskni joyiga qaytarish (UNDO).
 *
 * Foydalanuvchi tasodifan o'chirib yuborsa, "Qaytarish" tugmasi shuni chaqiradi.
 *
 * @param {Object} task - Avval o'chirilgan task obyekti
 * @param {number} index - Ro'yxatdagi eski o'rni
 * @returns {Promise<Array>} - Yangilangan ro'yxat
 */
export const restoreTask = async (task, index = 0) => {
  const tasks = await getAllTasks();

  // Eski o'rni ro'yxat chegarasidan chiqib ketmasligi kerak
  const position = Math.min(Math.max(index, 0), tasks.length);
  tasks.splice(position, 0, task);

  return persist(tasks);
};

/**
 * Task holatini almashtirish: bajarildi <-> bajarilmadi.
 *
 * @param {string} taskId - Task ID'si
 * @returns {Promise<Array>} - Yangilangan ro'yxat
 */
export const toggleTaskComplete = async (taskId) => {
  const tasks = await getAllTasks();

  const updated = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          completed: !task.completed,
          updatedAt: new Date().toISOString(),
        }
      : task
  );

  return persist(updated);
};

/**
 * Bajarilgan tasklarni tozalash.
 *
 * @returns {Promise<Array>} - Faqat faol tasklar qolgan ro'yxat
 */
export const clearCompletedTasks = async () => {
  const tasks = await getAllTasks();
  return persist(tasks.filter((task) => !task.completed));
};

/**
 * Barcha tasklarni o'chirish.
 *
 * Ehtiyot bo'ling - bu amalni qaytarib bo'lmaydi!
 *
 * @returns {Promise<Array>} - Bo'sh massiv
 */
export const clearAllTasks = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return [];
};

/**
 * Zaxira nusxa uchun barcha tasklarni matn ko'rinishida chiqarish.
 *
 * Natijani Telegram'ga yoki o'zingizga yuborib qo'yish mumkin -
 * telefon almashtirsangiz, shu matndan tiklaysiz.
 *
 * @returns {Promise<string>} - JSON matn
 */
export const exportTasks = async () => {
  const tasks = await getAllTasks();

  return JSON.stringify(
    {
      app: 'task-manager-mobile-app',
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
    },
    null,
    2
  );
};

/**
 * Zaxira nusxadan tasklarni tiklash.
 *
 * Mavjud tasklar o'chirilmaydi - yangilari ustiga qo'shiladi.
 * Bir xil ID li tasklar takrorlanmaydi (normalizeTasks buni hal qiladi).
 *
 * @param {string} json - exportTasks qaytargan matn
 * @returns {Promise<Array>} - Yangilangan ro'yxat
 */
export const importTasks = async (json) => {
  const parsed = JSON.parse(json);

  // Ham to'liq zaxira obyektini, ham oddiy massivni qabul qilamiz
  const incoming = normalizeTasks(Array.isArray(parsed) ? parsed : parsed?.tasks);

  if (incoming.length === 0) {
    throw new Error('Zaxira nusxada task topilmadi');
  }

  const current = await getAllTasks();

  // Avval mavjudlar, keyin yangilar - normalizeTasks nusxalarni tashlaydi
  return persist(normalizeTasks([...current, ...incoming]));
};

/**
 * Foydalanuvchi sozlamalarini olish (masalan tanlangan saralash tartibi).
 *
 * @returns {Promise<Object>} - Sozlamalar obyekti
 */
export const getSettings = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    const parsed = jsonValue != null ? JSON.parse(jsonValue) : null;

    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Sozlamalarni olishda xatolik:', error);
    return {};
  }
};

/**
 * Sozlamalarni saqlash.
 *
 * Bu funksiya xato tashlamaydi: sozlama saqlanmasa ham ilova
 * ishlayveradi, shunchaki keyingi ochilishda standart holatga qaytadi.
 *
 * @param {Object} changes - O'zgaradigan sozlamalar
 */
export const saveSettings = async (changes) => {
  try {
    const current = await getSettings();
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...current, ...changes })
    );
  } catch (error) {
    console.error('Sozlamalarni saqlashda xatolik:', error);
  }
};
