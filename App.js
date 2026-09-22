/**
 * App.js - Ilovaning asosiy komponenti
 *
 * Bu yerda:
 * 1. Xavfsiz zona (notch, status bar) hisobga olinadi;
 * 2. Navigatsiya sozlanadi;
 * 3. Ekranlar bir-biriga bog'lanadi.
 *
 * Tuzilma: SafeAreaProvider > NavigationContainer > Stack.Navigator > ekranlar
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import EditTaskScreen from './screens/EditTaskScreen';
import { colors } from './theme/colors';

// Stack navigator - ekranlar "qatlam" bo'lib ustma-ust ochiladi
const Stack = createNativeStackNavigator();

/**
 * App - ildiz komponent
 */
export default function App() {
  return (
    // SafeAreaProvider - ekranlarga telefon chekkalari o'lchamini yetkazib beradi.
    // Usiz Android'da header status bar ostiga kirib ketadi.
    <SafeAreaProvider>
      {/* Status bar matni oq bo'lsin (foni ko'k) */}
      <StatusBar style="light" backgroundColor={colors.primary} />

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.textInverse,
            headerTitleStyle: { fontWeight: '700', fontSize: 18 },
            headerShadowVisible: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {/* Bosh ekran - o'zining header'i bor, shuning uchun tizimnikini yashiramiz */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />

          {/* Yangi task qo'shish */}
          <Stack.Screen
            name="AddTask"
            component={AddTaskScreen}
            options={{ title: 'Yangi Task', headerBackTitle: 'Orqaga' }}
          />

          {/* Mavjud taskni tahrirlash */}
          <Stack.Screen
            name="EditTask"
            component={EditTaskScreen}
            options={{ title: 'Tahrirlash', headerBackTitle: 'Orqaga' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
