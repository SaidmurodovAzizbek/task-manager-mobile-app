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
| ⭐ | Har bir taskka ball (qiyinlik): 5 / 10 / 25 / 50 / 100 yoki istalgan son 1–999 |
| 🏆 | Ballar, darajalar, kunlik seriya 🔥, 12 ta yutuq va "Natijalar" ekrani |
| 📊 | Analitika: hafta / oy / 3 oy / 6 oy / yil bo'yicha muddatida-kechikkan, muhimlik, kategoriyalar, ballar |
| 🏷️ | Kategoriyalar: Ish, Oilaviy, Shaxsiy, Sport, Ta'lim, Boshqa + o'zingiz qo'shganlari |
| 🗂️ | Bosh ekranda kategoriya bo'yicha filtr (har birida tasklar soni) |
| 📅 | Muddat qo'yish + "Bugun / Ertaga / Bir hafta" tez tugmalari |
| ⚠️ | Muddati o'tgan tasklar qizil rangda ajralib turadi |
| ↕️ | Saralash: yangi, muddat, muhimlik, alifbo yoki ball bo'yicha |
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

## Ballar va darajalar

Har bir taskka **ball** beriladi — u taskning qanchalik "og'ir" ekanini
bildiradi. Formada tez tugmalar bor (🌱 5 Oson, ⭐ 10 Oddiy, 🔥 25 Jiddiy,
💎 50 Qiyin, 🏆 100 Epik), istalgan sonni (1–999) qo'lda yozish yoki −/+
bilan o'zgartirish ham mumkin. Yangi taskda ball ustuvorlikka qarab o'zi
tanlanadi (Yuqori → 25, O'rta → 10, Past → 5), toki o'zingiz boshqasini
tanlamaguningizcha.

| Qoida | |
|---|---|
| ✅ Task bajarildi | Uning balli hisobingizga qo'shiladi, ekranda "+25 ball" chiqadi |
| ⚡ Muddatida bajarildi | +25% bonus (muddat kuni yoki undan oldin) |
| ↩️ Qayta ochildi | Ball qaytib olinadi |
| 🔥 Seriya | Har kuni kamida bitta task bajarsangiz o'sadi |
| 🚀 Daraja | N-daraja uchun 25 × N × (N − 1) ball: 50, 150, 300, 500 ... |
| 🗑️ O'chirish | Bajarilgan task o'chsa ham, balli saqlanib qoladi |

Darajalar: 🌱 Boshlovchi → 🌿 Harakatchan → ⚡ G'ayratli → 🎯 Izchil →
🚀 Uddaburon → 💪 Mohir → 🧠 Usta → 💎 Ekspert → 🏆 Chempion → 👑 Afsona.

Bosh ekrandagi daraja panelini (yoki **⋯ → Natijalar va yutuqlar**) bossangiz
**Natijalar** ekrani ochiladi: jami ball, bugun / 7 kunda, seriya, oxirgi
7 kun grafigi, kategoriyalar bo'yicha ballar va 12 ta yutuq.

### Analitika

Bosh ekrandagi **📊** tugmasi (yoki **⋯ → Analitika**) tanlangan davr
bo'yicha hisobot ochadi. Davrlar: **Hafta** (7 kun), **Oy** (30 kun),
**3 oy**, **6 oy**, **Yil** (joriy oy bilan 12 oy).

| Bo'lim | Nimani ko'rsatadi |
|---|---|
| Ko'rsatkichlar | Bajarildi, ball, muddatida %, faol kunlar — oldingi xuddi shunday davr bilan solishtirib (▲ / ▼) |
| 💡 Xulosalar | Raqamlardan chiqqan qisqa maslahatlar: o'sish, qaysi muhimlik kechikyapti, eng samarali kun |
| Dinamika | Ustunli grafik: tasklar (muddatida / kechikkan / muddatsiz) yoki ballar; ustunni bossangiz tafsiloti |
| ⏰ Muddat bo'yicha | Taqsimot, o'rtacha kechikish va hozir muddati o'tgan faol tasklar |
| 🎯 Muhimlik bo'yicha | Jadval: Yuqori / O'rta / Past — soni, ball, vaqtida %, kechikkanlar |
| 🏷️ Kategoriyalar | Har birida nechta task va ballarning qancha ulushi |
| 📅 Hafta kunlari | Qaysi kuni eng ko'p ish qilasiz |

"Muddatida %" faqat muddati bor tasklar ichida hisoblanadi. Bajarilgan task
o'chirilsa ham analitikadan yo'qolmaydi — uning qisqa yozuvi ballar bankida
saqlanadi (bu imkoniyat 1.2 versiyada qo'shilgan; undan oldin o'chirilgan
tasklarning faqat balli saqlangan).

## 5. Testlar

Sana hisobi, saralash, filtrlash, validatsiya, ballar va analitika mantiqi testlar bilan
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
  CategoriesScreen.js     Kategoriyalarni qo'shish, tahrirlash, o'chirish
  ScoreScreen.js          Natijalar: ballar, daraja, seriya, yutuqlar
  AnalyticsScreen.js      Analitika: davrlar bo'yicha hisobot

components/
  TaskForm.js             Qo'shish va tahrirlash uchun umumiy forma
  TaskItem.js             Bitta task kartochkasi
  DateField.js            Muddat kiritish maydoni
  PriorityPicker.js       Ustuvorlik tanlash
  PointsPicker.js         Taskga ball berish
  LevelBar.js             Bosh ekrandagi daraja paneli
  RewardToast.js          Task bajarilganda "+31 ball" xabari
  CategoryPicker.js       Formada kategoriya tanlash (+ yangisini qo'shish)
  CategoryDialog.js       Kategoriya qo'shish / tahrirlash oynasi
  CategoryFilterBar.js    Bosh ekrandagi kategoriya filtri
  TaskMenu.js             Pastdan chiqadigan menyu
  ImportDialog.js         Zaxiradan tiklash oynasi
  EmptyList.js            Ro'yxat bo'sh bo'lgandagi xabar
  BarChart.js             Ustunli (qatlamli) grafik - kutubxonasiz

storage/
  taskStorage.js          Telefon xotirasi bilan ishlash (AsyncStorage)

hooks/
  useCategories.js        Kategoriyalar ro'yxatini ekranga olib kelish

utils/
  taskUtils.js            Sana, saralash, filtr va validatsiya mantiqi
  categoryUtils.js        Kategoriyalar mantiqi (standartlar, validatsiya)
  pointsUtils.js          Ballar, bonus, daraja, seriya va yutuqlar
  analyticsUtils.js       Analitika: davrlar, taqsimotlar, xulosalar

theme/
  colors.js               Ranglar, ustuvorlik darajalari, kategoriya ranglari

tests/
  taskUtils.test.js       Mantiq testlari
  categoryUtils.test.js   Kategoriyalar testlari
  pointsUtils.test.js     Ballar testlari
  analyticsUtils.test.js  Analitika testlari

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

Tasklar `AsyncStorage` da, `@task_manager_tasks` kaliti ostida turadi,
o'zingiz qo'shgan kategoriyalar esa `@task_manager_categories` da.
O'chirilgan bajarilgan tasklardan qolgan ballar `@task_manager_score` da
("bank") saqlanadi — shuning uchun tozalash natijalaringizni o'chirmaydi.
Bu telefonning ichki xotirasi. Standart kategoriyalar saqlanmaydi - ular
koddan keladi, shuning uchun ularni o'chirib bo'lmaydi.

Kategoriya o'chirilsa, undagi tasklar yo'qolmaydi - "Boshqa" ga o'tadi.
Kategoriyalar paydo bo'lishidan oldingi eski tasklar ham "Boshqa" da turadi.

**Muhim:** ilovani telefondan o'chirsangiz, tasklar ham o'chadi. Shuning
uchun vaqti-vaqti bilan **⋯ → Zaxira nusxa olish** orqali nusxa olib,
uni o'zingizga (masalan Telegram'dagi "Saqlangan xabarlar"ga) yuboring.
Yangi telefonda **⋯ → Zaxiradan tiklash** orqali qaytarasiz.
Zaxira nusxaga o'zingiz qo'shgan kategoriyalar va ballar ham kiradi; yangi
telefonda xuddi shu nomli kategoriya bo'lsa, ikkinchisi yaratilmaydi.

---

## Keyingi qadamlar uchun g'oyalar

- Eslatmalar (bildirishnoma) — `expo-notifications`
- Qorong'i rejim (dark mode)
- Takrorlanuvchi tasklar (har kuni / har hafta)
