/**
 * CategoryPicker.js - Task formasida kategoriya tanlash
 *
 * Barcha kategoriyalar tugmacha (chip) bo'lib turadi. Tanlangani o'z
 * rangiga bo'yaladi. Oxirida "+ Yangi" tugmasi - kerakli kategoriya
 * bo'lmasa, formadan chiqmasdan shu yerning o'zida qo'shsa bo'ladi.
 * Yangi kategoriya saqlanadi va darhol tanlanadi.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import CategoryDialog from './CategoryDialog';
import { colors, getCategoryColors } from '../theme/colors';
import { addCategory } from '../storage/taskStorage';

/**
 * CategoryPicker komponenti
 *
 * @param {Object} props
 * @param {Array} props.categories - To'liq kategoriyalar ro'yxati
 * @param {string} props.value - Tanlangan kategoriya kaliti
 * @param {Function} props.onChange - Tanlov o'zgarganda (key)
 * @param {Function} props.onCategoriesChange - Yangi kategoriya qo'shilganda (to'liq ro'yxat)
 */
const CategoryPicker = ({ categories, value, onChange, onCategoriesChange }) => {
  const [dialogVisible, setDialogVisible] = useState(false);

  /**
   * Yangi kategoriyani saqlash va darhol tanlash.
   *
   * @param {Object} values - { label, icon, color }
   */
  const handleCreate = async (values) => {
    const { category, categories: updated } = await addCategory(values);

    onCategoriesChange(updated);
    onChange(category.key);
    setDialogVisible(false);
  };

  return (
    <View>
      <View style={styles.container}>
        {categories.map((category) => {
          const selected = value === category.key;
          const palette = getCategoryColors(category);

          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.chip,
                selected && {
                  backgroundColor: palette.bgColor,
                  borderColor: palette.color,
                },
              ]}
              onPress={() => onChange(category.key)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Kategoriya: ${category.label}`}
            >
              <Text style={styles.icon}>{category.icon}</Text>
              <Text
                style={[
                  styles.label,
                  selected && { color: palette.color, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.chip, styles.addChip]}
          onPress={() => setDialogVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Yangi kategoriya qo'shish"
        >
          <Text style={styles.addText}>＋ Yangi</Text>
        </TouchableOpacity>
      </View>

      <CategoryDialog
        visible={dialogVisible}
        categories={categories}
        onClose={() => setDialogVisible(false)}
        onSubmit={handleCreate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: '100%',
  },

  icon: {
    fontSize: 14,
    marginRight: 5,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },

  addChip: {
    borderStyle: 'dashed',
    borderColor: colors.primaryLight,
    backgroundColor: colors.primarySurface,
  },

  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default CategoryPicker;
