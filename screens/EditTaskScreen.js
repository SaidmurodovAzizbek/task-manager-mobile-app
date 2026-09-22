/**
 * EditTaskScreen.js - Mavjud taskni tahrirlash ekrani
 *
 * Tahrirlanayotgan task HomeScreen'dan route.params orqali keladi:
 *     navigation.navigate('EditTask', { task })
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import TaskForm from '../components/TaskForm';
import { colors } from '../theme/colors';
import { updateTask } from '../storage/taskStorage';

/**
 * Task holatini ko'rsatuvchi nishon (Faol / Bajarilgan).
 * Forma sarlavhasi ostida turadi.
 *
 * @param {Object} props
 * @param {boolean} props.completed - Task bajarilganmi
 */
const StatusBadge = ({ completed }) => (
  <View
    style={[
      styles.statusBadge,
      completed ? styles.statusCompleted : styles.statusActive,
    ]}
  >
    <Text
      style={[
        styles.statusText,
        completed ? styles.statusTextCompleted : styles.statusTextActive,
      ]}
    >
      {completed ? '✅ Bajarilgan' : '🔄 Faol'}
    </Text>
  </View>
);

/**
 * EditTaskScreen komponenti
 *
 * @param {Object} props
 * @param {Object} props.route - Route parametrlari ({ task })
 * @param {Object} props.navigation - React Navigation obyekti
 */
const EditTaskScreen = ({ route, navigation }) => {
  const { task } = route.params;

  return (
    <TaskForm
      navigation={navigation}
      task={task}
      title="✏️ Taskni tahrirlash"
      subtitle="O'zgartirmoqchi bo'lgan maydonlarni yangilang"
      submitLabel="💾 Yangilash"
      headerExtra={<StatusBadge completed={task.completed} />}
      onSubmit={(values) => updateTask(task.id, values)}
    />
  );
};

const styles = StyleSheet.create({
  statusBadge: {
    alignSelf: 'flex-start', // Faqat matn kengligicha joy egallaydi
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },

  statusActive: {
    backgroundColor: colors.primarySurface,
  },

  statusCompleted: {
    backgroundColor: colors.successSurface,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  statusTextActive: {
    color: colors.primaryDark,
  },

  statusTextCompleted: {
    color: colors.success,
  },
});

export default EditTaskScreen;
