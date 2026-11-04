# BẢNG KIỂM KÊ VÀ ÁNH XẠ KỸ THUẬT USE CASE (USE CASE INVENTORY)
## PHÂN HỆ: QUẢN LÝ TOUR (TOUR MANAGER) – TRAVELVN ERP

---

### 1. Tổng quan phạm vi nghiệp vụ
Tài liệu này xác lập danh mục và bảng ánh xạ kỹ thuật truy vết cho **9 Use Case nghiệp vụ** thuộc phạm vi tác nhân **Quản lý tour (Tour Manager - Role ID: 3)** trong Hệ thống Quản trị và Điều hành Du lịch **TravelVN ERP**.

Danh mục 9 Use Case cơ sở bao gồm:
1. `UC-TM-01`: Gửi yêu cầu cung cấp dịch vụ
2. `UC-TM-02`: Quản lý tour
3. `UC-TM-03`: Quản lý đối tác
4. `UC-TM-04`: Quản lý xe
5. `UC-TM-05`: Phê duyệt thiết kế tour
6. `UC-TM-06`: Xử lý sự cố tour
7. `UC-TM-07`: Thiết lập lịch trình tour
8. `UC-TM-08`: Thiết lập vận hành tour
9. `UC-TM-09`: Xem báo cáo thống kê

Các chức năng dùng chung của hệ thống (như Đăng nhập, Đổi mật khẩu, Điểm danh GPS cá nhân) là các chức năng nền tảng chung cho toàn bộ nhân sự nội bộ công ty (`isInternalStaff`), đóng vai trò là Tiền điều kiện kỹ thuật và được phân tách độc lập khỏi 9 Use Case nghiệp vụ này.

---

### 2. Danh mục 9 Use Case nghiệp vụ cơ sở

| STT | Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Trạng thái xác minh | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | `UC-TM-01` | Gửi yêu cầu cung cấp dịch vụ | Quản lý dịch vụ đối tác | **Đã xác minh qua mã nguồn** | Cao |
| 2 | `UC-TM-02` | Quản lý tour | Quản trị sản phẩm tour | **Đã xác minh qua mã nguồn** | Cao |
| 3 | `UC-TM-03` | Quản lý đối tác | Quản lý mạng lưới đối tác | **Đã xác minh qua mã nguồn** | Cao |
| 4 | `UC-TM-04` | Quản lý xe | Quản lý đội xe nội bộ | **Đã xác minh qua mã nguồn** | Trung bình |
| 5 | `UC-TM-05` | Phê duyệt thiết kế tour | Quản lý thiết kế & duyệt tour | **Đã xác minh qua mã nguồn** | Cao |
| 6 | `UC-TM-06` | Xử lý sự cố tour | Quản trị rủi ro & sự cố đoàn | **Đã xác minh qua mã nguồn** | Cao |
| 7 | `UC-TM-07` | Thiết lập lịch trình tour | Kế hoạch lịch trình & nhân sự | **Đã xác minh qua mã nguồn** | Cao |
| 8 | `UC-TM-08` | Thiết lập vận hành tour | Giám sát & Điều hành tour | **Đã xác minh qua mã nguồn** | Cao |
| 9 | `UC-TM-09` | Xem báo cáo thống kê | Báo cáo & Thống kê điều hành | **Đã xác minh qua mã nguồn** | Trung bình |

---

### 3. Bảng ánh xạ kỹ thuật Use Case (Technical Traceability Matrix)

| Mã UC | Tên Use Case | Component Giao diện (Frontend) | Tuyến đường (Route / Tab) | Phương thức & API Endpoint Backend | File xử lý Backend (Controller) | Bảng dữ liệu tác động (MySQL) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UC-TM-01` | Gửi yêu cầu cung cấp dịch vụ | `ServiceRequestList.jsx`, `ServiceRequestCreate.jsx`, `ServiceRequestSupplement.jsx` | Tab `service_requests`, `create_request`, `create_supplement_request` | `GET /api/service-requests/groups`<br>`GET /api/service-requests/groups/:id`<br>`POST /api/service-requests/groups`<br>`POST /api/service-requests/groups/:id/supplement` | `microservices/tour-service/controllers/serviceRequestController.js` | `service_request_groups`, `service_requests`, `partners`, `departures` |
| `UC-TM-02` | Quản lý tour | `TourManagement.jsx`, `TourForm.jsx` | Tab `tours`, `tour_form` | `GET /api/tours/staff/tours`<br>`POST /api/tours/admin/save`<br>`PUT /api/tours/admin/price/:id`<br>`PUT /api/tours/admin/status/:id`<br>`DELETE /api/tours/:id` | `microservices/tour-service/controllers/tourController.js` | `tours`, `itineraries`, `itinerary_activities`, `destinations` |
| `UC-TM-03` | Quản lý đối tác | `PartnerManagement.jsx`, `PartnerForm.jsx` | Tab `partners`, `partner_form` | `GET /api/partners`<br>`POST /api/partners`<br>`PUT /api/partners/:id`<br>`DELETE /api/partners/:id` | `microservices/hr-service/controllers/partnerController.js` | `partners`, `destinations` |
| `UC-TM-04` | Quản lý xe | `VehicleFleetManagement.jsx` | Tab `fleet_vehicles` | `GET /api/tours/fleet/vehicles`<br>`POST /api/tours/fleet/vehicles`<br>`PUT /api/tours/fleet/vehicles/:id`<br>`DELETE /api/tours/fleet/vehicles/:id`<br>`POST /api/tours/fleet/maintenance`<br>`GET /api/tours/fleet/staff/vehicles/:id/history` | `microservices/tour-service/controllers/vehicleController.js` | `vehicles`, `vehicle_maintenances`, `vehicle_status_history` |
| `UC-TM-05` | Phê duyệt thiết kế tour | `ManagerTourApproval.jsx` | Tab `approve_quotes` | `GET /api/custom-tours/requests`<br>`POST /api/custom-tours/quotes/:quoteId/manager-review`<br>`GET /api/staff/tours`<br>`PUT /api/tours/admin/status/:id` | `microservices/tour-service/controllers/customTourController.js`<br>`microservices/tour-service/controllers/tourController.js` | `custom_tour_quotes`, `custom_tour_requests`, `tours` |
| `UC-TM-06` | Xử lý sự cố tour | `IncidentManagement.jsx` | Tab `incidents` | `GET /api/tours/incidents/all`<br>`PUT /api/tours/incidents/:id/status` | `microservices/tour-service/controllers/tourController.js` | `incident_reports`, `departures`, `tours`, `users`, `guides` |
| `UC-TM-07` | Thiết lập lịch trình tour | `TourOperationalManager.jsx` | Tab `operational_manager` | `GET /api/tours/staff/tours`<br>`GET /api/tours/admin/:id`<br>`GET /api/tours/admin/guide-schedule`<br>`GET /api/driver/work?driver_id=all`<br>`GET /api/tours/fleet/vehicles`<br>`POST /api/tours/admin/save` | `microservices/tour-service/controllers/tourController.js`<br>`microservices/tour-service/controllers/vehicleController.js` | `departures`, `tours`, `itineraries`, `itinerary_activities`, `guide_assignments`, `tour_vehicle_assignments` |
| `UC-TM-08` | Thiết lập vận hành tour | `TourOperations.jsx` | Tab `tour_operations` | `GET /api/tours/operations/departures`<br>`POST /api/tours/operations/departures/:id/decision` | `microservices/tour-service/controllers/tourController.js` | `departures`, `tours`, `bookings` |
| `UC-TM-09` | Xem báo cáo thống kê | `GeneralOverview.jsx` (tích hợp `OfficeStaffDashboard.jsx`) | Tab `overview` (khi đăng nhập với vai trò Tour Manager hoặc Admin) | `GET /api/guide/all-reports`<br>`PUT /api/guide/reports/:id/approve`<br>`GET /api/guide/incidents/all`<br>`GET /api/bookings`<br>`GET /api/hr/leave-requests` | `microservices/hr-service/controllers/guideController.js`<br>`microservices/booking-service/controllers/bookingController.js`<br>`microservices/hr-service/controllers/hrController.js` | `trip_reports`, `incident_reports`, `bookings`, `leave_requests` |

---

### 4. Tóm tắt kết quả kiểm chứng mã nguồn thực tế

1. **`UC-TM-01` (Gửi yêu cầu cung cấp dịch vụ):**
   - Hỗ trợ tạo nhóm yêu cầu ban đầu (`INITIAL`) và bổ sung (`SUPPLEMENT`) gửi các dịch vụ Khách sạn (`HOTEL`), Nhà hàng (`RESTAURANT`), Xe ngoài (`TRANSPORTATION`).
   - Yêu cầu được lưu vào `service_request_groups` và phân tách vào `service_requests`.
   - **Xác minh giới hạn:** Hệ thống không có cơ chế tự động chuyển yêu cầu sang đối tác khác khi bị từ chối; không gửi email/SMS ra bên ngoài mà đối tác tiếp nhận trực tiếp qua portal `PartnerServiceRequests.jsx`.
2. **`UC-TM-02` (Quản lý tour):**
   - Hỗ trợ xem danh sách, cập nhật giá niêm yết (`updateTourPrice`), đóng/mở bán (`updateTourStatus`), xóa tour có kiểm tra ràng buộc khóa ngoại (chặn nếu đã có đợt đi hoặc đơn đặt chỗ liên kết).
3. **`UC-TM-03` (Quản lý đối tác):**
   - Tuyến đường `/api/partners` được API Gateway proxy tới `hr-service` (cổng 5004).
   - Controller `microservices/hr-service/controllers/partnerController.js` xử lý CRUD.
   - **Xác minh giới hạn:** Bảng `partners` không có cột trạng thái (`status`), không hỗ trợ toggle kích hoạt/vô hiệu hóa, chỉ có thao tác xóa vật lý (chặn nếu có dữ liệu liên kết, mã lỗi 1451).
4. **`UC-TM-04` (Quản lý xe):**
   - Quản lý tài sản phương tiện vật lý thuộc đội xe nội bộ tại bảng `vehicles` (`license_plate`, `seat_capacity`, `brand_model`, `status`). Phân biệt rõ với bảng `services` (gói dịch vụ thương mại).
   - Kiểm tra trùng biển số xe được thực hiện ở Backend (`SELECT vehicle_id FROM vehicles WHERE license_plate = ?`).
   - Hỗ trợ lập phiếu bảo dưỡng (`vehicle_maintenances`) và theo dõi lịch sử xe (`vehicle_status_history`).
5. **`UC-TM-05` (Phê duyệt thiết kế tour):**
   - Thẩm định tour riêng qua `managerReview` (`POST /api/custom-tours/quotes/:quoteId/manager-review`): Chấp thuận (`Manager_Approved`) hoặc Từ chối (`Manager_Rejected` kèm `manager_note`).
   - **Xác minh giới hạn:** Hàm `managerReview` chỉ cập nhật DB bảng `custom_tour_quotes` và `custom_tour_requests`, không có lệnh tạo bản ghi thông báo tự động cho nhân viên; nhân viên theo dõi kết quả qua danh sách yêu cầu.
6. **`UC-TM-06` (Xử lý sự cố tour):**
   - Tiếp nhận sự cố từ HDV gửi lên từ tour (`incident_reports`). Hỗ trợ chuyển trạng thái `Open` $\rightarrow$ `Resolved` kèm `resolution_notes`, và hỗ trợ mở lại (`Reopen`).
   - **Xác minh giới hạn:** Bảng `incident_reports` chỉ lưu `status` và `resolution_notes`, không có trường chi phí bồi thường hay quy trình bồi thường tự động.
7. **`UC-TM-07` (Thiết lập lịch trình tour):**
   - Hỗ trợ cấu hình ngày đi, ngày về, số chỗ `max_slots`, gán HDV và Xe nội bộ.
   - Kiểm tra ngày trong quá khứ được thực hiện ở cả Frontend và Backend.
   - Kiểm tra trùng lịch HDV được thực hiện trực quan tại Frontend thông qua API `GET /api/tours/admin/guide-schedule`.
8. **`UC-TM-08` (Thiết lập vận hành tour):**
   - Các mốc T-21, T-14, T-7 được tính toán động tại Frontend [`TourOperations.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/TourOperations.jsx).
   - Backend `makeOperationalDecision` cập nhật `operational_status`, `status` và ghi lịch sử JSON `decision_history`.
   - **Xác minh giới hạn:** Không có luồng tự động hoàn tiền hay tự động gửi thông báo cho Office Staff khi hủy tour; việc này do nhân viên thực hiện thủ công ngoài luồng này.
9. **`UC-TM-09` (Xem báo cáo thống kê):**
   - Màn hình `GeneralOverview.jsx` tích hợp 5 phân hệ báo cáo: duyệt báo cáo kết thúc chuyến đi của HDV, xem doanh thu và xuất file PDF qua thư viện `html2pdf.js`, xem thống kê nghỉ phép HR, danh sách sự cố và chất lượng đối tác.

---
*Tài liệu được kết xuất từ mã nguồn TravelVN ERP phục vụ Báo cáo Khóa luận Tốt nghiệp ngành Hệ thống Thông tin.*
