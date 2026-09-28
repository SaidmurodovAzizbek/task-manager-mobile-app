/**
 * AddTaskScreen.js - Yangi task qo'shish ekrani
 *
 * Formaning o'zi TaskForm komponentida. Bu ekran faqat
 * "saqlanganda nima bo'ladi" degan savolga javob beradi.
 */

import React from 'react';

import TaskForm from '../components/TaskForm';
import { addTask } from '../storage/taskStorage';

/**
 * AddTaskScreen komponenti
 *
 * @param {Object} props
 * @param {Object} props.route - Route parametrlari ({ category } - ixtiyoriy)
 * @param {Object} props.navigation - React Navigation obyekti
 */
const AddTaskScreen = ({ route, navigation }) => (
  <TaskForm
    navigation={navigation}
    // Bosh ekranda kategoriya filtri tanlangan bo'lsa - yangi task o'sha
    // kategoriyada ochiladi (masalan "Sport" ko'rib turib "+" bosilsa)
    initialCategory={route.params?.category}
    title="Yangi Task"
    subtitle="Sarlavha majburiy, qolgani ixtiyoriy"
    submitLabel="✅ Saqlash"
    // Forma tekshiruvdan o'tgach shu funksiya chaqiriladi.
    // Xatolik chiqsa - TaskForm uni o'zi ushlaydi va xabar ko'rsatadi.
    onSubmit={(values) => addTask(values)}
  />
);

export default AddTaskScreen;
