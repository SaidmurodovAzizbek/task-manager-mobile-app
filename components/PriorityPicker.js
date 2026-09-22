/**
 * PriorityPicker.js - Ustuvorlik tanlash tugmalari
 *
 * Uchta variant yonma-yon turadi: Yuqori / O'rta / Past.
 * Tanlangani o'z rangiga bo'yaladi.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { colors, PRIORITIES } from '../theme/colors';

/**
 * PriorityPicker komponenti
 *
 * @param {Object} props
 * @param {string} props.value - Tanlangan ustuvorlik kaliti
 * @param {Function} props.onChange - Tanlov o'zgarganda (key)
 * @param {boolean} props.showDescription - Qisqa izoh ko'rsatilsinmi
 */
const PriorityPicker = ({ value, onChange, showDescription = true }) => (
  <View style={styles.container}>
    {PRIORITIES.map((priority) => {
      const selected = value === priority.key;

      return (
        <TouchableOpacity
          key={priority.key}
          style={[
            styles.option,
            // Tanlangan variant o'z rangiga bo'yaladi
            selected && {
              backgroundColor: priority.bgColor,
              borderColor: priority.color,
            },
          ]}
          onPress={() => onChange(priority.key)}
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{ selected }}
          accessibilityLabel={`${priority.label} ustuvorlik`}
        >
          <Text style={styles.icon}>{priority.icon}</Text>

          <Text
            style={[
              styles.label,
              selected && { color: priority.color, fontWeight: '700' },
            ]}
          >
            {priority.label}
          </Text>

          {showDescription && (
            <Text style={styles.description}>{priority.description}</Text>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },

  option: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },

  icon: {
    fontSize: 20,
    marginBottom: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },

  description: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default PriorityPicker;
