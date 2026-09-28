/**
 * CategoryDialog.js - Kategoriya qo'shish / tahrirlash oynasi
 *
 * Foydalanuvchi nom yozadi, belgi (emoji) va rang tanlaydi.
 * Pastda kategoriya qanday ko'rinishi darhol ko'rsatib turiladi.
 *
 * Ikki joydan ochiladi:
 * - task formasidagi "+ Yangi" tugmasidan (task yozayotib kategoriya qo'shish);
 * - "Kategoriyalar" ekranidan (qo'shish va tahrirlash).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';

import { colors, getCategoryColors } from '../theme/colors';
import {
  CATEGORY_COLOR_KEYS,
  CATEGORY_ICONS,
  CATEGORY_NAME_MAX,
  validateCategoryInput,
} from '../utils/categoryUtils';

/**
 * CategoryDialog komponenti
 *
 * @param {Object} props
 * @param {boolean} props.visible - Oyna ochiqmi
 * @param {Object} [props.category] - Tahrirlanayotgan kategoriya (yangisida yo'q)
 * @param {Array} props.categories - Mavjud kategoriyalar (nom takrorlanmasin)
 * @param {Function} props.onClose - Yopish
 * @param {Function} props.onSubmit - async ({ label, icon, color }) => void
 */
const CategoryDialog = ({ visible, category, categories, onClose, onSubmit }) => {
  const isEditing = Boolean(category);

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [color, setColor] = useState(CATEGORY_COLOR_KEYS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Oyna har ochilganda maydonlarni to'ldiramiz:
   * tahrirlashda - kategoriyaning o'z qiymatlari, yangisida - bo'sh.
   */
  useEffect(() => {
    if (!visible) return;

    setLabel(category?.label || '');
    setIcon(category?.icon || CATEGORY_ICONS[0]);
    setColor(category?.color || CATEGORY_COLOR_KEYS[0]);
    setError(null);
    setBusy(false);
  }, [visible, category]);

  /**
   * Saqlash tugmasi.
   */
  const handleSubmit = async () => {
    const errors = validateCategoryInput({ label }, categories, category?.key);

    if (errors.label) {
      setError(errors.label);
      return;
    }

    setBusy(true);

    try {
      await onSubmit({ label: label.trim(), icon, color });
    } catch (err) {
      console.error('Kategoriyani saqlash xatoligi:', err);
      setError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
      setBusy(false);
    }
  };

  const preview = getCategoryColors(color);

  // Tahrirlanayotgan kategoriya belgisi ro'yxatda bo'lmasa (zaxiradan
  // kelgan bo'lishi mumkin) - uni ham tanlov qatoriga qo'shamiz
  const icons = CATEGORY_ICONS.includes(icon) ? CATEGORY_ICONS : [icon, ...CATEGORY_ICONS];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.dialog}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>
              {isEditing ? '✏️ Kategoriyani tahrirlash' : '🏷️ Yangi kategoriya'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing
                ? 'Shu kategoriyadagi barcha tasklar yangi ko\'rinishni oladi.'
                : 'Saqlangan kategoriya standartlar qatorida doim chiqib turadi.'}
            </Text>

            {/* === Nom === */}
            <Text style={styles.label}>Nomi</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Masalan: Uy ishlari"
              placeholderTextColor={colors.textSubtle}
              value={label}
              onChangeText={(text) => {
                setLabel(text);
                if (error) setError(null);
              }}
              maxLength={CATEGORY_NAME_MAX}
              autoFocus={!isEditing}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Kategoriya nomi"
            />
            {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

            {/* === Belgi === */}
            <Text style={styles.label}>Belgi</Text>
            <View style={styles.iconGrid}>
              {icons.map((item) => {
                const selected = item === icon;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.iconOption,
                      selected && {
                        borderColor: preview.color,
                        backgroundColor: preview.bgColor,
                      },
                    ]}
                    onPress={() => setIcon(item)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Belgi ${item}`}
                  >
                    <Text style={styles.iconText}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* === Rang === */}
            <Text style={styles.label}>Rang</Text>
            <View style={styles.colorRow}>
              {CATEGORY_COLOR_KEYS.map((key) => {
                const selected = key === color;
                const swatch = getCategoryColors(key);

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.colorOption,
                      { backgroundColor: swatch.color },
                      selected && styles.colorOptionSelected,
                    ]}
                    onPress={() => setColor(key)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Rang: ${key}`}
                  >
                    {selected ? <Text style={styles.colorCheck}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* === Ko'rinishi === */}
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Ko'rinishi:</Text>
              <View style={[styles.previewChip, { backgroundColor: preview.bgColor }]}>
                <Text style={styles.previewIcon}>{icon}</Text>
                <Text
                  style={[styles.previewText, { color: preview.color }]}
                  numberOfLines={1}
                >
                  {label.trim() || 'Kategoriya'}
                </Text>
              </View>
            </View>

            {/* === Tugmalar === */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={busy}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Bekor qilish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton, busy && styles.buttonBusy]}
                onPress={handleSubmit}
                disabled={busy}
                accessibilityRole="button"
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.confirmText}>
                    {isEditing ? 'Yangilash' : 'Qo\'shish'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 30, 66, 0.54)',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    maxHeight: '100%',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 14,
    marginBottom: 8,
  },

  input: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 15,
    color: colors.text,
  },

  inputError: {
    borderColor: colors.danger,
  },

  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },

  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconText: {
    fontSize: 19,
  },

  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // 8 ta rang 360dp ekranda ham bitta qatorga sig'sin
    gap: 7,
  },

  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  colorOptionSelected: {
    // Tanlangan rang atrofida oq + to'q halqa
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: '#091E42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },

  colorCheck: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
  },

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  previewLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginRight: 8,
  },

  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexShrink: 1,
  },

  previewIcon: {
    fontSize: 12,
    marginRight: 4,
  },

  previewText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButton: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  confirmButton: {
    backgroundColor: colors.primary,
  },

  buttonBusy: {
    backgroundColor: colors.primaryLight,
  },

  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },

  confirmText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CategoryDialog;
