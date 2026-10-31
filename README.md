# 🏋️ BodyGym

BodyGym là nền tảng hỗ trợ tập luyện và theo dõi tiến độ thể hình. Ứng dụng giúp người dùng khám phá bài tập, xem hướng dẫn kỹ thuật, lựa chọn giáo án, ghi nhận buổi tập và theo dõi volume theo thời gian.

Phiên bản hiện tại được định hướng theo mô hình frontend React deploy độc lập, kết nối tới một lớp dịch vụ dữ liệu cloud cho tài khoản, giáo án và lịch sử tập luyện.

## ✨ Điểm nổi bật

- Thư viện **1.324 bài tập** với nhóm cơ, dụng cụ, hình ảnh thumbnail và animation GIF.
- Tìm kiếm và lọc bài tập theo tên, nhóm cơ, mục tiêu và thiết bị.
- Màn giới thiệu onboarding trực quan với animation dumbbell và hiệu ứng chuyển động.
- Đăng nhập/đăng ký khi người dùng muốn lưu dữ liệu cá nhân.
- Giáo án preset và tạo routine cá nhân.
- Live workout đơn giản để ghi nhận sets, reps, volume và lịch sử tập.
- Dashboard tổng quan về số buổi tập, volume và streak.
- Trang Analytics theo dõi lịch sử workout và thành tích.
- Calculator 1RM chạy trực tiếp trên trình duyệt.
- Giao diện dark theme, responsive, tối ưu cho desktop và mobile.

## 🧱 Kiến trúc hiện tại

```text
React + Vite frontend
        │
        ├── Cloud data service
        │      └── Users, profiles, routines, workout logs
        │
        └── Static assets
               ├── exercises.json
               ├── images/
               └── videos/
```

Java Spring Boot cũ vẫn được giữ trong repository để chạy local/fallback, nhưng bản React hiện tại không cần Java để build hoặc deploy frontend.

## 🛠️ Công nghệ sử dụng

### Frontend

- React 18+
- Vite
- JavaScript ES Modules
- React Hooks
- Lucide React Icons
- CSS responsive thuần

### Dữ liệu và dịch vụ cloud

- REST-style cloud data service
- Tài khoản, profile, routines và workout logs
- SHA-256 hash cho mật khẩu trước khi lưu
- Local static JSON cho danh mục bài tập

### Legacy/local backend

- Java 17
- Spring Boot 3.3
- Spring Data JPA
- H2 Database
- Docker

## 📁 Cấu trúc quan trọng

```text
BodyGym/
├── frontend-react/              # Frontend React hiện tại
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── styles.css
│   │   └── api/cloudClient.js
│   ├── public/data/exercises.json
│   ├── public/media/
│   ├── package.json
│   └── vite.config.js
│
├── frontend/                    # Bản frontend HTML/CSS/JS legacy
├── bodygym-backend/             # Spring Boot backend legacy/local
└── exercises-dataset/           # Dataset gốc bài tập
```

## 🚀 Chạy frontend React local

```bash
cd frontend-react
npm install
npm run dev
```

Build production:

```bash
npm run build
```

## ☁️ Deploy lên Vercel

Khi import repository vào Vercel, cấu hình:

```text
Root Directory: frontend-react
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Frontend React kết nối tới lớp dịch vụ dữ liệu cloud thông qua module API riêng trong `src/api/`.

## ⚠️ Ghi chú

Kiến trúc dữ liệu hiện tại phù hợp cho prototype, demo và MVP nhỏ. Khi lượng người dùng tăng, nên chuyển sang PostgreSQL hoặc một database có authentication, transaction và phân quyền đầy đủ.

---

BodyGym — Train smarter. Track better. Become stronger. 💪
