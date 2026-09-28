/**
 * CategoryFilterBar.js - Bosh ekrandagi kategoriya filtri
 *
 * Yonga suriladigan (gorizontal) tugmachalar qatori:
 *     Hammasi (12) | 💼 Ish 4 | 🏠 Oilaviy 2 | ... | ⚙️
 *
 * Har bir tugmachada shu kategoriyadagi tasklar soni turadi. Oxiridagi
 * "⚙️" tugmasi kategoriyalarni boshqarish ekranini ochadi.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import { colors, getCategoryColors } from '../theme/colors';

/**
 * CategoryFilterBar komponenti
 *
 * @param {Object} props
 * @param {Array} props.categories - To'liq kategoriyalar ro'yxati
 * @param {string} props.value - 'all' yoki tanlangan kategoriya kaliti
 * @param {Object} props.counts - { kategoriyaKaliti: son }
 * @param {number} props.total - "Hammasi" yonidagi son
 * @param {Function} props.onChange - Tanlov o'zgarganda (key)
 * @param {Function} props.onManage - "⚙️" bosilganda
 */
const CategoryFilterBar = ({ categories, value, counts, total, onChange, onManage }) => {
  const allSelected = value === 'all';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={[styles.chip, allSelected && styles.chipAllSelected]}
        onPress={() => onChange('all')}
        accessibilityRole="tab"
        accessibilityState={{ selected: allSelected }}
        accessibilityLabel={`Barcha kategoriyalar: ${total} ta task`}
      >
        <Text style={[styles.label, allSelected && styles.labelAllSelected]}>
          Hammasi
        </Text>
        <Text style={[styles.count, allSelected && styles.countAllSelected]}>
          {total}
        </Text>
      </TouchableOpacity>

      {categories.map((category) => {
        const selected = value === category.key;
        const count = counts[category.key] || 0;
        const palette = getCategoryColors(category);

        return (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.chip,
              // Bo'sh kategoriyalar xiraroq - ko'z tasklari borlariga tushsin
              count === 0 && !selected && styles.chipEmpty,
              selected && { backgroundColor: palette.color, borderColor: palette.color },
            ]}
            onPress={() => onChange(selected ? 'all' : category.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${category.label}: ${count} ta task`}
          >
            <Text style={styles.icon}>{category.icon}</Text>
            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {category.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: selected ? 'rgba(255,255,255,0.25)' : palette.bgColor },
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,
                  { color: selected ? colors.textInverse : palette.color },
                ]}
              >
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.chip, styles.manageChip]}
        onPress={onManage}
        accessibilityRole="button"
        accessibilityLabel="Kategoriyalarni boshqarish"
      >
        <Text style={styles.manageText}>⚙️</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    alignItems: 'center',
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 200,
  },

  chipEmpty: {
    opacity: 0.6,
  },

  chipAllSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },

  icon: {
    fontSize: 13,
    marginRight: 5,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },

  labelSelected: {
    color: colors.textInverse,
  },

  labelAllSelected: {
    color: colors.textInverse,
  },

  count: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 6,
  },

  countAllSelected: {
    color: 'rgba(255,255,255,0.75)',
  },

  countBadge: {
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
    alignItems: 'center',
  },

  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  manageChip: {
    paddingHorizontal: 10,
  },

  manageText: {
    fontSize: 14,
  },
});

export default CategoryFilterBar;
