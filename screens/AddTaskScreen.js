/**
 * AddTaskScreen.js - Yangi task qo'shish ekrani
 * 
 * Bu ekranda foydalanuvchi yangi task yaratishi mumkin:
 * - Sarlavha kiritish (majburiy)
 * - Tavsif kiritish (ixtiyoriy)
 * - Muddat tanlash (ixtiyoriy)
 * - Ustuvorlik tanlash (past/o'rta/yuqori)
 * 
 * Form validatsiyasi ham mavjud - sarlavha bo'sh bo'lmasligi kerak.
 */

import React, { useState } from 'react';
import {
  View,              // Konteyner
  Text,              // Matn
  TextInput,         // Matn kiritish maydoni
  StyleSheet,        // Stillar
  TouchableOpacity,  // Bosiladigan element
  ScrollView,        // Scroll qilinadigan konteyner
  Alert,             // Ogohlantirish dialogi
  KeyboardAvoidingView, // Klaviatura ochilganda forma ko'rinishi
  Platform,          // Platforma aniqlash (iOS/Android)
  ActivityIndicator, // Yuklanish indikatori
} from 'react-native';

// Task qo'shish funksiyasi
import { addTask } from '../storage/taskStorage';

/**
 * Ustuvorlik darajalari
 * Foydalanuvchi ulardan birini tanlaydi
 */
const PRIORITIES = [
  {
    key: 'low',
    label: 'Past',
    icon: '🟢',
    color: '#00875A',
    bgColor: '#E3FCEF',
    description: 'Shoshilish kerak emas',
  },
  {
    key: 'medium',
    label: "O'rta",
    icon: '🟡',
    color: '#FF991F',
    bgColor: '#FFF7E6',
    description: 'Normal muddat',
  },
  {
    key: 'high',
    label: 'Yuqori',
    icon: '🔴',
    color: '#DE350B',
    bgColor: '#FFEBE6',
    description: 'Shoshilinch!',
  },
];

/**
 * AddTaskScreen komponenti
 * 
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation obyekti
 */
const AddTaskScreen = ({ navigation }) => {
  // === STATE (holat) o'zgaruvchilari ===

  // Sarlavha (majburiy)
  const [title, setTitle] = useState('');

  // Tavsif (ixtiyoriy)
  const [description, setDescription] = useState('');

  // Muddat - YYYY-MM-DD formatda (ixtiyoriy)
  const [deadline, setDeadline] = useState('');

  // Tanlangan ustuvorlik (default: medium)
  const [priority, setPriority] = useState('medium');

  // Saqlash jarayoni holati
  const [saving, setSaving] = useState(false);

  // Xatolik xabarlari
  const [errors, setErrors] = useState({});

  /**
   * Formani tekshirish (validatsiya)
   * 
   * Sarlavha bo'sh bo'lmasligi va muddat to'g'ri formatda bo'lishi kerak.
   * 
   * @returns {boolean} - true agar forma to'g'ri to'ldirilgan bo'lsa
   */
  const validateForm = () => {
    const newErrors = {};

    // Sarlavha tekshirish
    if (!title.trim()) {
      newErrors.title = 'Sarlavha kiritish majburiy';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Sarlavha kamida 3 ta belgidan iborat bo\'lishi kerak';
    }

    // Muddat tekshirish (agar kiritilgan bo'lsa)
    if (deadline.trim()) {
      // Oddiy format tekshirish: YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(deadline.trim())) {
        newErrors.deadline = 'Sana formati: YYYY-MM-DD (masalan: 2024-12-31)';
      } else {
        // Sananing haqiqiyligini tekshirish
        const date = new Date(deadline.trim());
        if (isNaN(date.getTime())) {
          newErrors.deadline = "Noto'g'ri sana kiritildi";
        }
      }
    }

    // Xatoliklarni saqlash
    setErrors(newErrors);

    // Agar xatoliklar bo'sh bo'lsa, forma to'g'ri
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Taskni saqlash funksiyasi
   * 
   * Formani tekshirib, to'g'ri bo'lsa AsyncStorage'ga saqlaydi
   * va bosh ekranga qaytadi.
   */
  const handleSave = async () => {
    // Formani tekshirish
    if (!validateForm()) {
      return; // Xatoliklar bo'lsa, to'xtaymiz
    }

    setSaving(true); // Yuklanish holati

    try {
      // Yangi task yaratish
      await addTask({
        title: title.trim(),           // Sarlavha (bo'shliqlarni olib tashlash)
        description: description.trim(), // Tavsif
        deadline: deadline.trim() || null, // Muddat (bo'sh bo'lsa null)
        priority,                        // Ustuvorlik
      });

      // Muvaffaqiyatli saqlangandan keyin bosh ekranga qaytish
      navigation.goBack();
    } catch (err) {
      // Xatolik yuz bersa ogohlantirish ko'rsatamiz
      Alert.alert(
        'Xatolik',
        "Taskni saqlashda xatolik yuz berdi. Qayta urinib ko'ring.",
        [{ text: 'OK' }]
      );
      console.error('Saqlash xatoligi:', err);
    } finally {
      setSaving(false); // Yuklanish tugadi
    }
  };

  return (
    // Klaviatura ochilganda formani yuqoriga surish
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Klaviatura ochiq bo'lganda ham tugma bosish
      >
        {/* Forma bosh qismi */}
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Yangi Task</Text>
          <Text style={styles.formSubtitle}>
            Barcha majburiy maydonlarni to'ldiring
          </Text>
        </View>

        {/* === Sarlavha maydoni === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Sarlavha <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              // Xatolik bo'lsa qizil chegara
              errors.title && styles.inputError,
            ]}
            placeholder="Task sarlavhasini kiriting..."
            placeholderTextColor="#A5ADBA"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              // Yozish paytida xatolikni tozalash
              if (errors.title) {
                setErrors((prev) => ({ ...prev, title: null }));
              }
            }}
            maxLength={100} // Maksimal 100 belgi
            autoFocus={true} // Avtomatik fokus
          />
          {/* Xatolik xabari */}
          {errors.title && (
            <Text style={styles.errorText}>⚠️ {errors.title}</Text>
          )}
          {/* Belgilar hisoblagichi */}
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* === Tavsif maydoni === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tavsif</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Task haqida qo'shimcha ma'lumot..."
            placeholderTextColor="#A5ADBA"
            value={description}
            onChangeText={setDescription}
            multiline={true}        // Ko'p qatorli
            numberOfLines={4}       // 4 qator balandlik
            maxLength={500}         // Maksimal 500 belgi
            textAlignVertical="top" // Matnni yuqoridan boshlash
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* === Muddat maydoni === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>📅 Muddat</Text>
          <TextInput
            style={[
              styles.input,
              errors.deadline && styles.inputError,
            ]}
            placeholder="YYYY-MM-DD (masalan: 2024-12-31)"
            placeholderTextColor="#A5ADBA"
            value={deadline}
            onChangeText={(text) => {
              setDeadline(text);
              if (errors.deadline) {
                setErrors((prev) => ({ ...prev, deadline: null }));
              }
            }}
            keyboardType="numeric" // Raqamli klaviatura
            maxLength={10}
          />
          {errors.deadline && (
            <Text style={styles.errorText}>⚠️ {errors.deadline}</Text>
          )}
        </View>

        {/* === Ustuvorlik tanlash === */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>🎯 Ustuvorlik</Text>
          <View style={styles.priorityContainer}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.priorityOption,
                  // Tanlangan ustuvorlik uchun maxsus stil
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
                <Text style={styles.priorityDesc}>{p.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* === Tugmalar === */}
        <View style={styles.buttonContainer}>
          {/* Saqlash tugmasi */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              // Saqlash paytida o'chirilgan ko'rinish
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving} // Saqlash paytida bosib bo'lmaydi
            activeOpacity={0.8}
          >
            {saving ? (
              // Yuklanish indikatori
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>✅ Saqlash</Text>
            )}
          </TouchableOpacity>

          {/* Bekor qilish tugmasi */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
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
  },

  // Kiritish maydoni guruhi
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
    color: '#DE350B',                  // Qizil yulduzcha
  },

  // Kiritish maydoni
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

  // Fokusda yoki xatolikda
  inputError: {
    borderColor: '#DE350B',
  },

  // Ko'p qatorli kiritish maydoni
  textArea: {
    height: 110,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  // Xatolik xabari
  errorText: {
    color: '#DE350B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },

  // Belgilar hisoblagichi
  charCount: {
    color: '#A5ADBA',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },

  // Ustuvorlik konteyneri
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
    marginBottom: 2,
  },

  priorityDesc: {
    fontSize: 10,
    color: '#6B778C',
    textAlign: 'center',
  },

  // Tugmalar konteyneri
  buttonContainer: {
    marginTop: 12,
    gap: 12,
  },

  // Saqlash tugmasi
  saveButton: {
    backgroundColor: '#0052CC',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    // Soya
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  saveButtonDisabled: {
    backgroundColor: '#B3D4FF',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // Bekor qilish tugmasi
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

export default AddTaskScreen;
