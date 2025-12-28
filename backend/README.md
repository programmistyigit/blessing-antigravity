# Blessing Chicken Pharm Automation System

**Blessing Chicken Pharm SCR** loyihasi uchun ishlab chiqilgan, **Node.js** va **TypeScript** asosidagi, production-ready backend tizimi. Ushbu tizim tovuq fabrikasining barcha jarayonlarini avtomatlashtirish, real vaqt rejimida monitoring qilish va chuqur tahliliy hisobotlarni taqdim etish uchun mo'ljallangan.

Tizim **Clean Architecture** tamoyillariga asoslangan bo'lib, xavfsizlik (RBAC), barqarorlik va kengayuvchanlikni ta'minlaydi.

---

## � Texnologiyalar

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (Strong Typing)
- **Framework**: Fastify (High Performance)
- **Database**: MongoDB (Mongoose ORM)
- **Validation**: Zod (Schema Validation)
- **Monitoring**: WebSocket / Socket.IO (Real-time Events)
- **Auth**: JWT (JSON Web Tokens)
- **Security**: Role-Based Access Control (RBAC) & PBAC

---

## 📦 Modul Strukturasi

Tizim quyidagi asosiy modullardan iborat:

### 1. Auth & Users (Foydalanuvchilar va Xavfsizlik)
- JWT autentifikatsiya va sessiyalarni boshqarish.
- Foydalanuvchi akkauntlarini yaratish, o'chirish va bloklash.
- **RBAC**: Har bir foydalanuvchiga `Role` (masalan, `DIRECTOR`, `MANAGER`, `WORKER`) va maxsus `Permission`lar biriktiriladi.

### 2. Sections (Seksiyalar va Ishlab Chiqarish)
- Fabrika seksiyalarini (tovuqxonalar) boshqarish.
- Har bir seksiya uchun alohida `Batch` (partiya) yaratish (chick arrival, expected end date).
- **Daily Reports**: Kunlik o'lim, yem, suv, elektr sarfi va o'rtacha vazn kiritish.
- **Audit**: Har bir hisobot o'zgarishi audit qilinadi (`ReportAudit`).

### 3. Inventory (Omborxona)
- **Warehouse Management**: Yem, dori, suv va boshqa resurslar hisobi.
- **Transactions**: Kirim, chiqim, va iste'mol (`InventoryHistory`).
- **Low Stock Alerts**: Minimal chegara (`minThreshold`) ga yetganda avtomatik ogohlantirish.

### 4. Health (Veterinariya va Salomatlik)
- **Disease Tracking**: Seksiyalardagi kasalliklar, simptomlar va o'lim ko'rsatkichlari.
- **Medication**: Dori berish jurnali, dozalar va samaradorlik.
- **Alerts**: Yuqori o'lim (`High Mortality`) darajasi aniqlanganda darhol xabar berish.

### 5. Attendance & GPS Monitoring (Yo'qlama)
- **Check-In/Out**: Hodimlarning ishga kelish-ketishini qayd etish.
- **GPS Fencing**: Hodim belgilangan hududda ekanligini GPS koordinatalari orqali tekshirish.
- **Auto Status**: Kechikish (`-`) yoki erta kelish (`+`) ni avtomatik hisoblash (`arrivalDiff`).
- **Fake Detection**: GPS lokatsiya chegaradan tashqarida bo'lsa `isFake=true` belgisi.

### 6. Reports (Hisobotlar)
- **Aggregation**: Barcha modullardan (Section, Inventory, Health, Attendance) ma'lumotlarni yig'ib tahlil qilish.
- **Export**: Hisobotlarni CSV (yoki PDF) formatida yuklab olish.
- **Custom Range**: Istalgan sana oralig'i uchun dinamik hisobotlar.

### 7. KPI & Realtime Dashboard
- **Live Metrics**: Fabrika umumiy holatini bitta ekranda ko'rsatish.
- **Critical Alerts**: O'lim, kamomat, kechikishlar va xavfsizlik ogohlantirishlari.
- **WebSocket**: Ma'lumotlar o'zgarganda dashboard avtomatik yangilanadi.

---

## 🐥 Ishlab Chiqarish Modellari (Production Models)

### 8. Batch (Partiya)
Sexga tushgan joja guruhi. Har bir sex faqat **bitta aktiv partiya**ga ega bo'lishi mumkin.

**Fieldlar:**
- `sectionId` - Qaysi sexga tegishli
- `startedAt` - Boshlanish sanasi
- `expectedEndAt` - Kutilgan tugash sanasi
- `endedAt` - Haqiqiy tugash sanasi (faqat CLOSED bo'lganda)
- `totalChicksIn` - Kirgan jojalar soni
- `totalChicksOut` - Chiqarilgan jojalar soni
- `status` - `ACTIVE` | `CLOSED`

### 9. ChickOut (Joja Chiqarish)
Joja chiqarish operatsiyasi. Har bir chiqarish alohida yoziladi.

**Fieldlar:**
- `sectionId`, `batchId` - Bog'lanishlar
- `date` - Sana
- `count` - Chiqarilgan jojalar soni
- `vehicleNumber` - Mashina raqami
- `machineNumber` - Apparat raqami
- `isFinal` - Oxirgi chiqarishmi?

**Qoida:**
- `isFinal = true` → Batch `CLOSED` bo'ladi, Section `CLEANING` statusiga o'tadi

### 10. Section Status Lifecycle (Sex Holati)
Seksiya quyidagi holatlar orqali o'tadi:

```
EMPTY → PREPARING → ACTIVE → PARTIAL_OUT → CLEANING → EMPTY
```

| Status | Izoh |
|--------|------|
| `EMPTY` | Sex bo'sh, partiya yo'q |
| `PREPARING` | Tayyorlanmoqda, joja kutilmoqda |
| `ACTIVE` | Aktiv partiya bor |
| `PARTIAL_OUT` | Jojalar qisman chiqarilgan |
| `CLEANING` | Tozalanmoqda |

### 11. Delegation (Ruxsat Topshirish)
Ishchi o'z ruxsatlarini vaqtincha boshqasiga berishi mumkin.

**Fieldlar:**
- `fromUserId` - Kimdan
- `toUserId` - Kimga
- `permissions` - Qaysi ruxsatlar
- `sections` - Qaysi seksiyalar uchun (ixtiyoriy)
- `isActive` - Faolmi

---

## 🚀 O'rnatish va Ishga Tushirish

### Talablar
- Node.js v18 yoki yuqori
- MongoDB (Local yoki Atlas)

### 1. O'rnatish
Loyiha papkasiga kiring va paketlarni o'rnating:

```bash
npm install
```

### 2. Konfiguratsiya (.env)
Asosiy papkada `.env` faylini yarating va quyidagi o'zgaruvchilarni kiriting:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/poultry_db
JWT_SECRET=maxfiy_kalit_soz
NODE_ENV=development
```

### 3. Ishga Tushirish
**Development rejimida:**
```bash
npm run dev
```

**Production uchun build:**
```bash
npm run build
npm start
```

---

## 📡 API Endpoints Overview

Quyida asosiy API manzillari keltirilgan. Barcha so'rovlar `Authorization: Bearer <token>` headerini talab qiladi.

### 🔐 Authentication
- `POST /api/auth/login` - Tizimga kirish
- `POST /api/auth/register` - Ro'yxatdan o'tish (Admin)

### 🏭 Sections
- `POST /api/sections` - Yangi seksiya yaratish
- `PATCH /api/sections/:id/status` - Sex holatini o'zgartirish (`SECTION_STATUS_UPDATE`)
- `POST /api/sections/:id/reports` - Kunlik hisobot kiritish

### 🐥 Batch (Partiya)
- `POST /api/batches` - Yangi batch boshlash (`BATCH_CREATE`)
- `POST /api/batches/:id/close` - Batchni yopish (`BATCH_CLOSE`)
- `GET /api/batches/:id` - Batch ma'lumotini olish
- `GET /api/sections/:id/batches` - Seksiya batchlari ro'yxati

### 🚚 ChickOut (Joja Chiqarish)
- `POST /api/sections/:id/chick-outs` - Joja chiqarish (`CHICK_OUT_CREATE`)
- `GET /api/sections/:id/chick-outs` - Chiqarishlar ro'yxati

### 👥 Delegation (Ruxsat Topshirish)
- `POST /api/delegations` - Yangi delegation yaratish (`DELEGATE_PERMISSIONS`)
- `PATCH /api/delegations/:id/activate` - Activlashtirish
- `PATCH /api/delegations/:id/deactivate` - O'chirish
- `GET /api/delegations` - O'zim yaratgan delegationlar
- `GET /api/delegations/received` - Menga berilgan delegationlar

### 📦 Inventory
- `POST /api/inventory` - Yangi mahsulot qo'shish
- `GET /api/inventory` - Ombor holatini ko'rish

### 💊 Health
- `POST /api/sections/:id/diseases` - Kasallik qayd etish
- `POST /api/sections/:id/medications` - Dori berish

### 📍 Attendance & GPS
- `POST /api/sections/:id/attendance` - Check-In (GPS bilan)
- `POST /api/sections/:id/gps` - GPS monitoring log


### 📊 Reports & Dashboard
- `GET /api/reports/sections/:id?start=...&end=...` - Seksiya hisoboti
- `GET /api/dashboard/company` - Kompaniya KPI Dashboardi

---

## 🔄 WebSocket & Realtime Events

Tizim voqealarni real vaqtda uzatadi.

**Channels (Kanallar):**
- `system:*` - Direktorlar uchun (Barcha xabarlar).
- `system:section:{id}` - Menejerlar uchun (Seksiya xabarlari).
- `section:{id}` - Ishchilar uchun.

**Event Types:**
- `inventory_alert_low_stock` - Mahsulot kam qolganda.
- `disease_alert_high_mortality` - O'lim soni oshib ketganda.
- `attendance_late_alert` - Hodim kechikkanda.
- `attendance_fake_detected` - GPS lokatsiya noto'g'ri bo'lganda.

---

## � Permissions & Roles

Tizimda quyidagi rollar mavjud:

| Rol      | Ruxsatlar (Permissions) |
|----------|-------------------------|
| **DIRECTOR** | `SYSTEM_ALL` (To'liq nazorat), Hisobotlar, Dashboard. |
| **MANAGER** | `SECTION_VIEW`, `REPORT_VIEW`, `INVENTORY_READ`, `ATTENDANCE_APPROVE`. |
| **WORKER**  | `SECTION_DAILY_REPORT_CREATE`, `ATTENDANCE_CREATE`. |

---

## ⚠️ Realtime Alerts Logic

1. **High Mortality**: Agar kunlik o'lim soni **50** dan oshsa, `CRITICAL` darajali alert yuboriladi.
2. **Low Stock**: Omborxonadagi mahsulot **minThreshold** dan kamayib ketsa, `WARNING` alert.
3. **Attendance**: 
   - **Late**: Check-in vaqti rejadan kech bo'lsa.
   - **Fake GPS**: Agar koordinata zavod hududidan (>100m) tashqarida bo'lsa.

---

## 🧪 Testing & Verification

Loyihani tekshirish uchun:

```bash
# Type checking va Build
npm run build
```

Kod `src/` papkasida joylashgan bo'lib, `dist/` papkasiga kompilyatsiya qilinadi.

---

## 👥 Delegation (Ruxsat Topshirish) Test Flow

Delegation tizimi vaqtincha ruxsatlarni boshqa foydalanuvchiga topshirish imkonini beradi.

### Test Oqimi

```
1. Director login (SYSTEM_ALL) ────────────────────────┐
                                                       │
2. Role yaratish: E2E_WORKER (ATTENDANCE_CREATE)      │
                                                       │
3. User yaratish: e2eworker (E2E_WORKER role)         │
                                                       │
4. Worker login → POST /delegations → ❌ 403          │ Baseline test
                                                       │
5. Director → POST /delegations (DELEGATE_PERMISSIONS)│ Delegation
   toUserId: worker, permissions: [DELEGATE_PERMISSIONS]
                                                       │
6. Worker → POST /delegations → ✅ 201                │ Delegation works
                                                       │
7. Director → PATCH /delegations/:id/deactivate       │ Revoke
                                                       │
8. Worker → POST /delegations → ❌ 403                │ Deactivated
```

### Test Script
```bash
npx tsx tests/delegation-e2e.ts
```

### Ishlatiladigan Fayllar
- `permission.middleware.ts` — Delegation check
- `delegation.service.ts` — `getDelegatedPermissions(userId)`
- `delegation.model.ts` — `isActive` flag

---

## 🏗️ Full E2E Integration Test

Tizimning to'liq ishlashini tekshirish uchun `vitest` yordamida integratsion testlar mavjud.
Bu testlar **haqiqiy database** va **haqiqiy routerlar** bilan ishlaydi (Mock ishlatilmaydi).

### Yugurish
```bash
npm test
```

### Test Ssenariysi (`tests/e2e/full-flow.test.ts`)
1. **Server Start** — Test muhitini tayyorlash.
2. **Director Login** — Tizim administratori sifatida kirish.
3. **Roles Setup** — Manager va Worker rollarini yaratish.
4. **Users Setup** — Manager va Worker userlarini yaratish.
5. **Login Checks** — Har bir user bilan login qilib token olish.
6. **Permission Baseline** — Worker ruxsati yo'qligini tekshirish (403 Expected).
7. **Delegation Flow**:
   - Director Workera ruxsat beradi (`SECTION_STATUS_UPDATE`).
   - Worker endi o'sha ishni qila oladi (200 OK).
   - Director ruxsatni o'chiradi (Deactivate).
   - Worker yana ruxsatsiz qoladi (403 Expected).
8. **Router Coverage** — Asosiy routerlarning ishlashini tekshirish.

---



## 📄 License
Ushbu loyiha **Private Proprietary** hisoblanadi. Nusxalash va ruxsatsiz tarqatish taqiqlanadi.
