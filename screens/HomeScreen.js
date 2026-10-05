/**
 * HomeScreen.js - Bosh ekran (tasklar ro'yxati)
 *
 * Bu ekranda:
 * - barcha tasklar ro'yxati;
 * - qidiruv, filtr (Barchasi / Faol / Bajarilgan) va saralash;
 * - kategoriya bo'yicha filtr (Ish, Sport, ...);
 * - taskni bajarildi deb belgilash, tahrirlash, o'chirish;
 * - o'chirilgan taskni qaytarish ("Qaytarish" tugmasi);
 * - daraja paneli va task bajarilganda "+31 ball" xabari;
 * - zaxira nusxa va tozalash amallari (o'ng yuqoridagi "⋯" menyu).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TaskItem from '../components/TaskItem';
import EmptyList from '../components/EmptyList';
import TaskMenu from '../components/TaskMenu';
import ImportDialog from '../components/ImportDialog';
import CategoryFilterBar from '../components/CategoryFilterBar';
import LevelBar from '../components/LevelBar';
import RewardToast from '../components/RewardToast';
import { useCategories } from '../hooks/useCategories';
import { colors } from '../theme/colors';
import {
  clearAllTasks,
  clearCompletedTasks,
  deleteTask,
  exportTasks,
  getAllTasks,
  getScoreBank,
  getSettings,
  importTasks,
  restoreTask,
  saveSettings,
  toggleTaskComplete,
} from '../storage/taskStorage';
import {
  filterTasks,
  getStats,
  SORT_OPTIONS,
  sortTasks,
  TASK_FILTERS,
} from '../utils/taskUtils';
import { countByCategory, findCategory } from '../utils/categoryUtils';
import { describeToggle, EMPTY_BANK, getScoreSummary } from '../utils/pointsUtils';

// O'chirilgan taskni qaytarish uchun beriladigan vaqt (millisekund)
const UNDO_TIMEOUT = 6000;

/**
 * Modal oyna yopilib bo'lgunicha kutish vaqti.
 *
 * iOS ikkita oynani bir vaqtda ko'rsata olmaydi: menyu yopilmasdan
 * turib Alert yoki "ulashish" oynasini ochsak, u umuman chiqmaydi.
 */
const MODAL_CLOSE_DELAY = Platform.OS === 'ios' ? 350 : 0;

/**
 * HomeScreen komponenti
 *
 * @param {Object} props
 * @param {Object} props.navigation - React Navigation obyekti
 */
const HomeScreen = ({ navigation }) => {
  // Telefon "tirnog'i" (notch) va pastki chiziq o'lchamlari
  const insets = useSafeAreaInsets();

  // === Ma'lumot holati ===
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // === Ko'rinish holati ===
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('created');
  const [category, setCategory] = useState('all');

  // Kategoriyalar ro'yxati (ekran fokusga kelganda yangilanadi)
  const [categories] = useCategories();

  // === Oynalar ===
  const [menuVisible, setMenuVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);

  // Ballar banki (o'chirilgan bajarilgan tasklardan qolgan ballar)
  const [bank, setBank] = useState(EMPTY_BANK);

  // "+31 ball" xabari: describeToggle natijasi yoki null
  const [toast, setToast] = useState(null);
  const hideToast = useCallback(() => setToast(null), []);

  // O'chirilgan task: { task, index } - "Qaytarish" uchun saqlab turamiz
  const [undoItem, setUndoItem] = useState(null);
  const undoTimer = useRef(null);

  /**
   * Tasklarning "nusxasi" ref ichida.
   *
   * Nega kerak? O'chirish funksiyasiga taskning ro'yxatdagi o'rni kerak.
   * Agar u to'g'ridan-to'g'ri `tasks` ga bog'lansa, har bir o'zgarishda
   * qaytadan yaratiladi va TaskItem'dagi memo ishlamay qoladi - ya'ni
   * bitta katakcha belgilansa ham butun ro'yxat qaytadan chiziladi.
   */
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Bank ham xuddi shu sababdan ref ichida
  const bankRef = useRef(bank);
  useEffect(() => {
    bankRef.current = bank;
  }, [bank]);

  /**
   * Ro'yxatni o'zgartiruvchi amal (o'chirish, qaytarish, tozalash) natijasini
   * qo'llash. Bu amallar bankni ham o'zgartiradi, shuning uchun ikkalasi
   * BIRGA yangilanadi - aks holda jami ball bir lahza "sakrab" ketadi.
   *
   * @param {Promise<Array>} pending - Storage funksiyasi qaytargan va'da
   * @returns {Promise<Array>} - Yangi ro'yxat
   */
  const applyChange = useCallback(async (pending) => {
    const list = await pending;
    const saved = await getScoreBank();

    setTasks(list);
    setBank(saved);
    return list;
  }, []);

  /**
   * Tasklarni xotiradan o'qish.
   */
  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const [list, saved] = await Promise.all([getAllTasks(), getScoreBank()]);
      setTasks(list);
      setBank(saved);
    } catch (err) {
      console.error('Yuklash xatoligi:', err);
      setError('Tasklarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Ekran har safar ochilganda (va qayta fokusga kelganda) yangilaymiz.
   * Masalan: task qo'shib qaytganda ro'yxat o'zi yangilanadi.
   */
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  /**
   * Saqlangan sozlamalarni bir marta - ilova ochilganda o'qiymiz.
   * Shunda tanlangan saralash tartibi keyingi safar ham eslab qolinadi.
   */
  useEffect(() => {
    let active = true; // Komponent hali ekrandami?

    getSettings().then((settings) => {
      if (!active) return;
      if (settings.sortKey) setSortKey(settings.sortKey);
      if (settings.filter) setFilter(settings.filter);
      if (settings.category) setCategory(settings.category);
    });

    return () => {
      active = false;
    };
  }, []);

  /**
   * Komponent yopilganda "Qaytarish" taymerini to'xtatamiz.
   * Aks holda yo'q komponentning holati o'zgartirilib, ogohlantirish chiqadi.
   */
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  // === Ro'yxatni tayyorlash ===

  // Eslab qolingan kategoriya o'chirib yuborilgan bo'lishi mumkin -
  // unda filtrsiz ko'rsatamiz
  const activeCategory =
    category !== 'all' && categories.some((c) => c.key === category) ? category : 'all';

  // useMemo - tasklar yoki filtr o'zgarmasa, qayta hisoblamaymiz
  const visibleTasks = useMemo(
    () =>
      sortTasks(
        filterTasks(tasks, { filter, query, category: activeCategory, categories }),
        sortKey
      ),
    [tasks, filter, query, activeCategory, categories, sortKey]
  );

  /**
   * Kategoriya tugmachalaridagi sonlar.
   * Holat filtri (Faol / Bajarilgan) hisobga olinadi: "Faol" tanlangan
   * bo'lsa, har bir kategoriyadagi FAOL tasklar soni ko'rinadi.
   */
  const statusTasks = useMemo(() => filterTasks(tasks, { filter }), [tasks, filter]);
  const categoryCounts = useMemo(
    () => countByCategory(statusTasks, categories),
    [statusTasks, categories]
  );

  // Kalit -> kategoriya. Kartochkaga bir xil obyekt borsa, memo ishlaydi.
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.key, c])),
    [categories]
  );

  const stats = useMemo(() => getStats(tasks), [tasks]);
  const score = useMemo(() => getScoreSummary(tasks, bank), [tasks, bank]);

  /**
   * Har bir filtr yonida ko'rsatiladigan son.
   *
   * @param {string} key - Filtr kaliti
   * @returns {number}
   */
  const getFilterCount = (key) => {
    if (key === 'active') return stats.active;
    if (key === 'completed') return stats.completed;
    return stats.total;
  };

  // -------------------------------------------------------------------------
  // Amallar
  // -------------------------------------------------------------------------

  /**
   * Pastga tortib yangilash.
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, [loadTasks]);

  /**
   * Bajarildi / bajarilmadi holatini almashtirish.
   * Natijada qancha ball olingani (yoki qaytarilgani) xabar bo'lib chiqadi.
   */
  const handleToggle = useCallback(async (taskId) => {
    try {
      const before = getScoreSummary(tasksRef.current, bankRef.current);
      const updated = await toggleTaskComplete(taskId);
      setTasks(updated);

      const task = updated.find((item) => item.id === taskId);
      if (task) {
        const after = getScoreSummary(updated, bankRef.current);
        // Har safar yangi obyekt - xabar qaytadan "sakraydi"
        setToast({ ...describeToggle(task, before, after), id: Date.now() });
      }
    } catch (err) {
      console.error('Holatni o\'zgartirish xatoligi:', err);
      setError("Task holatini o'zgartirishda xatolik");
    }
  }, []);

  /**
   * Taskni o'chirish.
   *
   * Tasdiqlash so'ralmaydi - buning o'rniga pastda 6 soniya davomida
   * "Qaytarish" tugmasi turadi. Tasodifan o'chirilsa, bir bosishda qaytadi.
   */
  const handleDelete = useCallback(async (task) => {
    // Qaytarish uchun taskning ro'yxatdagi o'rnini eslab qolamiz
    const index = tasksRef.current.findIndex((item) => item.id === task.id);

    try {
      await applyChange(deleteTask(task.id));

      setUndoItem({ task, index: index < 0 ? 0 : index });

      // Avvalgi taymer bo'lsa - to'xtatamiz va yangisini qo'yamiz
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndoItem(null), UNDO_TIMEOUT);
    } catch (err) {
      console.error('O\'chirish xatoligi:', err);
      setError("Taskni o'chirishda xatolik");
    }
  }, [applyChange]);

  /**
   * O'chirilgan taskni joyiga qaytarish.
   */
  const handleUndo = useCallback(async () => {
    if (!undoItem) return;

    clearTimeout(undoTimer.current);

    try {
      await applyChange(restoreTask(undoItem.task, undoItem.index));
    } catch (err) {
      console.error('Qaytarish xatoligi:', err);
      setError('Taskni qaytarishda xatolik');
    } finally {
      setUndoItem(null);
    }
  }, [undoItem, applyChange]);

  /**
   * Tahrirlash ekraniga o'tish.
   */
  const handleTaskPress = useCallback(
    (task) => navigation.navigate('EditTask', { task }),
    [navigation]
  );

  /**
   * Ro'yxatdagi bitta qatorni chizish.
   *
   * useCallback ichida - shunda FlatList har o'zgarishda hamma
   * kartochkani qaytadan chizmaydi.
   */
  const renderTask = useCallback(
    ({ item }) => (
      <TaskItem
        task={item}
        // Noma'lum kategoriya - "Boshqa"
        category={categoryMap.get(item.category) || findCategory(categories, item.category)}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onPress={handleTaskPress}
      />
    ),
    [categoryMap, categories, handleToggle, handleDelete, handleTaskPress]
  );

  /**
   * Saralash tartibini o'zgartirish va eslab qolish.
   */
  const handleSortChange = (key) => {
    setSortKey(key);
    saveSettings({ sortKey: key });
  };

  /**
   * Filtrni o'zgartirish va eslab qolish.
   */
  const handleFilterChange = (key) => {
    setFilter(key);
    saveSettings({ filter: key });
  };

  /**
   * Kategoriya filtrini o'zgartirish va eslab qolish.
   */
  const handleCategoryChange = (key) => {
    setCategory(key);
    saveSettings({ category: key });
  };

  /**
   * Kategoriyalarni boshqarish ekrani.
   */
  const openCategories = () => navigation.navigate('Categories');

  /**
   * Natijalar (ballar va yutuqlar) ekrani.
   */
  const openScore = () => navigation.navigate('Score');

  /**
   * Menyuni yopib, so'ng amalni bajarish.
   *
   * @param {Function} action - Menyu yopilgach ishga tushadigan funksiya
   */
  const runAfterMenuClose = (action) => {
    setMenuVisible(false);
    setTimeout(action, MODAL_CLOSE_DELAY);
  };

  /**
   * Zaxira nusxa olish - tizimning "ulashish" oynasi orqali.
   * Matnni o'zingizga Telegram'da yoki eslatmalarga saqlab qo'yishingiz mumkin.
   */
  const handleExport = () =>
    runAfterMenuClose(async () => {
      try {
        await Share.share({
          message: await exportTasks(),
          title: 'Task Manager zaxira nusxasi',
        });
      } catch (err) {
        console.error('Zaxira olish xatoligi:', err);
        Alert.alert('Xatolik', 'Zaxira nusxa olishda xatolik yuz berdi.');
      }
    });

  /**
   * Zaxiradan tiklash oynasini ochish.
   */
  const handleOpenImport = () => runAfterMenuClose(() => setImportVisible(true));

  /**
   * Zaxira matnini o'qib, tasklarni tiklash.
   *
   * @param {string} text - Foydalanuvchi qo'ygan matn
   */
  const handleImport = async (text) => {
    const restored = await applyChange(importTasks(text));

    // Oyna yopilgach xabar beramiz
    setTimeout(
      () =>
        Alert.alert(
          'Tiklandi',
          `Zaxira nusxa yuklandi. Jami ${restored.length} ta task.`
        ),
      MODAL_CLOSE_DELAY
    );
  };

  /**
   * Bajarilgan tasklarni tozalash (tasdiqlash bilan).
   */
  const handleClearCompleted = () =>
    runAfterMenuClose(() => {
      Alert.alert(
        'Bajarilganlarni tozalash',
        `${stats.completed} ta bajarilgan task o'chiriladi. Ballaringiz saqlanib qoladi. Davom etasizmi?`,
        [
          { text: 'Bekor qilish', style: 'cancel' },
          {
            text: 'Tozalash',
            style: 'destructive',
            onPress: async () => {
              try {
                await applyChange(clearCompletedTasks());
              } catch (err) {
                console.error('Tozalash xatoligi:', err);
                setError('Tozalashda xatolik yuz berdi');
              }
            },
          },
        ]
      );
    });

  /**
   * Barcha tasklarni o'chirish (ikki marta tasdiqlash bilan).
   *
   * Bu amalni qaytarib bo'lmaydi, shuning uchun avval zaxira nusxa
   * olishni eslatib qo'yamiz.
   */
  const handleClearAll = () =>
    runAfterMenuClose(() => {
      Alert.alert(
        'Barcha tasklarni o\'chirish',
        `${stats.total} ta taskning hammasi butunlay o'chiriladi va qaytarib bo'lmaydi.`,
        [
          { text: 'Bekor qilish', style: 'cancel' },
          {
            text: "Ha, o'chirilsin",
            style: 'destructive',
            onPress: async () => {
              try {
                await applyChange(clearAllTasks());
                setUndoItem(null);
              } catch (err) {
                console.error('O\'chirish xatoligi:', err);
                setError("Tasklarni o'chirishda xatolik");
              }
            },
          },
        ]
      );
    });

  // -------------------------------------------------------------------------
  // Ko'rinish
  // -------------------------------------------------------------------------

  // Birinchi yuklanish - aylanuvchi indikator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== Header (ko'k qism) ===== */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>📋 Task Manager</Text>
            <Text style={styles.headerSubtitle}>
              {stats.active} faol · {stats.completed} bajarilgan
              {/* Kechikkanlar bo'lsagina ko'rsatamiz */}
              {stats.overdue > 0 ? ` · ${stats.overdue} kechikkan` : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Menyu"
          >
            <Text style={styles.menuButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Daraja, jami ball va seriya - bosilsa "Natijalar" ochiladi */}
        <LevelBar summary={score} onPress={openScore} />

        {/* Qidiruv maydoni */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Task qidirish..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Task qidirish"
          />

          {/* Tozalash tugmasi - faqat yozilgan bo'lsa */}
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Qidiruvni tozalash"
            >
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtr tugmalari */}
        <View style={styles.filterContainer}>
          {TASK_FILTERS.map((item) => {
            const active = filter === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterButton, active && styles.filterButtonActive]}
                onPress={() => handleFilterChange(item.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${item.label}: ${getFilterCount(item.key)} ta task`}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                  numberOfLines={1}
                >
                  {item.label} ({getFilterCount(item.key)})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ===== Kategoriya filtri =====
          Oddiy View ichida: aks holda gorizontal ScrollView bo'sh joyni
          ro'yxat bilan bo'lishib, ekranning yarmini egallab oladi */}
      <View>
        <CategoryFilterBar
          categories={categories}
          value={activeCategory}
          counts={categoryCounts}
          total={statusTasks.length}
          onChange={handleCategoryChange}
          onManage={openCategories}
        />
      </View>

      {/* ===== Saralash qatori =====
          Yonga suriladi: tor ekranda ham bitta qatorda qoladi */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
        >
          <Text style={styles.sortLabel}>Saralash:</Text>

          {SORT_OPTIONS.map((option) => {
            const active = sortKey === option.key;

            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.sortChip, active && styles.sortChipActive]}
                onPress={() => handleSortChange(option.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Saralash: ${option.label}`}
              >
                <Text
                  style={[styles.sortChipText, active && styles.sortChipTextActive]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Xatolik xabari (agar bo'lsa) */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={loadTasks} accessibilityRole="button">
            <Text style={styles.retryText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ===== Tasklar ro'yxati ===== */}
      <FlatList
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        ListEmptyComponent={
          <EmptyList
            filter={filter}
            query={query}
            category={activeCategory !== 'all' ? categoryMap.get(activeCategory) : null}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          // FAB va pastki chiziq uchun joy
          { paddingBottom: insets.bottom + 100 },
          visibleTasks.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        // Klaviatura ochiq bo'lsa, ro'yxatni aylantirganda yopilsin
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
      />

      {/* ===== "Qaytarish" paneli ===== */}
      {undoItem && (
        <View style={[styles.undoBar, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.undoText} numberOfLines={1}>
            "{undoItem.task.title}" o'chirildi
          </Text>

          <TouchableOpacity
            onPress={handleUndo}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
          >
            <Text style={styles.undoAction}>QAYTARISH</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ===== "+31 ball" xabari (FAB'dan yuqorida) ===== */}
      <RewardToast toast={toast} bottom={insets.bottom + 100} onHide={hideToast} />

      {/* ===== Yangi task qo'shish tugmasi ===== */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        // Kategoriya filtri tanlangan bo'lsa, yangi task o'sha kategoriyada ochiladi
        onPress={() =>
          navigation.navigate(
            'AddTask',
            activeCategory !== 'all' ? { category: activeCategory } : undefined
          )
        }
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Yangi task qo'shish"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ===== Oynalar ===== */}
      <TaskMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        stats={stats}
        score={score}
        onScore={() => runAfterMenuClose(openScore)}
        onExport={handleExport}
        onImport={handleOpenImport}
        onCategories={() => runAfterMenuClose(openCategories)}
        onClearCompleted={handleClearCompleted}
        onClearAll={handleClearAll}
      />

      <ImportDialog
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onImport={handleImport}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMuted,
  },

  // ===== Header =====
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  headerTitleContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.3,
  },

  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
  },

  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuButtonText: {
    fontSize: 22,
    color: colors.textInverse,
    fontWeight: '700',
    // Nuqtalar aylananing o'rtasida tursin
    marginTop: -6,
  },

  // ===== Qidiruv =====
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: colors.textInverse,
    fontSize: 15,
    // Android'da matn maydoni juda baland bo'lib ketmasligi uchun
    paddingVertical: Platform.OS === 'ios' ? 11 : 7,
  },

  searchClear: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
  },

  // ===== Filtr =====
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 3,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
  },

  filterButtonActive: {
    backgroundColor: colors.surface,
  },

  filterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  filterTextActive: {
    color: colors.primary,
  },

  // ===== Saralash =====
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },

  sortLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 2,
  },

  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  sortChipActive: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primary,
  },

  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  sortChipTextActive: {
    color: colors.primary,
  },

  // ===== Xatolik =====
  errorBanner: {
    backgroundColor: colors.dangerSurface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },

  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },

  retryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 12,
  },

  // ===== Ro'yxat =====
  listContent: {
    paddingTop: 6,
    flexGrow: 1,
  },

  listContentEmpty: {
    justifyContent: 'center',
  },

  // ===== "Qaytarish" paneli =====
  undoBar: {
    position: 'absolute',
    left: 16,
    // FAB tugmasi bilan ustma-ust tushmasligi uchun
    right: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#091E42',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  undoText: {
    color: colors.textInverse,
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },

  undoAction: {
    color: '#79E2F2',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ===== FAB =====
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },

  fabText: {
    fontSize: 32,
    color: colors.textInverse,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default HomeScreen;
