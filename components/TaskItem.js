/**
 * TaskItem.js - Har bir task kartochkasi komponenti
 * 
 * Bu komponent bitta taskni ko'rsatadi. U quyidagilarni o'z ichiga oladi:
 * - Checkbox (bajarilgan/bajarilmagan belgilash)
 * - Sarlavha va tavsif
 * - Muddat ko'rsatish
 * - Ustuvorlik (priority) indikatori
 * - O'chirish tugmasi
 * 
 * Jira'ning task kartochkalariga o'xshab yaratilgan.
 */

import React from 'react';
import {
  View,            // Konteyner
  Text,            // Matn
  StyleSheet,      // Stillar
  TouchableOpacity, // Bosilishi mumkin bo'lgan element
  Alert,           // Ogohlantirish dialogi
  Animated,        // Animatsiya uchun
} from 'react-native';

/**
 * Ustuvorlik ranglarini aniqlash
 * Jira'dagi kabi 3 darajali ustuvorlik tizimi
 */
const PRIORITY_CONFIG = {
  high: {
    color: '#DE350B',      // Qizil - yuqori ustuvorlik
    backgroundColor: '#FFEBE6', // Och qizil fon
    label: 'Yuqori',       // Ko'rsatiladigan matn
    icon: '🔴',            // Emoji indikator
  },
  medium: {
    color: '#FF991F',      // Sariq - o'rta ustuvorlik
    backgroundColor: '#FFF7E6', // Och sariq fon
    label: "O'rta",
    icon: '🟡',
  },
  low: {
    color: '#00875A',      // Yashil - past ustuvorlik
    backgroundColor: '#E3FCEF', // Och yashil fon
    label: 'Past',
    icon: '🟢',
  },
};

/**
 * Sanani chiroyli formatga o'tkazish
 * 
 * @param {string} dateString - ISO format sana (masalan: "2024-12-31")
 * @returns {string} - Chiroyli format (masalan: "31-dek, 2024")
 */
const formatDate = (dateString) => {
  // Agar sana berilmagan bo'lsa
  if (!dateString) return 'Muddat belgilanmagan';

  try {
    const date = new Date(dateString);
    // Oylar ro'yxati (qisqartirilgan)
    const months = [
      'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
      'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'
    ];
    const day = date.getDate();           // Kun
    const month = months[date.getMonth()]; // Oy
    const year = date.getFullYear();       // Yil
    return `${day}-${month}, ${year}`;
  } catch {
    return dateString; // Xatolik bo'lsa, asl qiymatni qaytaramiz
  }
};

/**
 * Muddat o'tib ketganligini tekshirish
 * 
 * @param {string} deadline - Muddat sanasi
 * @returns {boolean} - true agar muddat o'tgan bo'lsa
 */
const isOverdue = (deadline) => {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Bugungi sananing boshlanishi
  const deadlineDate = new Date(deadline);
  return deadlineDate < today;
};

/**
 * TaskItem komponenti
 * 
 * @param {Object} props - Komponent parametrlari
 * @param {Object} props.task - Task obyekti (id, title, description, ...)
 * @param {Function} props.onToggle - Checkbox bosilganda chaqiriladi
 * @param {Function} props.onDelete - O'chirish bosilganda chaqiriladi
 * @param {Function} props.onPress - Kartochka bosilganda chaqiriladi (tahrirlash)
 */
const TaskItem = ({ task, onToggle, onDelete, onPress }) => {
  // Ustuvorlik konfiguratsiyasini olamiz (default: medium)
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  // Muddat o'tganligini tekshiramiz
  const overdue = !task.completed && isOverdue(task.deadline);

  /**
   * O'chirish tugmasi bosilganda tasdiqlash dialogi
   * Foydalanuvchi tasodifan o'chirib yubormasligi uchun
   */
  const handleDelete = () => {
    Alert.alert(
      "Taskni o'chirish",                    // Dialog sarlavhasi
      `"${task.title}" taskini o'chirmoqchimisiz?`, // Dialog xabari
      [
        {
          text: 'Bekor qilish',              // Birinchi tugma
          style: 'cancel',                    // iOS'da maxsus stil
        },
        {
          text: "O'chirish",                  // Ikkinchi tugma
          style: 'destructive',               // Qizil rang (iOS)
          onPress: () => onDelete(task.id),   // O'chirish funksiyasini chaqirish
        },
      ]
    );
  };

  return (
    // Kartochkaga bosish - tahrirlash ekraniga o'tish
    <TouchableOpacity
      style={[
        styles.card,
        // Bajarilgan tasklar uchun maxsus stil
        task.completed && styles.cardCompleted,
      ]}
      onPress={() => onPress(task)}
      activeOpacity={0.7} // Bosilganda shaffoflik darajasi
    >
      {/* Yuqori qism: Ustuvorlik + Muddat */}
      <View style={styles.cardHeader}>
        {/* Ustuvorlik badge (nishon) */}
        <View style={[
          styles.priorityBadge,
          { backgroundColor: priorityConfig.backgroundColor }
        ]}>
          <Text style={styles.priorityIcon}>{priorityConfig.icon}</Text>
          <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
            {priorityConfig.label}
          </Text>
        </View>

        {/* Muddat ko'rsatish */}
        {task.deadline ? (
          <View style={[
            styles.deadlineBadge,
            overdue && styles.deadlineOverdue, // Muddat o'tgan bo'lsa qizil
          ]}>
            <Text style={styles.deadlineIcon}>
              {overdue ? '⚠️' : '📅'}
            </Text>
            <Text style={[
              styles.deadlineText,
              overdue && styles.deadlineTextOverdue,
            ]}>
              {formatDate(task.deadline)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* O'rta qism: Checkbox + Sarlavha + Tavsif */}
      <View style={styles.cardBody}>
        {/* Checkbox - bajarilgan/bajarilmagan */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            task.completed && styles.checkboxChecked,
          ]}
          onPress={() => onToggle(task.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Bosish zonasini kengaytirish
        >
          {/* Bajarilgan bo'lsa checkmark (✓) ko'rsatish */}
          {task.completed && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>

        {/* Matn qismi */}
        <View style={styles.textContainer}>
          {/* Task sarlavhasi */}
          <Text
            style={[
              styles.title,
              // Bajarilgan taskda chizilgan matn
              task.completed && styles.titleCompleted,
            ]}
            numberOfLines={2} // Maksimal 2 qator
          >
            {task.title}
          </Text>

          {/* Task tavsifi (agar mavjud bo'lsa) */}
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

      {/* Pastki qism: O'chirish tugmasi */}
      <View style={styles.cardFooter}>
        {/* Yaratilgan sana */}
        <Text style={styles.createdDate}>
          {formatDate(task.createdAt)}
        </Text>

        {/* O'chirish tugmasi */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Stillar
const styles = StyleSheet.create({
  // Task kartochkasi
  card: {
    backgroundColor: '#FFFFFF',        // Oq fon
    borderRadius: 8,                   // Burchak radiusi
    marginHorizontal: 16,             // Yon bo'shliq
    marginVertical: 6,                 // Yuqori-past bo'shliq
    padding: 16,                       // Ichki bo'shliq
    // Soya (ko'tarma effekt)
    shadowColor: '#091E42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,                      // Android soya
    // Chap tomonda ko'k chiziq (Jira uslubi)
    borderLeftWidth: 4,
    borderLeftColor: '#0052CC',
  },

  // Bajarilgan task kartochkasi
  cardCompleted: {
    backgroundColor: '#F4F5F7',        // Och kulrang fon
    borderLeftColor: '#00875A',        // Yashil chiziq
    opacity: 0.85,                     // Biroz shaffof
  },

  // Kartochka bosh qismi
  cardHeader: {
    flexDirection: 'row',              // Gorizontal joylashish
    justifyContent: 'space-between',   // Ikki chetga tarqalish
    alignItems: 'center',             // Vertikal markaz
    marginBottom: 12,                  // Pastdan bo'shliq
  },

  // Ustuvorlik badge
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,                  // Yumaloq burchaklar
  },

  priorityIcon: {
    fontSize: 10,
    marginRight: 4,
  },

  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',        // KATTA HARF
    letterSpacing: 0.5,
  },

  // Muddat badge
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Muddat o'tgan holat
  deadlineOverdue: {
    backgroundColor: '#FFEBE6',
  },

  deadlineIcon: {
    fontSize: 11,
    marginRight: 4,
  },

  deadlineText: {
    fontSize: 11,
    color: '#6B778C',
    fontWeight: '500',
  },

  deadlineTextOverdue: {
    color: '#DE350B',
    fontWeight: '700',
  },

  // Kartochka tana qismi
  cardBody: {
    flexDirection: 'row',              // Checkbox va matn yonma-yon
    alignItems: 'flex-start',          // Yuqoriga tekislash
  },

  // Checkbox stili
  checkbox: {
    width: 24,                         // Kenglik
    height: 24,                        // Balandlik
    borderRadius: 6,                   // Biroz yumaloq
    borderWidth: 2,                    // Chegara qalinligi
    borderColor: '#DFE1E6',            // Kulrang chegara
    justifyContent: 'center',          // Markaz
    alignItems: 'center',
    marginRight: 14,                   // O'ngdan bo'shliq
    marginTop: 2,                      // Yuqoridan biroz
  },

  // Belgilangan checkbox
  checkboxChecked: {
    backgroundColor: '#0052CC',        // Ko'k fon
    borderColor: '#0052CC',            // Ko'k chegara
  },

  // Checkmark (✓) belgisi
  checkmark: {
    color: '#FFFFFF',                  // Oq rang
    fontSize: 14,
    fontWeight: '700',
  },

  // Matn konteyneri
  textContainer: {
    flex: 1,                           // Qolgan joyni egallaydi
  },

  // Task sarlavhasi
  title: {
    fontSize: 16,
    fontWeight: '600',                 // Yarim qalin
    color: '#172B4D',                  // Quyuq ko'k
    marginBottom: 4,
    lineHeight: 22,
  },

  // Bajarilgan task sarlavhasi
  titleCompleted: {
    textDecorationLine: 'line-through', // Ustidan chiziq
    color: '#6B778C',                   // Kulrang
  },

  // Task tavsifi
  description: {
    fontSize: 13,
    color: '#6B778C',
    lineHeight: 18,
  },

  // Bajarilgan task tavsifi
  descriptionCompleted: {
    textDecorationLine: 'line-through',
    color: '#A5ADBA',
  },

  // Kartochka pastki qismi
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,                 // Yuqori chiziq
    borderTopColor: '#EBECF0',         // Och kulrang chiziq
  },

  // Yaratilgan sana
  createdDate: {
    fontSize: 11,
    color: '#A5ADBA',
  },

  // O'chirish tugmasi
  deleteButton: {
    padding: 4,
  },

  deleteIcon: {
    fontSize: 18,
  },
});

export default TaskItem;
