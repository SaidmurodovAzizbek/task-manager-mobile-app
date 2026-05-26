/**
 * HomeScreen.js - Bosh ekran (barcha tasklar ro'yxati)
 * 
 * Bu ekranda:
 * - Barcha tasklar ro'yxat ko'rinishida ko'rsatiladi
 * - Taskni bajarilgan deb belgilash mumkin (checkbox)
 * - Taskni o'chirish mumkin (delete tugma)
 * - Taskga bosib tahrirlash mumkin
 * - Yangi task qo'shish tugmasi bor (+ tugma)
 * - Filtrlash imkoniyati: Barchasi / Faol / Bajarilgan
 * 
 * Jira Board ko'rinishidan ilhomlangan.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,              // Konteyner
  Text,              // Matn
  FlatList,           // Samarali ro'yxat (lazy loading)
  StyleSheet,        // Stillar
  TouchableOpacity,  // Bosiladigan element
  StatusBar,         // Status bar sozlamalari
  ActivityIndicator, // Yuklanish indikatori
  RefreshControl,    // Pastga tortish orqali yangilash
  SafeAreaView,      // Xavfsiz zona (notch va boshqalar uchun)
} from 'react-native';

// Maxsus komponentlar
import TaskItem from '../components/TaskItem';
import EmptyList from '../components/EmptyList';

// Storage funksiyalari
import { getAllTasks, toggleTaskComplete, deleteTask } from '../storage/taskStorage';

/**
 * Filtr turlari
 * Foydalanuvchi tasklarni filtrlashi mumkin
 */
const FILTERS = [
  { key: 'all', label: 'Barchasi' },         // Barcha tasklar
  { key: 'active', label: 'Faol' },           // Faqat bajarilmaganlar
  { key: 'completed', label: 'Bajarilgan' },  // Faqat bajarilganlar
];

/**
 * HomeScreen komponenti
 * 
 * @param {Object} props - React Navigation proplari
 * @param {Object} props.navigation - Navigatsiya obyekti
 */
const HomeScreen = ({ navigation }) => {
  // === STATE (holat) o'zgaruvchilari ===

  // Barcha tasklar massivi
  const [tasks, setTasks] = useState([]);

  // Yuklanish holati (true = yuklanmoqda)
  const [loading, setLoading] = useState(true);

  // Yangilanish holati (pastga tortish)
  const [refreshing, setRefreshing] = useState(false);

  // Hozirgi filtr ("all", "active", "completed")
  const [activeFilter, setActiveFilter] = useState('all');

  // Xatolik xabari
  const [error, setError] = useState(null);

  /**
   * Tasklarni yuklash funksiyasi
   * 
   * useCallback - funksiyani qayta yaratmaslik uchun 
   * (performance optimizatsiya)
   */
  const loadTasks = useCallback(async () => {
    try {
      setError(null); // Avvalgi xatolikni tozalash
      // AsyncStorage'dan tasklarni olamiz
      const loadedTasks = await getAllTasks();
      // State'ga saqlaymiz
      setTasks(loadedTasks);
    } catch (err) {
      // Xatolik bo'lsa, xabar saqlaymiz
      setError("Tasklarni yuklashda xatolik yuz berdi");
      console.error('Yuklash xatoligi:', err);
    } finally {
      // Yuklanish tugadi (muvaffaqiyatli yoki xatolik bilan)
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Ekran ochilganda va qayta fokus bo'lganda tasklarni yuklash
   * 
   * useEffect - komponent paydo bo'lganda ishga tushadi
   * navigation.addListener('focus') - ekran fokusga kelganda
   */
  useEffect(() => {
    // Birinchi marta yuklash
    loadTasks();

    // Ekranga qaytganda yangilash (masalan, task qo'shilgandan keyin)
    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks();
    });

    // Cleanup - listener'ni o'chirish
    return unsubscribe;
  }, [navigation, loadTasks]);

  /**
   * Pastga tortib yangilash (Pull to Refresh)
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, [loadTasks]);

  /**
   * Task checkbox'ini almashtirish
   * 
   * @param {string} taskId - Task ID'si
   */
  const handleToggle = async (taskId) => {
    try {
      // AsyncStorage'da yangilaymiz va yangi ro'yxatni olamiz
      const updatedTasks = await toggleTaskComplete(taskId);
      setTasks(updatedTasks);
    } catch (err) {
      setError("Task holatini o'zgartirishda xatolik");
    }
  };

  /**
   * Taskni o'chirish
   * 
   * @param {string} taskId - Task ID'si
   */
  const handleDelete = async (taskId) => {
    try {
      const updatedTasks = await deleteTask(taskId);
      setTasks(updatedTasks);
    } catch (err) {
      setError("Taskni o'chirishda xatolik");
    }
  };

  /**
   * Task kartochkasini bosish - tahrirlash ekraniga o'tish
   * 
   * @param {Object} task - Bosilgan task obyekti
   */
  const handleTaskPress = (task) => {
    // EditTaskScreen'ga task ma'lumotlarini yuboramiz
    navigation.navigate('EditTask', { task });
  };

  /**
   * Filtr bo'yicha tasklarni filtrlash
   * 
   * activeFilter'ga qarab faqat kerakli tasklarni ko'rsatamiz
   */
  const getFilteredTasks = () => {
    switch (activeFilter) {
      case 'active':
        // Faqat bajarilmagan tasklar
        return tasks.filter((task) => !task.completed);
      case 'completed':
        // Faqat bajarilgan tasklar
        return tasks.filter((task) => task.completed);
      default:
        // Barcha tasklar
        return tasks;
    }
  };

  // Filtrlangan tasklarni olamiz
  const filteredTasks = getFilteredTasks();

  // Statistika: bajarilgan tasklar soni
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.filter((t) => !t.completed).length;

  /**
   * Yuklanish holati - spinner ko'rsatamiz
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0052CC" />
        <Text style={styles.loadingText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Status bar sozlamalari */}
      <StatusBar barStyle="light-content" backgroundColor="#0052CC" />

      {/* Header - Bosh qism */}
      <View style={styles.header}>
        {/* Sarlavha */}
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>📋 Task Manager</Text>
            <Text style={styles.headerSubtitle}>
              {tasks.length} ta task · {completedCount} bajarilgan
            </Text>
          </View>
        </View>

        {/* Filtr tugmalari */}
        <View style={styles.filterContainer}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                // Faol filtr uchun maxsus stil
                activeFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
                {/* Filtr yonida son ko'rsatish */}
                {filter.key === 'active' && ` (${activeCount})`}
                {filter.key === 'completed' && ` (${completedCount})`}
                {filter.key === 'all' && ` (${tasks.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Xatolik xabari */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={loadTasks}>
            <Text style={styles.retryText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tasklar ro'yxati */}
      <FlatList
        data={filteredTasks}              // Ko'rsatiladigan ma'lumotlar
        keyExtractor={(item) => item.id}  // Har bir element uchun noyob kalit
        renderItem={({ item }) => (       // Har bir elementni qanday ko'rsatish
          <TaskItem
            task={item}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onPress={handleTaskPress}
          />
        )}
        // Task yo'q bo'lganda ko'rsatiladigan komponent
        ListEmptyComponent={<EmptyList />}
        // Ro'yxat pastidan bo'shliq (FAB tugma uchun)
        contentContainerStyle={[
          styles.listContainer,
          filteredTasks.length === 0 && styles.emptyListContainer,
        ]}
        // Pastga tortib yangilash
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0052CC']}           // Android spinner rangi
            tintColor="#0052CC"             // iOS spinner rangi
          />
        }
        // Performance optimizatsiyalari
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
      />

      {/* FAB - Yangi task qo'shish tugmasi (Floating Action Button) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Stillar
const styles = StyleSheet.create({
  // Xavfsiz zona
  safeArea: {
    flex: 1,
    backgroundColor: '#0052CC',        // Header rangi
  },

  // Yuklanish ekrani
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B778C',
  },

  // Header
  header: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },

  // Filtr konteyneri
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 3,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },

  filterButtonActive: {
    backgroundColor: '#FFFFFF',
  },

  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },

  filterTextActive: {
    color: '#0052CC',
  },

  // Xatolik banner
  errorBanner: {
    backgroundColor: '#FFEBE6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  errorText: {
    color: '#DE350B',
    fontSize: 13,
    flex: 1,
  },

  retryText: {
    color: '#0052CC',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 12,
  },

  // Ro'yxat konteyneri
  listContainer: {
    paddingTop: 10,
    paddingBottom: 90,                 // FAB tugma uchun bo'shliq
    backgroundColor: '#F4F5F7',
    flexGrow: 1,
  },

  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',             // Qo'zg'almas joylashuv
    right: 20,                         // O'ng tomondan
    bottom: 30,                        // Pastdan
    width: 60,                         // Kenglik
    height: 60,                        // Balandlik
    borderRadius: 30,                  // To'liq yumaloq
    backgroundColor: '#0052CC',        // Ko'k rang
    justifyContent: 'center',
    alignItems: 'center',
    // Soya
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,                      // Android soya
  },

  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,                     // Biroz yuqoriga
  },
});

export default HomeScreen;
