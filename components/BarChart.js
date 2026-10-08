/**
 * BarChart.js - Oddiy (yoki qatlamli) ustunli grafik
 *
 *       12 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
 *                    ▆▆
 *           ▂▂  ▄▄   ██       ▆▆
 *           ██  ██   ██  ▂▂   ██
 *          ─────────────────────────
 *           Du  Se   Ch  Pa   Ju
 *
 * Kutubxonasiz - oddiy View'lardan. Har bir ustun bir nechta bo'lakdan
 * iborat bo'lishi mumkin (masalan: muddatida / kechikkan / muddatsiz),
 * bo'laklar orasida 2px oraliq qoladi. Ustunni bosganda onSelect chaqiriladi,
 * tanlangan ustun orqasida och fon paydo bo'ladi.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { colors } from '../theme/colors';

// Bo'laklar orasidagi oraliq
const GAP = 2;

/**
 * BarChart komponenti
 *
 * @param {Object} props
 * @param {Array} props.data - [{ key, label, showLabel, a11y, segments: [{ value, color }] }]
 *   segments - pastdan yuqoriga tartibda
 * @param {string} [props.selectedKey] - Tanlangan ustun
 * @param {Function} [props.onSelect] - (key) => void
 * @param {number} [props.height] - Grafik balandligi
 * @param {Function} [props.formatMax] - Tepadagi chiziq yozuvi uchun
 */
const BarChart = ({ data, selectedKey, onSelect, height = 120, formatMax = String }) => {
  const totals = data.map((item) => item.segments.reduce((sum, s) => sum + s.value, 0));
  const max = Math.max(...totals, 0);

  return (
    <View>
      {/* Eng katta qiymat chizig'i - o'qni almashtiradi */}
      <View style={styles.maxLine}>
        <Text style={styles.maxText}>{max > 0 ? formatMax(max) : ''}</Text>
        <View style={styles.maxRule} />
      </View>

      <View style={styles.row}>
        {data.map((item, index) => {
          const total = totals[index];
          const isSelected = item.key === selectedKey;
          const visible = item.segments.filter((s) => s.value > 0);

          // Kichik qiymat ham ko'rinib tursin
          const barHeight = total > 0 ? Math.max((total / max) * height, 4) : 0;
          const usable = Math.max(barHeight - GAP * (visible.length - 1), visible.length);

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.column}
              onPress={onSelect ? () => onSelect(item.key) : undefined}
              disabled={!onSelect}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.a11y}
            >
              <View
                style={[styles.area, { height }, isSelected && styles.areaSelected]}
              >
                {total > 0 ? (
                  <View style={[styles.bar, { height: barHeight }]}>
                    {/* column-reverse: birinchi bo'lak pastda */}
                    {visible.map((segment, i) => (
                      <View
                        key={i}
                        style={[
                          styles.segment,
                          {
                            backgroundColor: segment.color,
                            height: Math.max((segment.value / total) * usable, 1),
                          },
                          i > 0 && styles.segmentGap,
                          i === visible.length - 1 && styles.segmentTop,
                        ]}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.empty} />
                )}
              </View>

              <View style={styles.labelBox}>
                {item.showLabel !== false ? (
                  <Text
                    style={[styles.label, isSelected && styles.labelSelected]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  maxLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  maxText: {
    fontSize: 10,
    color: colors.textSubtle,
    marginRight: 6,
    minWidth: 12,
  },

  maxRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceAlt,
  },

  row: {
    flexDirection: 'row',
  },

  column: {
    flex: 1,
    alignItems: 'center',
    // Yozuv ustundan kengroq bo'lsa ham kesilmasin
    overflow: 'visible',
  },

  area: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  areaSelected: {
    backgroundColor: colors.primarySurface,
  },

  bar: {
    width: '62%',
    maxWidth: 28,
    minWidth: 3,
    flexDirection: 'column-reverse',
  },

  segment: {
    width: '100%',
  },

  segmentGap: {
    marginBottom: GAP,
  },

  // Faqat eng yuqori bo'lak yumaloq - ustun asosga "o'tirgan"
  segmentTop: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  empty: {
    width: '62%',
    maxWidth: 28,
    height: 2,
    backgroundColor: colors.surfaceAlt,
  },

  labelBox: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },

  label: {
    // Ustun ingichka bo'lsa ham yozuv bir qatorda, markazda turadi
    width: 48,
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textMuted,
  },

  labelSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
});

export default memo(BarChart);
