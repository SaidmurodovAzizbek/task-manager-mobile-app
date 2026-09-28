/**
 * useCategories.js - Kategoriyalar ro'yxatini ekranga olib kelish
 *
 * Ro'yxat ekran har safar ochilganda (fokusga kelganda) xotiradan
 * qayta o'qiladi. Masalan: "Kategoriyalar" ekranida yangisi qo'shilib,
 * orqaga qaytilsa - bosh ekrandagi filtrda u darhol ko'rinadi.
 *
 * Xotira o'qilguncha standart kategoriyalar ko'rsatib turiladi,
 * shuning uchun ekran hech qachon "bo'sh" bo'lmaydi.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getCategories } from '../storage/taskStorage';
import { buildCategoryList } from '../utils/categoryUtils';

/**
 * @returns {[Array, Function]} - [kategoriyalar, setKategoriyalar]
 *   Setter - kategoriya qo'shilgach/o'chirilgach ro'yxatni darhol yangilash uchun.
 */
export const useCategories = () => {
  const [categories, setCategories] = useState(() => buildCategoryList());

  useFocusEffect(
    useCallback(() => {
      let active = true; // Ekran hali ochiqmi?

      getCategories().then((list) => {
        if (active) setCategories(list);
      });

      return () => {
        active = false;
      };
    }, [])
  );

  return [categories, setCategories];
};

export default useCategories;
