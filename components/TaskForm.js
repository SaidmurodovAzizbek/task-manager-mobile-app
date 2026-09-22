/**
 * TaskForm.js - Task qo'shish va tahrirlash uchun umumiy forma
 *
 * Ilgari AddTaskScreen va EditTaskScreen deyarli bir xil 500 qatorli
 * kodni takrorlardi. Endi forma bitta joyda: bir maydonni o'zgartirsangiz,
 * ikkala ekranda ham o'zgaradi.
 *
 * Forma o'zi biladigan ishlar:
 * - maydonlarni tekshirish (validatsiya);
 * - saqlash paytida tugmani bloklash;
 * - saqlanmagan o'zgarishlar bilan chiqib ketishdan ogohlantirish.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

import DateField from './DateField';
import PriorityPicker from './PriorityPicker';
import { colors } from '../theme/colors';
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  validateTaskInput,
} from '../utils/taskUtils';

/**
 * TaskForm komponenti
 *
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation obyekti
 * @param {Object} [props.task] - Tahrirlanayotgan task (yangi taskda yo'q)
 * @param {Function} props.onSubmit - Saqlash funksiyasi: async (values) => void
 * @param {string} props.submitLabel - Saqlash tugmasidagi matn
 * @param {string} props.title - Forma sarlavhasi
 * @param {string} props.subtitle - Sarlavha ostidagi izoh
 * @param {React.ReactNode} [props.headerExtra] - Sarlavha ostiga qo'shimcha element
 */
const TaskForm = ({
  navigation,
  task,
  onSubmit,
  submitLabel,
  title: formTitle,
  subtitle: formSubtitle,
  headerExtra,
}) => {
  // Tahrirlash rejimidamizmi yoki yangi task yaratyapmizmi?
  const isEditing = Boolean(task);

  // === Forma maydonlari ===
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');

  // Saqlash jarayoni ketyaptimi?
  const [saving, setSaving] = useState(false);

  // Maydonlar bo'yicha xatoliklar: { title: "...", deadline: "..." }
  const [errors, setErrors] = useState({});

  // Saqlash tugagach ogohlantirishni ko'rsatmaslik uchun belgi.
  // useState emas, useRef - chunki qiymati o'zgarganda qayta chizish shart emas.
  const savedRef = useRef(false);

  // Klaviatura ochilganda forma qanchaga surilishini hisoblash uchun
  const headerHeight = useHeaderHeight();

  /**
   * Formada saqlanmagan o'zgarish bormi?
   */
  const hasChanges =
    title.trim() !== (task?.title || '') ||
    description.trim() !== (task?.description || '') ||
    deadline.trim() !== (task?.deadline || '') ||
    priority !== (task?.priority || 'medium');

  /**
   * Ekrandan chiqishni ushlab turish.
   *
   * "beforeRemove" hodisasi orqaga qaytishning BARCHA yo'llarini ushlaydi:
   * header'dagi strelka, Android'ning "orqaga" tugmasi va chetdan surish.
   * Shuning uchun har birini alohida dasturlash shart emas.
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      // Saqlab bo'lgan bo'lsak yoki o'zgarish bo'lmasa - bemalol chiqamiz
      if (savedRef.current || !hasChanges) return;

      // Chiqishni to'xtatib turamiz va foydalanuvchidan so'raymiz
      event.preventDefault();

      Alert.alert(
        "O'zgarishlar saqlanmadi",
        "Saqlanmagan o'zgarishlar bor. Baribir chiqasizmi?",
        [
          { text: 'Qolish', style: 'cancel' },
          {
            text: 'Chiqish',
            style: 'destructive',
            // To'xtatib qo'ygan harakatni qayta ishga tushiramiz
            onPress: () => navigation.dispatch(event.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasChanges]);

  /**
   * Saqlash tugmasi bosilganda.
   */
  const handleSubmit = async () => {
    const values = {
      title: title.trim(),
      description: description.trim(),
      deadline: deadline.trim() || null,
      priority,
    };

    // 1) Tekshiramiz
    const validationErrors = validateTaskInput({
      title: values.title,
      deadline: values.deadline,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // 2) Saqlaymiz
    setSaving(true);

    try {
      await onSubmit(values);

      // Saqlandi - endi "chiqmang" ogohlantirishi kerak emas
      savedRef.current = true;
      navigation.goBack();
    } catch (error) {
      console.error('Saqlash xatoligi:', error);
      Alert.alert(
        'Xatolik',
        "Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.",
        [{ text: 'OK' }]
      );
      // Xatolik bo'lsa tugmani qayta faollashtiramiz
      setSaving(false);
    }
  };

  // Tahrirlashda: hech narsa o'zgarmagan bo'lsa saqlashning hojati yo'q
  const submitDisabled = saving || (isEditing && !hasChanges);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // iOS'da klaviatura formani bosib qo'ymasligi uchun surib turamiz.
      // Android'da tizimning o'zi ekranni qayta o'lchaydi.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        // Klaviatura ochiq turganda ham tugmalar bosilsin
        keyboardShouldPersistTaps="handled"
      >
        {/* Forma sarlavhasi */}
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{formTitle}</Text>
          <Text style={styles.formSubtitle}>{formSubtitle}</Text>
          {headerExtra}
        </View>

        {/* === Sarlavha (majburiy) === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Sarlavha <Text style={styles.required}>*</Text>
          </Text>

          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Nima qilish kerak?"
            placeholderTextColor={colors.textSubtle}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              // Yozishni boshlashi bilan xatolikni olib tashlaymiz
              if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
            }}
            maxLength={TITLE_MAX}
            // Yangi taskda darhol yozishni boshlash qulay
            autoFocus={!isEditing}
            returnKeyType="next"
          />

          {errors.title ? (
            <Text style={styles.errorText}>⚠️ {errors.title}</Text>
          ) : null}

          <Text style={styles.charCount}>
            {title.length}/{TITLE_MAX}
          </Text>
        </View>

        {/* === Tavsif (ixtiyoriy) === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tavsif</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Qo'shimcha ma'lumot..."
            placeholderTextColor={colors.textSubtle}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={DESCRIPTION_MAX}
            textAlignVertical="top"
          />

          <Text style={styles.charCount}>
            {description.length}/{DESCRIPTION_MAX}
          </Text>
        </View>

        {/* === Muddat (ixtiyoriy) === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>📅 Muddat</Text>

          <DateField
            value={deadline}
            onChange={(text) => {
              setDeadline(text);
              if (errors.deadline) {
                setErrors((prev) => ({ ...prev, deadline: null }));
              }
            }}
            error={errors.deadline}
          />
        </View>

        {/* === Ustuvorlik === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>🎯 Ustuvorlik</Text>
          <PriorityPicker value={priority} onChange={setPriority} />
        </View>

        {/* === Tugmalar === */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, submitDisabled && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitDisabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: submitDisabled }}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing && !hasChanges ? "O'zgarish yo'q" : submitLabel}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  formHeader: {
    marginBottom: 24,
  },

  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },

  formSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },

  required: {
    color: colors.danger,
  },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },

  inputError: {
    borderColor: colors.danger,
  },

  textArea: {
    height: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },

  charCount: {
    color: colors.textSubtle,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },

  buttonContainer: {
    marginTop: 12,
    gap: 12,
  },

  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  saveButtonDisabled: {
    backgroundColor: colors.primaryLight,
    // O'chirilgan tugmada soya keraksiz
    shadowOpacity: 0,
    elevation: 0,
  },

  saveButtonText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },

  cancelButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TaskForm;
