/**
 * EmptyList.js - Task yo'q bo'lganda ko'rsatiladigan komponent
 * 
 * Bu komponent ro'yxat bo'sh bo'lganda foydalanuvchiga 
 * chiroyli xabar ko'rsatadi. Jira uslubida oddiy va zamonaviy.
 */

import React from 'react';
import {
  View,       // Konteyner (quti) yaratish
  Text,       // Matn ko'rsatish
  StyleSheet, // Stillar yaratish
} from 'react-native';

/**
 * EmptyList komponenti
 * 
 * Hech qanday prop (parametr) olmaydi.
 * Faqat chiroyli xabar ko'rsatadi.
 */
const EmptyList = () => {
  return (
    // Asosiy konteyner - ekranning markaziga joylashadi
    <View style={styles.container}>
      {/* Katta emoji - vizual ko'rinish uchun */}
      <Text style={styles.emoji}>📋</Text>

      {/* Asosiy sarlavha */}
      <Text style={styles.title}>Hozircha tasklar yo'q</Text>

      {/* Qo'shimcha tushuntirish */}
      <Text style={styles.subtitle}>
        Yangi task qo'shish uchun pastdagi {'\n'}
        "+" tugmasini bosing
      </Text>
    </View>
  );
};

// Stillar
const styles = StyleSheet.create({
  // Asosiy konteyner - vertikal markazlash
  container: {
    flex: 1,                     // Barcha bo'sh joyni egallaydi
    justifyContent: 'center',    // Vertikal markaz
    alignItems: 'center',        // Gorizontal markaz
    paddingHorizontal: 40,       // Yon tomondan 40px bo'shliq
    paddingTop: 80,              // Yuqoridan 80px bo'shliq
  },

  // Emoji stili
  emoji: {
    fontSize: 72,                // Katta emoji
    marginBottom: 20,            // Pastdan 20px bo'shliq
  },

  // Sarlavha stili
  title: {
    fontSize: 22,                // Katta shrift
    fontWeight: '700',           // Qalin (bold)
    color: '#172B4D',            // Jira'ning quyuq ko'k rangi
    marginBottom: 12,            // Pastdan 12px bo'shliq
    textAlign: 'center',         // Markazga tekislash
  },

  // Qo'shimcha matn stili
  subtitle: {
    fontSize: 15,                // O'rtacha shrift
    color: '#6B778C',            // Kulrang rang
    textAlign: 'center',         // Markazga tekislash
    lineHeight: 22,              // Qatorlar orasidagi masofa
  },
});

// Komponentni eksport qilish (boshqa fayllardan ishlatish uchun)
export default EmptyList;
