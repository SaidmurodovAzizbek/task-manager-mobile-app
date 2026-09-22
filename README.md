# 📋 Task Manager

Shaxsiy foydalanish uchun **offline** task (vazifa) boshqaruvchi mobil ilova.
React Native + Expo'da yozilgan.

Barcha ma'lumot telefonning o'z xotirasida saqlanadi: internet, server va
ro'yxatdan o'tish kerak emas. Ilova samolyot rejimida ham to'liq ishlaydi.

---

## Imkoniyatlar

| | |
|---|---|
| ✅ | Task qo'shish, tahrirlash, o'chirish, bajarildi deb belgilash |
| 🔍 | Sarlavha va tavsif bo'yicha qidirish |
| 🎯 | Uch darajali ustuvorlik: Yuqori / O'rta / Past |
| 📅 | Muddat qo'yish + "Bugun / Ertaga / Bir hafta" tez tugmalari |
| ⚠️ | Muddati o'tgan tasklar qizil rangda ajralib turadi |
| ↕️ | Saralash: yangi, muddat, muhimlik yoki alifbo bo'yicha |
| ↩️ | O'chirilgan taskni 6 soniya ichida qaytarish |
| 📤 | Zaxira nusxa olish va undan tiklash |
| 💾 | Tanlangan filtr va saralash tartibi eslab qolinadi |

---

## 1. Tayyorgarlik

Kerak bo'ladi:

- **Node.js 18 yoki undan yangi** — https://nodejs.org
- **Telefon** (Android yoki iPhone) va unda **Expo Go** ilovasi:
  - Android: Play Market'dan "Expo Go"
  - iPhone: App Store'dan "Expo Go"

Kompyuter va telefon **bitta Wi-Fi tarmog'ida** bo'lishi kerak.

## 2. O'rnatish

```bash
npm install
```

## 3. Ishga tushirish

```bash
npm start
```

Terminalda QR kod chiqadi:

- **Android**: Expo Go ilovasini oching → "Scan QR code" → QR kodni skanerlang
- **iPhone**: Kamerani oching → QR kodga qarating → chiqqan havolani bosing

Ilova telefonda ochiladi. Kodni o'zgartirsangiz, ilova o'zi yangilanadi.

> Wi-Fi orqali ulanmasa, tunnel rejimini sinab ko'ring:
> ```bash
> npx expo start --tunnel
> ```

Brauzerda tez ko'rib chiqish uchun (ixtiyoriy, telefon shart emas):

```bash
npm run web
```

## 4. Telefonga doimiy o'rnatish (APK)

Expo Go orqali ishlatish uchun kompyuter yoqiq turishi kerak. Ilovani
telefonga oddiy ilova sifatida, **butunlay mustaqil** o'rnatish uchun APK
fayl yig'iladi. Ikki yo'li bor.

### A) Kompyuterning o'zida yig'ish

Android Studio (Android SDK) va JDK 17 o'rnatilgan bo'lsa, hech qanday
hisob qaydnomasisiz, offline yig'sa bo'ladi:

```bash
npx expo prebuild --platform android --clean
```

Keyin Android SDK yo'lini ko'rsatamiz (bir marta):

```bash
echo "sdk.dir=C:/Users/user/AppData/Local/Android/Sdk" > android/local.properties
```

```bash
cd android && ./gradlew assembleRelease
```

Tayyor fayl: `android/app/build/outputs/apk/release/app-release.apk`

### B) Expo bulutida yig'ish

Kompyuterda Android SDK bo'lmasa:

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest build --platform android --profile preview
```

Yig'ilish tugagach yuklab olish havolasi beriladi.

### APK'ni o'rnatish

Faylni telefonga o'tkazing va ustiga bosing. Android "Noma'lum manbadan
o'rnatish"ga ruxsat so'raydi — ruxsat bering. Shundan keyin ilova
kompyutersiz va internetsiz ishlaydi.

> **Imzo haqida.** "A" usulida APK Expo'ning standart test kaliti bilan
> imzolanadi. Bu kalit har safar bir xil, shuning uchun keyinroq yangi
> versiya yig'sangiz, u eskisining **ustiga o'rnatiladi** va tasklaringiz
> joyida qoladi.
>
> Lekin "A" va "B" usullarini **aralashtirib bo'lmaydi**: bulutdagi
> yig'ilish boshqa kalit ishlatadi, shuning uchun uning APK'si mahalliy
> yig'ilgan ilova ustiga o'rnatilmaydi. Usulni almashtirmoqchi bo'lsangiz,
> avval zaxira nusxa oling, eski ilovani o'chiring, keyin yangisini
> o'rnatib tasklarni tiklang.

> iPhone uchun `--platform ios` kerak, lekin u Apple Developer hisobini
> (yiliga $99) talab qiladi. iPhone'da bepul yo'l - Expo Go'dan foydalanish.

## 5. Testlar

Sana hisobi, saralash, filtrlash va validatsiya mantiqi testlar bilan
qoplangan. Telefon ham, emulyator ham kerak emas:

```bash
npm test
```

## 6. Ilova ikonkalari

Ikonkalar kod orqali chiziladi. Rang yoki shaklni o'zgartirmoqchi bo'lsangiz
`scripts/generate-icons.js` faylini tahrirlang va qayta yarating:

```bash
node scripts/generate-icons.js
```

---

## Loyiha tuzilishi

```
index.js                  Kirish nuqtasi
App.js                    Navigatsiya va umumiy sozlamalar
app.json                  Expo sozlamalari (nom, ikonka, paket nomi)
eas.json                  APK yig'ish profillari

screens/
  HomeScreen.js           Tasklar ro'yxati, qidiruv, filtr, saralash
  AddTaskScreen.js        Yangi task qo'shish
  EditTaskScreen.js       Taskni tahrirlash

components/
  TaskForm.js             Qo'shish va tahrirlash uchun umumiy forma
  TaskItem.js             Bitta task kartochkasi
  DateField.js            Muddat kiritish maydoni
  PriorityPicker.js       Ustuvorlik tanlash
  TaskMenu.js             Pastdan chiqadigan menyu
  ImportDialog.js         Zaxiradan tiklash oynasi
  EmptyList.js            Ro'yxat bo'sh bo'lgandagi xabar

storage/
  taskStorage.js          Telefon xotirasi bilan ishlash (AsyncStorage)

utils/
  taskUtils.js            Sana, saralash, filtr va validatsiya mantiqi

theme/
  colors.js               Ranglar va ustuvorlik darajalari

tests/
  taskUtils.test.js       Mantiq testlari

scripts/
  generate-icons.js       Ikonkalarni chizish
```

### Kod qaysi qatlamda turadi

- **utils/** — hech narsaga bog'liq bo'lmagan sof funksiyalar. Hisob-kitob
  shu yerda, shuning uchun uni oson test qilish mumkin.
- **storage/** — faqat saqlash va o'qish.
- **components/** va **screens/** — ko'rinish. Ular hisob-kitob qilmaydi,
  `utils` dan foydalanadi.

Yangi imkoniyat qo'shsangiz shu tartibga amal qiling: mantiqni `utils` ga,
saqlashni `storage` ga, ko'rinishni komponentga.

---

## Ma'lumot qayerda saqlanadi?

Tasklar `AsyncStorage` da, `@task_manager_tasks` kaliti ostida turadi.
Bu telefonning ichki xotirasi.

**Muhim:** ilovani telefondan o'chirsangiz, tasklar ham o'chadi. Shuning
uchun vaqti-vaqti bilan **⋯ → Zaxira nusxa olish** orqali nusxa olib,
uni o'zingizga (masalan Telegram'dagi "Saqlangan xabarlar"ga) yuboring.
Yangi telefonda **⋯ → Zaxiradan tiklash** orqali qaytarasiz.

---

## Keyingi qadamlar uchun g'oyalar

- Eslatmalar (bildirishnoma) — `expo-notifications`
- Qorong'i rejim (dark mode)
- Tasklarni kategoriyalarga (teglar) ajratish
- Takrorlanuvchi tasklar (har kuni / har hafta)
