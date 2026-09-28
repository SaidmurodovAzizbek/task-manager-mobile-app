/**
 * CategoriesScreen.js - Kategoriyalarni boshqarish ekrani
 *
 * Bu yerda:
 * - standart kategoriyalar (o'zgartirib bo'lmaydi) va ulardagi tasklar soni;
 * - foydalanuvchi qo'shgan kategoriyalar: qo'shish, tahrirlash, o'chirish.
 *
 * Kategoriya o'chirilsa, undagi tasklar yo'qolmaydi - "Boshqa" ga o'tadi.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryDialog from '../components/CategoryDialog';
import { useCategories } from '../hooks/useCategories';
import { colors, getCategoryColors } from '../theme/colors';
import {
  addCategory,
  deleteCategory,
  getAllTasks,
  updateCategory,
} from '../storage/taskStorage';
import { countByCategory, findCategory } from '../utils/categoryUtils';

/**
 * Ro'yxatdagi bitta kategoriya qatori.
 *
 * @param {Object} props
 * @param {Object} props.category - Kategoriya
 * @param {number} props.count - Undagi tasklar soni
 * @param {Function} [props.onEdit] - Tahrirlash (faqat foydalanuvchi kategoriyasida)
 * @param {Function} [props.onDelete] - O'chirish (faqat foydalanuvchi kategoriyasida)
 */
const CategoryRow = ({ category, count, onEdit, onDelete }) => {
  const palette = getCategoryColors(category);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onEdit}
      disabled={!onEdit}
      activeOpacity={0.7}
      accessibilityRole={onEdit ? 'button' : undefined}
      accessibilityLabel={`${category.label}, ${count} ta task`}
      accessibilityHint={onEdit ? 'Tahrirlash uchun bosing' : undefined}
    >
      <View style={[styles.rowIcon, { backgroundColor: palette.bgColor }]}>
        <Text style={styles.rowIconText}>{category.icon}</Text>
      </View>

      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowLabel, { color: palette.color }]} numberOfLines={1}>
          {category.label}
        </Text>
        <Text style={styles.rowHint}>
          {count > 0 ? `${count} ta task` : "Task yo'q"}
        </Text>
      </View>

      {onDelete ? (
        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${category.label} kategoriyasini tahrirlash`}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${category.label} kategoriyasini o'chirish`}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.lockText}>Standart</Text>
      )}
    </TouchableOpacity>
  );
};

/**
 * CategoriesScreen komponenti
 */
const CategoriesScreen = () => {
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useCategories();
  const [tasks, setTasks] = useState([]);

  // Oyna holati: null - yopiq, { category } - ochiq (category yo'q bo'lsa - yangi)
  const [dialog, setDialog] = useState(null);

  /**
   * Tasklar sonini ko'rsatish uchun ro'yxatni yuklaymiz.
   */
  useFocusEffect(
    useCallback(() => {
      let active = true;

      getAllTasks().then((list) => {
        if (active) setTasks(list);
      });

      return () => {
        active = false;
      };
    }, [])
  );

  const counts = useMemo(() => countByCategory(tasks, categories), [tasks, categories]);

  const defaults = categories.filter((c) => !c.custom);
  const customs = categories.filter((c) => c.custom);

  /**
   * Oynada "Qo'shish" / "Yangilash" bosilganda.
   *
   * @param {Object} values - { label, icon, color }
   */
  const handleSubmit = async (values) => {
    if (dialog?.category) {
      setCategories(await updateCategory(dialog.category.key, values));
    } else {
      const { categories: updated } = await addCategory(values);
      setCategories(updated);
    }

    setDialog(null);
  };

  /**
   * Kategoriyani o'chirish (tasdiqlash bilan).
   *
   * @param {Object} category
   */
  const handleDelete = (category) => {
    const count = counts[category.key] || 0;
    const fallback = findCategory(categories, 'other');

    Alert.alert(
      "Kategoriyani o'chirish",
      count > 0
        ? `"${category.label}" o'chiriladi. Undagi ${count} ta task o'chmaydi - "${fallback.label}" kategoriyasiga o'tkaziladi.`
        : `"${category.label}" o'chiriladi.`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: "O'chirish",
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteCategory(category.key);
              setCategories(result.categories);
              setTasks(result.tasks);
            } catch (err) {
              console.error("Kategoriyani o'chirish xatoligi:", err);
              Alert.alert('Xatolik', "Kategoriyani o'chirishda xatolik yuz berdi.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* === Foydalanuvchi kategoriyalari === */}
        <Text style={styles.sectionTitle}>Mening kategoriyalarim</Text>
        <View style={styles.card}>
          {customs.length === 0 ? (
            <Text style={styles.emptyText}>
              Hali o'z kategoriyangiz yo'q. Pastdagi tugma orqali qo'shing -
              u standartlar qatorida doim chiqib turadi.
            </Text>
          ) : (
            customs.map((category, index) => (
              <View key={category.key}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <CategoryRow
                  category={category}
                  count={counts[category.key] || 0}
                  onEdit={() => setDialog({ category })}
                  onDelete={() => handleDelete(category)}
                />
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setDialog({})}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>＋ Yangi kategoriya</Text>
        </TouchableOpacity>

        {/* === Standart kategoriyalar === */}
        <Text style={styles.sectionTitle}>Standart kategoriyalar</Text>
        <View style={styles.card}>
          {defaults.map((category, index) => (
            <View key={category.key}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <CategoryRow category={category} count={counts[category.key] || 0} />
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>
          Kategoriyasi ko'rsatilmagan eski tasklar "Boshqa" da turadi.
        </Text>
      </ScrollView>

      <CategoryDialog
        visible={dialog !== null}
        category={dialog?.category}
        categories={categories}
        onClose={() => setDialog(null)}
        onSubmit={handleSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    shadowColor: '#091E42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  divider: {
    height: 1,
    backgroundColor: colors.surfaceAlt,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  rowIconText: {
    fontSize: 18,
  },

  rowTextContainer: {
    flex: 1,
  },

  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },

  rowHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  rowActions: {
    flexDirection: 'row',
    gap: 6,
  },

  actionButton: {
    padding: 6,
  },

  actionIcon: {
    fontSize: 17,
  },

  lockText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSubtle,
  },

  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    paddingVertical: 16,
  },

  addButton: {
    marginTop: 12,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },

  addButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },

  footnote: {
    fontSize: 12,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: 14,
  },
});

export default CategoriesScreen;
