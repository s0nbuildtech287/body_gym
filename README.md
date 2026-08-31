# 🏋️‍♂️ BodyGym - Elite Workout & Fitness Platform

> **BodyGym** là nền tảng ứng dụng thể hình & theo dõi tập luyện đa nền tảng (**Mobile-First Web App & PWA**), xây dựng bằng **Java Spring Boot 3.3.4 (JDK 18)**, tích hợp trọn vẹn kho dữ liệu **1,324 bài tập (kèm hình ảnh Thumbnail & Animation GIF chuyển động kỹ thuật)** cùng chuẩn thiết kế **UI/UX Pro Max**.

---

## 🌟 Tính Năng Nổi Bật

1. **Kho Dữ Liệu 1,324 Bài Tập & Video GIF (Exercise Explorer):**
   - Tự động import và lập chỉ mục 1,324 bài tập từ `exercises.json` vào database Spring Boot.
   - Tìm kiếm nhanh, lọc đa chiều theo 10 nhóm cơ (`Chest`, `Back`, `Legs`, `Shoulders`, `Arms`, `Waist`, `Cardio`...) và thiết bị (`Barbell`, `Dumbbell`, `Cable`, `Bodyweight`...).
   - Hướng dẫn kỹ thuật từng bước bằng **Tiếng Việt chuẩn Huấn luyện viên thể hình** kèm mẹo an toàn (Coach's Pro Tips) và hỗ trợ đa ngôn ngữ (English, Français, 中文).

2. **Trình Ghi Log Buổi Tập Trực Tiếp (Live Workout Tracker - Hevy/Strong style):**
   - Bấm giờ buổi tập thời gian thực (**Live Elapsed Workout Timer**).
   - Ghi nhận chi tiết từng Set: Phân loại Set (`Warm-up`, `Normal`, `Drop-set`, `Failure`), trọng lượng tạ (**kg**), số lần lặp (**Reps**).
   - **Smart Rest Timer & Web Audio Synth Beep**: Tự động đếm ngược thời gian nghỉ (30s, 60s, 90s, 120s, 180s) và phát âm thanh chuông *beep* khi hết giờ.
   - Hiệu ứng pháo hoa Confetti 🎉 khi hoàn thành buổi tập và vinh danh **Kỷ Lục Cá Nhân (PR)**.

3. **Giáo Án & Split Luyện Tập (Routines & Programs):**
   - Giáo án chuẩn quốc tế: *Push Day Alpha*, *Pull Day Beast*, *Legs & Core*, *Upper Body Power*, *Full Body HIIT*, *Arnold Golden Era Split*.
   - Cho phép người dùng tự thiết kế giáo án tùy chỉnh (Routine Builder) và kích hoạt buổi tập chỉ với 1 chạm.

4. **Bản Đồ Hồi Phục Cơ Bắp & Thống Kê (Muscle Recovery Heatmap - Fitbod style):**
   - Phân tích thời gian nghỉ của từng nhóm cơ (🔴 Đang mỏi <50%, 🟡 Đang hồi phục 50-89%, 🟢 Đã hồi phục 90-100%).
   - Bấm vào nhóm cơ trên Heatmap để lọc bài tập ngay.
   - Biểu đồ khối lượng tạ tích lũy theo tuần (**Weekly Volume Progression** qua Chart.js).
   - Bảng vinh danh **Kỷ Lục Cá Nhân (PR Wall of Fame)** cho các bài Compound lớn (Bench Press, Squat, Deadlift, OHP).

5. **Bộ Công Cụ Tính Toán Thể Hình (Fitness Calculator Suite):**
   - **1-Rep Max (1RM) Calculator**: Áp dụng các công thức chuẩn khoa học (Brzycki, Epley, Lander, Mayhew, Lombardi) và sinh bảng tải tạ theo từng % 1RM.
   - **TDEE & BMR Calculator**: Tính lượng Calo tiêu hao và phân bổ Macro hàng ngày (**Protein, Carb, Fat**) theo mục tiêu Tăng cơ, Giảm mỡ hoặc Duy trì.

---

## 🛠️ Cài Đặt & Chạy Ứng Dụng

### Yêu cầu môi trường:
- **Java**: OpenJDK / Oracle JDK 17+ (Khuyên dùng JDK 18+)

### Chạy ứng dụng:
```bash
cd bodygym-backend
.\gradlew.bat bootRun
```

Truy cập ứng dụng tại: **`http://localhost:8080/`**
H2 Database Console: **`http://localhost:8080/h2-console`**
