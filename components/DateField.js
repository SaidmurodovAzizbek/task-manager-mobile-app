/**
 * DateField.js - Muddat kiritish maydoni
 *
 * Eski versiyada foydalanuvchi "2026-12-31" ni qo'lda yozishi kerak edi,
 * lekin telefonning raqamli klaviaturasida "-" belgisi yo'q - ya'ni
 * sanani kiritishning iloji yo'q edi.
 *
 * Endi:
 * - foydalanuvchi faqat raqam yozadi, chiziqchani ilova qo'yadi;
 * - eng kerakli sanalar uchun tayyor tugmalar bor (Bugun, Ertaga, ...).
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { colors } from '../theme/colors';
import { addDays, formatDeadline, maskDateInput, todayString } from '../utils/taskUtils';

/**
 * Tayyor sana tugmalari.
 * `getValue` funksiyasi bosilganda qaysi sana qo'yilishini aniqlaydi.
 */
const QUICK_DATES = [
  { label: 'Bugun', getValue: () => todayString() },
  { label: 'Ertaga', getValue: () => addDays(1) },
  { label: 'Bir hafta', getValue: () => addDays(7) },
];

/**
 * DateField komponenti
 *
 * @param {Object} props
 * @param {string} props.value - Hozirgi qiymat ("YYYY-MM-DD" yoki bo'sh)
 * @param {Function} props.onChange - Qiymat o'zgarganda (matn)
 * @param {string} props.error - Xatolik matni (bo'lsa)
 */
const DateField = ({ value, onChange, error }) => {
  // Kiritilgan sana to'liq va to'g'ri bo'lsa - pastda izohini ko'rsatamiz
  const preview = value && value.length === 10 && !error ? formatDeadline(value) : null;

  return (
    <View>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder="YYYY-MM-DD (masalan: 2026-12-31)"
        placeholderTextColor={colors.textSubtle}
        value={value}
        // Har bir bosishda matnni formatlab beramiz
        onChangeText={(text) => onChange(maskDateInput(text))}
        keyboardType="number-pad"
        maxLength={10}
        accessibilityLabel="Muddat sanasi"
      />

      {/* Tez tanlash tugmalari */}
      <View style={styles.quickRow}>
        {QUICK_DATES.map((quick) => {
          const quickValue = quick.getValue();
          const selected = value === quickValue;

          return (
            <TouchableOpacity
              key={quick.label}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(quickValue)}
              accessibilityRole="button"
              accessibilityLabel={`Muddat: ${quick.label}`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {quick.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Sana kiritilgan bo'lsa - tozalash tugmasi */}
        {value ? (
          <TouchableOpacity
            style={styles.chip}
            onPress={() => onChange('')}
            accessibilityRole="button"
            accessibilityLabel="Muddatni olib tashlash"
          >
            <Text style={styles.chipClear}>✕ Tozalash</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Xatolik yoki tushunarli izoh */}
      {error ? (
        <Text style={styles.errorText}>⚠️ {error}</Text>
      ) : preview ? (
        <Text style={styles.previewText}>📅 {preview}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },

  inputError: {
    borderColor: colors.danger,
  },

  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  chipSelected: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primary,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  chipTextSelected: {
    color: colors.primary,
  },

  chipClear: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },

  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },

  previewText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
});

export default DateField;
