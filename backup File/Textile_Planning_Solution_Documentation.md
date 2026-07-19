# শিমুল মামার প্রজেক্ট V2 (Textile Planning Solution)
# সম্পূর্ণ বিস্তারিত ডকুমেন্টেশন — প্রতিটি কন্ডিশন ও লজিক সহ

---

## পার্ট ১: প্রজেক্টের মূল কাঠামো (Project Architecture)

### ১.১ ফাইল স্ট্রাকচার
প্রজেক্টে মোট ৩টি মূল HTML ফাইল আছে:
* **`login.html`** — লগইন পেজ (ইউজার অথেনটিকেশন)
* **`index.html`** — মূল ড্যাশবোর্ড ও সম্পূর্ণ সিস্টেম। (এর ভেতরের প্রায় ৪৫০০+ লাইনের জাভাস্ক্রিপ্ট কোডগুলো মডুলার করে `js/` ফোল্ডারে ১৫টি আলাদা ফাইলে ভাগ করা হয়েছে)
* **`users.html`** — ইউজার ম্যানেজমেন্ট পেজ (শুধুমাত্র Admin দেখতে পায়)

**`js/` ফোল্ডার স্ট্রাকচার (মডুলার স্ক্রিপ্টস):**
`index.html`-এর বিশাল জাভাস্ক্রিপ্ট কোডবেস পরিচালনা সহজ করতে নিচের ফাইলগুলোতে ভাগ করা হয়েছে:
1. `globals.js` — গ্লোবাল ভ্যারিয়েবল ও স্টেট
2. `core.js` — ড্যাশবোর্ড ইনিট, পারমিশন, নেভিগেশন ও টোস্ট মেসেজ
3. `table-headers.js` — ডাইনামিক টেবিল হেডার তৈরি
4. `data-processing.js` — ডাটা ফেচিং, মার্জিং, এবং মেইন টেবিল রেন্ডারিং
5. `pagination-filters.js` — পেজিনেশন ও বায়ার ফিল্টার লজিক
6. `detailed-view.js` — অর্ডার ডিটেইল ফর্ম (অর্ডার ক্লিক করার পর)
7. `save-planning.js` — ফ্যাব্রিক প্ল্যানিং সেভ করার লজিক
8. `file-upload.js` — এক্সেল ফাইল আপলোড ও ডিলিট 
9. `utils.js` — তারিখ ফরম্যাট এবং অন্যান্য হেল্পার ফাংশন
10. `tabs-sidebar.js` — সাইডবার, ট্যাব ম্যানেজমেন্ট এবং ওয়াইপ ডাটা
11. `order-status.js` — Order Status পেজ ও পিডিএফ/এক্সেল ডাউনলোড
12. `tracking-report.js` — Tracking Report (বিভাগভিত্তিক রিপোর্ট)
13. `actual-tracking.js` — Plan vs Actual Tracking পেজ ও লজিক
14. `dashboard-animation.js` — ড্যাশবোর্ড পার্টিকেল অ্যানিমেশন
15. `load-calculation.js` — Load Calculation রিপোর্ট, সামারি এবং এক্সেল ডাউনলোড

### ১.২ টেকনোলজি ব্যবহার
* **Frontend:** HTML, JavaScript, TailwindCSS (CDN)
* **Icons:** Font Awesome 6.4
* **Excel Parsing:** SheetJS (xlsx.js) — এক্সেল ফাইল পড়ার জন্য
* **PDF Generation:** html2pdf.js — পিডিএফ ডাউনলোডের জন্য
* **Backend API:** `https://abir-backend-api.onrender.com` (Node.js/Express সার্ভার)
* **Database:** MongoDB (Backend এ)

### ১.৩ Backend API Endpoints
| API URL | Method | কাজ |
|---|---|---|
| `/api/auth/login` | POST | ইউজার লগইন |
| `/api/auth/register` | POST | নতুন ইউজার তৈরি |
| `/api/auth/users` | GET | সকল ইউজারের তালিকা |
| `/api/auth/user/:id` | DELETE | ইউজার ডিলিট |
| `/api/files/upload` | POST | এক্সেল ফাইল আপলোড |
| `/api/files/all` | GET | আপলোড করা সকল ফাইলের তালিকা |
| `/api/files/:id` | DELETE | একটি নির্দিষ্ট ফাইল ডিলিট |
| `/api/files/save-dates` | POST | প্ল্যানিং ডাটা (তারিখ, টাইপ) সেভ |
| `/api/files/all-dates` | GET | সকল সেভ করা প্ল্যানিং ডাটা ফেচ |
| `/api/files/clear-all-planning` | DELETE | সম্পূর্ণ সিস্টেম ওয়াইপ |
| `/uploads/:savedName` | GET | আপলোড করা এক্সেল ফাইল ডাউনলোড/রিড |

---

## পার্ট ২: লগইন সিস্টেম ও অথেনটিকেশন (Login & Authentication)

### ২.১ লগইন প্রসেস (`login.html`)
1. ইউজার Username ও Password দিয়ে লগইন করে।
2. সিস্টেম `/api/auth/login` API তে POST রিকোয়েস্ট পাঠায়।
3. সার্ভার থেকে সফল রেসপন্স আসলে ৩টি জিনিস `localStorage`-এ সেভ হয়:
   * `token` (JWT Token)
   * `username`
   * `role` (Admin / Planner / Viewer)
4. তারপর ইউজারকে `index.html`-এ রিডাইরেক্ট করা হয়।

### ২.২ অটো-রিডাইরেক্ট কন্ডিশন
* **`login.html` ওপেন করলে:** যদি `localStorage`-এ আগে থেকেই `token` থাকে, তাহলে সরাসরি `index.html`-এ পাঠিয়ে দেয়। (ইউজার দ্বিতীয়বার লগইন করতে হয় না)
* **`index.html` ওপেন করলে:** যদি `localStorage`-এ `token` না থাকে, তাহলে সাথে সাথে `login.html`-এ পাঠিয়ে দেয়।

### ২.৩ লগআউট
`logout()` ফাংশন কল হলে `localStorage.clear()` দিয়ে সব ডাটা মুছে দেয় এবং `login.html`-এ পাঠায়।

---

## পার্ট ৩: ইউজার রোল ও পারমিশন সিস্টেম (User Roles & Permissions)

সিস্টেমে ৩ ধরনের রোল আছে। প্রতিটি রোলের জন্য আলাদা আলাদা পারমিশন প্রযোজ্য:

### ৩.১ Admin (অ্যাডমিন) — সর্বোচ্চ ক্ষমতা
* সাইডবারে **"Manage Users"** মেনু দেখতে পায় (অন্যরা পায় না)।
* **"Data Management"** পেজে যেতে পারে ও ফাইল আপলোড/ডিলিট করতে পারে।
* যেকোনো অর্ডারের **Confirmed Plan Type পরিবর্তন** করতে পারে। (নন-অ্যাডমিনরা পারে না)
* ডাউনস্ট্রিম (Downstream) ডিপার্টমেন্ট Confirm থাকলেও আপস্ট্রিম পরিবর্তন করতে পারে।
* `users.html`-এ নতুন ইউজার তৈরি এবং ডিলিট করতে পারে।

### ৩.২ Planner (প্ল্যানার) — সম্পাদনা ক্ষমতা
* **"Data Management"** পেজে যেতে পারে ও ফাইল আপলোড/ডিলিট করতে পারে।
* অর্ডারের প্ল্যানিং ডাটা (Date, Plan Type) এডিট করতে পারে, তবে **Confirmed আইটেম পরিবর্তন করতে পারে না** (শুধু Admin পারে)।
* "Manage Users" মেনু **দেখতে পায় না**।

### ৩.৩ Viewer (ভিউয়ার) — শুধুমাত্র দেখা
* সাইডবারে **"Data Management"** মেনু সম্পূর্ণ লুকানো থাকে।
* ফাইল আপলোড এরিয়া (`uploadArea`) `display: none` হয়ে যায়।
* ড্যাশবোর্ড, রিপোর্ট এবং অর্ডার স্ট্যাটাস শুধু দেখতে পারে।
* "Manage Users" মেনু **দেখতে পায় না**।

### ৩.৪ users.html এর সিকিউরিটি কন্ডিশন
`users.html` পেজ ওপেন হলে প্রথমেই চেক হয়:
* `token` না থাকলে → `login.html`-এ রিডাইরেক্ট।
* `role !== 'Admin'` হলে → "Access Denied!" Alert দেখায় এবং `index.html`-এ পাঠায়।
* ইউজাররা ৩টি গ্রুপে দেখানো হয়: Admin Management Team, Planning & Operation Team, এবং Viewers & Observers।

---

## পার্ট ৪: ডাটা আপলোড ও ফাইল ম্যানেজমেন্ট (Data Upload & File Management)

### ৪.১ আপলোড ক্যাটাগরি ট্যাব সিস্টেম
Data Management পেজে ৫টি ট্যাব আছে:
1. **General Base Data** — মূল অর্ডারের সব তথ্য (Buyer, Booking Date, Shipment Date, T&A Dates ইত্যাদি)
2. **Knitting Plan Data** — নিটিং ডিপার্টমেন্টের তথ্য (Color, GSM, Grey Req, Knit Prod ইত্যাদি)
3. **Dyeing Plan Data** — ডাইং ডিপার্টমেন্টের তথ্য (BP Qty, Dyeing Prod ইত্যাদি)
4. **Finishing Plan Data** — ফিনিশিং ডিপার্টমেন্টের তথ্য
5. **Delivery Plan Data** — ডেলিভারি ডিপার্টমেন্টের তথ্য (Net Delivery, RFD ইত্যাদি)

### ৪.২ ফাইল আপলোড প্রসেস
1. ইউজার `.xlsx`, `.xls`, বা `.csv` ফাইল সিলেক্ট করে "Upload Data" ক্লিক করে।
2. সিস্টেম `FormData`-তে ফাইল, ইউজারনেম, রোল, এবং ক্যাটাগরি যুক্ত করে `/api/files/upload`-এ POST করে।
3. সফল হলে ফাইল ডিরেক্টরি আপডেট হয় এবং ড্যাশবোর্ড রিফ্রেশ হয়।

### ৪.৩ Uploaded Files Directory (ফাইল তালিকা)
* প্রতিটি ক্যাটাগরি অনুযায়ী আলাদাভাবে ফাইলের তালিকা দেখায়।
* **একই নামের ফাইল** একাধিকবার আপলোড করলে শুধুমাত্র সর্বশেষটি তালিকায় দেখায় (`Map` ব্যবহার করে ইউনিক রাখে)।
* প্রতিটি ফাইলের Category, File Name, Uploaded By, Date & Time এবং Delete অপশন আছে।

### ৪.৪ ফাইল ডিলিট
* Delete বাটনে ক্লিক করলে **একই নামের সব ভার্সন** একসাথে ডিলিট হয়ে যায়।
* ডিলিট হলে ড্যাশবোর্ডও রিফ্রেশ হয়।

### ৪.৫ System Wipe (সম্পূর্ণ সিস্টেম মুছে ফেলা) — Danger Zone
1. প্রথমে `confirm()` ডায়ালগ আসে ("Are you sure?")
2. তারপর `prompt()` আসে যেখানে ইউজারকে **"DELETE"** টেক্সট টাইপ করতে হয়।
3. `DELETE` সঠিকভাবে টাইপ না করলে কিছুই হবে না।
4. সঠিক হলে `/api/files/clear-all-planning` API তে DELETE রিকোয়েস্ট যায় এবং সব ডাটা ও ফাইল মুছে যায়।

---

## পার্ট ৫: ডাটা রিডিং ও কলাম ম্যাপিং (Data Reading & Column Mapping)

### ৫.১ `getColData()` — স্মার্ট কলাম ম্যাচিং ফাংশন
এই ফাংশনটি সিস্টেমের অন্যতম গুরুত্বপূর্ণ অংশ। এটি একটি এক্সেলের row এবং সম্ভাব্য কলাম নামগুলোর একটি array নেয়। তারপর:
1. প্রতিটি সম্ভাব্য কলাম নাম (`keys`) এবং এক্সেলের প্রকৃত কলাম নাম — উভয়কেই **lowercase করে** এবং **সব special character মুছে ফেলে** (শুধু a-z এবং 0-9 রাখে)।
2. যদি দুটি মিলে যায়, তাহলে সেই কলামের ভ্যালু রিটার্ন করে।
3. এর মানে হলো, এক্সেলে কলামের নাম যদি `Booking No`, `BookingNo`, বা `Booking_No` যেটাই হোক, সিস্টেম সবগুলোকেই `bookingno` হিসেবে চিনবে এবং সঠিক ডাটা বের করবে।

### ৫.২ General Information — কোন কলাম থেকে কী আসে
| সিস্টেমের ফিল্ড | এক্সেলের সম্ভাব্য কলাম নামগুলো |
|---|---|
| Order/Booking No | `BookingNo`, `OrderNo`, `EWO`, `Booking`, `Order No`, `Booking No` |
| Buyer | `Buyer`, `BuyerName`, `Customer` |
| Booking Date | `BookingReceiveDate`, `BookingDate`, `Date` |
| Buyer Team | `BuyerTeam`, `Team` |
| Status | `Status` |
| EWO No | `OrderNo`, `EWO` |
| Order Qty | `RequiredQtyKgs`, `Qty`, `Order Qty` |
| Booking Unit | `BookingUnit` |
| Unit | `Unit` |
| Final Confirmation | `FinalConfirmation`, `Status` |
| Event Day | `EventDay` |
| 1st Shipment Date | `1stShipmentDate`, `Ship1` |
| Last Shipment Date | `LastShipmentDate`, `ShipLast` |
| T&A Yarn Date | `TAYarnDate`, `YarnDate` |
| T&A Delivery Start | `TADeliStart`, `DeliStart` |
| T&A Delivery End | `TADeliEnd`, `DeliEnd` |
| T&A Knitting Start | `TAKnittingStart`, `KnitStart` |
| T&A Knitting End | `TAKnittingEnd`, `KnitEnd` |
| T&A Dyeing Start | `TADyeingStart`, `DyeStart` |
| T&A Dyeing End | `TADyeingEnd`, `DyeEnd` |
| Fabric Notes | `FabricNotes`, `Notes` |

### ৫.৩ Department Items — কোন কলাম থেকে কী আসে
| ফিল্ড | সম্ভাব্য কলাম |
|---|---|
| Color | `Color`, `Colour`, `Fab Color` |
| Fabric Construction | `FabricConstruction`, `Construction`, `Fab Const`, `Fabric` |
| GSM | `GSM`, `G.S.M` |
| Process Name | `Process Name`, `ProcessName`, `Process` |
| Grey Req | `Grey Req.`, `GreyReq` |
| Knit Prod | `Knit Prod.`, `KnitProd` |
| Knit Balance | `Knit. Bala.`, `KnitBala` |
| Yarn Req | `Yarn req.`, `YarnReq` |
| Allocated Qty | `Allocated Qty`, `AllocatedQty` |
| Yarn Balance | `Yarn bala.`, `YarnBala` |
| Allowance | `Allowance %`, `Allowance` |
| BP Qty | `BP Qty`, `BPQty` |
| Dyeing Prod | `Dyeing Prod.`, `DyeingProd` |
| Dyeing Balance | `Dyeing Bala.`, `DyeingBala` |
| Net Received Qty | `NetReceivedQtyKgs`, `NetReceivedQty`, `ReceivedQty` |
| Net Delivery Qty | `NetDeliveryQtyKgs`, `NetDeliveryQty`, `DeliveryQty` |
| RFD | `RFD` |
| Slowmoving | `Slowmoving` |
| FF Stock | `FF Stock`, `FFStock` |

### ৫.৪ Excel Date Conversion (`formatExcelDate`)
* যদি এক্সেল থেকে তারিখ **সংখ্যা (Serial Number)** হিসেবে আসে (যেমন: 45678), তাহলে সিস্টেম সেটিকে `(val - 25569) * 86400 * 1000` সূত্র ব্যবহার করে JavaScript Date-এ রূপান্তর করে।
* যদি **স্ট্রিং** হিসেবে আসে (যেমন: "2026-01-15"), তাহলে সরাসরি `new Date()` দিয়ে parse করে।
* প্রদর্শনের সময় সবসময় `DD-MMM-YYYY` ফরম্যাটে (যেমন: `15-Jan-2026`) দেখানো হয়।

---

## পার্ট ৬: ডাটা ফেচ, গ্রুপিং ও মার্জিং (Data Fetching, Grouping & Merging)

### ৬.১ `fetchAndProcessData()` — মূল ডাটা প্রসেসিং ফাংশন
এই ফাংশনটি সম্পূর্ণ সিস্টেমের হৃদপিণ্ড। এটি নিচের ধাপগুলো অনুসরণ করে:

**ধাপ ১: সার্ভার থেকে সব ফাইলের তালিকা আনা**
* `/api/files/all` API থেকে সমস্ত আপলোড করা ফাইলের তালিকা আনে।

**ধাপ ২: ফাইল ফিল্টারিং**
* "General" ক্যাটাগরির ফাইলগুলোকে আলাদা করে (`generalFilesRaw`)।
* বর্তমান ডিপার্টমেন্টের (যেমন: Knitting) ক্যাটাগরির ফাইলগুলোকে আলাদা করে (`deptFilesRaw`)।

**ধাপ ৩: Latest File Selection (সর্বশেষ ফাইল নির্বাচন)**
* **একই নামের ফাইল** একাধিকবার আপলোড থাকলে শুধুমাত্র সর্বশেষ ভার্সনটি নেয়। (`Map` ব্যবহার করে `originalName` অনুযায়ী সর্বশেষটি রাখে।)

**ধাপ ৪: ফাইল থেকে ডাটা পড়া (`readFiles`)**
* প্রতিটি ফাইল সার্ভার থেকে ডাউনলোড করে `ArrayBuffer`-এ রূপান্তর করে।
* SheetJS (XLSX) দিয়ে ফাইল পড়ে প্রথম শীটের ডাটা JSON array-তে রূপান্তর করে।
* প্রতিটি row-তে `_fileIndex` যোগ করে রাখে, যাতে পরে ট্র্যাক করা যায় কোন row কোন ফাইল থেকে এসেছে।

**ধাপ ৫: General Data গ্রুপিং**
* প্রতিটি row-কে Booking No অনুযায়ী গ্রুপ করে `groupedData` অবজেক্টে রাখে।
* Booking No না থাকলে `Unknown_Booking_X` নাম দেয়।
* Buyer না থাকলে বা `undefined`/`n/a` হলে → **"General"** হিসেবে সেট করে।
* একই Booking No-র একাধিক row থাকলে, পরের row-এর ডাটা আগেরটিকে ওভাররাইড করে **শুধুমাত্র যদি নতুন ভ্যালু ফাঁকা না হয়**।

**ধাপ ৬: Department Data গ্রুপিং**
* Department-specific ফাইলের ডাটাগুলোকেও Booking No অনুযায়ী গ্রুপ করে।
* প্রতিটি row-কে `excelItems` array-তে পুশ করে।

**ধাপ ৭: ডাটাবেস থেকে সেভ করা প্ল্যানিং ডাটা আনা**
* `/api/files/all-dates` API কল করে আগে সেভ করা সব তারিখ, Plan Type, Limitation, Remarks ইত্যাদি আনে।
* যদি `groupedData`-তে সেই Booking No আগে থেকে থাকে, তাহলে `dbData` হিসেবে অ্যাটাচ করে।
* যদি শুধু ডাটাবেসে থাকে কিন্তু এক্সেলে না থাকে, তাহলেও একটি নতুন গ্রুপ তৈরি করে রাখে।

**ধাপ ৮: Excel ↔ Database মার্জিং (সবচেয়ে জটিল অংশ)**
* এই ধাপে এক্সেলের আইটেম এবং ডাটাবেসের আইটেম একত্রিত করা হয়।
* বিস্তারিত নিচে (পার্ট ৭) আলোচনা করা হয়েছে।

---

## পার্ট ৭: আইটেম আইডি জেনারেশন ও মার্জিং লজিক (Item ID & Merging)

### ৭.১ `generateItemId()` — ইউনিক আইডি তৈরি
* **Knitting ও Delivery:** `OrderNo_Color_FabricConstruction_GSM` (সব lowercase, স্পেস বাদ)
* **Dyeing ও Finishing:** `OrderNo_Color_ProcessName` (সব lowercase, স্পেস বাদ)

### ৭.২ Duplicate Occurrence Handling (ডুপ্লিকেট হ্যান্ডলিং)
যদি একই আইডির একাধিক আইটেম থাকে (যেমন একই Color+FabricConstruction+GSM):
* **Knitting ও Delivery:** প্রতিটি ডুপ্লিকেটের জন্য `_2`, `_3` ইত্যাদি সাফিক্স যুক্ত করে আলাদা রাখে।
* **Dyeing ও Finishing:** ডুপ্লিকেট থাকলে শুধুমাত্র প্রথমটি রাখে, বাকিগুলো স্কিপ করে।

### ৭.৩ File Index Tracking (ফাইল ট্র্যাকিং)
* একাধিক ফাইল আপলোড করা থাকলে, যখন একটি নতুন ফাইলের ডাটা শুরু হয় (`_fileIndex` পরিবর্তন হয়), তখন আগের ফাইলের মার্জ করা আইটেমগুলো মুছে ফেলে এবং নতুন ফাইলের ডাটা দিয়ে শুরু করে। এর মানে হলো **সবসময় সর্বশেষ ফাইলের ডাটাই প্রাধান্য পায়**।

### ৭.৪ Excel ↔ Database মিলানো
প্রতিটি এক্সেল আইটেমের জন্য:
* **যদি ডাটাবেসে একই আইডি পাওয়া যায়:** এক্সেলের ডাটা (Color, GSM ইত্যাদি) নতুন হিসেবে নেয়, কিন্তু ডাটাবেসের সেভ করা `startDate`, `endDate`, `planType`, `limitation`, `remarks` বজায় রাখে। (source: `'Both'`)
* **যদি ডাটাবেসে না পাওয়া যায়:** সম্পূর্ণ নতুন আইটেম হিসেবে যুক্ত করে, সব প্ল্যানিং ফিল্ড ফাঁকা থাকে। (source: `'Excel'`)

---

## পার্ট ৮: অর্ডার লিস্ট ফিল্টারিং — Pending/Confirm/Tentative/Completed

### ৮.১ Plan Type অনুযায়ী অর্ডার ক্যাটাগরাইজেশন

প্রতিটি অর্ডারের `mergedItems` (মার্জ করা আইটেমগুলো) স্ক্যান করে ৩টি ভেরিয়েবল ট্র্যাক করে:
* `hasSelect` — কোনো আইটেমের planType ফাঁকা বা "Select" কিনা
* `hasTentative` — কোনো আইটেমের planType "Tentative" কিনা
* `confirmCount` — কতগুলো আইটেমের planType "Confirm"

**কন্ডিশন টেবিল:**
| কন্ডিশন | ফলাফল |
|---|---|
| `hasSelect === true` (যেকোনো একটি আইটেম "Select" বা ফাঁকা) | **Pending List** |
| `hasSelect === false` এবং `hasTentative === true` (কোনোটা "Select" নয়, কিন্তু অন্তত একটি "Tentative") | **Tentative List** |
| `confirmCount === totalItems` (১০০% আইটেম "Confirm") | **Confirm List** |
| উপরের কোনোটাই না মিললে | **Pending List** (ডিফল্ট) |

### ৮.২ Completed List কন্ডিশন
* Completed List-এ সেই অর্ডারগুলো দেখায় যেগুলোর `generalInfo.OrderStatus === 'Completed'`।
* অন্য সব লিস্টে (Pending/Confirm/Tentative) শুধুমাত্র `OrderStatus !== 'Completed'` অর্ডার দেখায়।
* Completed List-এ অর্ডারগুলো **Completed Date অনুযায়ী পুরাতন থেকে নতুন** ক্রমে সাজানো থাকে।

### ৮.৩ Buyer Filter (বায়ার ফিল্টার)
* Pending/Confirm/Tentative লিস্টে প্রতিটি Buyer-এর নাম ট্যাব আকারে দেখায়।
* ইউজার কোনো Buyer ট্যাবে ক্লিক করলে শুধুমাত্র সেই Buyer-এর অর্ডারগুলো দেখায়।
* ডিফল্টভাবে প্রথম Buyer সিলেক্ট থাকে।
* Buyer নাম **UPPERCASE**-এ নরমালাইজ করা হয় এবং ফাঁকা/undefined হলে "GENERAL" করা হয়।

### ৮.৪ Column Search Filter (কলাম সার্চ)
* টেবিলের প্রতিটি কলামের হেডারের নিচে একটি সার্চ বক্স আছে।
* ইউজার টাইপ করলে রিয়েল-টাইমে সেই কলামের ভ্যালু অনুযায়ী ফিল্টার হয়।

### ৮.৫ Pagination (পেজিনেশন)
* ডিফল্ট `rowsPerPage = 10`।
* ইউজার 10, 20, 50, বা 100 সিলেক্ট করতে পারে।
* "Showing X-Y of Z" এবং Prev/Next বাটন দেখায়।

---

## পার্ট ৯: ডিটেইল ভিউ — প্ল্যানিং ইনপুট ও ভ্যালিডেশন

### ৯.১ ডিটেইল ভিউ ওপেন করা
যেকোনো অর্ডারের Eye (👁️) আইকনে ক্লিক করলে:
* লিস্ট ভিউ লুকিয়ে যায়, ডিটেইল ভিউ দেখায়।
* উপরে General Info প্যানেলে সেই অর্ডারের সব সাধারণ তথ্য populate হয়।
* নিচে Department Fabric Items টেবিলে সেই ডিপার্টমেন্টের সব আইটেম দেখায়।

### ৯.২ ডিপার্টমেন্ট অনুযায়ী ভিন্ন কলাম
প্রতিটি ডিপার্টমেন্টের জন্য টেবিলে আলাদা আলাদা কলাম দেখানো হয়:

**Knitting:**
* Left: Color, FabricConstruction, GSM
* Planning: Start Date, End Date, Plan Type, Limitation, Remarks
* Right: Grey Req, Knit Prod, Knit Bala, Yarn Req, Allocated Qty, Yarn Bala, Allowance %

**Dyeing:**
* Left: Color, Unit (Dropdown: EFL/EKL/Ext/Outside), Process Name (Dropdown: Solid/Dyeing Wash/HTR/Pluvia/SB/WH/DF)
* Knitting Planning (Read-Only): Knitting Start Date, End Date, Plan Type, Limitation, Remarks — এগুলো Knitting ডিপার্টমেন্টের সেভ করা ডাটা থেকে এসে শুধু দেখায়, এডিট করা যায় না।
* Dyeing Planning: Start Date, End Date, Plan Type, Limitation, Remarks
* Right: BP Qty, Dyeing Prod, Dyeing Bala, Knit Prod, Knit Bala

**Delivery:**
* Left: Color, FabricConstruction, GSM
* Knitting Planning (Read-Only): Start Date, End Date
* Dyeing Planning (Read-Only): Start Date, End Date, Plan Type
* Delivery Planning: Start Date, End Date, Plan Type, Limitation, Remarks
* Right: RequiredQtyKgs, NetReceivedQtyKgs, NetDeliveryQtyKgs, RFD, Slowmoving, FF Stock

**Finishing:**
* Left: OrderNo, Color, RequiredQtyKgs, Buyer, Unit, Process Name, Grey Req, Knit Prod, Knit Bala, BP Qty, Dyeing Prod, Dyeing Bala, NetReceivedQtyKgs, NetDeliveryQtyKgs, RFD, Slowmoving, FF Stock
* Planning: Start Date, End Date, Plan Type, Limitation, Remarks

### ৯.৩ Auto-Fill (অটো ফিল) ফিচার
**প্রথম আইটেমে ইনপুট দিলে বাকি সবগুলোতে অটোমেটিকভাবে কপি হয়ে যায়:**
* **Start Date:** প্রথম row-তে Start Date পরিবর্তন করলে, বাকি সব row-তেও একই Start Date সেট হয় (যদি সেই row-তে ভ্যালিডেশন পাস করে)।
* **End Date:** একইভাবে অটো-কপি হয়।
* **Plan Type:** একইভাবে অটো-কপি হয়।
* **Dyeing-এ Unit:** প্রথম row-তে Unit সিলেক্ট করলে বাকি সব row-তে একই Unit সেট হয়।
* **Dyeing-এ Process Name:** একইভাবে অটো-কপি হয়।

### ৯.৪ Confirmed Item Lock (কনফার্মড আইটেম লক)
* যদি কোনো আইটেমের Plan Type আগে থেকেই "Confirm" থাকে এবং ইউজার **Admin না হয়**, তাহলে সেই আইটেমের `Plan Type`, `Start Date`, এবং `End Date` ইনপুট **disabled** (অচল) হয়ে যায়।
* **শুধুমাত্র Admin** এগুলো পরিবর্তন করতে পারে।

### ৯.৫ Delivery-তে Dyeing Dependency Lock (ডেলিভারিতে ডাইং নির্ভরতা)
* Delivery ডিপার্টমেন্টে, যদি কোনো আইটেমের **Dyeing Start Date** ফাঁকা থাকে বা `-` থাকে, তাহলে সেই আইটেমের Delivery Planning (Start Date, End Date, Plan Type) সম্পূর্ণ **disabled** থাকে।
* অর্থাৎ, **Dyeing-এর কাজ শুরু না হলে Delivery plan করাই যাবে না।**

---

## পার্ট ১০: ডেটা ভ্যালিডেশন রুলস (Data Validation Rules)

### ১০.১ তারিখ ভ্যালিডেশন (Date Validation)
| রুল নং | শর্ত | Toast Message |
|---|---|---|
| ১ | Start Date > End Date হতে পারবে না | "Start Date cannot be greater than End Date!" |
| ২ | (Dyeing) Dyeing Start Date < Knitting Start Date হতে পারবে না | "Dyeing Start Date cannot be less than Knitting Start Date!" |
| ৩ | (Dyeing) Dyeing End Date < Knitting End Date হতে পারবে না | "Dyeing End Date cannot be less than Knitting End Date!" |
| ৪ | (Dyeing) Knitting Plan সম্পূর্ণ ফাঁকা থাকলে Dyeing date দেওয়া যাবে না | "Cannot set Dyeing plan because Knitting plan is blank!" |

### ১০.২ Plan Type ভ্যালিডেশন
| রুল নং | শর্ত | Toast Message |
|---|---|---|
| ৫ | Confirm বা Tentative সিলেক্ট করতে হলে Start Date ও End Date দিতেই হবে | "Start and End dates are required to set Plan Type." |
| ৬ | (Dyeing) Knitting Plan ফাঁকা থাকলে Dyeing Plan Type দেওয়া যাবে না | "Cannot set Dyeing plan because Knitting plan is blank!" |
| ৭ | (Dyeing) Knitting "Tentative" থাকলে Dyeing "Confirm" করা যাবে না | "Cannot confirm Dyeing when Knitting is Tentative." |
| ৮ | (Dyeing) Final Confirmation "No" থাকলে Dyeing Confirm করা যাবে না | "Cannot confirm Dyeing because Final Confirmation is 'No'." |
| ৯ | (Delivery) Dyeing Plan Type "Tentative", ফাঁকা বা "-" থাকলে Delivery Confirm করা যাবে না | "Cannot confirm Delivery when Dyeing is Tentative or blank." |

### ১০.৩ Save-Time Validation (সেভ করার সময় ভ্যালিডেশন)
সেভ বাটনে ক্লিক করার পর আরও কঠোর চেক হয়:
| রুল নং | শর্ত | Toast Message |
|---|---|---|
| ১০ | আগে Confirm ছিল, এখন পরিবর্তন করা হচ্ছে এবং ইউজার Admin নয় | "Save failed: Only Admin can change a Confirmed plan!" |
| ১১ | Downstream Department (পরবর্তী ডিপার্টমেন্ট) Confirm আছে এবং ইউজার Admin নয়, কিন্তু বর্তমান ডিপার্টমেন্টের ডাটা পরিবর্তন করা হচ্ছে | "Save failed: Cannot change [dept] because the next department is already Confirmed!" |
| ১২ | Start Date > End Date | "Save failed: A Start Date is greater than its End Date." |
| ১৩ | Plan Type সিলেক্ট করা হয়েছে কিন্তু Start/End Date দেওয়া হয়নি | "Save failed: Plan Type selected without Start and End dates." |
| ১৪ | (Delivery) Dyeing Plan ফাঁকা থাকলে Delivery-তে কিছু ইনপুট দেওয়া যাবে না | "Save failed: Cannot input Delivery. Dyeing plan is missing!" |
| ১৫ | (Delivery) Delivery Start Date < Dyeing Start Date | "Save failed: Delivery Start Date cannot be before Dyeing Start Date!" |
| ১৬ | (Delivery) Delivery End Date < Dyeing End Date | "Save failed: Delivery End Date cannot be before Dyeing End Date!" |

### ১০.৪ Downstream Chain Lock (ডাউনস্ট্রিম চেইন লক)
এটি সিস্টেমের একটি অত্যন্ত গুরুত্বপূর্ণ সিকিউরিটি ফিচার:
* **যদি Dyeing Confirm থাকে** → Knitting পরিবর্তন করা যাবে না (Admin ছাড়া)।
* **যদি Delivery Confirm থাকে** → Dyeing পরিবর্তন করা যাবে না (Admin ছাড়া)।
* এটি নিশ্চিত করে যে একবার পরবর্তী ডিপার্টমেন্ট কাজ শুরু করে দিলে, আগের ডিপার্টমেন্টের প্ল্যান যেন কেউ পরিবর্তন করতে না পারে।

### ১০.৫ Order Status Change কনফার্মেশন
* যদি ইউজার Order Status "On Process" থেকে "Completed"-এ পরিবর্তন করে, তাহলে `confirm()` ডায়ালগ আসে: "Are you sure you want to mark order 'XXX' as Completed?"
* "OK" ক্লিক করলে সেভ হয়, "Cancel" করলে স্ট্যাটাস "On Process"-এ ফিরে যায়।

---

## পার্ট ১১: ডাটা সেভ প্রসেস (Save Data Logic)

### ১১.১ Save Payload
সেভ করার সময় সিস্টেম নিচের JSON পাঠায়:
```json
{
  "orderNo": "Booking No",
  "department": "knitting/dyeing/finishing/delivery",
  "fabricItems": [
    {
      "itemId": "unique_id",
      "itemData": { Color, GSM, etc. },
      "startDate": "2026-01-15",
      "endDate": "2026-01-20",
      "planType": "Confirm/Tentative/Select",
      "limitation": "text",
      "remarks": "text"
    }
  ],
  "orderStatus": "On Process / Completed",
  "completedDate": "ISO date / null"
}
```

### ১১.২ Save-এ কী কী সেভ হয়
* শুধুমাত্র **ইউজারের দেওয়া ডাটা** সেভ হয়: Start Date, End Date, Plan Type, Limitation, Remarks, Order Status।
* Dyeing-এ অতিরিক্ত `Unit` এবং `ProcessName`-ও সেভ হয়।
* এক্সেলের মূল ডাটা (Color, GSM, Qty ইত্যাদি) ডাটাবেসে সেভ হয় না — সেগুলো সবসময় সরাসরি এক্সেল থেকে পড়া হয়।

### ১১.৩ Optimistic UI Update
* সেভ বাটনে ক্লিক করলে **তৎক্ষণাৎ** UI আপডেট হয়ে যায় (ডিটেইল ভিউ বন্ধ হয়, মেইন টেবিল রিরেন্ডার হয়)।
* ব্যাকগ্রাউন্ডে API কল চলে এবং সফল হলে আবার ফ্রেশ ডাটা ফেচ করে (`fetchAndProcessData(true)`)।

---

## পার্ট ১২: রিপোর্ট ও এক্সেল ডাউনলোড (Reports & Excel Download)

### ১২.১ Report Mode
* সাইডবারের "Report" সাবমেনু থেকে যেকোনো ডিপার্টমেন্টে ক্লিক করলে **Report Mode** চালু হয়।
* Report Mode-এ মেইন টেবিল (Pending/Confirm/Tentative) লুকিয়ে যায়।
* দুটি কার্ড দেখায়: "Updated Confirm List" এবং "Updated Tentative List"।

### ১২.২ Report Card Visibility (রিপোর্ট কার্ড দেখানোর শর্ত)
* **Confirm Card দেখায়:** যদি কমপক্ষে একটি অর্ডার `isConfirm === true` হয়।
* **Tentative Card দেখায়:** যদি কমপক্ষে একটি অর্ডার `isTentative === true` হয়।
* **উভয়টি ফাঁকা হলে:** "No Report Data Available" Empty State দেখায়।

### ১২.৩ Excel Export Logic (`exportReportToExcel`)
1. `groupedData`-র সব অর্ডার স্ক্যান করে টার্গেট Plan Type (Confirm/Tentative) ফিল্টার করে।
2. প্রতিটি matching আইটেমকে **Buyer Name অনুযায়ী** আলাদা array-তে রাখে।
3. **Buyer Name Sanitization:** বিশেষ ক্যারেক্টার (`[]/*?\:`) আন্ডারস্কোর দিয়ে রিপ্লেস করে এবং ৩১ ক্যারেক্টারে কেটে ফেলে (Excel Sheet Name-এর সীমাবদ্ধতা)।
4. প্রতিটি Buyer-এর জন্য আলাদা **Worksheet (ট্যাব)** তৈরি হয়।
5. ফাইলের নাম: `KNITTING_Confirm_Report_2026-06-03.xlsx`

### ১২.৪ Completed List Excel Download
* Completed List-এ একটি "EXCEL" বাটন আছে।
* ক্লিক করলে সব Completed অর্ডারের Order No, Completed Date, Buyer, এবং Status সহ এক্সেল ডাউনলোড হয়।

---

## পার্ট ১৩: Order Status Dashboard (অর্ডার স্ট্যাটাস)

### ১৩.১ ডাটা ফেচ (`fetchAllDataForOS`)
* এই পেজ সব ক্যাটাগরির সব ফাইল একসাথে পড়ে (General + Knitting + Dyeing + Finishing + Delivery সব)।
* সবগুলোকে Booking No অনুযায়ী গ্রুপ করে।
* একই Color + FabricConstruction-এর ডুপ্লিকেট আইটেম মার্জ করে।

### ১৩.২ Cross-File Double Counting Prevention (ক্রস-ফাইল ডাবল কাউন্টিং রোধ)
* প্রতিটি ফাইলের ভিত্তিতে আলাদাভাবে Allocated Qty, Yarn Bala, Knit Prod ইত্যাদি যোগ করা হয় (`totalsPerFile`)।
* তারপর সব ফাইলের মধ্যে **সর্বোচ্চ ভ্যালু (`Math.max`)** নেওয়া হয়।
* এতে একই ডাটা একাধিক ফাইলে থাকলেও হিসাব ডাবল হয় না।

### ১৩.৩ Detailed View — প্রোডাকশন সামারি
Order Status-এ কোনো অর্ডারে ক্লিক করলে যে তথ্যগুলো দেখায়:
* Booking No, Buyer, Allocated Qty, Yarn bala.
* Knit Prod, Dyeing Prod, Net Delivery Qty, Slowmoving
* Knit Bala, Dyeing Bala, Deli. Bal., RFD

### ১৩.৪ Department-wise Planning Breakdown
নিচের টেবিলে প্রতিটি ডিপার্টমেন্টের:
* **Aggregated Start Date** (সবচেয়ে আগের/Minimum তারিখ)
* **Aggregated End Date** (সবচেয়ে পরের/Maximum তারিখ)
* **Aggregated Plan Type** (যদি কোনো আইটেম "Tentative" থাকে তবে "Tentative", সব "Confirm" থাকলে "Confirm", অন্যথায় "-")

### ১৩.৫ PDF ও Excel Download
* **PDF:** `html2pdf.js` ব্যবহার করে A4 Landscape ফরম্যাটে ডাউনলোড হয়।
* **Excel:** সমস্ত প্রোডাকশন সামারি এবং ফেব্রিক আইটেম ব্রেকডাউন সহ ডাউনলোড হয়।

---

## পার্ট ১৪: UI/UX ফিচারস ও অন্যান্য

### ১৪.১ Page State Persistence (পেজ স্টেট মনে রাখা)
* ইউজার যে পেজে আছে (Dashboard, Data Management, কোন Department, Order Status) সেটি `localStorage`-এ `activePage` হিসেবে সেভ থাকে।
* পেজ রিফ্রেশ করলে আগের পেজেই ফিরে আসে।

### ১৪.২ Dynamic Tab System (ডাইনামিক ট্যাব)
* সাইডবার থেকে বিভিন্ন ডিপার্টমেন্ট ওপেন করলে উপরে ট্যাব তৈরি হয়।
* প্রতিটি ট্যাবে ✕ ক্লিক করে বন্ধ করা যায়।
* সব ট্যাব বন্ধ করলে Dashboard-এ ফিরে যায়।

### ১৪.৩ Sidebar — Mobile Responsive
* মোবাইলে সাইডবার ডিফল্টে লুকানো থাকে (`-translate-x-full`)।
* হ্যামবার্গার মেনু (☰) ক্লিক করলে সাইডবার স্লাইড করে আসে।
* একটি কালো overlay দেখায়, overlay-তে ক্লিক করলে সাইডবার বন্ধ হয়।
* ডেস্কটপে সাইডবার টগল করলে margin-left দিয়ে সরানো হয়।

### ১৪.৪ Sidebar Submenu Accordion
* "Order Management" এবং "Report" মেনুতে ক্লিক করলে সাবমেনু টগল হয় (দেখায়/লুকায়)।
* Chevron আইকন ঘুরে যায় (◀ → ▼)।

### ১৪.৫ Active Sidebar Highlight
* বর্তমানে যে মেনু আইটেম সক্রিয়, সেটি `bg-sidebarActive`, `text-white`, এবং বামে সবুজ বর্ডার (`border-[#4CAF50]`) দিয়ে হাইলাইট হয়।
* যদি সেটি সাবমেনুর ভেতরে থাকে এবং সেই সাবমেনু বন্ধ থাকে, তাহলে সাবমেনু অটোমেটিক ওপেন হয়ে যায়।

### ১৪.৬ Toast Notification
* সব ধরনের অ্যাকশনের পর (আপলোড, সেভ, এরর, ভ্যালিডেশন ফেইল) উপরে ডানদিকে একটি Toast দেখায়।
* ৩ সেকেন্ড পরে অটোমেটিক মিলিয়ে যায়।

---

## সামগ্রিক ডাটা ফ্লো ডায়াগ্রাম (Overall Data Flow)
```
Excel File Upload ──► Server-এ সেভ
         │
         ▼
User clicks Department ──► fetchAndProcessData() কল হয়
         │
         ├── ১. /api/files/all থেকে ফাইল তালিকা আনে
         ├── ২. General + Dept ফাইল আলাদা করে
         ├── ৩. একই নামের Latest ভার্সন বাছাই করে
         ├── ৪. SheetJS দিয়ে Excel পড়ে JSON বানায়
         ├── ৫. Booking No অনুযায়ী গ্রুপিং করে
         ├── ৬. /api/files/all-dates থেকে Database ডাটা আনে
         ├── ৭. Excel Items ↔ DB Items মার্জ করে (Unique ID basis)
         └── ৮. Plan Type চেক করে Pending/Confirm/Tentative ক্যাটাগরাইজ করে
                  │
                  ▼
         Main Table-এ অর্ডার দেখায় (Buyer Tab + Pagination সহ)
                  │
                  ▼ (ক্লিক)
         Detailed View ──► ইউজার Date, Plan Type, Limitation, Remarks দেয়
                  │
                  ▼ (Save)
         Validation Check ──► পাস হলে /api/files/save-dates এ POST
                  │
                  ▼
         UI আপডেট + Background Refresh
```
