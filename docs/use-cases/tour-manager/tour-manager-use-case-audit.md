# BÁO CÁO RÀ SOÁT VÀ KIỂM CHỨNG MÃ NGUỒN (AUDIT REPORT)
## PHÂN HỆ: QUẢN LÝ TOUR (TOUR MANAGER) – TRAVELVN ERP

---

### 1. Mục đích và Tiêu chí kiểm chứng
Tài liệu này ghi nhận kết quả rà soát, đối chiếu và kiểm chứng trực tiếp giữa mã nguồn thực tế của hệ thống TravelVN ERP và tài liệu nghiệp vụ cho **9 Use Case cơ sở** của vai trò **Quản lý tour (Tour Manager - Role ID: 3)**.

**Tiêu chí phân loại trạng thái kiểm chứng:**
- **Đã xác minh qua mã nguồn:** Chức năng có giao diện thực tế, API endpoint, logic backend và tác động cơ sở dữ liệu đã được kiểm chứng trực tiếp từ mã nguồn.
- **Xác minh một phần:** Có bằng chứng cho một phần chức năng nhưng còn thiếu một số bước xử lý tự động hoặc có sự khác biệt giữa các phân hệ.
- **Chưa tìm thấy bằng chứng:** Chưa tìm thấy căn cứ tin cậy trong mã nguồn hiện có.

---

### 2. Kết quả kiểm chứng chi tiết theo 9 Use Case cơ sở

---

#### 2.1. UC-TM-01 — Gửi yêu cầu cung cấp dịch vụ
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/ServiceRequestList.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/ServiceRequestList.jsx): Danh sách nhóm yêu cầu dịch vụ.
    - [`frontend/src/components/ServiceRequestCreate.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/ServiceRequestCreate.jsx): Giao diện lập nhóm yêu cầu ban đầu (`INITIAL`).
    - [`frontend/src/components/ServiceRequestSupplement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/ServiceRequestSupplement.jsx): Giao diện lập yêu cầu bổ sung (`SUPPLEMENT`).
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/serviceRequestRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/serviceRequestRoutes.js) (`POST /groups` và `POST /groups/:id/supplement`).
    - Controller: [`microservices/tour-service/controllers/serviceRequestController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/serviceRequestController.js):
      - Hàm `createGroup` (dòng 67): Kiểm tra đợt khởi hành chưa có yêu cầu `INITIAL`, chèn bản ghi vào `service_request_groups` (`status = 'PROCESSING'`), bóc tách danh sách dịch vụ và chèn vào `service_requests` (`status = 'Pending'`), tạo bản ghi thông báo trong `notifications` cho tài khoản đối tác (`role_id = 7`).
      - Hàm `createSupplement` (dòng 143): Tạo nhóm yêu cầu bổ sung `SUPPLEMENT` và chèn các yêu cầu con chênh lệch.
      - Hàm `acceptRequest` (dòng 257) và `rejectRequest` (dòng 317): Cập nhật trạng thái yêu cầu con thành `Accepted` hoặc `Rejected` (lưu lý do `reject_reason`).
  - *Cơ sở dữ liệu:* Bảng `service_request_groups`, `service_requests`, `notifications`.
- **Hành vi được xác minh:** Hỗ trợ tạo yêu cầu cho Khách sạn (`HOTEL`), Nhà hàng (`RESTAURANT`), Vận chuyển ngoài (`TRANSPORTATION`). Đối tác tiếp nhận và phản hồi trên portal đối tác ([`PartnerServiceRequests.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/PartnerServiceRequests.jsx)).
- **Giới hạn thực tế:** Hệ thống không có cơ chế tự động chuyển yêu cầu sang đối tác khác khi bị từ chối; không gửi email hoặc SMS ra bên ngoài, chỉ thông báo nội bộ qua bảng `notifications`.

---

#### 2.2. UC-TM-02 — Quản lý tour
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/TourManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/TourManagement.jsx): Danh sách tour, tìm kiếm, lọc trạng thái, modal cập nhật giá, toggle đóng/mở tour, nút xóa.
    - [`frontend/src/components/TourForm.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/TourForm.jsx): Chỉnh sửa thông tin tour.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/tourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/tourRoutes.js).
    - Controller: [`microservices/tour-service/controllers/tourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/tourController.js):
      - Hàm `updateTourPrice` (dòng 743): Cập nhật `base_price`, `markup_percent`, `base_cost` vào bảng `tours`.
      - Hàm `updateTourStatus` (dòng 495): Cập nhật trạng thái tour (`Active` hoặc `Inactive`), lưu lý do `rejection_reason`.
      - Hàm `deleteTour` (dòng 95): Thực thi `DELETE FROM tours WHERE tour_id = ?`. Bắt lỗi khóa ngoại errno 1451 để trả về lỗi 400: “Không thể xóa! Tour này đang có Ngày khởi hành hoặc Đơn đặt hàng liên kết.”.
  - *Cơ sở dữ liệu:* Bảng `tours`, `itineraries`, `itinerary_activities`.
- **Hành vi được xác minh:** Quản lý vòng đời tour trọn gói, bảo toàn hợp đồng cũ khi đổi giá, bảo vệ toàn vẹn dữ liệu khi xóa tour.

---

#### 2.3. UC-TM-03 — Quản lý đối tác
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/PartnerManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/PartnerManagement.jsx): Bảng danh mục đối tác phân theo tab 5 loại hình (`HOTEL`, `RESTAURANT`, `TRANSPORTATION`, `SIGHTSEEING`, `LOCAL_GUIDE`), nút thêm, sửa, xóa.
    - [`frontend/src/components/PartnerForm.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/PartnerForm.jsx): Form nhập hồ sơ đối tác.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/api-gateway/server.js`](file:///d:/KLTN/travel-management-system/microservices/api-gateway/server.js) proxy `/api/partners` sang `hr-service` (cổng 5004). Tuyến đường backend tại [`microservices/hr-service/routes/partnerRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/routes/partnerRoutes.js).
    - Controller: [`microservices/hr-service/controllers/partnerController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/partnerController.js):
      - Hàm `getAllPartners` (dòng 4): Trả về danh sách đối tác.
      - Hàm `createPartner` (dòng 26): Thêm mới vào bảng `partners`.
      - Hàm `updatePartner` (dòng 82): Cập nhật thông tin vào bảng `partners`.
      - Hàm `deletePartner` (dòng 139): Xóa vật lý `DELETE FROM partners WHERE partner_id = ?`, bắt lỗi khóa ngoại 1451 nếu có liên kết dữ liệu dịch vụ.
  - *Cơ sở dữ liệu:* Bảng `partners`.
- **Hành vi được xác minh:** Thêm, sửa, xóa hồ sơ đối tác.
- **Giới hạn thực tế:** Bảng `partners` không có cột trạng thái (`status`); hệ thống không có chức năng toggle kích hoạt/vô hiệu hóa đối tác.

---

#### 2.4. UC-TM-04 — Quản lý xe
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/VehicleFleetManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/VehicleFleetManagement.jsx): Giao diện quản lý đội xe dành riêng cho Quản lý Tour và Admin. Cung cấp danh sách xe, thêm xe, sửa xe, xóa xe, lập phiếu bảo dưỡng và xem lịch sử trạng thái xe.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/tourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/tourRoutes.js) (dòng 72–88).
    - Controller: [`microservices/tour-service/controllers/vehicleController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/vehicleController.js):
      - Hàm `getVehicles` (dòng 23): Truy vấn danh sách xe.
      - Hàm `createVehicle` (dòng 98): Kiểm tra biển số xe trùng lặp (`SELECT vehicle_id FROM vehicles WHERE license_plate = ?`), trả về lỗi 400 nếu trùng; liên kết với gói dịch vụ qua `resolveVehicleServiceLink`, lưu vào bảng `vehicles`.
      - Hàm `updateVehicle` (dòng 165) và `deleteVehicle` (dòng 222): Cập nhật hoặc xóa xe.
      - Hàm `createMaintenance` (dòng 380): Tạo bản ghi bảo dưỡng trong `vehicle_maintenances`, đổi trạng thái xe sang `MAINTENANCE`, ghi nhật ký vào `vehicle_status_history`.
      - Hàm `getVehicleHistoryStaff` (dòng 571): Truy xuất lịch sử thay đổi trạng thái và bảo dưỡng của xe.
  - *Cơ sở dữ liệu:* Bảng `vehicles`, `vehicle_maintenances`, `vehicle_status_history`.
- **Hành vi được xác minh:** Phân biệt rõ xe vật lý (`vehicles`) và dịch vụ (`services`); kiểm tra trùng biển số ở backend; quản lý bảo dưỡng và lịch sử xe.

---

#### 2.5. UC-TM-05 — Phê duyệt thiết kế tour
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/ManagerTourApproval.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/ManagerTourApproval.jsx): Tab `approve_quotes`. Nạp danh sách yêu cầu tour riêng (`GET /api/custom-tours/requests`) và tour cố định chờ duyệt (`GET /api/staff/tours`).
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/customTourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/customTourRoutes.js) (dòng 58) và [`tourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/tourRoutes.js) (dòng 40).
    - Controller:
      - Hàm `managerReview` trong [`customTourController.js#L640`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/customTourController.js#L640): Nếu `action === 'approve'`, cập nhật `custom_tour_quotes.approval_status = 'Approved'`, `custom_tour_requests.status = 'Manager_Approved'`. Nếu `action === 'reject'`, cập nhật `approval_status = 'Rejected'`, lưu `manager_note`, cập nhật `custom_tour_requests.status = 'Manager_Rejected'`.
      - Hàm `updateTourStatus` trong [`tourController.js#L495`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/tourController.js#L495): Chuyển trạng thái tour cố định sang `Active`.
  - *Cơ sở dữ liệu:* Bảng `custom_tour_quotes`, `custom_tour_requests`, `tours`.
- **Hành vi được xác minh:** Thẩm định chi phí định phí/biến phí/margin; duyệt hoặc từ chối kèm góp ý.
- **Giới hạn thực tế:** Hàm `managerReview` không có câu lệnh tạo thông báo tự động (notification/email) gửi nhân viên văn phòng; nhân viên theo dõi kết quả qua giao diện làm việc.

---

#### 2.6. UC-TM-06 — Xử lý sự cố tour
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/IncidentManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/IncidentManagement.jsx): Tab `incidents`. Nạp danh sách sự cố, hiển thị chi tiết, modal nhập giải pháp và nút mở lại sự cố (`Reopen`).
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/tourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/tourRoutes.js) (dòng 60–61).
    - Controller: [`microservices/tour-service/controllers/tourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/tourController.js):
      - Hàm `getAllIncidents` (dòng 109): Truy vấn các bản ghi sự cố từ `incident_reports` kèm thông tin đợt khởi hành và hướng dẫn viên.
      - Hàm `updateIncidentStatus` (dòng 135): Kiểm tra `status` thuộc `['Open', 'Resolved']`, cập nhật `status` và `resolution_notes` vào bảng `incident_reports`.
  - *Cơ sở dữ liệu:* Bảng `incident_reports`.
- **Hành vi được xác minh:** Tiếp nhận, chỉ đạo giải quyết, cập nhật trạng thái sang `Resolved` và hỗ trợ mở lại sự cố (`Open`).
- **Giới hạn thực tế:** Bảng `incident_reports` chỉ lưu `status` và `resolution_notes`, không có trường chi phí bồi thường hay quy trình bồi thường tự động.

---

#### 2.7. UC-TM-07 — Thiết lập lịch trình tour
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/TourOperationalManager.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/TourOperationalManager.jsx): Tab `operational_manager`. Tạo đợt khởi hành, tự động tính ngày kết thúc, phân bổ số chỗ, gán HDV và Xe nội bộ.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/tourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/tourRoutes.js).
    - Controller: [`microservices/tour-service/controllers/tourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/tourController.js):
      - Hàm `saveTourOperationalSchedule` (dòng 207): Khởi tạo Database Transaction, lưu đợt khởi hành vào bảng `departures`, lưu phân công vào `guide_assignments` và `tour_vehicle_assignments`.
      - Kiểm tra ngày quá khứ (dòng 373): `if (dep.departure_date < todayStr || dep.return_date < todayStr)` thì rollback và trả về lỗi 400.
      - Kiểm tra đợt đã đóng (dòng 325-345): Nếu đợt cũ đã qua ngày kết thúc hoặc ở trạng thái `Closed`/`Completed`, chặn thay đổi HDV/xe/lịch trình và trả về lỗi 400.
      - Tạo thông báo (dòng 425, 458): Tạo bản ghi thông báo trong `notifications` cho Hướng dẫn viên và Tài xế được phân công.
      - Hàm `getGuideSchedule` (dòng 772): Truy vấn lịch công tác của HDV để Frontend hiển thị cảnh báo trùng lịch.
  - *Cơ sở dữ liệu:* Bảng `departures`, `tours`, `itineraries`, `itinerary_activities`, `guide_assignments`, `tour_vehicle_assignments`, `notifications`.
- **Hành vi được xác minh:** Thiết lập lịch khởi hành, chặn ngày quá khứ ở cả FE và BE, kiểm tra chống trùng lịch HDV tại FE qua `guide-schedule`.

---

#### 2.8. UC-TM-08 — Thiết lập vận hành tour
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/TourOperations.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/TourOperations.jsx): Tab `tour_operations`. Tính toán mốc ngày T-21, T-14, T-7; so sánh `current_pax` với `min_pax`; modal ghi nhận quyết định.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/tourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/tourRoutes.js) (dòng 92–93).
    - Controller: [`microservices/tour-service/controllers/tourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/tourController.js):
      - Hàm `getOperationalDepartures` (dòng 911): Truy vấn danh sách đợt đi kèm số khách đã đặt và mảng JSON `decision_history`.
      - Hàm `makeOperationalDecision` (dòng 1047): Tiếp nhận `action`, `note`, `user_id`, `user_name`. Cập nhật `operational_status`, `status` và đẩy phần tử mới vào mảng JSON `decision_history`.
  - *Cơ sở dữ liệu:* Bảng `departures` (các cột `operational_status`, `status`, `decision_history`).
- **Hành vi được xác minh:** Các quyết định vận hành: `Xác nhận vận hành` (`Confirmed`), `Tiếp tục xem xét` / `Tiếp tục vận hành` (`Reviewing`), `Đóng tour` (`Cancelled` / `Closed`), `Đóng booking` (`Closed`); ghi vết vào `decision_history`.
- **Giới hạn thực tế:** Không có cơ chế tự động gửi thông báo hay tự động hoàn tiền khi hủy tour; các công việc này do nhân viên thực hiện thủ công ngoài hệ thống.

---

#### 2.9. UC-TM-09 — Xem báo cáo thống kê
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/GeneralOverview.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/GeneralOverview.jsx): Tab `overview`. Tích hợp 5 phân hệ báo cáo:
      1. `tour_reports`: Xem danh sách `trip_reports`, hiển thị rating trung bình, nút duyệt hoàn tất chuyến đi gọi `PUT /api/guide/reports/:id/approve`.
      2. `revenue`: Nhúng `OfficeStaffDashboard.jsx`, hiển thị doanh thu thực tế từ `bookings`, có nút xuất PDF sử dụng thư viện `html2pdf.js` (`OfficeStaffDashboard.jsx` dòng 95-127).
      3. `hr_stats`: Gọi `GET /api/hr/leave-requests` hiển thị thống kê nghỉ phép nhân sự.
      4. `incidents`: Gọi `GET /api/guide/incidents/all` hiển thị thống kê sự cố toàn hệ thống.
      5. `partners`: Thống kê chất lượng đối tác dịch vụ.
  - *Backend Route & Controller:*
    - `microservices/hr-service/controllers/guideController.js` (`approveGuideReport`).
    - `microservices/booking-service/controllers/bookingController.js` (dữ liệu `bookings`).
    - `microservices/hr-service/controllers/hrController.js` (dữ liệu `leave_requests`).
  - *Cơ sở dữ liệu:* Bảng `trip_reports`, `incident_reports`, `bookings`, `leave_requests`.
- **Hành vi được xác minh:** Xem số liệu thống kê tổng hợp, duyệt báo cáo hoàn tất tour của HDV, xuất báo cáo doanh thu PDF qua client-side `html2pdf.js`.

---

### 3. Bảng tổng hợp mức độ kiểm chứng kỹ thuật

| Mã UC | Tên Use Case | Giao diện (Frontend) | API & Backend Controller | Cơ sở dữ liệu (MySQL) | Đánh giá kiểm chứng |
| :---: | :--- | :---: | :---: | :---: | :---: |
| `UC-TM-01` | Gửi yêu cầu cung cấp dịch vụ | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |
| `UC-TM-02` | Quản lý tour | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |
| `UC-TM-03` | Quản lý đối tác | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |
| `UC-TM-04` | Quản lý xe | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |
| `UC-TM-05` | Phê duyệt thiết kế tour | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |
| `UC-TM-06` | Xử lý sự cố tour | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |
| `UC-TM-07` | Thiết lập lịch trình tour | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |
| `UC-TM-08` | Thiết lập vận hành tour | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |
| `UC-TM-09` | Xem báo cáo thống kê | Đã xác minh | Đã xác minh | Đã xác minh | Đã xác minh qua mã nguồn |

---
*Tài liệu được kết xuất từ mã nguồn TravelVN ERP phục vụ Báo cáo Khóa luận Tốt nghiệp ngành Hệ thống Thông tin.*
