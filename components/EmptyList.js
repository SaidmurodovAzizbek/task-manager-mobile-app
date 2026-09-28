/**
 * EmptyList.js - Ro'yxat bo'sh bo'lganda ko'rsatiladigan xabar
 *
 * Xabar holatga qarab o'zgaradi: qidiruv natija bermadimi,
 * tanlangan kategoriya bo'shmi, "Bajarilgan" filtri bo'shmi
 * yoki umuman task yo'qmi.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors } from '../theme/colors';

/**
 * Holatga mos matnni tanlash.
 *
 * @param {string} filter - 'all' | 'active' | 'completed'
 * @param {string} query - Qidiruv so'zi
 * @param {Object} [category] - Tanlangan kategoriya (filtr bo'lmasa - null)
 * @returns {Object} - { emoji, title, subtitle }
 */
const getMessage = (filter, query, category) => {
  // 1) Qidiruv hech narsa topmadi
  if (query) {
    return {
      emoji: '🔍',
      title: 'Hech narsa topilmadi',
      subtitle: `"${query}" bo'yicha mos task yo'q.\nBoshqa so'z bilan qidirib ko'ring.`,
    };
  }

  // 2) Tanlangan kategoriyada mos task yo'q
  if (category) {
    const status =
      filter === 'active' ? 'faol ' : filter === 'completed' ? 'bajarilgan ' : '';

    return {
      emoji: category.icon,
      title: `"${category.label}" bo'sh`,
      subtitle: `Bu kategoriyada ${status}task yo'q.
"+" tugmasini bossangiz, yangi task shu kategoriyada ochiladi.`,
    };
  }

  // 3) Faol tasklar tugagan - bu yaxshi xabar!
  if (filter === 'active') {
    return {
      emoji: '🎉',
      title: 'Barcha ishlar bajarilgan',
      subtitle: 'Faol task qolmadi. Dam olsangiz ham bo\'ladi!',
    };
  }

  // 4) Hali bironta task bajarilmagan
  if (filter === 'completed') {
    return {
      emoji: '✅',
      title: 'Bajarilgan task yo\'q',
      subtitle: 'Taskni bajarganingizda chap tomondagi\nkatakchani belgilang.',
    };
  }

  // 5) Ilova endi ochilgan - umuman task yo'q
  return {
    emoji: '📋',
    title: 'Hozircha tasklar yo\'q',
    subtitle: 'Yangi task qo\'shish uchun pastdagi\n"+" tugmasini bosing.',
  };
};

/**
 * EmptyList komponenti
 *
 * @param {Object} props
 * @param {string} props.filter - Hozirgi filtr
 * @param {string} props.query - Hozirgi qidiruv so'zi
 * @param {Object} [props.category] - Tanlangan kategoriya (bo'lsa)
 */
const EmptyList = ({ filter = 'all', query = '', category = null }) => {
  const { emoji, title, subtitle } = getMessage(filter, query.trim(), category);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },

  emoji: {
    fontSize: 64,
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});

export default EmptyList;
