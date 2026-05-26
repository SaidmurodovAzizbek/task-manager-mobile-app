/**
 * App.js - Ilovaning asosiy kirish nuqtasi (Entry Point)
 * 
 * Bu fayl:
 * 1. React Navigation'ni sozlaydi
 * 2. Barcha ekranlarni bir-biriga bog'laydi
 * 3. Navigatsiya stilini belgilaydi (Jira uslubi)
 * 
 * React Navigation ishlash tartibi:
 * NavigationContainer > Stack.Navigator > Stack.Screen (ekranlar)
 */

import React from 'react';
import { StatusBar } from 'react-native';

// React Navigation kutubxonalari
// NavigationContainer - navigatsiya tizimining asosiy qobig'i
import { NavigationContainer } from '@react-navigation/native';
// createNativeStackNavigator - ekranlar orasida o'tish (stack)
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Ekranlar (screens)
import HomeScreen from './screens/HomeScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import EditTaskScreen from './screens/EditTaskScreen';

// Stack navigatorni yaratish
// Bu bizga ekranlar orasida "oldinga" va "orqaga" o'tish imkonini beradi
const Stack = createNativeStackNavigator();

/**
 * App - asosiy komponent
 * 
 * Bu yerda navigatsiya tuzilmasi aniqlanadi.
 * Har bir Stack.Screen - bu alohida ekran.
 */
export default function App() {
  return (
    // NavigationContainer - barcha navigatsiyani o'rab turadi
    <NavigationContainer>
      {/* StatusBar - telefon yuqorisidagi soat, batareya va h.k. */}
      <StatusBar barStyle="light-content" backgroundColor="#0052CC" />

      {/* Stack Navigator - ekranlar stack (qatlam) ko'rinishida */}
      <Stack.Navigator
        // Boshlang'ich ekran - HomeScreen
        initialRouteName="Home"
        // Barcha ekranlar uchun umumiy stil sozlamalari
        screenOptions={{
          // Header (yuqori panel) stili
          headerStyle: {
            backgroundColor: '#0052CC',      // Jira ko'k rangi
          },
          headerTintColor: '#FFFFFF',         // Header matn rangi (oq)
          headerTitleStyle: {
            fontWeight: '700',                // Qalin shrift
            fontSize: 18,                     // Shrift hajmi
          },
          // Header soyasi
          headerShadowVisible: false,
          // Animatsiya turi
          animation: 'slide_from_right',      // O'ngdan chapga
          // Content stili
          contentStyle: {
            backgroundColor: '#F4F5F7',       // Kontent foni
          },
        }}
      >
        {/* 
          Bosh ekran - barcha tasklar ro'yxati
          name="Home" - bu ekranning nomi (navigatsiyada ishlatiladi)
          component={HomeScreen} - ko'rsatiladigan komponent
        */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            // Bu ekranda header ko'rsatmaymiz (o'zimiz yaratganmiz)
            headerShown: false,
          }}
        />

        {/* 
          Yangi task qo'shish ekrani
          navigation.navigate('AddTask') orqali ochiladi
        */}
        <Stack.Screen
          name="AddTask"
          component={AddTaskScreen}
          options={{
            title: 'Yangi Task',               // Header sarlavhasi
            // Header chap tomondagi "Orqaga" tugma matni
            headerBackTitle: 'Orqaga',
          }}
        />

        {/* 
          Task tahrirlash ekrani
          navigation.navigate('EditTask', { task }) orqali ochiladi
          route.params.task - tahrir qilinadigan task ma'lumotlari
        */}
        <Stack.Screen
          name="EditTask"
          component={EditTaskScreen}
          options={{
            title: 'Tahrirlash',                // Header sarlavhasi
            headerBackTitle: 'Orqaga',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
