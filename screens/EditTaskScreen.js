/**
 * EditTaskScreen.js - Taskni tahrirlash ekrani
 * 
 * Bu ekranda foydalanuvchi mavjud taskni o'zgartirishi mumkin:
 * - Sarlavhani o'zgartirish
 * - Tavsifni o'zgartirish
 * - Muddatni o'zgartirish
 * - Ustuvorlikni o'zgartirish
 * 
 * HomeScreen'dan task ma'lumotlari route.params orqali keladi.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

// Task yangilash funksiyasi
import { updateTask } from '../storage/taskStorage';

/**
 * Ustuvorlik darajalari (AddTaskScreen bilan bir xil)
 */
const PRIORITIES = [
  {
    key: 'low',
    label: 'Past',
    icon: '🟢',
    color: '#00875A',
    bgColor: '#E3FCEF',
  },
  {
    key: 'medium',
    label: "O'rta",
    icon: '🟡',
    color: '#FF991F',
    bgColor: '#FFF7E6',
  },
  {
    key: 'high',
    label: 'Yuqori',
    icon: '🔴',
    color: '#DE350B',
    bgColor: '#FFEBE6',
  },
];

/**
 * EditTaskScreen komponenti
 * 
 * @param {Object} props
 * @param {Object} props.route - Route parametrlari (task ma'lumotlari)
 * @param {Object} props.navigation - Navigatsiya obyekti
 */
const EditTaskScreen = ({ route, navigation }) => {
  // Route'dan task ma'lumotlarini olamiz
  // Bu ma'lumotlar HomeScreen'dan yuborilgan
  const { task } = route.params;

  // === STATE - mavjud task qiymatlari bilan boshlash ===
  
  // Sarlavha (mavjud qiymat bilan)
  const [title, setTitle] = useState(task.title);

  // Tavsif (mavjud qiymat yoki bo'sh string)
  const [description, setDescription] = useState(task.description || '');

  // Muddat (mavjud qiymat yoki bo'sh string)
  const [deadline, setDeadline] = useState(task.deadline || '');

  // Ustuvorlik (mavjud qiymat yoki 'medium')
  const [priority, setPriority] = useState(task.priority || 'medium');

  // Saqlash holati
  const [saving, setSaving] = useState(false);

  // Xatoliklar
  const [errors, setErrors] = useState({});

  /**
   * Formani tekshirish (validatsiya)
   * AddTaskScreen'dagi kabi
   */
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Sarlavha kiritish majburiy';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Sarlavha kamida 3 ta belgidan iborat bo\'lishi kerak';
    }

    if (deadline.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(deadline.trim())) {
        newErrors.deadline = 'Sana formati: YYYY-MM-DD (masalan: 2024-12-31)';
      } else {
        const date = new Date(deadline.trim());
        if (isNaN(date.getTime())) {
          newErrors.deadline = "Noto'g'ri sana kiritildi";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * O'zgarishlarni saqlash
   * 
   * Faqat o'zgargan maydonlarni yangilaydi
   */
  const handleUpdate = async () => {
    // Formani tekshirish
    if (!validateForm()) return;

    setSaving(true);

    try {
      // Yangilangan ma'lumotlarni AsyncStorage'ga saqlash
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        deadline: deadline.trim() || null,
        priority,
      });

      // Muvaffaqiyatli - bosh ekranga qaytish
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Xatolik',
        "Taskni yangilashda xatolik yuz berdi. Qayta urinib ko'ring.",
        [{ text: 'OK' }]
      );
      console.error('Yangilash xatoligi:', err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * O'zgarishlar borligini tekshirish
   * Agar hech narsa o'zgarmagan bo'lsa, foydalanuvchiga bildiramiz
   */
  const hasChanges = () => {
    return (
      title.trim() !== task.title ||
      description.trim() !== (task.description || '') ||
      deadline.trim() !== (task.deadline || '') ||
      priority !== (task.priority || 'medium')
    );
  };

  /**
   * Ortga qaytish - o'zgarishlar bo'lsa tasdiqlash
   */
  const handleGoBack = () => {
    if (hasChanges()) {
      Alert.alert(
        "O'zgarishlar saqlanmadi",
        "Saqlanmagan o'zgarishlar bor. Davom etasizmi?",
        [
          { text: 'Qolish', style: 'cancel' },
          {
            text: 'Chiqish',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Forma boshi */}
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>✏️ Taskni tahrirlash</Text>
          <Text style={styles.formSubtitle}>
            O'zgartirmoqchi bo'lgan maydonlarni yangilang
          </Text>
          {/* Task holati */}
          <View style={[
            styles.statusBadge,
            task.completed ? styles.statusCompleted : styles.statusActive,
          ]}>
            <Text style={[
              styles.statusText,
              task.completed ? styles.statusTextCompleted : styles.statusTextActive,
            ]}>
              {task.completed ? '✅ Bajarilgan' : '🔄 Faol'}
            </Text>
          </View>
        </View>

        {/* === Sarlavha === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Sarlavha <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Task sarlavhasi..."
            placeholderTextColor="#A5ADBA"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) {
                setErrors((prev) => ({ ...prev, title: null }));
              }
            }}
            maxLength={100}
          />
          {errors.title && (
            <Text style={styles.errorText}>⚠️ {errors.title}</Text>
          )}
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* === Tavsif === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tavsif</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Qo'shimcha ma'lumot..."
            placeholderTextColor="#A5ADBA"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* === Muddat === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>📅 Muddat</Text>
          <TextInput
            style={[styles.input, errors.deadline && styles.inputError]}
            placeholder="YYYY-MM-DD (masalan: 2024-12-31)"
            placeholderTextColor="#A5ADBA"
            value={deadline}
            onChangeText={(text) => {
              setDeadline(text);
              if (errors.deadline) {
                setErrors((prev) => ({ ...prev, deadline: null }));
              }
            }}
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.deadline && (
            <Text style={styles.errorText}>⚠️ {errors.deadline}</Text>
          )}
        </View>

        {/* === Ustuvorlik === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>🎯 Ustuvorlik</Text>
          <View style={styles.priorityContainer}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.priorityOption,
                  priority === p.key && {
                    backgroundColor: p.bgColor,
                    borderColor: p.color,
                  },
                ]}
                onPress={() => setPriority(p.key)}
              >
                <Text style={styles.priorityIcon}>{p.icon}</Text>
                <Text
                  style={[
                    styles.priorityLabel,
                    priority === p.key && { color: p.color, fontWeight: '700' },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* === Tugmalar === */}
        <View style={styles.buttonContainer}>
          {/* Yangilash tugmasi */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
              // O'zgarish bo'lmasa ham disabled ko'rinish
              !hasChanges() && !saving && styles.saveButtonNoChanges,
            ]}
            onPress={handleUpdate}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {hasChanges() ? '💾 Yangilash' : "O'zgarish yo'q"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Bekor qilish tugmasi */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Stillar
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Forma boshi
  formHeader: {
    marginBottom: 24,
  },

  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#172B4D',
    marginBottom: 4,
  },

  formSubtitle: {
    fontSize: 14,
    color: '#6B778C',
    marginBottom: 12,
  },

  // Holat badge
  statusBadge: {
    alignSelf: 'flex-start',          // Faqat kerakli kenglikda
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  statusActive: {
    backgroundColor: '#DEEBFF',        // Och ko'k
  },

  statusCompleted: {
    backgroundColor: '#E3FCEF',        // Och yashil
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  statusTextActive: {
    color: '#0052CC',
  },

  statusTextCompleted: {
    color: '#00875A',
  },

  // Kiritish maydonlari
  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#172B4D',
    marginBottom: 8,
  },

  required: {
    color: '#DE350B',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DFE1E6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#172B4D',
  },

  inputError: {
    borderColor: '#DE350B',
  },

  textArea: {
    height: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  errorText: {
    color: '#DE350B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },

  charCount: {
    color: '#A5ADBA',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },

  // Ustuvorlik
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },

  priorityOption: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DFE1E6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  priorityIcon: {
    fontSize: 20,
    marginBottom: 6,
  },

  priorityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#172B4D',
  },

  // Tugmalar
  buttonContainer: {
    marginTop: 12,
    gap: 12,
  },

  saveButton: {
    backgroundColor: '#0052CC',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  saveButtonDisabled: {
    backgroundColor: '#B3D4FF',
  },

  saveButtonNoChanges: {
    backgroundColor: '#6B778C',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  cancelButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DFE1E6',
    backgroundColor: '#FFFFFF',
  },

  cancelButtonText: {
    color: '#6B778C',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default EditTaskScreen;
