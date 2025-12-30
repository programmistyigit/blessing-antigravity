# Backend API Documentation
# Blessing - Poultry Factory Automation System
**Version:** 1.0 | **Til:** Uzbek | **Base URL:** `http://localhost:3000/api`

---

## 📚 Mundarija

1. [Umumiy Ma'lumotlar](#umumiy-malumotlar)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Users (Foydalanuvchilar)](#users-foydalanuvchilar)
4. [Roles (Rollar)](#roles-rollar)
5. [Delegations (Vakolat berish)](#delegations-vakolat-berish)
6. [Sections (Sexlar)](#sections-sexlar)
7. [Batches (Partiyalar)](#batches-partiyalar)
8. [Daily Reports (Kunlik Hisobotlar)](#daily-reports-kunlik-hisobotlar)
9. [ChickOut (Joja Chiqarish)](#chickout-joja-chiqarish)
10. [Periods (Davrlar)](#periods-davrlar)
11. [Expenses (Xarajatlar)](#expenses-xarajatlar)
12. [Inventory (Ombor)](#inventory-ombor)
13. [Attendance (Davomat)](#attendance-davomat)
14. [Salary (Ish haqi)](#salary-ish-haqi)
15. [Prices (Narxlar)](#prices-narxlar)
16. [Health (Kasalliklar)](#health-kasalliklar)
17. [Assets (Uskunalar)](#assets-uskunalar)
18. [Incidents (Hodisalar)](#incidents-hodisalar)
19. [Feed & Utility (Yem va Kommunal)](#feed-utility)
20. [Dashboard](#dashboard)
21. [Forecast (Bashorat)](#forecast-bashorat)
22. [Reports (Hisobotlar)](#reports-hisobotlar)
23. [WebSocket (Real-time)](#websocket-real-time)
24. [Enums va Constants](#enums-va-constants)
25. [Error Handling](#error-handling)

---

## Umumiy Ma'lumotlar

### Response Format
Barcha API javoblar quyidagi formatda:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}

// Error
{
  "success": false,
  "error": "Error message",
  "details": [] // Zod validation errors (optional)
}
```

### HTTP Status Codes
| Code | Ma'no |
|------|-------|
| 200 | OK - So'rov muvaffaqiyatli |
| 201 | Created - Yaratildi |
| 400 | Bad Request - Noto'g'ri so'rov |
| 401 | Unauthorized - Token yo'q yoki noto'g'ri |
| 403 | Forbidden - Ruxsat yo'q |
| 404 | Not Found - Topilmadi |
| 409 | Conflict - Allaqachon mavjud |
| 500 | Server Error - Ichki xato |

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## Autentifikatsiya

### POST /auth/login
**Permission:** Ommaviy (token kerak emas)

Tizimga kirish va JWT token olish.

**Request Body:**
```typescript
{
  "username": string, // min: 3, max: 50
  "password": string  // min: 6
}
```

**Response (200):**
```typescript
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "admin",
      "fullName": "Admin User",
      "role": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Director",
        "permissions": ["SYSTEM_ALL"]
      }
    }
  }
}
```

**Errors:**
- 400: Noto'g'ri username yoki password
- 403: Foydalanuvchi faol emas (isActive: false)

---

## Users (Foydalanuvchilar)

### POST /users
**Permission:** `USER_CREATE` yoki `SYSTEM_ALL`

Yangi foydalanuvchi yaratish.

**Request Body:**
```typescript
{
  "fullName": string,   // min: 2, max: 100
  "username": string,   // min: 3, max: 50, unique
  "password": string,   // min: 6
  "roleId": string,     // Valid MongoDB ObjectId (24 hex chars)
  "isActive": boolean   // default: true
}
```

**Response (201):**
```typescript
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "username": "johndoe",
    "role": { "id": "...", "name": "Manager", "permissions": [...] },
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### PATCH /users/:id
**Permission:** `USER_UPDATE` yoki `SYSTEM_ALL`

Foydalanuvchi ma'lumotlarini yangilash.

**URL Params:** `id` - User ID

**Request Body:** (Barcha maydonlar optional)
```typescript
{
  "fullName": string,   // min: 2, max: 100
  "username": string,   // min: 3, max: 50
  "password": string,   // min: 6
  "roleId": string,     // Valid ObjectId
  "isActive": boolean
}
```

---

### GET /users
**Permission:** `USER_VIEW` yoki `SYSTEM_ALL`

Barcha foydalanuvchilar ro'yxati.

**Response (200):**
```typescript
{
  "success": true,
  "data": [
    {
      "id": "...",
      "fullName": "...",
      "username": "...",
      "role": { "id": "...", "name": "...", "permissions": [...] },
      "isActive": true,
      "createdAt": "..."
    }
  ]
}
```

---

## Roles (Rollar)

### POST /roles
**Permission:** `ROLE_CREATE` yoki `SYSTEM_ALL`

Yangi rol yaratish.

**Request Body:**
```typescript
{
  "name": string,                    // min: 2, max: 50
  "permissions": Permission[],       // Kamida bitta permission
  "canCreateUsers": boolean,         // default: false
  "canCreateRoles": boolean          // default: false
}
```

**Permissions ro'yxati:** [Enums bo'limida](#enums-va-constants)

---

### PATCH /roles/:id
**Permission:** `ROLE_UPDATE` yoki `SYSTEM_ALL`

Rol ma'lumotlarini yangilash.

---

### GET /roles
**Permission:** `ROLE_VIEW` yoki `SYSTEM_ALL`

Barcha rollar ro'yxati.

---

## Delegations (Vakolat berish)

Bir foydalanuvchidan boshqasiga vaqtinchalik permission berish.

### POST /delegations
**Permission:** `DELEGATE_PERMISSIONS`

**Request Body:**
```typescript
{
  "toUserId": string,        // Permission beriladigan user ID
  "permissions": string[],   // Beriladigan permissionlar ro'yxati
  "sections": string[]       // Optional: Faqat ma'lum sexlar uchun
}
```

---

### PATCH /delegations/:id/activate
**Permission:** `DELEGATE_PERMISSIONS`

Delegationni faollashtirish.

---

### PATCH /delegations/:id/deactivate
**Permission:** `DELEGATE_PERMISSIONS`

Delegationni o'chirish.

---

### GET /delegations
**Permission:** Auth required

Siz yaratgan delegationlar ro'yxati.

---

### GET /delegations/received
**Permission:** Auth required

Sizga berilgan delegationlar ro'yxati.

---

## Sections (Sexlar)

### POST /sections
**Permission:** `SECTION_CREATE`

Yangi sex yaratish.

**Request Body:**
```typescript
{
  "name": string,                    // min: 1, max: 100
  "expectedEndDate": string | null,  // ISO datetime, optional
  "assignedWorkers": string[]        // Optional: Worker user IDs
}
```

**Response (201):**
```typescript
{
  "success": true,
  "data": {
    "id": "...",
    "name": "1-Sex",
    "status": "EMPTY",           // SectionStatus enum
    "activeBatchId": null,
    "activePeriodId": null,
    "assignedWorkers": [],
    "location": null,
    "createdAt": "..."
  }
}
```

---

### PATCH /sections/:id
**Permission:** `SECTION_UPDATE`

Sex ma'lumotlarini yangilash.

**Request Body:** (Barcha optional)
```typescript
{
  "name": string,
  "status": SectionStatus,           // Enum
  "chickArrivalDate": string | null,
  "expectedEndDate": string | null,
  "assignedWorkers": string[],
  "isArchived": boolean,
  "location": {                      // GPS checkpoint
    "lat": number,
    "lng": number,
    "radius": number                 // Metrda, default: 100
  }
}
```

---

### GET /sections
**Permission:** `SECTION_VIEW`

Barcha sexlar ro'yxati.

---

### PATCH /sections/:id/status
**Permission:** `SECTION_STATUS_UPDATE`

Faqat status o'zgartirish.

**Request Body:**
```typescript
{
  "status": "EMPTY" | "PREPARING" | "ACTIVE" | "PARTIAL_OUT" | "CLEANING"
}
```

---

### POST /sections/:id/assign-workers
**Permission:** `SECTION_ASSIGN_WORKER`

Sexga ishchilar tayinlash.

**Request Body:**
```typescript
{
  "workerIds": string[]  // User IDs array
}
```

---

### PATCH /sections/:id/assign-period
**Permission:** `SECTION_STATUS_UPDATE`

Sexni Period ga biriktirish.

**Request Body:**
```typescript
{
  "periodId": string
}
```

---

### PATCH /sections/:id/unassign-period
**Permission:** `SECTION_STATUS_UPDATE`

Sexni Period dan ajratish.

---

### POST /sections/:id/close
**Permission:** `SECTION_CLOSE`

Sexni yopish (arxivlash).

---

### GET /sections/:id/pl
**Permission:** `SECTION_VIEW`

Section uchun P&L (Profit & Loss) hisoblash.

**Response (200):**
```typescript
{
  "success": true,
  "data": {
    "sectionId": "...",
    "sectionName": "1-Sex",
    "totalRevenue": 50000000,
    "totalExpenses": 30000000,
    "profit": 20000000,
    "isProfitable": true,
    "metrics": {
      "costPerAliveChick": 2500,        // yoki null
      "revenuePerSoldChick": 5000,      // yoki null
      "profitPerSoldChick": 2500,       // yoki null
      "aliveChicks": 9500,
      "soldChicks": 9000,
      "deadChicks": 500
    }
  }
}
```

> **Muhim:** Metrics qiymatlari `null` bo'lishi mumkin (ma'lumot yo'q holatlarda). Frontend `?? 'N/A'` bilan handle qilsin.

---

## Batches (Partiyalar)

### POST /batches
**Permission:** `BATCH_CREATE`

Yangi partiya yaratish.

**Request Body:**
```typescript
{
  "sectionId": string,
  "startedAt": string,       // ISO datetime, optional (default: now)
  "expectedEndAt": string,   // ISO datetime, required
  "totalChicksIn": number    // min: 1, kamida 1 joja
}
```

**Biznes qoidalar:**
- Har bir sexda faqat bitta ACTIVE batch bo'lishi mumkin
- Sex ACTIVE period ga biriktirilgan bo'lishi kerak

---

### POST /batches/:id/close
**Permission:** `BATCH_CLOSE`

Partiyani yopish.

**Request Body:**
```typescript
{
  "endedAt": string  // ISO datetime, optional
}
```

**Biznes qoidalar:**
- Barcha ChickOut recordlar COMPLETE bo'lishi kerak
- Hal qilinmagan incident'lar bo'lmasligi kerak

---

### GET /batches/:id
**Permission:** `SECTION_VIEW`

Batch ma'lumotlarini olish.

---

### GET /sections/:id/batches
**Permission:** `SECTION_VIEW`

Sex uchun barcha batchlar ro'yxati.

---

### GET /batches/:batchId/summary
**Permission:** `SECTION_VIEW`

Batch yakuniy hisoboti.

**Response (200):**
```typescript
{
  "success": true,
  "data": {
    "batchId": "...",
    "sectionId": "...",
    "totalChicksIn": 10000,
    "totalChicksOut": 9000,
    "totalDeaths": 500,
    "remainingChicks": 500,
    "mortalityRate": 5.0,
    "startedAt": "...",
    "endedAt": "..."
  }
}
```

---

### GET /batches/:batchId/timeline
**Permission:** `SECTION_VIEW`

Kunma-kun jadval (timeline).

---

### GET /batches/:batchId/verify-totals
**Permission:** `SECTION_VIEW`

Ma'lumotlar mosligini tekshirish.

---

## Daily Reports (Kunlik Hisobotlar)

### POST /sections/:id/reports
**Permission:** `SECTION_DAILY_REPORT_CREATE`

Kunlik hisobot yaratish.

**Request Body:**
```typescript
{
  "date": string,                // ISO datetime
  "avgWeight": number,           // O'rtacha vazn (gramm), min: 0
  "totalWeight": number,         // Umumiy vazn, min: 0
  "deaths": number,              // O'limlar soni, min: 0
  "feedUsedKg": number,          // Yem sarfi (kg), min: 0
  "waterUsedLiters": number,     // Suv sarfi (litr), min: 0
  "electricityUsedKwh": number,  // Elektr sarfi (kWh), min: 0
  "medicines": [                 // Optional
    {
      "name": string,
      "dose": string
    }
  ],
  "note": string                 // Optional
}
```

**Biznes qoidalar:**
- Bir kunda bitta sex uchun bitta report bo'lishi mumkin
- Report yaratuvchi sexga tayinlangan bo'lishi kerak

---

### GET /sections/:id/reports
**Permission:** `SECTION_DAILY_REPORT_VIEW`

Sex uchun barcha reportlar.

---

### PATCH /reports/:id
**Permission:** `SECTION_DAILY_REPORT_UPDATE`

Reportni yangilash.

**Request Body:** (Barcha optional)
```typescript
{
  "avgWeight": number,
  "totalWeight": number,
  "deaths": number,
  "feedUsedKg": number,
  "waterUsedLiters": number,
  "electricityUsedKwh": number,
  "medicines": [{ "name": string, "dose": string }],
  "note": string
}
```

---

## ChickOut (Joja Chiqarish)

### POST /sections/:id/chick-outs
**Permission:** `CHICK_OUT_CREATE`

Joja chiqarish yozuvi yaratish (1-bosqich: miqdor).

**Request Body:**
```typescript
{
  "date": string,           // ISO datetime, optional
  "count": number,          // min: 1
  "vehicleNumber": string,  // Mashina raqami, required
  "machineNumber": string,  // Mashina ID, required
  "isFinal": boolean        // default: false, true = oxirgi chiqarish
}
```

**Biznes qoidalar:**
- `isFinal: true` bo'lsa, section status `CLEANING` ga o'zgaradi
- Batch `totalChicksOut` avtomatik yangilanadi

---

### PATCH /chick-outs/:id/complete
**Permission:** `CHICKOUT_COMPLETE`

ChickOut yozuvini yakunlash (2-bosqich: vazn va narx).

**Request Body:**
```typescript
{
  "totalWeightKg": number,  // Umumiy vazn (kg)
  "pricePerKg": number,     // Narx (so'm/kg)
  "notes": string           // Optional
}
```

**Response (200):**
```typescript
{
  "success": true,
  "data": {
    "id": "...",
    "count": 5000,
    "totalWeightKg": 12500,
    "pricePerKg": 30000,
    "totalRevenue": 375000000,
    "status": "COMPLETE"
  }
}
```

---

### GET /sections/:id/chick-outs
**Permission:** `SECTION_VIEW`

Sex uchun barcha chick-out yozuvlari.

---

## Periods (Davrlar)

### POST /periods
**Permission:** `PERIOD_CREATE`

Yangi period yaratish.

**Request Body:**
```typescript
{
  "name": string,           // min: 1
  "startDate": string,      // ISO datetime
  "sections": string[],     // Optional: Section IDs
  "notes": string           // Optional
}
```

---

### GET /periods
**Permission:** `PERIOD_VIEW`

Barcha periodlar ro'yxati.

---

### GET /periods/:id
**Permission:** `PERIOD_VIEW`

Period ma'lumotlari.

---

### PATCH /periods/:id
**Permission:** `PERIOD_UPDATE`

Faqat ACTIVE period yangilanishi mumkin.

**Request Body:**
```typescript
{
  "name": string,       // Optional
  "sections": string[], // Optional
  "notes": string       // Optional
}
```

---

### POST /periods/:id/close
**Permission:** `PERIOD_CLOSE`

Periodni yopish.

**Biznes qoidalar:**
- Barcha batchlar yopilgan bo'lishi kerak
- Hal qilinmagan incidentlar bo'lmasligi kerak
- Salary xarajatlari avtomatik yakunlanadi

**Response (200):**
```typescript
{
  "success": true,
  "data": {
    "id": "...",
    "name": "January 2024",
    "status": "CLOSED",
    "startDate": "...",
    "endDate": "..."
  }
}
```

---

### GET /periods/:id/sections/pl
**Permission:** `PERIOD_VIEW`

Period ichidagi barcha seksiyalar uchun P&L.

---

## Expenses (Xarajatlar)

### POST /periods/:id/expenses
**Permission:** `PERIOD_EXPENSE_CREATE`

Period uchun xarajat qo'shish.

**Request Body:**
```typescript
{
  "category": ExpenseCategory,  // Enum
  "amount": number,             // min: 0
  "description": string,        // Optional
  "expenseDate": string,        // ISO datetime
  "sectionId": string           // Optional: Qaysi sex uchun
}
```

**ExpenseCategory enums:**
```typescript
"ELECTRICITY" | "WATER" | "FEED" | "MEDICINE" | 
"LABOR_FIXED" | "LABOR_DAILY" | "MAINTENANCE" | 
"TRANSPORT" | "ASSET_PURCHASE" | "ASSET_REPAIR" | "OTHER"
```

---

### GET /periods/:id/expenses
**Permission:** `PERIOD_VIEW`

Period xarajatlari ro'yxati.

---

## Inventory (Ombor)

### POST /inventory
**Permission:** `INVENTORY_CREATE`

Yangi inventar element yaratish.

**Request Body:**
```typescript
{
  "name": string,               // min: 1, max: 100
  "category": InventoryCategory, // Enum
  "quantity": number,           // default: 0, min: 0
  "unit": string,               // Masalan: "kg", "dona", "litr"
  "minThreshold": number,       // Low stock alert, default: 0
  "maxThreshold": number        // Optional
}
```

**InventoryCategory enums:**
```typescript
"FEED" | "WATER" | "ELECTRICITY" | "MEDICINE" | "OTHER"
```

---

### PATCH /inventory/:id
**Permission:** `INVENTORY_UPDATE`

Inventar yangilash (miqdor o'zgartirish).

**Request Body:**
```typescript
{
  "quantityChange": number,           // Musbat yoki manfiy
  "changeType": InventoryChangeType,  // Enum
  "reason": string,                   // Optional

  // Optional field updates:
  "name": string,
  "category": InventoryCategory,
  "unit": string,
  "minThreshold": number,
  "maxThreshold": number
}
```

**InventoryChangeType enums:**
```typescript
"ADD" | "REMOVE" | "CONSUME" | "ADJUST"
```

---

### GET /inventory
**Permission:** `INVENTORY_READ`

Barcha inventar elementlari.

---

### DELETE /inventory/:id
**Permission:** `INVENTORY_DELETE`

Inventar o'chirish (soft delete).

---

### GET /inventory/:id/history
**Permission:** `INVENTORY_READ`

Inventar o'zgarishlar tarixi.

---

### GET /inventory/alerts
**Permission:** `INVENTORY_ALERT_VIEW`

Faol alertlar ro'yxati (low stock, threshold violations).

---

### PATCH /inventory/alerts/:id/resolve
**Permission:** `INVENTORY_ALERT_RESOLVE`

Alertni hal qilish.

---

## Attendance (Davomat)

### POST /sections/:id/attendance
**Permission:** `ATTENDANCE_CREATE`

Ishga kirish (Check-in).

**Request Body:**
```typescript
{
  "checkInTime": string,     // ISO datetime
  "location": {
    "lat": number,           // GPS latitude
    "lng": number            // GPS longitude
  },
  "plannedStartTime": string, // Optional, default: 08:00
  "isFake": boolean          // Optional, default: false
}
```

**Biznes qoidalar:**
- Agar location section radius dan tashqarida bo'lsa, `isFake` alert yuboriladi
- Erta/kech kelish avtomatik hisoblanadi

**Response (201):**
```typescript
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "sectionId": "...",
    "checkInTime": "...",
    "arrivalDifference": -15,  // Manfiy = erta, Musbat = kech
    "status": "PENDING"
  }
}
```

---

### PATCH /attendance/:id
**Permission:** `ATTENDANCE_UPDATE`

Davomat yangilash (checkout qo'shish).

**Request Body:**
```typescript
{
  "checkOutTime": string,     // ISO datetime, optional
  "status": AttendanceStatus, // Optional
  "notes": string             // Optional
}
```

**AttendanceStatus enums:**
```typescript
"PENDING" | "APPROVED" | "REJECTED" | "ABSENT"
```

---

### POST /attendance/:id/approve
**Permission:** `ATTENDANCE_APPROVE`

Davomatni tasdiqlash.

---

### GET /sections/:id/attendance
**Permission:** `ATTENDANCE_READ`

**Query params:**
- `date` (optional): Filter by date (ISO string)

---

### DELETE /attendance/:id
**Permission:** `ATTENDANCE_DELETE`

Davomat yozuvini o'chirish.

---

### POST /sections/:id/gps
**Permission:** `GPS_MONITOR_UPDATE`

GPS monitoring log yozish.

**Request Body:**
```typescript
{
  "location": {
    "lat": number,
    "lng": number
  },
  "isOutsideAllowedArea": boolean,
  "timestamp": string  // Optional
}
```

---

### GET /sections/:id/gps
**Permission:** `GPS_MONITOR_READ`

**Query params:**
- `userId` (required): User ID filter

GPS tarix olish.

---

## Salary (Ish haqi)

### POST /salaries
**Permission:** `SALARY_MANAGE`

Xodim uchun asosiy oylik belgilash.

**Request Body:**
```typescript
{
  "employeeId": string,   // User ID
  "baseSalary": number,   // Oylik miqdori
  "periodId": string,     // Period ID
  "sectionId": string     // Optional
}
```

**Biznes qoidalar:**
- Har bir employee uchun period bo'yicha faqat bitta salary bo'lishi mumkin

---

### POST /salaries/advance
**Permission:** `SALARY_ADVANCE_GIVE`

Avans berish.

**Request Body:**
```typescript
{
  "employeeId": string,
  "amount": number,       // Musbat son
  "periodId": string,
  "sectionId": string,    // Optional
  "description": string   // Optional
}
```

**Biznes qoidalar:**
- Avtomatik `LABOR_FIXED` expense yaratiladi
- Transaction ishlatiladi

---

### POST /salaries/bonus
**Permission:** `SALARY_BONUS_GIVE`

Bonus berish.

**Request Body:**
```typescript
{
  "employeeId": string,
  "amount": number,
  "reason": string,       // Bonus sababi, required
  "periodId": string,
  "sectionId": string     // Optional
}
```

---

### GET /salaries/employees/:id/summary
**Permission:** `SALARY_VIEW`

Xodim ish haqi xulosasi.

**Query params:**
- `periodId` (optional): Period filter

**Response (200):**
```typescript
{
  "employeeId": "...",
  "baseSalary": 5000000,
  "totalAdvances": 2000000,
  "totalBonuses": 500000,
  "remainingSalary": 3000000  // baseSalary - totalAdvances
}
```

> **Muhim:** `remainingSalary = baseSalary - totalAdvances`. Bonuslar hisobga olinmaydi, ular alohida mukofot.

---

### GET /salaries/periods/:id
**Permission:** `SALARY_VIEW`

Period bo'yicha umumiy salary statistikasi.

---

### GET /salaries
**Permission:** `SALARY_VIEW`

**Query params:**
- `periodId` (required)

---

### GET /salaries/advances
**Permission:** `SALARY_VIEW`

**Query params:**
- `periodId` (required)

---

### GET /salaries/bonuses
**Permission:** `SALARY_VIEW`

**Query params:**
- `periodId` (required)

---

## Prices (Narxlar)

### POST /prices
**Permission:** `PRICE_MANAGE`

Yangi narx belgilash.

**Request Body:**
```typescript
{
  "type": PriceType,           // Enum
  "value": number,             // min: 0
  "effectiveFrom": string,     // Optional, default: now
  "description": string        // Optional
}
```

**PriceType enums:**
```typescript
"FEED" | "WATER" | "ELECTRICITY" | "CHICK_PRICE"
```

---

### GET /prices/current
**Permission:** Auth required (any)

Barcha joriy narxlar.

**Response (200):**
```typescript
{
  "success": true,
  "data": {
    "FEED": 5000,
    "WATER": 500,
    "ELECTRICITY": 800,
    "CHICK_PRICE": 30000
  }
}
```

---

### GET /prices/current/:type
**Permission:** Auth required

Ma'lum turdagi joriy narx.

**Response (200):**
```typescript
{
  "success": true,
  "data": {
    "type": "FEED",
    "value": 5000
  }
}
```

---

### GET /prices/history
**Permission:** `PRICE_MANAGE`

**Query params:**
- `type` (optional): Filter by type

Narxlar tarixi.

---

## Health (Kasalliklar)

### POST /sections/:id/diseases
**Permission:** `DISEASE_CREATE`

Kasallik yozuvi.

---

### PATCH /diseases/:id
**Permission:** `DISEASE_UPDATE`

---

### GET /sections/:id/diseases
**Permission:** `DISEASE_READ`

---

### DELETE /diseases/:id
**Permission:** `DISEASE_DELETE`

---

### POST /sections/:id/medications
**Permission:** `MEDICATION_CREATE`

Dori yozuvi.

---

### PATCH /medications/:id
**Permission:** `MEDICATION_UPDATE`

---

### GET /sections/:id/medications
**Permission:** `MEDICATION_READ`

---

### DELETE /medications/:id
**Permission:** `MEDICATION_DELETE`

---

## Assets (Uskunalar)

### POST /assets
**Permission:** `ASSET_MANAGE`

Yangi uskuna qo'shish.

---

### PATCH /assets/:id/status
**Permission:** `ASSET_MANAGE`

Uskuna holati yangilash.

---

### GET /assets
**Permission:** `SECTION_VIEW`

Barcha uskunalar.

---

### GET /assets/:id
**Permission:** `SECTION_VIEW`

---

### GET /assets/section/:sectionId
**Permission:** `SECTION_VIEW`

Sex bo'yicha uskunalar.

---

### GET /assets/:id/history
**Permission:** `SECTION_VIEW`

Uskuna tarixi.

---

## Incidents (Hodisalar)

### POST /incidents
**Permission:** `TECH_REPORT_CREATE`

Texnik hodisa yaratish.

---

### GET /incidents
**Permission:** `TECH_REPORT_VIEW`

---

### GET /incidents/:id
**Permission:** `TECH_REPORT_VIEW`

---

### GET /assets/:id/incidents
**Permission:** `TECH_REPORT_VIEW`

---

### GET /sections/:id/incidents
**Permission:** `TECH_REPORT_VIEW`

---

### PATCH /incidents/:id/resolve
**Permission:** `TECH_REPORT_UPDATE`

Hodisani hal qilish/qayta ochish.

---

### POST /incidents/:id/expense
**Permission:** `FINANCE_EXPENSE_APPROVE`

Hodisa uchun ta'mirlash xarajati qo'shish.

---

### GET /incidents/:id/expense
**Permission:** `TECH_REPORT_VIEW`

---

## Feed & Utility

### POST /feed/deliveries
**Permission:** `FEED_MANAGE`

Yem yetkazilishini qayd qilish.

---

### GET /feed/deliveries
**Permission:** `FEED_MANAGE`

Section bo'yicha filter.

---

### GET /feed/deliveries/period
**Permission:** `FEED_MANAGE`

Period bo'yicha filter.

---

### GET /feed/periods/:periodId/total
**Permission:** `FEED_MANAGE`

---

### GET /feed/sections/:sectionId/summary
**Permission:** `FEED_MANAGE`

---

### POST /utilities
**Permission:** `WATER_REPORT`

Kommunal xarajat qayd qilish.

---

### GET /utilities
**Permission:** `WATER_REPORT`

---

### GET /utilities/section
**Permission:** `WATER_REPORT`

---

### GET /utilities/periods/:periodId/summary
**Permission:** `WATER_REPORT`

---

## Dashboard

### GET /dashboard/sections/:id
**Permission:** `DASHBOARD_READ`

Section dashboard.

---

### GET /dashboard/company
**Permission:** `DASHBOARD_READ`

Kompaniya umumiy dashboard.

---

## Forecast (Bashorat)

### POST /forecast/price
**Permission:** `SYSTEM_ALL` (Director only)

Bashorat narxi belgilash.

---

### GET /forecast/sections/:id
**Permission:** `SECTION_VIEW`

Section bashorati.

---

### GET /forecast/periods/:id
**Permission:** `PERIOD_VIEW`

Period bashorati.

---

### POST /forecast/simulate
**Permission:** `SECTION_VIEW`

Qisman sotish simulyatsiyasi.

---

## Reports (Hisobotlar)

### GET /reports/sections/:id
**Permission:** `REPORT_VIEW`

Section hisoboti.

---

### GET /reports/sections/:id/export
**Permission:** `REPORT_EXPORT`

Section hisobotini eksport qilish.

---

## WebSocket (Real-time)

### Connection
```
ws://localhost:3000/ws?token=<JWT_TOKEN>
```

### Events
WebSocket orqali quyidagi eventlar keladi:

```typescript
{
  "event": "event_name",
  "data": { ... }
}
```

#### Event turlari:

**User Events:**
- `user_created`
- `user_updated`
- `user_deleted`

**Role Events:**
- `role_created`
- `role_updated`
- `permission_updated`

**Section Events:**
- `section_created`
- `section_updated`
- `section_assigned`
- `section_closed`
- `section_status_changed`

**Report Events:**
- `daily_report_created`
- `daily_report_updated`

**Batch Events:**
- `batch_started`
- `batch_closed`
- `chick_out_created`

**Inventory Events:**
- `inventory_item_created`
- `inventory_item_updated`
- `inventory_item_removed`
- `inventory_low_stock`
- `inventory_alert_min_threshold`
- `inventory_alert_max_threshold`

**Health Events:**
- `disease_created`, `disease_updated`, `disease_deleted`
- `medication_created`, `medication_updated`, `medication_deleted`
- `medication_alert_low_stock`
- `disease_alert_high_mortality`

**Attendance Events:**
- `attendance_created`
- `attendance_updated`
- `attendance_approved`
- `attendance_fake_detected`
- `attendance_late_alert`
- `attendance_early_alert`
- `attendance_absent_alert`

**Financial Events:**
- `expense_created`
- `period_pl_updated`
- `section_pl_updated`
- `period_created`
- `period_closed`
- `salary_advance_given`
- `salary_bonus_given`
- `salary_expense_finalized`
- `feed_delivery_recorded`
- `utility_cost_recorded`
- `price_changed`

**Delegation Events:**
- `delegation_activated`
- `delegation_deactivated`

**System Events:**
- `system_notification`

### Subscribe/Unsubscribe
```typescript
// Subscribe
{ "action": "subscribe", "channel": "section:507f1f77bcf86cd799439011" }

// Unsubscribe
{ "action": "unsubscribe", "channel": "section:507f1f77bcf86cd799439011" }
```

### Channels
- `system:*` - Barcha system eventlar (Director uchun)
- `section:{sectionId}` - Ma'lum section eventlari
- `users` - User eventlari
- `roles` - Role eventlari

---

## Enums va Constants

### Permission (Barcha ruxsatlar)
```typescript
// System
SYSTEM_ALL              // Hammaga kirish

// Role Management
ROLE_CREATE, ROLE_UPDATE, ROLE_VIEW

// User Management
USER_CREATE, USER_UPDATE, USER_VIEW

// Section Management
SECTION_CREATE, SECTION_UPDATE, SECTION_VIEW
SECTION_ASSIGN_WORKER, SECTION_CLOSE, SECTION_STATUS_UPDATE

// Daily Report
SECTION_DAILY_REPORT_CREATE, SECTION_DAILY_REPORT_UPDATE, SECTION_DAILY_REPORT_VIEW

// Disease
SECTION_DISEASE_CREATE, SECTION_DISEASE_UPDATE, SECTION_DISEASE_VIEW

// Warehouse
WAREHOUSE_VIEW, WAREHOUSE_IN, WAREHOUSE_OUT, WAREHOUSE_UPDATE

// Inventory
INVENTORY_CREATE, INVENTORY_READ, INVENTORY_UPDATE, INVENTORY_DELETE
INVENTORY_APPROVE, INVENTORY_ALERT_VIEW, INVENTORY_ALERT_RESOLVE

// Medication
MEDICATION_READ, MEDICATION_CREATE, MEDICATION_UPDATE, MEDICATION_DELETE

// Disease
DISEASE_READ, DISEASE_CREATE, DISEASE_UPDATE, DISEASE_DELETE

// Attendance
ATTENDANCE_READ, ATTENDANCE_CREATE, ATTENDANCE_UPDATE
ATTENDANCE_DELETE, ATTENDANCE_APPROVE

// GPS
GPS_MONITOR_READ, GPS_MONITOR_UPDATE

// Report
REPORT_VIEW, REPORT_EXPORT

// Dashboard
DASHBOARD_READ, KPI_READ

// Batch & Production
BATCH_CREATE, BATCH_CLOSE, CHICK_OUT_CREATE, CHICKOUT_COMPLETE
DELEGATE_PERMISSIONS

// Period
PERIOD_CREATE, PERIOD_VIEW, PERIOD_CLOSE, PERIOD_UPDATE, PERIOD_EXPENSE_CREATE

// Asset
ASSET_MANAGE

// Tech Report
TECH_REPORT_CREATE, TECH_REPORT_VIEW, TECH_REPORT_UPDATE

// Finance
FINANCE_EXPENSE_APPROVE

// Salary
SALARY_VIEW, SALARY_MANAGE, SALARY_ADVANCE_GIVE, SALARY_BONUS_GIVE

// Feed & Utility
FEED_MANAGE, WATER_REPORT, ELECTRICITY_REPORT, PRICE_MANAGE
```

### SectionStatus
```typescript
"EMPTY"        // Bo'sh
"PREPARING"    // Tayyorlanmoqda
"ACTIVE"       // Faol
"PARTIAL_OUT"  // Qisman chiqarilgan
"CLEANING"     // Tozalanmoqda
```

### ExpenseCategory
```typescript
"ELECTRICITY"      // Elektr
"WATER"            // Suv
"FEED"             // Yem
"MEDICINE"         // Dori
"LABOR_FIXED"      // Oylik ishchilar
"LABOR_DAILY"      // Kunlik ishchilar
"MAINTENANCE"      // Ta'mirlash
"TRANSPORT"        // Transport
"ASSET_PURCHASE"   // Uskuna xaridi
"ASSET_REPAIR"     // Uskuna ta'miri
"OTHER"            // Boshqa
```

### InventoryCategory
```typescript
"FEED" | "WATER" | "ELECTRICITY" | "MEDICINE" | "OTHER"
```

### InventoryChangeType
```typescript
"ADD" | "REMOVE" | "CONSUME" | "ADJUST"
```

### PriceType
```typescript
"FEED" | "WATER" | "ELECTRICITY" | "CHICK_PRICE"
```

### AttendanceStatus
```typescript
"PENDING" | "APPROVED" | "REJECTED" | "ABSENT"
```

### ChickOutStatus
```typescript
"INCOMPLETE" | "COMPLETE"
```

---

## Error Handling

### Validation Errors (400)
```typescript
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 1 character(s)",
      "path": ["name"]
    }
  ]
}
```

### Not Found (404)
```typescript
{
  "success": false,
  "error": "Section not found"
}
```

### Conflict (409)
```typescript
{
  "success": false,
  "error": "Salary already exists for this employee in this period"
}
```

### Forbidden (403)
```typescript
{
  "success": false,
  "error": "Cannot close period with active batches"
}
```

### Unauthorized (401)
```typescript
{
  "success": false,
  "error": "Authentication required"
}
```

---

## Frontend Integration Tips

### 1. Token Storage
```typescript
localStorage.setItem('token', response.data.token);

// API calls
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### 2. Response Handling
```typescript
const response = await api.get('/sections');
if (response.data.success) {
  const sections = response.data.data;
}
```

### 3. Null Metrics Handling
```typescript
const metrics = response.data.data.metrics;
const costDisplay = metrics.costPerAliveChick ?? 'N/A';
const revenueDisplay = metrics.revenuePerSoldChick ?? 'N/A';
```

### 4. WebSocket Connection
```typescript
const token = localStorage.getItem('token');
const ws = new WebSocket(`ws://localhost:3000/ws?token=${token}`);

ws.onmessage = (event) => {
  const { event: eventName, data } = JSON.parse(event.data);
  console.log(`Received: ${eventName}`, data);
};
```

### 5. Permission Check
```typescript
const user = JSON.parse(localStorage.getItem('user'));
const hasPermission = (perm: string) => 
  user.role.permissions.includes('SYSTEM_ALL') || 
  user.role.permissions.includes(perm);

if (hasPermission('SECTION_CREATE')) {
  // Show create button
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-30  
**Author:** Antigravity AI
