/**
 * TaskMenu.js - Pastdan chiqadigan menyu
 *
 * Bosh ekranning o'ng yuqori burchagidagi "⋯" tugmasi shu oynani ochadi.
 * Ichida kundalik ishlatilmaydigan, lekin kerak bo'ladigan amallar:
 * zaxira nusxa olish, tiklash va tozalash.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

/**
 * Menyudagi bitta qator.
 *
 * @param {Object} props
 * @param {string} props.icon - Chapdagi emoji
 * @param {string} props.label - Amal nomi
 * @param {string} [props.hint] - Kichik izoh
 * @param {Function} props.onPress - Bosilganda
 * @param {boolean} [props.disabled] - Amal hozir mumkin emasmi
 * @param {boolean} [props.danger] - Xavfli amal (qizil rangda)
 */
const MenuRow = ({ icon, label, hint, onPress, disabled, danger }) => (
  <TouchableOpacity
    style={[styles.row, disabled && styles.rowDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.6}
    accessibilityRole="button"
    accessibilityState={{ disabled: Boolean(disabled) }}
  >
    <Text style={styles.rowIcon}>{icon}</Text>

    <View style={styles.rowTextContainer}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
        {label}
      </Text>
      {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
    </View>
  </TouchableOpacity>
);

/**
 * TaskMenu komponenti
 *
 * @param {Object} props
 * @param {boolean} props.visible - Oyna ochiqmi
 * @param {Function} props.onClose - Yopish
 * @param {Object} props.stats - { total, completed, active, overdue }
 * @param {Function} props.onExport - Zaxira nusxa olish
 * @param {Function} props.onImport - Zaxiradan tiklash
 * @param {Function} props.onClearCompleted - Bajarilganlarni o'chirish
 * @param {Function} props.onClearAll - Hammasini o'chirish
 */
const TaskMenu = ({
  visible,
  onClose,
  stats,
  onExport,
  onImport,
  onClearCompleted,
  onClearAll,
}) => {
  // Telefon pastidagi "uy" chizig'i ustiga tushib qolmaslik uchun
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // Android'da "orqaga" tugmasi oynani yopsin
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Qorong'i fon - bosilganda oyna yopiladi */}
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        {/* Oynaning o'zini bosganda yopilmasligi uchun bosishni to'xtatamiz */}
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
          onPress={(event) => event?.stopPropagation?.()}
        >
          {/* Yuqoridagi kichik chiziqcha - "bu oynani surish mumkin" ishorasi */}
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>Menyu</Text>
          <Text style={styles.sheetSubtitle}>
            Jami {stats.total} ta · {stats.active} faol · {stats.completed} bajarilgan
          </Text>

          <View style={styles.divider} />

          <MenuRow
            icon="📤"
            label="Zaxira nusxa olish"
            hint="Tasklarni matn ko'rinishida chiqarish"
            onPress={onExport}
            disabled={stats.total === 0}
          />

          <MenuRow
            icon="📥"
            label="Zaxiradan tiklash"
            hint="Avval olingan nusxadan qayta yuklash"
            onPress={onImport}
          />

          <View style={styles.divider} />

          <MenuRow
            icon="🧹"
            label="Bajarilganlarni tozalash"
            hint={
              stats.completed > 0
                ? `${stats.completed} ta task o'chiriladi`
                : 'Bajarilgan task yo\'q'
            }
            onPress={onClearCompleted}
            disabled={stats.completed === 0}
          />

          <MenuRow
            icon="🗑️"
            label="Barcha tasklarni o'chirish"
            hint="Bu amalni qaytarib bo'lmaydi"
            onPress={onClearAll}
            disabled={stats.total === 0}
            danger
          />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>Yopish</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 30, 66, 0.54)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 14,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  sheetSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: colors.surfaceAlt,
    marginVertical: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  rowDisabled: {
    opacity: 0.4,
  },

  rowIcon: {
    fontSize: 20,
    width: 34,
  },

  rowTextContainer: {
    flex: 1,
  },

  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },

  rowLabelDanger: {
    color: colors.danger,
  },

  rowHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  closeButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

export default TaskMenu;
