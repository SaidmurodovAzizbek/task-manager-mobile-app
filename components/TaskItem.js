/**
 * TaskItem.js - Bitta task kartochkasi
 *
 * Kartochkada:
 * - Checkbox (bajarilgan / bajarilmagan)
 * - Sarlavha va tavsif
 * - Ustuvorlik nishoni va muddat
 * - O'chirish tugmasi
 *
 * Kartochkaning o'zini bossangiz - tahrirlash ekrani ochiladi.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { colors, getPriority } from '../theme/colors';
import { formatDate, formatDeadline, isOverdue } from '../utils/taskUtils';

/**
 * TaskItem komponenti
 *
 * @param {Object} props
 * @param {Object} props.task - Task obyekti
 * @param {Function} props.onToggle - Checkbox bosilganda (taskId)
 * @param {Function} props.onDelete - O'chirish bosilganda (task)
 * @param {Function} props.onPress - Kartochka bosilganda (task)
 */
const TaskItem = ({ task, onToggle, onDelete, onPress }) => {
  // Ustuvorlik ranglari (noma'lum qiymatda "o'rta" qaytadi)
  const priority = getPriority(task.priority);

  // Muddat o'tib ketganmi? Bajarilgan taskda buni ko'rsatmaymiz.
  const overdue = !task.completed && isOverdue(task.deadline);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        // Bajarilgan task boshqacha ko'rinadi
        task.completed && styles.cardCompleted,
        // Kechikkan task chap chetida qizil chiziq oladi
        overdue && styles.cardOverdue,
      ]}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
      // Ekran o'quvchi (TalkBack/VoiceOver) uchun izoh
      accessibilityRole="button"
      accessibilityLabel={`${task.title}. ${priority.label} ustuvorlik.`}
      accessibilityHint="Tahrirlash uchun bosing"
    >
      {/* Yuqori qator: ustuvorlik nishoni + muddat */}
      <View style={styles.cardHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: priority.bgColor }]}>
          <Text style={styles.priorityIcon}>{priority.icon}</Text>
          <Text style={[styles.priorityText, { color: priority.color }]}>
            {priority.label}
          </Text>
        </View>

        {/* Muddat faqat belgilangan bo'lsa ko'rinadi */}
        {task.deadline ? (
          <View style={[styles.deadlineBadge, overdue && styles.deadlineOverdue]}>
            <Text style={styles.deadlineIcon}>{overdue ? '⚠️' : '📅'}</Text>
            <Text
              style={[styles.deadlineText, overdue && styles.deadlineTextOverdue]}
            >
              {/* "Bugun", "Ertaga", "2 kun kechikdi" ... */}
              {formatDeadline(task.deadline)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* O'rta qator: checkbox + matnlar */}
      <View style={styles.cardBody}>
        <TouchableOpacity
          style={[styles.checkbox, task.completed && styles.checkboxChecked]}
          onPress={() => onToggle(task.id)}
          // Bosish zonasini kengaytiramiz - barmoq bilan tegish oson bo'lsin
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.completed }}
          accessibilityLabel={
            task.completed ? 'Bajarilmagan deb belgilash' : 'Bajarildi deb belgilash'
          }
        >
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <Text
            style={[styles.title, task.completed && styles.titleCompleted]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              style={[
                styles.description,
                task.completed && styles.descriptionCompleted,
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Pastki qator: yaratilgan sana + o'chirish */}
      <View style={styles.cardFooter}>
        <Text style={styles.createdDate}>{formatDate(task.createdAt)}</Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(task)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Taskni o'chirish"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    // Soya (kartochka "ko'tarilgan" ko'rinishi)
    shadowColor: '#091E42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    // Chap chetdagi rangli chiziq
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  cardCompleted: {
    backgroundColor: colors.background,
    borderLeftColor: colors.success,
    opacity: 0.85,
  },

  cardOverdue: {
    borderLeftColor: colors.danger,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  priorityIcon: {
    fontSize: 10,
    marginRight: 4,
  },

  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    // Uzun matnlar kartochkadan chiqib ketmasin
    flexShrink: 1,
    marginLeft: 8,
  },

  deadlineOverdue: {
    backgroundColor: colors.dangerSurface,
  },

  deadlineIcon: {
    fontSize: 11,
    marginRight: 4,
  },

  deadlineText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  deadlineTextOverdue: {
    color: colors.danger,
    fontWeight: '700',
  },

  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },

  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  checkmark: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },

  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },

  description: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },

  descriptionCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSubtle,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },

  createdDate: {
    fontSize: 11,
    color: colors.textSubtle,
  },

  deleteButton: {
    padding: 4,
  },

  deleteIcon: {
    fontSize: 18,
  },
});

/**
 * memo - task o'zgarmagan bo'lsa kartochkani qayta chizmaydi.
 * Ro'yxat uzun bo'lganda aylantirish (scroll) silliq bo'lishiga yordam beradi.
 */
export default memo(TaskItem);
