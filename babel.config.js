/**
 * babel.config.js - Babel konfiguratsiyasi
 *
 * Babel zamonaviy JavaScript va JSX kodini telefon tushunadigan
 * ko'rinishga o'giradi. Expo uchun bitta preset yetarli.
 *
 * Eslatma: ilgari bu yerda 'react-native-reanimated/plugin' bor edi,
 * lekin ilovada reanimated ishlatilmaydi. Bundan tashqari o'rnatilgan
 * reanimated 4 boshqa plugin ('react-native-worklets/plugin') talab
 * qiladi - ya'ni eski sozlama ilovani ishga tushirmasdan to'xtatardi.
 */
module.exports = function (api) {
  // Konfiguratsiyani keshlaymiz (qayta yig'ish tezroq bo'ladi)
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
  };
};
