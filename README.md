# لوحة متابعة مهام العطاءات — ASP.NET Core + SQL Server

## مصدر البيانات

الـ Frontend لا يعتمد على ملفات JSON كبيانات تشغيلية، ولا يستخدم LocalStorage، ولا يعتمد على Key/Value JSON لتخزين بيانات الأعمال.

الهيكل الفعلي هو:

```text
SQL Database
   ↓
Entity Framework Core Models
   ↓
ASP.NET Core REST API
   ↓
wwwroot/assets/app.js
   ↓
Dynamic UI
```

JSON الموجود في HTTP هو فقط **صيغة نقل API** بين Browser وBackend، وليس مصدر بيانات.

ملفات `appsettings*.json` تخص إعداد تشغيل ASP.NET مثل Connection String فقط، وليست مخزنًا لبيانات النظام.

## الجداول التشغيلية

- `Teams` — الفرق
- `Engineers` — المهندسون
- `StandardTasks` — المهام القياسية
- `Projects` — المشاريع
- `ProjectTaskStates` — حالة كل مهمة داخل المشروع
- `CustomTasks` — المهام المضافة يدويًا
- `HasrProjects` — مشاريع قسم الحصر
- `AuthHashes` — كلمات المرور المرمّزة حسب الدور والكيان
- `DashboardSettings` — إعدادات الشاشة
- `ProjectOutcomeOptions` — نتائج المشروع
- `TeamPaletteOptions` — ألوان الفرق
- `FieldDefinitions` — تعريف الحقول الديناميكية

`StorageItems` أصبح جدول **Legacy Migration فقط**، ولا يوجد Controller أو Frontend API يستخدمه أثناء التشغيل الطبيعي.

## API

### Bootstrap
`GET /api/bootstrap`

يرجع بيانات التهيئة من قاعدة البيانات: الفرق، المهندسين، المهام، إعدادات النظام، النتائج، ألوان الفرق وتعريفات الحقول.

### Roster
`GET /api/roster`
`PUT /api/roster`

### Tasks
`GET /api/tasks`

### Projects / Engineer
`GET /api/dashboard/engineers/{engineerId}`
`PUT /api/dashboard/engineers/{engineerId}`

### Hasr
`GET /api/dashboard/hasr/{teamId}`
`PUT /api/dashboard/hasr/{teamId}`

### Authentication
`GET /api/dashboard/auth`
`PUT /api/dashboard/auth`

### Dashboard configuration
`GET /api/dashboard/config`
`PUT /api/dashboard/config`

## الترحيل

عند تشغيل النسخة الجديدة على قاعدة تحتوي على بيانات النسخة القديمة، يقوم التطبيق بترحيل البيانات الموجودة في `StorageItems` مرة واحدة إلى الجداول الطبيعية ثم يتوقف عن استخدامها في التشغيل.

## التشغيل

```bash
dotnet restore
dotnet run
```

وقبل التشغيل تأكد أن `DefaultConnection` يشير إلى قاعدة `TenderDashboard`.

## ملاحظات

- تم فصل HTML وCSS وJavaScript.
- كل بيانات الأعمال التي يقرأها أو يحفظها الـ Frontend تمر عبر API.
- لا يوجد `localStorage` أو `session storage` كمصدر بيانات للنظام.
- لا يوجد `/api/storage` في الإصدار الحالي.
