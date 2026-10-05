/**
 * LevelBar.js - Bosh ekran header'idagi daraja paneli
 *
 *     ┌──────────────────────────────────────────────┐
 *     │ 🚀  5-daraja · Uddaburon        1 240 ⭐  🔥3 │
 *     │     ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░                      │
 *     └──────────────────────────────────────────────┘
 *
 * Bosilganda "Natijalar" ekrani ochiladi.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { colors } from '../theme/colors';
import { formatPoints } from '../utils/pointsUtils';

/**
 * LevelBar komponenti
 *
 * @param {Object} props
 * @param {Object} props.summary - getScoreSummary natijasi
 * @param {Function} props.onPress - Bosilganda
 */
const LevelBar = ({ summary, onPress }) => {
  const { level, total, streak, streakToday } = summary;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${level.level}-daraja, ${level.title}. Jami ${total} ball. Seriya: ${streak} kun. Natijalarni ochish.`}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{level.icon}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.levelText} numberOfLines={1}>
          {level.level}-daraja · {level.title}
        </Text>

        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              // Juda kichik progress ham ko'rinib tursin
              { width: `${Math.max(level.progress * 100, 3)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.points}>{formatPoints(total)} ⭐</Text>

        {streak > 0 ? (
          // Bugun hali task bajarilmagan bo'lsa - seriya "xavf ostida", xira ko'rinadi
          <View style={[styles.streak, !streakToday && styles.streakPending]}>
            <Text style={styles.streakText}>🔥{streak}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },

  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  icon: {
    fontSize: 17,
  },

  middle: {
    flex: 1,
    marginRight: 10,
  },

  levelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: 5,
  },

  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },

  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.gold,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  points: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textInverse,
  },

  streak: {
    backgroundColor: 'rgba(255,171,0,0.28)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  streakPending: {
    opacity: 0.55,
  },

  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
  },
});

export default memo(LevelBar);
