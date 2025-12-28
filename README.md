# BLESSING Backend Codebase — Real State Analysis

> **Sana:** 2025-12-21  
> **Maqsad:** Backend source code asosida tizimning hozirgi real holati

---

## 1. BACKEND HOZIR QANDAY MUAMMONI HAL QILAYAPTI?

Backend parranda fabrikasi uchun **ishlab chiqarish tsikli boshqaruvi** tizimi yaratgan:

1. **Period (Davr)** — moliyaviy hisob-kitob davri, bir necha sexlarni o'z ichiga oladi
2. **Section (Sex)** — fizik joyda joylashgan parrandalar uchun bo'lim
3. **Batch (Partiya)** — sexga tushgan jojalar guruhi, ularning hayot tsiklini kuzatish
4. **Kunlik balans** — har kuni joja soni, o'lim, chiqim hisobi (Excel "остаток" uslubida)
5. **Moliyaviy yakunlash** — joja chiqarilganda vazn, narx, daromad hisoblash

**Asosiy maqsad:** Joja tushishidan boshlab sotilgunicha butun jarayonni raqamlashtirish, intizomni ta'minlash, moliyaviy ma'lumotlarni yig'ish.

---

## 2. ASOSIY OBYEKTLAR VA ULARNING ROLI

### 2.1 Period (Davr)
**Nima:** Moliyaviy hisob-kitob davri — bir oylik yoki mavsumiy tsikl.

**Nimaga xizmat qiladi:**
- Bir necha sexlarni guruhlash
- Xarajatlarni (PeriodExpense) davr doirasida yozish
- Yakuniy moliyaviy hisobot tayyorlash

**Nimaga bog'langan:**
- Section.activePeriodId → Period
- Batch.periodId → Period
- PeriodExpense.periodId → Period

**Statuslar:** `ACTIVE` | `CLOSED`

---

### 2.2 Section (Sex)
**Nima:** Fizik bo'lim — parrandalar saqlanadigan joy.

**Nimaga xizmat qiladi:**
- Ishchilarni tayinlash (assignedWorkers)
- GPS checkpoint belgilash (location: lat, lng, radius)
- Aktiv partiyani kuzatish

**Nimaga bog'langan:**
- activeBatchId → Batch
- activePeriodId → Period
- assignedWorkers → User[]

**Statuslar (5 ta):**
| Status | Ma'no |
|--------|-------|
| EMPTY | Bo'sh, hech qanday partiya yo'q |
| PREPARING | Tayyorlanmoqda, joja kutilmoqda |
| ACTIVE | Aktiv partiya bor, jojalar ichida |
| PARTIAL_OUT | Jojalar qisman chiqarilgan |
| CLEANING | Partiya yopilgan, sex tozalanmoqda |

---

### 2.3 Batch (Partiya)
**Nima:** Sexga tushgan jojalar guruhi — bir tsikl.

**Nimaga xizmat qiladi:**
- Joja sonini kuzatish (totalChicksIn / totalChicksOut)
- Kunlik balanslar yaratish
- Chiqim yozuvlarini bog'lash

**Nimaga bog'langan:**
- sectionId → Section
- periodId → Period (majburiy!)

**Statuslar:** `ACTIVE` | `PARTIAL_OUT` | `CLOSED`

**Muhim qoida:** Bir sexda faqat 1 ta ACTIVE batch bo'lishi mumkin (unique index).

---

### 2.4 DailyBalance (Kunlik Qoldiq)
**Nima:** Har bir kun uchun joja qoldig'ini kuzatish — Excel "остаток" mantiqiga mos.

**Nimaga xizmat qiladi:**
- Kun boshidagi qoldiq (startOfDayChicks)
- Bugungi o'limlar (deaths)
- Bugungi chiqim (chickOut)
- Kun oxiridagi qoldiq (endOfDayChicks = start - deaths - chickOut)

**Nimaga bog'langan:**
- batchId → Batch

**Avto-hisoblash:** 
- Oldingi kundan endOfDayChicks olinadi
- Yangi kun uchun startOfDayChicks sifatida qo'yiladi

---

### 2.5 ChickOut (Joja Chiqarish)
**Nima:** Jojalarni sotish/chiqarish yozuvi — **2 bosqichli jarayon**.

**1-Bosqich (Operatsion):**
- count — necha dona
- vehicleNumber — mashina raqami
- machineNumber — tartib raqami
- isFinal — oxirgi chiqimmi (true = batch yopiladi)
- status: `INCOMPLETE`

**2-Bosqich (Moliyaviy):**
- totalWeightKg — jami vazn
- wastePercent — chiqindi foizi (0-100)
- netWeightKg — sof vazn (avtomatik hisoblanadi)
- pricePerKg — 1 kg narxi
- totalRevenue — jami daromad (avtomatik hisoblanadi)
- status: `COMPLETE`

**Formula:**
```
netWeightKg = totalWeightKg × (1 - wastePercent / 100)
totalRevenue = netWeightKg × pricePerKg
```

---

### 2.6 BatchDailyReport (Kunlik Hisobot)
**Nima:** Ishchi tomonidan kunlik kiritilgan ma'lumotlar.

**Nimaga xizmat qiladi:**
- avgWeight — o'rtacha vazn
- totalWeight — jami vazn
- deaths — o'limlar (DailyBalance'ga ham yoziladi)
- feedUsedKg — yem sarfi
- waterUsedLiters — suv sarfi
- electricityUsedKwh — elektr sarfi
- medicines — berilgan dorilar ro'yxati

**Muhim qoida:** Bir batchga kuniga faqat 1 ta report (unique index).

---

### 2.7 Asset (Uskuna)
**Nima:** Fabrikadagi texnik uskunalar ro'yxati.

**Kategoriyalar:** MOTOR | COUNTER | ENGINE | OTHER

**Statuslar:** ACTIVE | BROKEN | REPAIRED | DECOMMISSIONED

**Qo'shimcha maydonlar:**
- location (lat, lng) — GPS joylashuvi
- isNewPurchase — yangi sotib olinganmi
- purchaseCost — xarid narxi
- purchasePeriodId — qaysi davrda xarid qilingan

---

### 2.8 TechnicalIncident (Texnik Nosozlik)
**Nima:** Uskunadagi muammo haqida rasmiy xabar.

**Nimaga xizmat qiladi:**
- Nosozlikni qayd qilish
- Xarajat talab qiladimi — belgilash
- Hal qilindimi — kuzatish

**Muhim maydonlar:**
- requiresExpense — xarajat kerakmi (boolean)
- expenseId — yozilgan xarajat (agar requiresExpense=true)
- resolved — hal qilindimi

---

### 2.9 PeriodExpense (Davr Xarajati)
**Nima:** Period darajasidagi xarajatlar.

**Kategoriyalar (8 ta):**
| Kategoriya | Ma'no |
|------------|-------|
| ELECTRICITY | Elektr energiya |
| LABOR_FIXED | Oylik ishchilar |
| LABOR_DAILY | Kunlik ishchilar |
| MAINTENANCE | Ta'mirlash |
| TRANSPORT | Transport |
| ASSET_PURCHASE | Uskuna xaridi |
| ASSET_REPAIR | Uskuna ta'miri |
| OTHER | Boshqa |

**Incident bilan bog'lanish:** ASSET_REPAIR kategoriyasi incident orqali yaratiladi va incident.expenseId ga yoziladi.

---

### 2.10 Attendance (Davomat)
**Nima:** Ishchilarning kelish-ketish qaydlari.

**Nimaga xizmat qiladi:**
- Check-in/Check-out vaqtini qayd qilish
- GPS lokatsiyani saqlash
- Kech kelish / erta kelishni hisoblash

**Statuslar:** PRESENT | ABSENT | LATE | LEFT_EARLY

**Arrival Symbol:** + (erta) | - (kech) | '' (vaqtida)

**Fake Detection:**
- isFake — soxta check-in aniqlanganda true
- GPS radius tashqarisida bo'lsa avtomatik fake deb belgilanadi

---

### 2.11 GPSMonitor
**Nima:** Ishchining real-vaqt GPS kuzatuvi.

**Nimaga xizmat qiladi:**
- Ishlash vaqtida lokatsiyani kuzatish
- Ruxsat berilgan zonadan chiqishni aniqlash
- Alert yuborish

---

## 3. TO'LIQ ISHLAB CHIQARISH SSENARIYSI (Step-by-Step)

### 3.1 Davr Ochiladi
```
Period.create({ name: "Yanvar 2025", startDate: now })
→ status: ACTIVE
```

### 3.2 Sex Davrga Ulanadi
```
Section.activePeriodId = period._id
Section.status = PREPARING
```

### 3.3 Partiya Ochiladi (Joja Tushadi)
```
Batch.create({ sectionId, totalChicksIn: 5000, periodId })
→ Section.status = ACTIVE
→ Section.activeBatchId = batch._id
→ DailyBalance yaratiladi (1-kun)
```

**GUARD #1:** Sexda activePeriodId bo'lmasa — **Batch ochish MUMKIN EMAS**

**GUARD #2:** Period.status !== ACTIVE bo'lsa — **Batch ochish MUMKIN EMAS**

### 3.4 Kunlik Hisobot Kiritiladi
```
BatchDailyReport.create({ batchId, date, deaths: 5, feedUsedKg: 100, ... })
→ DailyBalance.deaths += 5
→ DailyBalance.endOfDayChicks qayta hisoblanadi
```

**GUARD #3:** Section.status !== ACTIVE && !== PARTIAL_OUT — **Report kiritish MUMKIN EMAS**

**GUARD #4:** User assignedWorkers yoki SYSTEM_ALL bo'lmasa — **Report kiritish MUMKIN EMAS**

### 3.5 Qisman Chiqarish (Partial Out)
```
ChickOut.create({ sectionId, count: 1000, isFinal: false })
→ status: INCOMPLETE
→ Batch.totalChicksOut += 1000
→ DailyBalance.chickOut += 1000
→ Section.status = PARTIAL_OUT
```

### 3.6 Moliyaviy Yakunlash (Complete)
```
ChickOut.complete(chickOutId, { totalWeightKg: 2000, wastePercent: 5, pricePerKg: 30000 })
→ netWeightKg = 1900
→ totalRevenue = 57,000,000
→ status: COMPLETE
```

**GUARD #5:** Period.status !== ACTIVE — **Complete qilish MUMKIN EMAS**

### 3.7 Yakuniy Chiqarish (Final Out)
```
ChickOut.create({ sectionId, count: 3500, isFinal: true })
→ Batch.status = CLOSED
→ Section.status = CLEANING
→ Section.activeBatchId = null
```

### 3.8 Batch Yopiladi

**GUARD #6:** Incomplete ChickOut mavjud — **Batch yopish MUMKIN EMAS**
```
Error: "Cannot close batch: incomplete chick-outs exist"
```

**GUARD #7:** Moliyaviy yakunlanmagan incident mavjud — **Batch yopish MUMKIN EMAS**
```
Error: "Moliyaviy yakunlanmagan texnik nosozliklar mavjud"
```

### 3.9 Davr Yopiladi

**GUARD #8:** Active batch mavjud — **Period yopish MUMKIN EMAS**
```
Error: "Cannot close period with active batches"
```

**GUARD #9:** Incomplete ChickOut mavjud — **Period yopish MUMKIN EMAS**
```
Error: "Cannot close period: there are incomplete chick-outs"
```

**GUARD #10:** Moliyaviy yakunlanmagan incident mavjud — **Period yopish MUMKIN EMAS**
```
Error: "Moliyaviy yakunlanmagan texnik nosozliklar mavjud"
```

---

## 4. MOLIYAVIY OQIM

### 4.1 Xarajat Manbalari (MAVJUD)
| Manba | Qanday yoziladi |
|-------|-----------------|
| ELECTRICITY | PeriodExpense.create (manual) |
| LABOR_FIXED | PeriodExpense.create (manual) |
| LABOR_DAILY | PeriodExpense.create (manual) |
| MAINTENANCE | PeriodExpense.create (manual) |
| TRANSPORT | PeriodExpense.create (manual) |
| ASSET_PURCHASE | Asset.isNewPurchase = true + purchaseCost |
| ASSET_REPAIR | Incident → RepairExpenseService.createRepairExpense |
| OTHER | PeriodExpense.create (manual) |

### 4.2 Daromad Manbalari (MAVJUD)
| Manba | Qanday yoziladi |
|-------|-----------------|
| Joja sotish | ChickOut.complete → totalRevenue |

### 4.3 HALI YO'Q BO'LGAN MA'LUMOTLAR

| Kategoriya | Hozirgi holat |
|------------|---------------|
| **Joja xarid narxi** | Yo'q — Batch'da faqat count bor, narx yo'q |
| **Yem xarid narxi** | Yo'q — faqat sarfiyot (kg) yoziladi |
| **Dori xarid narxi** | Yo'q — faqat nomi va dozasi |
| **Davriy xulosa** | BatchSummary bor, lekin PeriodSummary yo'q |
| **Foyda/Zarar hisoblash** | Yo'q — revenue bor, lekin xarajatlar yig'indisi hisoblanmaydi |

---

## 5. XAVFSIZLIK VA MAJBURIY INTIZOM

### 5.1 Yopish Mumkin Emas Bo'lgan Holatlar

| Obyekt | Shart | Xato xabari |
|--------|-------|-------------|
| Batch | Incomplete ChickOut mavjud | "Cannot close batch: incomplete chick-outs exist" |
| Batch | requiresExpense=true, expenseId=null incident mavjud | "Moliyaviy yakunlanmagan texnik nosozliklar mavjud" |
| Period | Active batch mavjud | "Cannot close period with active batches" |
| Period | Incomplete ChickOut mavjud | "Cannot close period: there are incomplete chick-outs" |
| Period | Unresolved expense incident mavjud | "Moliyaviy yakunlanmagan texnik nosozliklar mavjud" |

### 5.2 Yaratish Mumkin Emas Bo'lgan Holatlar

| Obyekt | Shart | Xato xabari |
|--------|-------|-------------|
| Batch | Section.activePeriodId yo'q | "Section is not assigned to an active period" |
| Batch | Period.status !== ACTIVE | "Cannot create batch in closed period" |
| Batch | Section'da allaqachon ACTIVE batch bor | "This section already has an ACTIVE batch" |
| DailyBalance | Batch.status = CLOSED | "Cannot create balance for CLOSED batch" |
| DailyBalance | Section.status = CLEANING yoki PREPARING | "Cannot create balance for CLEANING/PREPARING section" |
| Report | Section.status !== ACTIVE && !== PARTIAL_OUT | "Reports can only be created for ACTIVE or PARTIAL_OUT sections" |
| Report | User assignedWorkers da emas + SYSTEM_ALL yo'q | "You are not assigned to this section" |
| ChickOut Complete | Period.status !== ACTIVE | "Cannot complete chick-out in closed period" |
| RepairExpense | Incident.requiresExpense = false | "This incident does not require expense" |
| RepairExpense | Incident.expenseId allaqachon mavjud | "This incident already has an expense attached" |
| Attendance | Section.status !== ACTIVE | "Cannot check in to inactive section" |
| Attendance | Bugun shu section'ga allaqachon check-in qilgan | "User already checked in for today" |

---

## 6. HOZIRGI BACKEND NIMALARGA TAYYOR

### 6.1 To'liq Ishlayotgan Jarayonlar

1. **Period CRUD** — yaratish, ko'rish, yopish
2. **Section CRUD** — yaratish, status yangilash, ishchi tayinlash, GPS checkpoint
3. **Batch lifecycle** — yaratish, PARTIAL_OUT, CLOSED
4. **DailyBalance avto-hisoblash** — deaths va chickOut asosida
5. **ChickOut 2-bosqichli** — operatsion → moliyaviy
6. **BatchDailyReport** — kunlik hisobot + audit log
7. **Asset boshqaruvi** — yaratish, status yangilash
8. **TechnicalIncident** — yaratish, resolve qilish
9. **RepairExpense** — incident asosida xarajat yozish
10. **Attendance** — check-in/out, GPS tracking, fake detection, alerts
11. **BatchSummary** — yakuniy hisob (deaths, chickOut, days, average mortality)
12. **Real-time events** — WebSocket orqali barcha o'zgarishlar

### 6.2 Mavjud Hisob-Kitoblar

| Hisob | Qayerda |
|-------|---------|
| Kunlik qoldiq | DailyBalance.endOfDayChicks |
| Jami o'limlar | BatchSummary.totalDeaths |
| Jami chiqim | BatchSummary.totalChickOut |
| O'rtacha kunlik o'lim | BatchSummary.averageDailyMortality |
| Sof vazn | ChickOut.netWeightKg |
| Daromad | ChickOut.totalRevenue |
| Data integrity check | BatchSummaryService.verifyTotals() |

---

## 7. QANDAY HISOB-KITOBLARNI QILA OLMAYDI

### 7.1 Backend Hozir Qila Olmaydigan Hisob-Kitoblar

| Hisob | Sabab (kod bo'yicha) |
|-------|---------------------|
| **Joja tannarxi** | Batch'da xarid narxi yo'q |
| **1 kg go'sht tannarxi** | Yem/dori narxi yo'q |
| **Davr foydasi** | PeriodSummary yo'q, xarajatlar yig'ilmaydi |
| **ROI (Return on Investment)** | Investitsiya summasi kuzatilmaydi |
| **Yem konversiyasi (FCR)** | feedUsedKg mavjud, lekin vazn o'sishi alohida hisoblanmaydi |
| **Ishchi samaradorligi** | Attendance bor, lekin natijaga bog'lanmagan |
| **Sexlar taqqoslash** | Qo'lda mumkin, lekin avtomatik rating yo'q |

### 7.2 Mavjud, Lekin Ishlatilmayotgan Ma'lumotlar

| Ma'lumot | Holat |
|----------|-------|
| Report.avgWeight | Saqlanadi, lekin hech qayerda ishlatilmaydi |
| Report.totalWeight | Saqlanadi, lekin hech qayerda ishlatilmaydi |
| Period.notes | Saqlanadi, lekin UI'da ko'rsatilmaydi |
| Asset.location | Saqlanadi, lekin hech qayerda tekshirilmaydi |

---

## 8. XULOSA — 3 BO'LIM

### ✅ Backend Hozir TO'LIQ Yopib Bergan Jarayonlar

1. **Partiya hayot tsikli** — joja tushishidan yopilguncha to'liq kuzatiladi
2. **Kunlik balans** — o'lim va chiqim avtomatik hisoblanadi
3. **2-bosqichli ChickOut** — operatsion va moliyaviy alohida
4. **Intizom guard'lari** — incomplete data bilan yopish mumkin emas
5. **Texnik nosozlik → Xarajat** — bog'langan va majburiy
6. **Ishchi davomati** — GPS, fake detection, alerts
7. **Audit log** — report o'zgarishlari saqlanadi
8. **Real-time** — barcha o'zgarishlar WebSocket orqali

---

### ⚠️ Backend Hozir QISMAN Yopgan Jarayonlar

1. **Moliyaviy hisobot** — xarajat kategoriyalari bor, lekin jamlanmaydi
2. **Period xulosa** — BatchSummary bor, PeriodSummary yo'q
3. **Uskuna boshqaruvi** — CRUD bor, lekin amortizatsiya yo'q
4. **Yem/dori kuzatuvi** — sarfiyot bor, xarid narxi yo'q

---

### ❌ Backend Umuman Qilmaydigan (Lekin Kerak Bo'lishi Mumkin) Jarayonlar

1. **Tannarx hisoblash** — joja, 1 kg go'sht
2. **Foyda/Zarar hisobi** — period darajasida
3. **Yem konversiyasi (FCR)** — sanoat standarti bo'yicha
4. **Sexlar reytingi** — qaysi sex samaradorroq
5. **Prognozlash** — qachon partiya tugaydi, qancha daromad bo'ladi
6. **Inventar (ombor) boshqaruvi** — hozir faqat permission bor, kod yo'q
7. **Dori inventari** — sarfiyot bor, zaxira yo'q
8. **Oylik/mavsumiy avtomatik hisobot** — hozir qo'lda

---

> **Eslatma:** Bu hujjat faqat backend source code asosida yozilgan. README, workflow, commit message va boshqa hujjatlar o'qilmagan.
   