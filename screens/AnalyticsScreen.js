/**
 * AnalyticsScreen.js - Analitika: tanlangan davrda nima qilindi
 *
 * Yuqorida davr tanlanadi: Hafta / Oy / 3 oy / 6 oy / Yil.
 * Pastdagi hamma narsa shu davr bo'yicha:
 * - asosiy ko'rsatkichlar (bajarildi, ball, muddatida %, faol kunlar)
 *   va oldingi xuddi shunday davr bilan solishtirish;
 * - qisqa xulosalar ("Eng samarali kuningiz - dushanba" kabi);
 * - dinamika grafigi: tasklar (muddatida / kechikkan / muddatsiz) yoki ballar;
 * - muddat bo'yicha taqsimot;
 * - muhimlik bo'yicha jadval;
 * - kategoriyalar bo'yicha;
 * - hafta kunlari bo'yicha faollik.
 *
 * Hisob-kitob - utils/analyticsUtils.js da.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import BarChart from '../components/BarChart';
import { useCategories } from '../hooks/useCategories';
import { colors, getCategoryColors, getPriority } from '../theme/colors';
import { getAllTasks, getScoreBank, getSettings, saveSettings } from '../storage/taskStorage';
import { findCategory } from '../utils/categoryUtils';
import { formatPoints } from '../utils/pointsUtils';
import {
  ANALYTICS_PERIODS,
  DEFAULT_PERIOD,
  formatChange,
  formatDecimal,
  formatPercent,
  getAnalytics,
  getInsights,
  percentChange,
} from '../utils/analyticsUtils';

/** Muddat bo'yicha holatlar: rang va nom (grafik va taqsimot uchun) */
const TIMING = [
  { key: 'onTime', label: 'Muddatida', color: colors.chartOnTime },
  { key: 'late', label: 'Kechikkan', color: colors.chartLate },
  { key: 'noDeadline', label: 'Muddatsiz', color: colors.chartNone },
];

/** Dinamika grafigi: nima ko'rsatiladi */
const CHART_MODES = [
  { key: 'tasks', label: 'Tasklar' },
  { key: 'points', label: 'Ballar' },
];

// ---------------------------------------------------------------------------
// Kichik bo'laklar
// ---------------------------------------------------------------------------

/**
 * Segmentli tanlagich (davr, grafik turi).
 */
const Segmented = ({ options, value, onChange, small }) => (
  <View style={[styles.segmented, small && styles.segmentedSmall]}>
    {options.map((option) => {
      const active = option.key === value;

      return (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.segment,
            small ? styles.segmentSmall : styles.segmentFill,
            active && styles.segmentActive,
          ]}
          onPress={() => onChange(option.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
        >
          <Text
            style={[
              styles.segmentText,
              small && styles.segmentTextSmall,
              active && styles.segmentTextActive,
            ]}
            numberOfLines={1}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

/**
 * Oldingi davrga nisbatan o'zgarish: "▲ 25% · oldin 16".
 *
 * @param {Object} props
 * @param {number} props.current
 * @param {number} props.previous
 * @param {Function} [props.format] - Oldingi qiymatni yozish
 */
const Delta = ({ current, previous, format = String }) => {
  const change = percentChange(current, previous);

  if (change === null) {
    return <Text style={[styles.delta, styles.deltaUp]}>▲ yangi</Text>;
  }
  if (change === 0) {
    return <Text style={styles.delta}>= oldingi davrdek</Text>;
  }

  const up = change > 0;
  return (
    <Text style={[styles.delta, up ? styles.deltaUp : styles.deltaDown]}>
      {up ? '▲' : '▼'} {formatChange(change)}
      <Text style={styles.deltaMuted}> · oldin {format(previous)}</Text>
    </Text>
  );
};

/**
 * Muddatida % uchun o'zgarish - foiz punktlarda: "▲ 8 · oldin 67%".
 */
const RateDelta = ({ current, previous }) => {
  if (current === null) return <Text style={styles.delta}>Muddatli task yo'q</Text>;
  if (previous === null) return <Text style={styles.delta}>Oldin muddatli task yo'q edi</Text>;

  const diff = Math.round((current - previous) * 100);
  if (diff === 0) return <Text style={styles.delta}>= oldin ham {formatPercent(previous)}</Text>;

  const up = diff > 0;
  return (
    <Text style={[styles.delta, up ? styles.deltaUp : styles.deltaDown]}>
      {up ? '▲' : '▼'} {Math.abs(diff)}
      <Text style={styles.deltaMuted}> · oldin {formatPercent(previous)}</Text>
    </Text>
  );
};

/**
 * Bitta ko'rsatkich kartochkasi.
 */
const Kpi = ({ icon, label, value, children }) => (
  <View style={styles.kpi}>
    <Text style={styles.kpiLabel}>
      {icon} {label}
    </Text>
    <Text style={styles.kpiValue}>{value}</Text>
    {children}
  </View>
);

/**
 * Kartochka sarlavhasi.
 */
const CardTitle = ({ children, right }) => (
  <View style={styles.cardHeader}>
    <Text style={styles.cardTitle}>{children}</Text>
    {right}
  </View>
);

/**
 * Ingichka progress chizig'i.
 */
const Progress = ({ value, color }) => (
  <View style={styles.track}>
    <View
      style={[
        styles.trackFill,
        { backgroundColor: color, width: `${Math.min(Math.max(value, 0), 1) * 100}%` },
      ]}
    />
  </View>
);

/**
 * Rangli nuqta (legenda va jadval uchun).
 */
const Dot = ({ color }) => <View style={[styles.dot, { backgroundColor: color }]} />;

// ---------------------------------------------------------------------------
// Ekran
// ---------------------------------------------------------------------------

const AnalyticsScreen = () => {
  const insets = useSafeAreaInsets();

  const [tasks, setTasks] = useState([]);
  const [bank, setBank] = useState(null);
  const [categories] = useCategories();

  const [periodKey, setPeriodKey] = useState(DEFAULT_PERIOD);
  const [chartMode, setChartMode] = useState('tasks');
  // Grafikda tanlangan ustun (null - eng oxirgisi)
  const [selectedKey, setSelectedKey] = useState(null);

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

  // Oxirgi tanlangan davr eslab qolinadi
  useEffect(() => {
    let active = true;

    getSettings().then((settings) => {
      if (active && ANALYTICS_PERIODS.some((p) => p.key === settings.analyticsPeriod)) {
        setPeriodKey(settings.analyticsPeriod);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handlePeriodChange = (key) => {
    setPeriodKey(key);
    setSelectedKey(null);
    saveSettings({ analyticsPeriod: key });
  };

  const analytics = useMemo(
    () => getAnalytics(tasks, bank, { period: periodKey, categories }),
    [tasks, bank, periodKey, categories]
  );
  const insights = useMemo(() => getInsights(analytics, categories), [analytics, categories]);

  if (!bank) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { totals, previous, buckets, period, range } = analytics;

  // ===== Dinamika grafigi =====
  const selected = buckets.find((b) => b.key === selectedKey) || buckets[buckets.length - 1];
  const chartData = buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    showLabel: bucket.showLabel,
    a11y:
      chartMode === 'tasks'
        ? `${bucket.title}: ${bucket.completed} ta task, ${bucket.onTime} muddatida, ${bucket.late} kechikkan`
        : `${bucket.title}: ${bucket.points} ball`,
    segments:
      chartMode === 'tasks'
        ? TIMING.map((t) => ({ value: bucket[t.key], color: t.color }))
        : [{ value: bucket.points, color: colors.gold }],
  }));

  // ===== Hafta kunlari =====
  const bestWeekday = [...analytics.weekdays].sort(
    (a, b) => b.completed - a.completed || b.points - a.points
  )[0];
  const weekdayData = analytics.weekdays.map((day) => ({
    key: String(day.index),
    label: day.label,
    a11y: `${day.name}: ${day.completed} ta task`,
    segments: [
      {
        value: day.completed,
        color: day === bestWeekday ? colors.primary : colors.primaryLight,
      },
    ],
  }));

  const maxCategoryPoints = analytics.byCategory.length ? analytics.byCategory[0].points : 1;
  const isEmpty = totals.completed === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== Davr ===== */}
      <Segmented options={ANALYTICS_PERIODS} value={period.key} onChange={handlePeriodChange} />
      <Text style={styles.range}>
        {period.title} · {range.label}
      </Text>

      {!analytics.hasAnyData ? (
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Hali ma'lumot yo'q</Text>
          <Text style={styles.emptyText}>
            Tasklarni bajarib boring - bu yerda qancha ish qilganingiz, nechtasi
            muddatida bo'lgani va ballaringiz qanday o'sayotgani ko'rinadi.
          </Text>
        </View>
      ) : (
        <>
          {/* ===== Ko'rsatkichlar ===== */}
          <View style={styles.kpis}>
            <Kpi icon="✅" label="Bajarildi" value={`${totals.completed} ta`}>
              <Delta current={totals.completed} previous={previous.completed} />
            </Kpi>

            <Kpi icon="⭐" label="Ball" value={formatPoints(totals.points)}>
              <Delta current={totals.points} previous={previous.points} format={formatPoints} />
            </Kpi>

            <Kpi icon="⏰" label="Muddatida" value={formatPercent(totals.onTimeRate)}>
              <RateDelta current={totals.onTimeRate} previous={previous.onTimeRate} />
            </Kpi>

            <Kpi icon="📆" label="Faol kunlar" value={`${totals.activeDays}/${range.days}`}>
              <Text style={styles.delta}>
                kuniga ~{formatDecimal(totals.points / range.days)} ball
              </Text>
            </Kpi>
          </View>

          {/* ===== Xulosalar ===== */}
          {insights.length > 0 ? (
            <View style={styles.card}>
              <CardTitle>💡 Xulosalar</CardTitle>

              {insights.map((insight) => (
                <View key={insight.key} style={styles.insightRow}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightText}>{insight.text}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ===== Dinamika ===== */}
          <View style={styles.card}>
            <CardTitle
              right={
                <Segmented options={CHART_MODES} value={chartMode} onChange={setChartMode} small />
              }
            >
              Dinamika
            </CardTitle>

            <Text style={styles.caption}>
              {selected.title}:{' '}
              {chartMode === 'tasks' ? (
                <Text style={styles.captionValue}>
                  {selected.completed} ta task
                  {selected.completed > 0 ? (
                    <Text style={styles.captionMuted}>
                      {' '}
                      · {selected.onTime} muddatida · {selected.late} kech ·{' '}
                      {selected.noDeadline} muddatsiz
                    </Text>
                  ) : null}
                </Text>
              ) : (
                <Text style={styles.captionValue}>
                  {formatPoints(selected.points)} ball
                  <Text style={styles.captionMuted}> · {selected.completed} ta task</Text>
                </Text>
              )}
            </Text>

            <BarChart
              data={chartData}
              selectedKey={selected.key}
              onSelect={setSelectedKey}
              height={130}
              formatMax={chartMode === 'points' ? formatPoints : String}
            />

            {chartMode === 'tasks' ? (
              <View style={styles.legend}>
                {TIMING.map((t) => (
                  <View key={t.key} style={styles.legendItem}>
                    <Dot color={t.color} />
                    <Text style={styles.legendText}>{t.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* ===== Muddat bo'yicha ===== */}
          <View style={styles.card}>
            <CardTitle right={<Text style={styles.cardRight}>{totals.completed} ta</Text>}>
              ⏰ Muddat bo'yicha
            </CardTitle>

            {isEmpty ? (
              <Text style={styles.muted}>Bu davrda bajarilgan task yo'q.</Text>
            ) : (
              <>
                {/* 100% lik gorizontal ustun */}
                <View style={styles.stackBar}>
                  {TIMING.filter((t) => totals[t.key] > 0).map((t) => (
                    <View
                      key={t.key}
                      style={[styles.stackPart, { flex: totals[t.key], backgroundColor: t.color }]}
                    />
                  ))}
                </View>

                {TIMING.map((t) => (
                  <View key={t.key} style={styles.timingRow}>
                    <Dot color={t.color} />
                    <Text style={styles.timingLabel}>{t.label}</Text>
                    <Text style={styles.timingCount}>{totals[t.key]} ta</Text>
                    <Text style={styles.timingShare}>
                      {/* Foiz faqat muddati bor tasklar ichida */}
                      {t.key === 'noDeadline'
                        ? ''
                        : formatPercent(
                            totals.withDeadline ? totals[t.key] / totals.withDeadline : null
                          )}
                    </Text>
                  </View>
                ))}
              </>
            )}

            <View style={styles.footer}>
              {totals.avgLateDays !== null ? (
                <Text style={styles.footerText}>
                  Kechikkanlar o'rtacha {formatDecimal(totals.avgLateDays)} kun kech bajarilgan.
                </Text>
              ) : null}
              <Text style={styles.footerText}>
                Hozir: {analytics.pending.open} ta faol task
                {analytics.pending.overdue > 0 ? (
                  <Text style={styles.footerDanger}>
                    , {analytics.pending.overdue} tasining muddati o'tgan
                  </Text>
                ) : null}
                .
              </Text>
            </View>
          </View>

          {/* ===== Muhimlik bo'yicha ===== */}
          <View style={styles.card}>
            <CardTitle>🎯 Muhimlik bo'yicha</CardTitle>

            <View style={[styles.tableRow, styles.tableHead]}>
              <Text style={[styles.th, styles.colName]}>MUHIMLIK</Text>
              <Text style={[styles.th, styles.colNum]}>SONI</Text>
              <Text style={[styles.th, styles.colNum]}>BALL</Text>
              <Text style={[styles.th, styles.colNum]}>VAQTIDA</Text>
              <Text style={[styles.th, styles.colNum]}>KECH</Text>
            </View>

            {analytics.byPriority.map((row) => {
              const priority = getPriority(row.key);

              return (
                <View key={row.key} style={styles.tableRow}>
                  <View style={[styles.colName, styles.nameCell]}>
                    <Dot color={priority.color} />
                    <Text style={styles.td}>{priority.label}</Text>
                  </View>
                  <Text style={[styles.td, styles.colNum, styles.tdStrong]}>{row.completed}</Text>
                  <Text style={[styles.td, styles.colNum]}>{formatPoints(row.points)}</Text>
                  <Text style={[styles.td, styles.colNum]}>{formatPercent(row.onTimeRate)}</Text>
                  <Text
                    style={[styles.td, styles.colNum, row.late > 0 && styles.tdDanger]}
                  >
                    {row.late}
                  </Text>
                </View>
              );
            })}

            <Text style={styles.footnote}>
              "Vaqtida" - muddati bor tasklarning qanchasi muddatida bajarilgani.
            </Text>
          </View>

          {/* ===== Kategoriyalar ===== */}
          {analytics.byCategory.length > 0 ? (
            <View style={styles.card}>
              <CardTitle>🏷️ Kategoriyalar</CardTitle>

              {analytics.byCategory.map((row) => {
                const category = findCategory(categories, row.key);

                return (
                  <View key={row.key} style={styles.categoryRow}>
                    <View style={styles.categoryLine}>
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {category.icon} {category.label}
                      </Text>
                      <Text style={styles.categoryValue}>
                        {row.completed} ta · {formatPoints(row.points)} ball
                        <Text style={styles.categoryShare}> · {formatPercent(row.share)}</Text>
                      </Text>
                    </View>
                    <Progress
                      value={row.points / maxCategoryPoints}
                      color={getCategoryColors(category).color}
                    />
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* ===== Hafta kunlari (bir haftada ma'nosi yo'q - dinamika o'zi shu) ===== */}
          {period.key !== 'week' && !isEmpty ? (
            <View style={styles.card}>
              <CardTitle
                right={<Text style={styles.cardRight}>Eng faol: {bestWeekday.name}</Text>}
              >
                📅 Hafta kunlari
              </CardTitle>

              <BarChart data={weekdayData} height={80} />
            </View>
          ) : null}

          {analytics.untracked > 0 ? (
            <Text style={styles.note}>
              ℹ️ Analitika qo'shilishidan oldin o'chirilgan {analytics.untracked} ta task bu yerda
              hisobga olinmagan - ularning ballari "Natijalar" ekranida saqlangan.
            </Text>
          ) : null}
        </>
      )}
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

  // ===== Segmentli tanlagich =====
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 3,
  },

  segmentedSmall: {
    borderRadius: 8,
    padding: 2,
  },

  segment: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },

  // Katta tanlagich butun kenglikni teng bo'ladi, kichigi - matnicha
  segmentFill: {
    flex: 1,
  },

  segmentSmall: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: '#091E42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },

  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },

  segmentTextSmall: {
    fontSize: 12,
  },

  segmentTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  range: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: -6,
    textAlign: 'center',
  },

  // ===== Bo'sh holat =====
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ===== Ko'rsatkichlar =====
  kpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  kpi: {
    width: '48.4%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
  },

  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
    marginBottom: 2,
  },

  delta: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSubtle,
  },

  deltaUp: {
    color: colors.success,
  },

  deltaDown: {
    color: colors.danger,
  },

  deltaMuted: {
    fontWeight: '400',
    color: colors.textSubtle,
  },

  // ===== Kartochka =====
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  cardRight: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
  },

  muted: {
    fontSize: 13,
    color: colors.textMuted,
  },

  // ===== Xulosalar =====
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  insightIcon: {
    fontSize: 16,
    width: 28,
  },

  insightText: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text,
    lineHeight: 19,
  },

  // ===== Dinamika =====
  caption: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
  },

  captionValue: {
    fontWeight: '800',
    color: colors.text,
  },

  captionMuted: {
    fontWeight: '400',
    color: colors.textMuted,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },

  // ===== Muddat bo'yicha =====
  stackBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 12,
  },

  stackPart: {
    height: '100%',
  },

  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  timingLabel: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text,
  },

  timingCount: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
    minWidth: 50,
    textAlign: 'right',
  },

  timingShare: {
    fontSize: 13,
    color: colors.textMuted,
    minWidth: 48,
    textAlign: 'right',
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    marginTop: 8,
    paddingTop: 10,
    gap: 4,
  },

  footerText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },

  footerDanger: {
    color: colors.danger,
    fontWeight: '700',
  },

  // ===== Jadval =====
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },

  tableHead: {
    paddingTop: 0,
    paddingBottom: 6,
  },

  th: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textSubtle,
  },

  colName: {
    flex: 1.5,
  },

  colNum: {
    flex: 1,
    textAlign: 'right',
  },

  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  td: {
    fontSize: 13.5,
    color: colors.text,
  },

  tdStrong: {
    fontWeight: '800',
  },

  tdDanger: {
    color: colors.danger,
    fontWeight: '700',
  },

  footnote: {
    fontSize: 11.5,
    color: colors.textSubtle,
    marginTop: 8,
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

  categoryValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },

  categoryShare: {
    fontWeight: '400',
    color: colors.textMuted,
  },

  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },

  trackFill: {
    height: '100%',
    borderRadius: 4,
  },

  note: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
});

export default AnalyticsScreen;
