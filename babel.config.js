/**
 * babel.config.js - Babel konfiguratsiyasi
 * 
 * Babel - JavaScript kodni "tarjima" qiladi.
 * Expo uchun maxsus preset va reanimated plugin kerak.
 */
module.exports = function (api) {
  // Babel konfiguratsiyasini keshlaymiz (tezlashirish uchun)
  api.cache(true);

  return {
    // Expo'ning standart preset'i
    presets: ['babel-preset-expo'],
    // Qo'shimcha pluginlar
    plugins: [
      // Reanimated plugin - DOIMO oxirgi bo'lishi kerak!
      'react-native-reanimated/plugin',
    ],
  };
};
