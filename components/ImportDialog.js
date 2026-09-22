/**
 * ImportDialog.js - Zaxira nusxadan tiklash oynasi
 *
 * Foydalanuvchi "Zaxira nusxa olish" orqali olgan matnni shu yerga
 * qo'yadi (paste qiladi) va tasklari qaytadi.
 *
 * Mavjud tasklar o'chirilmaydi - yangilari ustiga qo'shiladi.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { colors } from '../theme/colors';

/**
 * ImportDialog komponenti
 *
 * @param {Object} props
 * @param {boolean} props.visible - Oyna ochiqmi
 * @param {Function} props.onClose - Yopish
 * @param {Function} props.onImport - async (matn) => tiklangan tasklar soni
 */
const ImportDialog = ({ visible, onClose, onImport }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Oynani tozalab yopish.
   * Keyingi safar ochilganda eski matn qolib ketmasligi kerak.
   */
  const handleClose = () => {
    setText('');
    setError(null);
    onClose();
  };

  /**
   * Tiklash tugmasi.
   */
  const handleImport = async () => {
    if (!text.trim()) {
      setError('Avval zaxira nusxa matnini qo\'ying');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await onImport(text.trim());
      // Muvaffaqiyatli tiklandi - oynani tozalab yopamiz
      setText('');
      onClose();
    } catch (err) {
      console.error('Tiklash xatoligi:', err);
      // JSON buzuq bo'lsa yoki ichida task bo'lmasa shu yerga tushamiz
      setError("Matn tanilmadi. To'liq zaxira nusxani qo'yganingizga ishonch hosil qiling.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.dialog}>
          <Text style={styles.title}>📥 Zaxiradan tiklash</Text>
          <Text style={styles.subtitle}>
            Zaxira nusxa matnini pastdagi maydonga qo'ying.
            Mavjud tasklaringiz o'chmaydi.
          </Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder='{"app": "task-manager-mobile-app", ...}'
            placeholderTextColor={colors.textSubtle}
            value={text}
            onChangeText={(value) => {
              setText(value);
              if (error) setError(null);
            }}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={busy}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Bekor qilish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, busy && styles.buttonBusy]}
              onPress={handleImport}
              disabled={busy}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={styles.confirmText}>Tiklash</Text>
              )}
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
  },

  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
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
    marginBottom: 14,
  },

  input: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    height: 140,
    fontSize: 12,
    color: colors.text,
    // Bir xil kenglikdagi shrift - JSON matni chiroyli ko'rinadi
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  inputError: {
    borderColor: colors.danger,
  },

  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
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

export default ImportDialog;
