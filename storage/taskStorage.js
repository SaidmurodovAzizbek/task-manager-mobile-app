/**
 * taskStorage.js - AsyncStorage yordamida tasklarni saqlash va boshqarish
 * 
 * Bu fayl barcha CRUD (Create, Read, Update, Delete) operatsiyalarini 
 * bajaradi. Ma'lumotlar telefonning ichki xotirasida saqlanadi,
 * shuning uchun internet shart emas (offline ishlaydi).
 */

// AsyncStorage - telefon xotirasiga ma'lumot saqlash kutubxonasi
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tasklarni saqlash uchun kalit (key) nomi
// Bu kalit orqali ma'lumotlarni topamiz va o'qiymiz
const STORAGE_KEY = '@task_manager_tasks';

/**
 * Barcha tasklarni olish (READ)
 * 
 * Bu funksiya AsyncStorage'dan barcha saqlangan tasklarni o'qiydi.
 * Agar hech narsa saqlanmagan bo'lsa, bo'sh massiv qaytaradi.
 * 
 * @returns {Array} - Tasklarning massivi yoki bo'sh massiv
 */
export const getAllTasks = async () => {
  try {
    // AsyncStorage'dan ma'lumotni o'qiymiz (string shaklida qaytadi)
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);

    // Agar ma'lumot mavjud bo'lsa, JSON'dan massivga o'giramiz
    // Agar mavjud bo'lmasa (null), bo'sh massiv qaytaramiz
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    // Xatolik yuz bersa, konsolga chiqaramiz va bo'sh massiv qaytaramiz
    console.error('Tasklarni olishda xatolik:', error);
    return [];
  }
};

/**
 * Yangi task qo'shish (CREATE)
 * 
 * Bu funksiya yangi task yaratib, mavjud tasklarning boshiga qo'shadi.
 * Har bir taskga avtomatik ID va sana beriladi.
 * 
 * @param {Object} task - Yangi task ma'lumotlari
 * @param {string} task.title - Task sarlavhasi
 * @param {string} task.description - Task tavsifi
 * @param {string} task.deadline - Task muddati (sana)
 * @returns {Object} - Yaratilgan task obyekti
 */
export const addTask = async (task) => {
  try {
    // Avval barcha mavjud tasklarni olaylik
    const existingTasks = await getAllTasks();

    // Yangi task obyektini yaratamiz
    const newTask = {
      // Noyob ID yaratish - vaqt + tasodifiy son
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      // Foydalanuvchi kiritgan ma'lumotlar
      title: task.title,             // Sarlavha
      description: task.description, // Tavsif
      deadline: task.deadline,       // Muddat
      // Standart qiymatlar
      completed: false,              // Yangi task bajarilmagan
      createdAt: new Date().toISOString(), // Yaratilgan vaqt
      // Ustuvorlik (priority) - default: 'medium'
      priority: task.priority || 'medium',
    };

    // Yangi taskni massivning BOSHIGA qo'shamiz (eng yangi - birinchi)
    const updatedTasks = [newTask, ...existingTasks];

    // Yangilangan massivni AsyncStorage'ga saqlaymiz
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));

    // Yaratilgan taskni qaytaramiz
    return newTask;
  } catch (error) {
    console.error('Task qo\'shishda xatolik:', error);
    throw error; // Xatolikni yuqoriga uzatamiz
  }
};

/**
 * Taskni yangilash (UPDATE)
 * 
 * Bu funksiya mavjud taskni topib, ma'lumotlarini yangilaydi.
 * 
 * @param {string} taskId - Yangilanadigan taskning ID'si
 * @param {Object} updatedData - Yangi ma'lumotlar
 * @returns {Array} - Yangilangan tasklar massivi
 */
export const updateTask = async (taskId, updatedData) => {
  try {
    // Barcha tasklarni olamiz
    const tasks = await getAllTasks();

    // Taskni ID bo'yicha topamiz va yangilaymiz
    const updatedTasks = tasks.map((task) => {
      // Agar bu bizning izlayotgan taskimiz bo'lsa
      if (task.id === taskId) {
        // Eski ma'lumotlarni yangi ma'lumotlar bilan birlashtir
        return { ...task, ...updatedData };
      }
      // Boshqa tasklarni o'zgartirmasdan qoldir
      return task;
    });

    // Yangilangan massivni saqlaymiz
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));

    return updatedTasks;
  } catch (error) {
    console.error('Taskni yangilashda xatolik:', error);
    throw error;
  }
};

/**
 * Taskni o'chirish (DELETE)
 * 
 * Bu funksiya berilgan ID'li taskni ro'yxatdan olib tashlaydi.
 * 
 * @param {string} taskId - O'chiriladigan taskning ID'si
 * @returns {Array} - Yangilangan tasklar massivi (o'chirilganisiz)
 */
export const deleteTask = async (taskId) => {
  try {
    // Barcha tasklarni olamiz
    const tasks = await getAllTasks();

    // Berilgan ID'li taskni CHIQARIB TASHLASH (filter)
    // filter() - faqat shart bajarilgan elementlarni qoldiradi
    const filteredTasks = tasks.filter((task) => task.id !== taskId);

    // Yangilangan massivni saqlaymiz
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTasks));

    return filteredTasks;
  } catch (error) {
    console.error('Taskni o\'chirishda xatolik:', error);
    throw error;
  }
};

/**
 * Task holatini almashtirish (bajarilgan <-> bajarilmagan)
 * 
 * Bu funksiya task'ning "completed" qiymatini almashtirib qo'yadi.
 * Agar true bo'lsa false ga, false bo'lsa true ga o'zgaradi.
 * 
 * @param {string} taskId - Almashtiradigan taskning ID'si
 * @returns {Array} - Yangilangan tasklar massivi
 */
export const toggleTaskComplete = async (taskId) => {
  try {
    const tasks = await getAllTasks();

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        // completed qiymatini teskari qilamiz (toggle)
        return { ...task, completed: !task.completed };
      }
      return task;
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));

    return updatedTasks;
  } catch (error) {
    console.error('Task holatini o\'zgartirishda xatolik:', error);
    throw error;
  }
};

/**
 * Barcha tasklarni o'chirish (CLEAR ALL)
 * 
 * Bu funksiya barcha tasklarni butunlay o'chirib yuboradi.
 * Ehtiyot bo'ling - bu qaytarib bo'lmaydi!
 */
export const clearAllTasks = async () => {
  try {
    // STORAGE_KEY'ni AsyncStorage'dan o'chiramiz
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Barcha tasklarni o\'chirishda xatolik:', error);
    throw error;
  }
};
