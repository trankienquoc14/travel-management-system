# BẢNG KIỂM KÊ VÀ ÁNH XẠ KỸ THUẬT USE CASE (USE CASE INVENTORY)
## PHÂN HỆ: NHÂN VIÊN VĂN PHÒNG (OFFICE STAFF) – TRAVELVN ERP

---

### 1. Tổng quan phạm vi nghiệp vụ
Tài liệu này xác lập danh mục và bảng ánh xạ kỹ thuật truy vết cho bộ Use Case nghiệp vụ chính của vai trò **Nhân viên văn phòng (Office Staff - Role ID: 4)** trong Hệ thống Quản trị và Điều hành Du lịch **TravelVN ERP** (bao gồm 9 Use Case từ `UC-OS-01` đến `UC-OS-08`, trong đó nhóm nghiệp vụ đội xe `UC-OS-06` được tách rõ thành `UC-OS-06A` và `UC-OS-06B`).

Các chức năng dùng chung của hệ thống (như Đăng nhập, Đổi mật khẩu, Điểm danh GPS cá nhân hay Tiếp nhận thông báo) là các chức năng nền tảng chung cho toàn bộ nhân sự nội bộ công ty (`isInternalStaff`), đóng vai trò là Tiền điều kiện kỹ thuật và được phân tách độc lập khỏi bộ Use Case nghiệp vụ cốt lõi này.

---

### 2. Danh mục Use Case nghiệp vụ chính

| STT | Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Phân loại |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `UC-OS-01` | Tư vấn khách hàng | Chăm sóc khách hàng | Nghiệp vụ cốt lõi |
| 2 | `UC-OS-02` | Thiết kế tour riêng | Quản lý thiết kế tour | Nghiệp vụ cốt lõi |
| 3 | `UC-OS-03` | Thiết kế tour cố định | Quản lý sản phẩm tour | Nghiệp vụ cốt lõi |
| 4 | `UC-OS-04` | Xử lý hủy, đổi lịch | Quản trị đơn đặt tour | Nghiệp vụ cốt lõi |
| 5 | `UC-OS-05` | Xác nhận thanh toán | Quản lý thanh toán | Nghiệp vụ cốt lõi |
| 6 | `UC-OS-06A` | Theo dõi và cập nhật trạng thái xe | Quản lý đội xe nội bộ | Nghiệp vụ hỗ trợ |
| 7 | `UC-OS-06B` | Tiếp nhận và xử lý sự cố xe | Quản lý đội xe nội bộ | Nghiệp vụ hỗ trợ |
| 8 | `UC-OS-07` | Báo giá và điều chỉnh báo giá tour riêng | Quản lý báo giá | Nghiệp vụ cốt lõi |
| 9 | `UC-OS-08` | Chỉnh sửa thiết kế tour | Quản lý thiết kế tour | Nghiệp vụ cốt lõi |

---

### 3. Bảng ánh xạ kỹ thuật Use Case (Technical Traceability Matrix)

| Mã UC | Tên Use Case | Component Giao diện (Frontend) | Tuyến đường (Route / Tab) | Phương thức & API Endpoint Backend | File xử lý Backend (Controller) | Bảng dữ liệu tác động (MySQL) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UC-OS-01` | Tư vấn khách hàng | `StaffLiveChat.jsx` | Tab `staff_live_chat` | `Socket.IO (Port 5005)`<br>`GET /api/chat/conversations`<br>`GET /api/chat/conversations/:id/messages`<br>`POST /api/chat/upload`<br>`PUT /api/chat/conversations/:id/read`<br>`GET /api/chat/customers` | `chat-service/server.js` | `chat_conversations`, `chat_messages`, `users` |
| `UC-OS-02` | Thiết kế tour riêng | `StaffTourRequestManager.jsx` (Tab `tour_requests`), `StaffTourDesigner.jsx`, `TimelineBuilder.jsx` | Tab `tour_requests`, `tour_designer` | `GET /api/destinations`<br>`GET /api/services`<br>`GET /api/tours/fleet/vehicles`<br>`POST /api/custom-tours/requests/:id/submit-manager`<br>`POST /api/custom-tours/quotes/:id/send-to-customer` | `tour-service/controllers/customTourController.js` | `custom_tour_requests`, `custom_tour_quotes`, `destinations`, `services`, `vehicles` |
| `UC-OS-03` | Thiết kế tour cố định | `StaffFixedTourDesigner.jsx`, `TimelineBuilder.jsx` | Tab `fixed_tours` | `POST /api/tours/staff/tours`<br>`POST /api/tours/design`<br>`GET /api/staff/tours/:id`<br>`PUT /api/tours/staff/tours/:id`<br>`GET /api/tours/fleet/vehicles` | `tour-service/controllers/tourController.js` | `tours`, `itineraries`, `itinerary_activities`, `destinations`, `services`, `vehicles` |
| `UC-OS-04` | Xử lý hủy, đổi lịch | `StaffChangeRequestManager.jsx`, `StaffBookingManagement.jsx` | Tab `change_request` và Modal Hủy tại Tab `orders` | `GET /api/bookings/admin/change-requests`<br>`PUT /api/bookings/admin/change-requests/:id/process`<br>`PUT /api/bookings/admin/bookings/:bookingId/status` | `booking-service/controllers/bookingController.js` | `booking_change_requests`, `bookings`, `departures`, `booking_passengers`, `payments`, `notifications` |
| `UC-OS-05` | Xác nhận thanh toán | `StaffPaymentManagement.jsx` | Tab `payments` | `GET /api/bookings/admin/payments`<br>`PUT /api/bookings/:bookingId/confirm-cash` | `booking-service/controllers/bookingController.js` | `payments`, `bookings`, `notifications`, `timekeeping` |
| `UC-OS-06A` | Theo dõi và cập nhật trạng thái xe | `StaffVehicleManagement.jsx`, `StaffVehicleHistory.jsx` (Chế độ chỉ xem) | Tab `staff_fleet_vehicles`, `staff_vehicle_history` | `GET /api/tours/fleet/vehicles`<br>`PUT /api/tours/fleet/staff/vehicles/:id/status`<br>`GET /api/tours/fleet/staff/vehicles/:id/history` | `tour-service/controllers/vehicleController.js` (`getAllVehicles`, `updateVehicleStatusStaff`, `getVehicleHistoryStaff`) | `vehicles`, `vehicle_status_history`, `vehicle_maintenances`, `tour_vehicle_assignments` (đối chiếu lịch), `driver_incidents` (đối chiếu/tra cứu) |
| `UC-OS-06B` | Tiếp nhận và xử lý sự cố xe | `StaffVehicleIncidents.jsx`, `StaffVehicleHistory.jsx` (Tra cứu dòng thời gian) | Tab `staff_vehicle_incidents`, `staff_vehicle_history` | `GET /api/tours/fleet/staff/incidents`<br>`PUT /api/tours/fleet/staff/incidents/:id`<br>`GET /api/tours/fleet/staff/vehicles/:id/history` | `tour-service/controllers/vehicleController.js` (`getDriverIncidentsStaff`, `updateDriverIncidentStaff`, `getVehicleHistoryStaff`)<br>*(Luồng tạo sự cố từ Tài xế: `hr-service/controllers/driverController.js` - `reportIncident`)* | `driver_incidents`, `vehicles`, `vehicle_status_history`, `vehicle_maintenances`, `notifications` |
| `UC-OS-07` | Báo giá và điều chỉnh báo giá tour riêng | `StaffTourRequestManager.jsx`, `StaffPendingTours.jsx` | Tab `tour_requests_pending` và Tab `approved_tours` (sub-tab `custom`) | `POST /api/custom-tours/requests/:id/initial-quote`<br>`POST /api/custom-tours/quotes/:quoteId/send-to-customer` | `tour-service/controllers/customTourController.js` | `custom_tour_requests`, `custom_tour_quotes`, `notifications` |
| `UC-OS-08` | Chỉnh sửa thiết kế tour | `StaffTourRequestManager.jsx`, `StaffTourDesigner.jsx`, `TimelineBuilder.jsx` | Tab `tour_requests_revision` (điều hướng đến `tour_designer`) | `GET /api/custom-tours/requests/all`<br>`POST /api/custom-tours/requests/:id/submit-manager`<br>`GET /api/destinations`<br>`GET /api/services`<br>`GET /api/tours/fleet/vehicles` | `tour-service/controllers/customTourController.js` | `custom_tour_requests`, `custom_tour_quotes`, `destinations`, `services`, `vehicles` |

---

### 4. Đánh giá trạng thái triển khai kỹ thuật

| Mã UC | Tên Use Case | Trạng thái triển khai | Căn cứ mã nguồn thực tế |
| :---: | :--- | :---: | :--- |
| `UC-OS-01` | Tư vấn khách hàng | **Hoàn chỉnh** | Máy chủ Socket.IO cổng 5005 hoạt động đầy đủ: trò chuyện thời gian thực, gửi tệp đính kèm, ảnh, voice, hiển thị trạng thái đang soạn tin và cập nhật số tin chưa đọc. |
| `UC-OS-02` | Thiết kế tour riêng | **Hoàn chỉnh** | Công cụ Timeline Builder hoạt động trực quan: bóc tách định phí (xe nguyên chuyến theo ngày và đội xe thực tế, HDV) và biến phí (khách sạn, vé tham quan tự động từ hoạt động, ăn uống, bảo hiểm). Hiển thị giá bán đề xuất / 1 khách, bảng phân tích theo nhóm khách và Tổng giá tour toàn đoàn ở cả danh sách lẫn modal chi tiết; hỗ trợ gửi duyệt Quản lý (`submitToManager`) và gửi khách hàng (`sendToCustomer`). |
| `UC-OS-03` | Thiết kế tour cố định | **Hoàn chỉnh** | Lưu đầy đủ thông tin tour, lịch trình `itineraries`, hoạt động `itinerary_activities`, cấu trúc chi phí trong trường `design_data`, trạng thái mặc định `Pending` qua Database Transaction. Đồng bộ chọn phương tiện di chuyển chính trực tiếp từ danh mục Quản lý đội xe thực tế (`vehicles`), hiển thị tên xe, biển số, số chỗ ngồi và giá xe/ngày tự động tính theo thời lượng tour. |
| `UC-OS-04` | Xử lý hủy, đổi lịch | **Hoàn chỉnh** | Triển khai đầy đủ logic tính biểu phí phạt 5 mốc ngày (10% - 100%), hoàn trả chỗ trống `available_slots`, vô hiệu hóa mã QR check-in của vé và chuyển trạng thái thanh toán sang `Refunded`. |
| `UC-OS-05` | Xác nhận thanh toán | **Hoàn chỉnh** | Hỗ trợ đối soát thanh toán tiền mặt và SePay VietQR; hàm `confirmCashByStaff` cập nhật trạng thái thanh toán, kích hoạt xuất vé điện tử, tạo mã QR check-in và tự động chốt công cho HDV. |
| `UC-OS-06A` | Theo dõi và cập nhật trạng thái xe | **Đã triển khai (Cần điều chỉnh phân quyền & chuẩn hóa)** | **Đã có:** Xem danh sách xe, cập nhật trạng thái qua `updateVehicleStatusStaff` (`AVAILABLE` $\leftrightarrow$ `MAINTENANCE`/`REPAIR`), chặn `IN_TOUR`, ghi `vehicle_status_history` & `vehicle_maintenances`, xem lịch sử tại `StaffVehicleHistory.jsx`.<br>**Cần điều chỉnh:** (1) Gỡ bỏ nút Thêm/Sửa/Xóa hồ sơ xe trên `StaffVehicleManagement.jsx` và thu hồi quyền `role_id = 4` tại API `POST/PUT/DELETE /api/tours/fleet/vehicles` (chuyển về `restrictTo(1, 3)`); (2) Bổ sung tùy chọn chuyển sang `REPAIR` và hoàn tất `REPAIR` trên `StaffVehicleManagement.jsx`; (3) Gỡ bỏ nút `"Hoàn tất sửa chữa"` (`handleQuickResolve`) khỏi `StaffVehicleHistory.jsx` để đảm bảo lịch sử ở chế độ chỉ xem (Read-only). |
| `UC-OS-06B` | Tiếp nhận và xử lý sự cố xe | **Đã triển khai (Cần chuẩn hóa quy tắc nghiệp vụ)** | **Đã có:** Xem danh sách sự cố từ `driver_incidents` (`getDriverIncidentsStaff`), xử lý sự cố qua `updateDriverIncidentStaff` (`PROCESSING`, `REPAIR`, `RESOLVED`), đồng bộ `vehicles.status`, `vehicle_maintenances` và gửi thông báo cho Tài xế.<br>**Cần điều chỉnh:** (1) Chặn chuyển trạng thái xe sang `REPAIR` khi xe đang `IN_TOUR` hoặc đang gắn với chuyến đi đang diễn ra (`current_tour`); (2) Lưu ghi chú xử lý (`reason`) vào `vehicle_status_history` kể cả khi `old_status = new_status` (giữ nguyên `driver_incidents.description`); (3) Khi hoàn tất một sự cố (`RESOLVED`), kiểm tra không còn sự cố nào khác đang `Processing` trước khi chuyển xe về `AVAILABLE`. |
| `UC-OS-07` | Báo giá và điều chỉnh báo giá tour riêng | **Hoàn chỉnh** | Tiếp nhận yêu cầu mới (`Pending`); lập và gửi báo giá sơ bộ ban đầu (`initial-quote`); tiếp nhận và xử lý điều chỉnh báo giá khi khách phản hồi trước khi thiết kế (`Customer_Revision` ở giai đoạn báo giá); hỗ trợ cấu hình và bảo lưu 100% Chính sách giá trẻ em (`childPolicy`) theo 3 nhóm tuổi; gửi báo giá chính thức sau khi Quản lý duyệt (`send-to-customer`). |
| `UC-OS-08` | Chỉnh sửa thiết kế tour | **Hoàn chỉnh** | Chuyên biệt xử lý các bản thiết kế tour chi tiết cần chỉnh sửa từ Quản lý (`Manager_Rejected`) và Khách hàng (`Customer_Revision` trên hồ sơ đã có thiết kế tour sau khi duyệt gửi khách); tuyệt đối không tiếp nhận chỉnh sửa báo giá sơ bộ. Nút 'Sửa ngay' mở trực tiếp phòng thiết kế nạp lại toàn bộ lịch trình, cập nhật phương tiện từ đội xe thực tế, dịch vụ, tính toán tổng giá tour toàn đoàn và nộp duyệt lại cho Quản lý Tour. Tự động đóng hồ sơ khỏi danh mục cần sửa khi Quản lý phê duyệt thành công (`Manager_Approved`). |

---

### 5. Phân tích ranh giới và mối quan hệ nghiệp vụ

#### 5.1. Mối quan hệ tương hỗ giữa UC-OS-01, UC-OS-07, UC-OS-02 và UC-OS-08 trong quy trình Tour riêng
- `UC-OS-01 (Tư vấn khách hàng):` Đóng vai trò là kênh giao tiếp trực tiếp ban đầu qua Live Chat, nắm bắt nhu cầu, sở thích điểm đến và ngân sách của khách.
- `UC-OS-07 (Gửi báo giá thiết kế tour riêng - Mốc 1):` Ngay khi khách gửi yêu cầu thiết kế riêng, nhân viên dự toán nhanh chi phí và gửi **Báo giá sơ bộ (Initial Quote)** để định hướng khoảng giá cho khách hàng trước khi đầu tư thời gian thiết kế chi tiết.
- `UC-OS-02 (Thiết kế tour riêng):` Khi có sự đồng thuận sơ bộ, nhân viên sử dụng Timeline Builder để thiết kế chi tiết hành trình từng ngày, bóc tách chính xác định phí và biến phí, rồi trình Quản lý Tour duyệt (`submitToManager`).
- `UC-OS-07 (Điều chỉnh báo giá sơ bộ):` Nếu khách hàng phản hồi yêu cầu điều chỉnh báo giá sơ bộ trước khi thiết kế, hồ sơ được xử lý ngay tại phân hệ Báo giá (`tour_requests_pending`), bảo lưu 100% chính sách giá trẻ em và gửi lại báo giá cho khách.
- `UC-OS-08 (Chỉnh sửa thiết kế tour):` Kích hoạt khi Quản lý Tour từ chối bản thiết kế chi tiết (`Manager_Rejected`) hoặc Khách hàng phản hồi yêu cầu điều chỉnh thiết kế (`Customer_Revision`) sau khi bản thiết kế đã được Quản lý duyệt và gửi cho khách. Nhân viên tiếp nhận nội dung cần sửa, mở phòng thiết kế Timeline Builder cập nhật lại lịch trình, phương tiện đội xe, dịch vụ và gửi duyệt lại Quản lý.
- `UC-OS-07 (Gửi báo giá thiết kế tour riêng - Mốc 2):` Sau khi Quản lý duyệt bản thiết kế (`Manager_Approved`), nhân viên gửi bản thiết kế và báo giá chính thức cho khách hàng (`sendToCustomer`) để khách chốt chấp thuận và đặt cọc.
- `UC-OS-01` tiếp tục đồng hành trong suốt quá trình trên để hỗ trợ, giải đáp các thắc mắc phát sinh của khách.

#### 5.2. Sự khác biệt giữa Tour riêng (UC-OS-02) và Tour cố định (UC-OS-03)
- **Về mục đích:** Tour riêng may đo phục vụ riêng một khách hàng/đoàn cụ thể theo ngày đi tự chọn; Tour cố định là sản phẩm trọn gói tiêu chuẩn của công ty mở bán công khai cho nhiều khách ghép đoàn.
- **Về luồng xử lý:** Tour riêng gắn liền với một mã yêu cầu `request_id`, trải qua khâu Báo giá sơ bộ $\rightarrow$ Thiết kế chi tiết $\rightarrow$ Quản lý duyệt $\rightarrow$ Khách duyệt $\rightarrow$ Khách đặt cọc mới tự động sinh tour riêng `is_custom = 1`. Tour cố định được tạo độc lập trong danh mục tour `tours` ở trạng thái `Pending` để Quản lý duyệt mở bán và lên lịch các đợt khởi hành định kỳ (`departures`).
- **Về quyền hạn:** Ở cả hai quy trình, Office Staff đều có quyền thiết kế nhưng **không có quyền tự phê duyệt mở bán hoặc đưa vào khai thác chính thức** (quyền duyệt thuộc về Tour Manager).

#### 5.3. Ranh giới nghiệp vụ Đội xe giữa Nhân viên văn phòng (UC-OS-06A, UC-OS-06B) và Quản lý Tour (UC-TM-04, UC-TM-07)
- **Quản lý Tour (`role_id = 3` – `UC-TM-04` & `UC-TM-07`):** Chịu trách nhiệm quản trị hồ sơ tài sản phương tiện (Thêm xe mới, Sửa thông tin hồ sơ/định giá vốn `base_cost` & giá bán `selling_price`/liên kết dịch vụ `service_id`, Xóa phương tiện, Ngừng khai thác `INACTIVE`) và điều phối xe/tài xế cho các đợt khởi hành (`tour_vehicle_assignments`).
- **Nhân viên văn phòng (`role_id = 4` – `UC-OS-06A` & `UC-OS-06B`):** Chỉ thực hiện 2 nhiệm vụ vận hành kỹ thuật hàng ngày:
  1. **`UC-OS-06A (Theo dõi và cập nhật trạng thái xe)`:** Theo dõi tình trạng đội xe, cập nhật trạng thái kỹ thuật hợp lệ (`AVAILABLE` $\leftrightarrow$ `MAINTENANCE` / `REPAIR`), xác nhận hoàn tất bảo dưỡng/sửa chữa để đưa xe về `AVAILABLE`, và tra cứu lịch sử xe (`StaffVehicleHistory.jsx`) ở chế độ **chỉ xem (Read-only)**.
  2. **`UC-OS-06B (Tiếp nhận và xử lý sự cố xe)`:** Tiếp nhận báo cáo sự cố từ Tài xế (`driver_incidents`), ghi nhận tiến độ xử lý (`Processing`), chuyển xe vào xưởng sửa chữa (`REPAIR` — chỉ áp dụng khi xe không ở trạng thái `IN_TOUR` và không đang chạy tour), và xác nhận hoàn tất sự cố (`Resolved`). Khi xe đang chạy tour (`IN_TOUR`) gặp sự cố không thể tiếp tục hành trình, Nhân viên văn phòng ghi nhận sự cố (`Processing`) và phối hợp để Quản lý Tour thực hiện điều phối/thay thế xe trước khi chuyển trạng thái xe hỏng sang `REPAIR`.

---
*Tài liệu được kết xuất từ mã nguồn TravelVN ERP phục vụ Báo cáo Khóa luận Tốt nghiệp ngành Hệ thống Thông tin.*
