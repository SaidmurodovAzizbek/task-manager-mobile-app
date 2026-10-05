/**
 * PointsPicker.js - Taskga ball (qiyinlik) berish
 *
 *     🌱 5    ⭐ 10    🔥 25    💎 50    🏆 100
 *     Oson   Oddiy   Jiddiy   Qiyin    Epik
 *
 *     Boshqa son:   [ − ]  [ 35 ]  [ + ]
 *
 *     🏅 Bajarsangiz: 35 ball · muddatida bo'lsa +9 bonus ⚡
 *
 * Tez tugmalar bilan bir bosishda tanlanadi, kerak bo'lsa istalgan
 * son (1-999) qo'lda yoziladi yoki −/+ bilan 5 talab o'zgartiriladi.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

import { colors } from '../theme/colors';
import { POINTS_MAX, POINTS_MIN } from '../utils/taskUtils';
import { getOnTimeBonus, POINT_PRESETS } from '../utils/pointsUtils';

// −/+ tugmalari qadami
const STEP = 5;

/**
 * PointsPicker komponenti
 *
 * @param {Object} props
 * @param {string} props.value - Ball (matn ko'rinishida - yozish paytida bo'sh bo'lishi mumkin)
 * @param {Function} props.onChange - Yangi qiymat (matn)
 * @param {string} [props.error] - Xatolik matni
 * @param {boolean} [props.hasDeadline] - Muddat qo'yilganmi (bonus haqida aytish uchun)
 * @param {boolean} [props.suggested] - Ball ustuvorlikka qarab avtomatik tanlanganmi
 */
const PointsPicker = ({ value, onChange, error, hasDeadline, suggested }) => {
  const number = Number(value);
  const valid = Number.isInteger(number) && number >= POINTS_MIN && number <= POINTS_MAX;

  /**
   * −/+ bosilganda: 5 ga karrali qiymatga "yopishadi" (12 → 15 → 20).
   *
   * @param {number} direction - 1 yoki -1
   */
  const step = (direction) => {
    const current = valid ? number : 0;
    const next =
      direction > 0
        ? Math.floor(current / STEP) * STEP + STEP
        : Math.ceil(current / STEP) * STEP - STEP;

    onChange(String(Math.min(Math.max(next, POINTS_MIN), POINTS_MAX)));
  };

  return (
    <View>
      {/* Tez tanlash tugmalari */}
      <View style={styles.presets}>
        {POINT_PRESETS.map((preset) => {
          const selected = valid && number === preset.value;

          return (
            <TouchableOpacity
              key={preset.value}
              style={[styles.preset, selected && styles.presetSelected]}
              onPress={() => onChange(String(preset.value))}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${preset.label}: ${preset.value} ball`}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <Text style={[styles.presetValue, selected && styles.presetValueSelected]}>
                {preset.value}
              </Text>
              <Text
                style={[styles.presetLabel, selected && styles.presetLabelSelected]}
                numberOfLines={1}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Istalgan son */}
      <View style={styles.customRow}>
        <Text style={styles.customLabel}>Boshqa son:</Text>

        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => step(-1)}
            disabled={valid && number <= POINTS_MIN}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${STEP} ball kamaytirish`}
          >
            <Text style={styles.stepText}>−</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={value}
            // Faqat raqamlar
            onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={String(POINTS_MAX).length}
            placeholder="10"
            placeholderTextColor={colors.textSubtle}
            selectTextOnFocus
            accessibilityLabel="Ball"
          />

          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => step(1)}
            disabled={valid && number >= POINTS_MAX}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${STEP} ball qo'shish`}
          >
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

      {/* Bajarilsa nima olinadi - oldindan ko'rsatamiz */}
      {valid ? (
        <View style={styles.preview}>
          <Text style={styles.previewText}>
            🏅 Bajarsangiz: <Text style={styles.previewStrong}>{number} ball</Text>
            {hasDeadline
              ? ` · muddatida bo'lsa +${getOnTimeBonus(number)} bonus ⚡`
              : ' · muddat qo\'ysangiz, vaqtida bajarishga +25% bonus'}
          </Text>
          {suggested ? (
            <Text style={styles.previewHint}>✨ Ustuvorlikka qarab tanlandi</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  presets: {
    flexDirection: 'row',
    gap: 6,
  },

  preset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  presetSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSurface,
  },

  presetIcon: {
    fontSize: 18,
    marginBottom: 4,
  },

  presetValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  presetValueSelected: {
    color: colors.goldDark,
  },

  presetLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },

  presetLabelSelected: {
    color: colors.goldDark,
    fontWeight: '700',
  },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  customLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: -2,
  },

  input: {
    width: 72,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },

  inputError: {
    borderColor: colors.danger,
  },

  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },

  preview: {
    marginTop: 12,
    backgroundColor: colors.goldSurface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  previewText: {
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
  },

  previewStrong: {
    fontWeight: '800',
    color: colors.goldDark,
  },

  previewHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});

export default PointsPicker;
