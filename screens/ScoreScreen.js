/**
 * ScoreScreen.js - Natijalar: ballar, daraja, seriya va yutuqlar
 *
 * Ekranda:
 * - daraja kartochkasi (jami ball, keyingi darajagacha qancha qolgani);
 * - qisqa ko'rsatkichlar: bugun, 7 kunda, seriya, kutilayotgan ballar;
 * - oxirgi 7 kun grafigi (ustunni bossangiz - o'sha kun ko'rinadi);
 * - kategoriyalar bo'yicha ballar;
 * - yutuqlar (nishonlar);
 * - "Qanday ishlaydi?" - qoidalar.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCategories } from '../hooks/useCategories';
import { colors, getCategoryColors } from '../theme/colors';
import { getAllTasks, getScoreBank } from '../storage/taskStorage';
import { findCategory } from '../utils/categoryUtils';
import { formatDate } from '../utils/taskUtils';
import {
  formatPoints,
  getAchievements,
  getLevel,
  getScoreSummary,
  ON_TIME_BONUS_RATE,
} from '../utils/pointsUtils';

// Grafik ustunlarining eng katta balandligi
const CHART_HEIGHT = 120;

/**
 * Ingichka progress chizig'i.
 *
 * @param {Object} props
 * @param {number} props.value - 0..1
 * @param {string} props.color - To'ldirish rangi
 * @param {string} [props.track] - Fon rangi
 */
const Progress = ({ value, color, track = colors.surfaceAlt }) => (
  <View style={[styles.track, { backgroundColor: track }]}>
    <View
      style={[
        styles.trackFill,
        { backgroundColor: color, width: `${Math.min(Math.max(value, 0), 1) * 100}%` },
      ]}
    />
  </View>
);

/**
 * Bitta ko'rsatkich kartochkasi.
 */
const StatTile = ({ icon, label, value, hint }) => (
  <View style={styles.tile}>
    <Text style={styles.tileLabel}>
      {icon} {label}
    </Text>
    <Text style={styles.tileValue}>{value}</Text>
    {hint ? <Text style={styles.tileHint}>{hint}</Text> : null}
  </View>
);

/**
 * Bo'lim sarlavhasi.
 */
const SectionTitle = ({ children, right }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{children}</Text>
    {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
  </View>
);

/**
 * ScoreScreen komponenti
 */
const ScoreScreen = () => {
  const insets = useSafeAreaInsets();

  const [tasks, setTasks] = useState([]);
  const [bank, setBank] = useState(null);
  const [categories] = useCategories();

  // Grafikda tanlangan kun (standart - bugun)
  const [selectedDay, setSelectedDay] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([getAllTasks(), getScoreBank()]).then(([list, saved]) => {
        if (!active) return;
        setTasks(list);
        setBank(saved);
      });

      return () => {
        active = false;
      };
    }, [])
  );

  const summary = useMemo(
    () => getScoreSummary(tasks, bank, { categories }),
    [tasks, bank, categories]
  );
  const achievements = useMemo(() => getAchievements(summary), [summary]);

  // Bank hali o'qilmagan - bir lahza kutamiz
  if (!bank) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { level } = summary;
  const nextLevel = getLevel(level.next);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Grafik
  const maxDay = Math.max(...summary.lastWeek.map((d) => d.points), 1);
  const selected =
    summary.lastWeek.find((d) => d.day === selectedDay) ||
    summary.lastWeek[summary.lastWeek.length - 1];

  // Kategoriyalar - ko'pidan oziga
  const categoryRows = Object.keys(summary.byCategory)
    .map((key) => ({ category: findCategory(categories, key), points: summary.byCategory[key] }))
    .sort((a, b) => b.points - a.points);
  const maxCategory = categoryRows.length ? categoryRows[0].points : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== Daraja kartochkasi ===== */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroIcon}>{level.icon}</Text>
          </View>

          <View style={styles.heroTitleBox}>
            <Text style={styles.heroLevel}>{level.level}-DARAJA</Text>
            <Text style={styles.heroTitle}>{level.title}</Text>
          </View>
        </View>

        <Text style={styles.heroTotal}>
          {formatPoints(summary.total)}
          <Text style={styles.heroUnit}> ball</Text>
        </Text>

        <Progress
          value={level.progress}
          color={colors.gold}
          track="rgba(255,255,255,0.22)"
        />

        <Text style={styles.heroHint}>
          Keyingi darajagacha {formatPoints(level.toNext)} ball →{' '}
          {nextLevel.icon} {nextLevel.title}
        </Text>
      </View>

      {/* ===== Ko'rsatkichlar ===== */}
      <View style={styles.tiles}>
        <StatTile
          icon="☀️"
          label="Bugun"
          value={`+${formatPoints(summary.today)}`}
          hint={summary.today > 0 ? 'Yaxshi kun!' : 'Hali boshlanmadi'}
        />
        <StatTile
          icon="📈"
          label="7 kunda"
          value={formatPoints(summary.week)}
          hint={`Kunlik rekord: ${formatPoints(summary.bestDay)}`}
        />
        <StatTile
          icon="🔥"
          label="Seriya"
          value={`${summary.streak} kun`}
          hint={
            summary.streak > 0 && !summary.streakToday
              ? 'Bugun bitta task bajaring!'
              : `Rekord: ${summary.bestStreak} kun`
          }
        />
        <StatTile
          icon="⭐"
          label="Kutilmoqda"
          value={formatPoints(summary.potential)}
          hint={`${summary.activeCount} ta faol taskda`}
        />
      </View>

      {/* ===== Oxirgi 7 kun ===== */}
      <View style={styles.card}>
        <SectionTitle right={`${formatPoints(summary.week)} ball`}>Oxirgi 7 kun</SectionTitle>

        <Text style={styles.chartCaption}>
          {selected.isToday ? 'Bugun' : formatDate(selected.day)}:{' '}
          <Text style={styles.chartCaptionValue}>{formatPoints(selected.points)} ball</Text>
        </Text>

        <View style={styles.chart}>
          {summary.lastWeek.map((day) => {
            const isSelected = day.day === selected.day;
            const height = day.points > 0 ? Math.max((day.points / maxDay) * CHART_HEIGHT, 6) : 2;

            return (
              <TouchableOpacity
                key={day.day}
                style={styles.barColumn}
                onPress={() => setSelectedDay(day.day)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${day.weekday}, ${day.date}: ${day.points} ball`}
              >
                <View style={styles.barArea}>
                  <View
                    style={[
                      styles.bar,
                      { height },
                      day.points === 0 && styles.barEmpty,
                      isSelected && day.points > 0 && styles.barSelected,
                    ]}
                  />
                </View>

                <Text style={[styles.barLabel, isSelected && styles.barLabelSelected]}>
                  {day.weekday}
                </Text>
                <Text style={[styles.barDate, isSelected && styles.barLabelSelected]}>
                  {day.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ===== Kategoriyalar ===== */}
      {categoryRows.length > 0 ? (
        <View style={styles.card}>
          <SectionTitle>Kategoriyalar bo'yicha</SectionTitle>

          {categoryRows.map(({ category, points }) => {
            const palette = getCategoryColors(category);

            return (
              <View key={category.key} style={styles.categoryRow}>
                <View style={styles.categoryLine}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category.icon} {category.label}
                  </Text>
                  <Text style={styles.categoryPoints}>{formatPoints(points)}</Text>
                </View>
                <Progress value={points / maxCategory} color={palette.color} />
              </View>
            );
          })}
        </View>
      ) : null}

      {/* ===== Yutuqlar ===== */}
      <View style={styles.card}>
        <SectionTitle right={`${unlockedCount}/${achievements.length}`}>🏅 Yutuqlar</SectionTitle>

        <View style={styles.badges}>
          {achievements.map((achievement) => (
            <View
              key={achievement.key}
              style={[styles.badge, achievement.unlocked && styles.badgeUnlocked]}
              accessible
              accessibilityLabel={`${achievement.title}. ${achievement.description}. ${
                achievement.unlocked
                  ? 'Ochilgan'
                  : `${achievement.current} / ${achievement.target}`
              }`}
            >
              <Text style={[styles.badgeIcon, !achievement.unlocked && styles.badgeIconLocked]}>
                {achievement.icon}
              </Text>
              <Text style={styles.badgeTitle} numberOfLines={1}>
                {achievement.title}
              </Text>
              <Text style={styles.badgeDescription} numberOfLines={2}>
                {achievement.description}
              </Text>

              {achievement.unlocked ? (
                <Text style={styles.badgeDone}>✓ Ochildi</Text>
              ) : (
                <View style={styles.badgeProgress}>
                  <Progress value={achievement.progress} color={colors.gold} />
                  <Text style={styles.badgeCount}>
                    {formatPoints(achievement.current)}/{formatPoints(achievement.target)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* ===== Qoidalar ===== */}
      <View style={styles.card}>
        <SectionTitle>Qanday ishlaydi?</SectionTitle>

        {[
          ['⭐', "Har bir taskka ball bering: qanchalik og'ir bo'lsa - shuncha ko'p."],
          ['✅', 'Taskni bajarganingizda ball hisobingizga qo\'shiladi.'],
          [
            '⚡',
            `Muddatida (yoki oldinroq) bajarsangiz +${ON_TIME_BONUS_RATE * 100}% bonus.`,
          ],
          ['🔥', 'Har kuni kamida bitta task bajarsangiz, seriya o\'sib boradi.'],
          ['🚀', "Ballar yig'ilib darajangiz oshadi: Boshlovchidan Afsonagacha."],
          ['🗑️', "Bajarilgan taskni o'chirsangiz ham, balli saqlanib qoladi."],
        ].map(([icon, text]) => (
          <View key={icon} style={styles.ruleRow}>
            <Text style={styles.ruleIcon}>{icon}</Text>
            <Text style={styles.ruleText}>{text}</Text>
          </View>
        ))}

        <Text style={styles.footnote}>
          Jami bajarilgan: {summary.completedCount} ta · muddatida: {summary.onTimeCount} ta
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 16,
    gap: 14,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  // ===== Progress =====
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  trackFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ===== Daraja kartochkasi =====
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  heroIcon: {
    fontSize: 28,
  },

  heroTitleBox: {
    flex: 1,
  },

  heroLevel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.gold,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textInverse,
  },

  heroTotal: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textInverse,
    marginTop: 14,
    marginBottom: 10,
  },

  heroUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },

  heroHint: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },

  // ===== Ko'rsatkichlar =====
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  tile: {
    // Ikki ustun: (100% - oraliq) / 2
    width: '48.4%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
  },

  tileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  tileValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },

  tileHint: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 2,
  },

  // ===== Umumiy kartochka =====
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  sectionRight: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },

  // ===== Grafik =====
  chartCaption: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
  },

  chartCaptionValue: {
    fontWeight: '800',
    color: colors.text,
  },

  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  barColumn: {
    flex: 1,
    alignItems: 'center',
  },

  barArea: {
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  bar: {
    width: '58%',
    maxWidth: 30,
    backgroundColor: colors.primaryLight,
    // Faqat yuqori burchaklar yumaloq - ustun asosga "o'tirgan"
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  barEmpty: {
    backgroundColor: colors.surfaceAlt,
  },

  barSelected: {
    backgroundColor: colors.primary,
  },

  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 6,
  },

  barDate: {
    fontSize: 10,
    color: colors.textSubtle,
  },

  barLabelSelected: {
    color: colors.primary,
    fontWeight: '800',
  },

  // ===== Kategoriyalar =====
  categoryRow: {
    marginBottom: 12,
  },

  categoryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },

  categoryPoints: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginLeft: 8,
  },

  // ===== Yutuqlar =====
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  badge: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
    backgroundColor: colors.background,
    padding: 12,
    alignItems: 'center',
  },

  badgeUnlocked: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSurface,
  },

  badgeIcon: {
    fontSize: 30,
    marginBottom: 6,
  },

  badgeIconLocked: {
    opacity: 0.3,
  },

  badgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  badgeDescription: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    minHeight: 28,
  },

  badgeDone: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.goldDark,
    marginTop: 8,
  },

  badgeProgress: {
    alignSelf: 'stretch',
    marginTop: 8,
  },

  badgeCount: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  // ===== Qoidalar =====
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  ruleIcon: {
    fontSize: 16,
    width: 30,
  },

  ruleText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },

  footnote: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 4,
  },
});

export default ScoreScreen;
