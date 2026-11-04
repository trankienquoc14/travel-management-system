# BÁO CÁO PHÂN TÍCH NGHIỆP VỤ, PHÂN QUYỀN VÀ ĐỐI CHIẾU KỸ THUẬT
## VAI TRÒ: NHÂN VIÊN VĂN PHÒNG (OFFICE STAFF) – TRAVELVN ERP
*(Trọng tâm: Chuẩn hóa nhóm chức năng Quản lý đội xe `UC-OS-06A` & `UC-OS-06B`)*

---

### 1. Tổng quan vai trò Nhân viên văn phòng và Danh mục Use Case sau điều chỉnh

Trong hệ thống **TravelVN ERP**, **Nhân viên văn phòng (Office Staff - `role_id = 4`)** là tác nhân thực thi các nghiệp vụ giao dịch khách hàng (tư vấn, báo giá, thiết kế tour, chỉnh sửa yêu cầu tour, xác nhận thanh toán, xử lý hủy/đổi lịch) và hỗ trợ theo dõi tình trạng kỹ thuật đội xe nội bộ.

Sau khi rà soát mã nguồn, cơ sở dữ liệu và thống nhất các quyết định nghiệp vụ, danh mục Use Case của Nhân viên văn phòng bao gồm **9 Use Case (`UC-OS-01` đến `UC-OS-08`)**; trong đó phân hệ Yêu cầu thiết kế tour được hoàn thiện đồng bộ 3 nhánh tác nghiệp (`tour_requests_pending` - Báo giá sơ bộ `UC-OS-07`, `tour_requests_revision` - Chỉnh sửa thiết kế `UC-OS-08`, `tour_requests` - Thiết kế tour đã báo giá `UC-OS-02`), và nhóm nghiệp vụ đội xe `UC-OS-06` được tách chuẩn hóa thành `UC-OS-06A` và `UC-OS-06B`:

| STT | Mã Use Case (Trước điều chỉnh) | Tên Use Case (Trước điều chỉnh) | Mã Use Case (Sau điều chỉnh) | Tên Use Case (Sau điều chỉnh) | Phân hệ nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `UC-OS-01` | Tư vấn khách hàng | `UC-OS-01` | Tư vấn khách hàng | Chăm sóc khách hàng |
| 2 | `UC-OS-02` | Thiết kế tour riêng | `UC-OS-02` | Thiết kế tour riêng | Quản lý thiết kế tour |
| 3 | `UC-OS-03` | Thiết kế tour cố định | `UC-OS-03` | Thiết kế tour cố định | Quản lý sản phẩm tour |
| 4 | `UC-OS-04` | Xử lý hủy, đổi lịch | `UC-OS-04` | Xử lý hủy, đổi lịch | Quản trị đơn đặt tour |
| 5 | `UC-OS-05` | Xác nhận thanh toán | `UC-OS-05` | Xác nhận thanh toán | Quản lý thanh toán |
| 6 | `UC-OS-06` | Cập nhật tình trạng xe | **`UC-OS-06A`** | **Theo dõi và cập nhật trạng thái xe** | Quản lý đội xe nội bộ |
| 7 | *(Gộp trong UC-OS-06)* | *(Gộp trong Cập nhật tình trạng xe)* | **`UC-OS-06B`** | **Tiếp nhận và xử lý sự cố xe** | Quản lý đội xe nội bộ |
| 8 | `UC-OS-07` | Gửi báo giá thiết kế tour riêng | `UC-OS-07` | Báo giá và điều chỉnh báo giá tour riêng | Quản lý báo giá |
| 9 | *(Chức năng mới bổ sung)* | *(Chưa có trong danh mục cũ)* | **`UC-OS-08`** | **Chỉnh sửa thiết kế tour** | Quản lý thiết kế tour |

---

### 2. Ma trận phân quyền nhóm chức năng Đội xe giữa Nhân viên văn phòng và Quản lý Tour

Phân quyền bắt buộc phải được thực thi đồng bộ ở cả **Giao diện (Frontend)** và **Máy chủ (Backend Middleware & Controller)**:

| STT | Chức năng / Thao tác nghiệp vụ | API Endpoint liên quan | Quyền hiện tại trong Code (`role_id`) | Quyền chuẩn hóa (`UC-OS-06A/B` & `UC-TM-04`) | Ghi chú kiểm soát Backend & Frontend |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | Xem danh sách phương tiện, trạng thái kỹ thuật & lịch chạy hiện tại | `GET /api/tours/fleet/vehicles` | Mọi role (`verifyToken`) | **NV Văn phòng (`4`)**, **Quản lý Tour (`3`)**, Admin (`1`) | Giữ nguyên quyền xem danh sách; ẩn giá vốn (`base_cost`) trên giao diện của NV Văn phòng. |
| 2 | Thêm phương tiện mới vào đội xe | `POST /api/tours/fleet/vehicles` | `1, 3, 4` *(Sai phạm)* | **Chỉ Quản lý Tour (`3`) & Admin (`1`)** | Đổi middleware tại `tourRoutes.js` sang `restrictTo(1, 3)`. Xóa nút `+ Thêm xe mới` khỏi `StaffVehicleManagement.jsx`. |
| 3 | Sửa hồ sơ phương tiện, định giá (`base_cost`, `selling_price`) & liên kết dịch vụ (`service_id`) | `PUT /api/tours/fleet/vehicles/:id` | `1, 3, 4` *(Sai phạm)* | **Chỉ Quản lý Tour (`3`) & Admin (`1`)** | Đổi middleware tại `tourRoutes.js` sang `restrictTo(1, 3)`. Xóa nút `✏️ Sửa` và Modal CRUD khỏi `StaffVehicleManagement.jsx`. |
| 4 | Xóa phương tiện khỏi đội xe | `DELETE /api/tours/fleet/vehicles/:id` | `1, 3, 4` *(Sai phạm)* | **Chỉ Quản lý Tour (`3`) & Admin (`1`)** | Đổi middleware tại `tourRoutes.js` sang `restrictTo(1, 3)`. Xóa nút `🗑️ Xóa` khỏi `StaffVehicleManagement.jsx`. Bổ sung kiểm tra chặn xóa xe đang `IN_TOUR` / có lịch phân công tại `vehicleController.deleteVehicle`. |
| 5 | Cập nhật trạng thái kỹ thuật xe (`AVAILABLE` $\leftrightarrow$ `MAINTENANCE` / `REPAIR`) | `PUT /api/tours/fleet/staff/vehicles/:id/status` | `1, 3, 4` | **NV Văn phòng (`4`)**, Quản lý Tour (`3`), Admin (`1`) | Kiểm tra whitelist trạng thái hợp lệ; chặn tuyệt đối khi xe đang `IN_TOUR` hoặc có `current_tour` đang diễn ra; bắt buộc nhập `reason`. |
| 6 | Ngừng khai thác phương tiện (`INACTIVE`) | `PUT /api/tours/fleet/vehicles/:id` | `1, 3, 4` | **Chỉ Quản lý Tour (`3`) & Admin (`1`)** | NV Văn phòng không được chuyển xe sang `INACTIVE`. |
| 7 | Phân công / Điều phối / Thay thế xe cho chuyến đi (`departures`) | `POST /api/tours/fleet/dispatch`<br>`POST /api/tours/admin/save` | `1, 3` | **Chỉ Quản lý Tour (`3`) & Admin (`1`)** | NV Văn phòng không có quyền điều phối xe cho tour. |
| 8 | Tiếp nhận & xử lý báo cáo sự cố xe từ Tài xế (`driver_incidents`) | `GET /api/tours/fleet/staff/incidents`<br>`PUT /api/tours/fleet/staff/incidents/:id` | `1, 3, 4` | **NV Văn phòng (`4`)**, Quản lý Tour (`3`), Admin (`1`) | Chặn chuyển xe sang `REPAIR` nếu xe đang `IN_TOUR` / đang chạy tour (Phương án A); luôn ghi nhật ký xử lý vào `vehicle_status_history`. |
| 9 | Tra cứu dòng thời gian Lịch sử xe (`StaffVehicleHistory.jsx`) | `GET /api/tours/fleet/staff/vehicles/:id/history` | `1, 3, 4` | **NV Văn phòng (`4`)**, Quản lý Tour (`3`), Admin (`1`) *(Chỉ xem)* | Xóa nút `"Hoàn tất sửa chữa"` (`handleQuickResolve`) khỏi `StaffVehicleHistory.jsx` để đảm bảo 100% Read-only. |

---

### 3. Các quy tắc nghiệp vụ đã thống nhất (Business Rules)

#### 3.1. Quy tắc giới hạn quyền quản lý hồ sơ phương tiện (`BR-OS-FLEET-01`)
- Nhân viên văn phòng không chịu trách nhiệm quản lý hồ sơ tài sản phương tiện: tuyệt đối không được thêm mới xe, sửa thông tin định danh/định giá xe (`vehicle_name`, `license_plate`, `seat_capacity`, `base_cost`, `selling_price`, `service_id`), xóa xe hoặc chuyển xe sang trạng thái ngừng khai thác (`INACTIVE`).
- Toàn bộ các thao tác quản trị hồ sơ đội xe thuộc thẩm quyền của Quản lý Tour (`UC-TM-04`).

#### 3.2. Quy tắc chuyển trạng thái kỹ thuật của phương tiện (`BR-OS-FLEET-02`)
- Nhân viên văn phòng chỉ được thực hiện các phép chuyển trạng thái hợp lệ sau tại `UC-OS-06A` và `UC-OS-06B`:
  1. `AVAILABLE` $\rightarrow$ `MAINTENANCE` (Đưa xe vào bảo dưỡng định kỳ: bắt buộc có `start_date`, `end_date`, `reason`; tạo bản ghi `vehicle_maintenances` với `status = 'IN_PROGRESS'`).
  2. `AVAILABLE` $\rightarrow$ `REPAIR` (Đưa xe vào sửa chữa: bắt buộc có `reason`; tạo bản ghi `vehicle_maintenances` với `status = 'IN_PROGRESS'`).
  3. `MAINTENANCE` $\rightarrow$ `REPAIR` (Chuyển từ bảo dưỡng sang sửa chữa khi phát hiện hỏng hóc kỹ thuật: bắt buộc có `reason`).
  4. `MAINTENANCE` hoặc `REPAIR` $\rightarrow$ `AVAILABLE` (Hoàn tất bảo dưỡng/sửa chữa: bắt buộc có `reason` nghiệm thu; cập nhật `vehicle_maintenances.status = 'COMPLETED'` và `end_date` thực tế).
- Không cho phép cập nhật khi `new_status === old_status` trong chức năng đổi trạng thái xe (`updateVehicleStatusStaff`) để tránh sinh bản ghi lịch sử trùng lặp.

#### 3.3. Quy tắc xử lý sự cố khi xe đang chạy tour – Phương án A (`BR-OS-FLEET-03`)
- Khi phương tiện đang ở trạng thái `IN_TOUR` và/hoặc vẫn đang được gắn với một chuyến đi đang diễn ra trong bảng `tour_vehicle_assignments` (`status IN ('ASSIGNED', 'IN_PROGRESS') AND CURRENT_DATE() BETWEEN start_date AND end_date`):
  - Nhân viên văn phòng **không được** trực tiếp chuyển trạng thái xe sang `REPAIR` thông qua chức năng xử lý sự cố (`action = 'REPAIR'` bị chặn ở cả giao diện và Backend `403 Forbidden`).
  - Nhân viên văn phòng **vẫn được phép** tiếp nhận sự cố (`status = 'Processing'`, `action = 'PROCESSING'`), ghi nhận nội dung xử lý vào lịch sử, hoặc đóng sự cố (`status = 'Resolved'`, `action = 'RESOLVED'`) nếu sự cố nhỏ đã được khắc phục tại chỗ mà không làm thay đổi trạng thái `IN_TOUR` của xe.
  - Trường hợp xe hỏng nặng không thể tiếp tục hành trình: Quản lý Tour (`role_id = 3`) thực hiện nghiệp vụ điều phối, thay thế xe cho đoàn theo quy trình hiện có (`UC-TM-07`). Sau khi xe gặp sự cố được gỡ khỏi phân công đang chạy và không còn ở trạng thái `IN_TOUR`, Nhân viên văn phòng mới thực hiện chuyển trạng thái xe sang `REPAIR`.

#### 3.4. Quy tắc kiểm soát đồng bộ trạng thái và lịch điều phối (`BR-OS-FLEET-04`)
- Trạng thái `REPAIR`, `MAINTENANCE` và `INACTIVE` là các trạng thái khóa kỹ thuật/khai thác của phương tiện, không được bị ghi đè tự động thành `IN_TOUR` hoặc `AVAILABLE` bởi bất kỳ cơ chế đồng bộ lịch trình nào.
- Khi tra cứu xe khả dụng để điều phối (`getAvailableVehicles`), hệ thống phải loại trừ cả các xe đang có `vehicles.status IN ('REPAIR', 'MAINTENANCE', 'INACTIVE')` bất kể ngày dự kiến `end_date` trong `vehicle_maintenances` đã qua hay chưa (cho đến khi được nghiệm thu chuyển về `AVAILABLE`).

#### 3.5. Quy tắc lưu ghi chú xử lý sự cố và bảo toàn báo cáo gốc (`BR-OS-FLEET-05`)
- Trường `driver_incidents.description` lưu nội dung báo cáo ban đầu của Tài xế; tuyệt đối không nối thêm hoặc ghi đè ghi chú xử lý của Nhân viên văn phòng vào trường này.
- Sử dụng cấu trúc bảng `vehicle_status_history` hiện có (`history_id`, `vehicle_id`, `old_status`, `new_status`, `reason`, `updated_by`, `created_at`) để lưu mọi bước xử lý sự cố của Nhân viên văn phòng:
  - Kể cả khi bước xử lý không làm thay đổi trạng thái xe (ví dụ: chọn `PROCESSING` giữ nguyên trạng thái xe, hoặc chọn `RESOLVED` cho xe không ở trạng thái `REPAIR`), hệ thống vẫn chèn một bản ghi vào `vehicle_status_history` với `old_status = v.status`, `new_status = v.status`, `reason = "[Sự cố #" + incident_id + " - " + title + "]: " + reason`, và `updated_by = req.user.id`.

#### 3.6. Quy tắc độc lập giữa các sự cố của cùng một phương tiện (`BR-OS-FLEET-06`)
- Hoàn tất (`Resolved`) một sự cố trong bảng `driver_incidents` chỉ cập nhật trạng thái cho đúng `incident_id` đó, **không tự động đóng** các sự cố khác chưa được giải quyết (`Reported` hoặc `Processing`) của cùng phương tiện.
- Khi hoàn tất một sự cố (`action = 'RESOLVED'`), hệ thống chỉ tự động chuyển `vehicles.status` từ `REPAIR` về `AVAILABLE` (và đóng phiếu `vehicle_maintenances`) khi xác minh phương tiện đó **không còn bất kỳ sự cố nào khác đang ở trạng thái `Processing`**.

#### 3.7. Quy tắc chế độ chỉ xem (Read-only) tại chức năng Lịch sử xe (`BR-OS-FLEET-07`)
- Mục `📜 Lịch sử xe` (`StaffVehicleHistory.jsx`) được giữ trên thanh menu trái của Nhân viên văn phòng và có thể mở qua liên kết nhanh từ trang Quản lý trạng thái xe / Báo cáo sự cố xe.
- Trang Lịch sử xe chỉ phục vụ tra cứu, xem và lọc dòng thời gian (`INCIDENT`, `MAINTENANCE`, `STATUS_CHANGE`); tuyệt đối không cho phép cập nhật trạng thái xe, hoàn tất sửa chữa, sửa hoặc xóa dữ liệu lịch sử trực tiếp tại trang này.

---

### 4. Đối chiếu chi tiết các điểm trong mã nguồn chưa đáp ứng yêu cầu

Bảng dưới đây liệt kê chính xác các vị trí trong mã nguồn hiện tại chưa đáp ứng các quy tắc nghiệp vụ đã thống nhất (làm căn cứ cho giai đoạn triển khai sau khi phê duyệt):

| STT | Tệp mã nguồn | Hàm / Vị trí dòng | Hiện trạng trong mã nguồn (Đã xác minh) | Yêu cầu điều chỉnh (Khi triển khai) |
| :---: | :--- | :--- | :--- | :--- |
| 1 | [`tourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/tourRoutes.js#L72-L79) | Dòng `72–74`, `79` | `POST /fleet/vehicles`, `PUT /fleet/vehicles/:id`, `DELETE /fleet/vehicles/:id`, `POST /fleet/maintenance` đang dùng `restrictTo(1, 3, 4)`. | Đổi middleware của 4 route trên thành `restrictTo(1, 3)`. |
| 2 | [`StaffVehicleManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleManagement.jsx) | Dòng `286–289`, `408–415`, `456–462`, `476–699` | Hiển thị nút `+ Thêm xe mới`, `✏️ Sửa`, `🗑️ Xóa`, hiển thị `base_cost` và Modal CRUD hồ sơ xe. | Gỡ bỏ các nút Thêm, Sửa, Xóa hồ sơ xe và Modal CRUD; chỉ giữ thông tin vận hành và chức năng cập nhật trạng thái (`AVAILABLE` $\leftrightarrow$ `MAINTENANCE`/`REPAIR`). |
| 3 | [`StaffVehicleManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleManagement.jsx#L431-L441) | `openMaintenanceModal` (Dòng `182–237`, `431–441`) | Chỉ kiểm tra `veh.status === 'IN_TOUR'` (chưa kiểm tra `veh.current_tour`); chỉ cho chuyển sang `MAINTENANCE` và chỉ hiện nút hoàn tất khi `status === 'MAINTENANCE'` (bỏ sót khi xe đang `REPAIR`). | Chặn cập nhật khi `veh.status === 'IN_TOUR' \|\| Boolean(veh.current_tour)`; hỗ trợ chọn chuyển sang `MAINTENANCE` hoặc `REPAIR`, và hỗ trợ hoàn tất cho cả `MAINTENANCE` lẫn `REPAIR`. |
| 4 | [`vehicleController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/vehicleController.js#L410-L464) | `updateVehicleStatusStaff` (Dòng `410–464`) | - Chưa kiểm tra xe có đang chạy tour theo `tour_vehicle_assignments` (`CURRENT_DATE() BETWEEN start_date AND end_date`).<br>- Chưa kiểm tra whitelist `['AVAILABLE', 'MAINTENANCE', 'REPAIR']` cho `role_id = 4`.<br>- Chưa chặn `currentStatus === new_status` và chưa bắt buộc `reason`.<br>- Khi chuyển về `AVAILABLE`, chưa cập nhật `end_date = CURDATE()` cho `vehicle_maintenances` và chưa kiểm tra sự cố đang `Processing`. | Bổ sung đầy đủ các kiểm tra điều kiện tiên quyết, cập nhật `end_date = CURDATE()` khi hoàn tất `vehicle_maintenances`, và chặn chuyển về `AVAILABLE` nếu xe vẫn còn sự cố đang `Processing` chưa giải quyết. |
| 5 | [`vehicleController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/vehicleController.js#L480-L569) | `updateDriverIncidentStaff` (Dòng `480–569`) | - Khi `action === 'REPAIR'` (dòng `501`), không kiểm tra `v.status === 'IN_TOUR'` hay phân công đang chạy trong `tour_vehicle_assignments`, dẫn tới tự ý đổi trạng thái xe đang đi tour sang `REPAIR`.<br>- Khi `action === 'PROCESSING'` hoặc khi `oldStatus === targetStatus`, không lưu `reason` vào `vehicle_status_history`.<br>- Khi `action === 'RESOLVED'` (dòng `519–541`), tự động chuyển xe về `AVAILABLE` và đóng mọi phiếu `vehicle_maintenances` mà không kiểm tra xem xe còn sự cố nào khác đang `Processing` hay không.<br>- Nội dung thông báo gửi Tài xế (dòng `548–551`) báo sai là *"chuyển xe vào xưởng sửa chữa"* khi `action === 'PROCESSING'`. | - Chặn `action === 'REPAIR'` (`403`) nếu xe đang `IN_TOUR` hoặc đang có phân công chạy tour hiện hành.<br>- Luôn ghi bản ghi vào `vehicle_status_history` (kể cả khi `old_status === new_status`) với `reason` có gắn mã sự cố và `updated_by = userId`.<br>- Khi `action === 'RESOLVED'`, chỉ chuyển xe về `AVAILABLE` và đóng `vehicle_maintenances` nếu xe không còn sự cố nào khác đang `Processing`.<br>- Chuẩn hóa nội dung thông báo gửi Tài xế theo đúng từng `action` (`PROCESSING`, `REPAIR`, `RESOLVED`). |
| 6 | [`StaffVehicleHistory.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleHistory.jsx#L111-L134) | `handleQuickResolve` (Dòng `111–134`, `390–396`, `755–807`) | Có nút `"Hoàn tất sửa chữa (Đưa về Sẵn sàng)"` và Modal cập nhật trạng thái ngay trên màn hình Lịch sử xe; khi `h.old_status === h.new_status` tiêu đề hiển thị `"Cập nhật trạng thái: X ➔ X"`. | Gỡ bỏ nút `"Hoàn tất sửa chữa"` và Modal khỏi `StaffVehicleHistory.jsx` để đảm bảo Read-only; hiển thị tiêu đề rõ ràng `"Ghi nhận xử lý sự cố (Giữ nguyên trạng thái: ...)"` khi `old_status === new_status`. |
| 7 | [`driverController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/driverController.js#L405) | `reportIncident` (Dòng `405`) | Lưu `action_url = 'vehicle_incidents'` trong bảng `notifications`. | Đồng bộ thành `'staff_vehicle_incidents'` khớp với mã tab trên `Dashboard.jsx`. |

---

### 5. Phân tích cơ chế đồng bộ trạng thái xe (`IN_TOUR` vs `current_tour`) và các điểm cần lưu ý

Qua kiểm tra trực tiếp [`vehicleController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/vehicleController.js) và [`tourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/tourController.js), hệ thống **không có hàm `syncVehicleStatuses` chạy ngầm để tự động `UPDATE vehicles SET status = 'IN_TOUR'`**. Thay vào đó, cơ chế hiện tại hoạt động theo 2 nguồn dữ liệu:
1. **Trường tĩnh `vehicles.status`:** Lưu trong bảng `vehicles` (`ENUM('AVAILABLE','IN_TOUR','MAINTENANCE','REPAIR','INACTIVE')`). Trong dữ liệu khởi tạo (`travel_management.sql`), có 6 xe (`vehicle_id` = 9, 15, 20, 27, 33, 39) được gán tĩnh `status = 'IN_TOUR'`, trong khi bảng `tour_vehicle_assignments` chỉ có 1 bản ghi phân công (`assignment_id = 3`, `vehicle_id = 35`, từ `2026-12-28` đến `2026-12-31`).
2. **Trường động `current_tour`:** Được tính toán trực tiếp trong câu lệnh `SELECT` của `getAllVehicles` ([vehicleController.js#L25-L33](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/vehicleController.js#L25-L33)) khi `tva.status IN ('ASSIGNED', 'IN_PROGRESS') AND CURRENT_DATE() BETWEEN tva.start_date AND tva.end_date`. Khi Quản lý Tour điều phối xe qua `dispatchVehicle` ([vehicleController.js#L321](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/vehicleController.js#L321)) hoặc `saveTourOperationalSchedule` ([tourController.js#L448](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/tourController.js#L448)), hệ thống chỉ thêm bản ghi vào `tour_vehicle_assignments` chứ không cập nhật `vehicles.status = 'IN_TOUR'`.

**Hệ quả cần lưu ý và phương án xử lý an toàn:**
- Nếu một xe đang trong ngày chạy tour theo `tour_vehicle_assignments` (`current_tour != null`), cột `vehicles.status` trong DB có thể vẫn là `'AVAILABLE'`. Do đó, để tuân thủ Phương án A (*không chuyển trạng thái xe đang chạy tour sang `REPAIR`*), Backend phải kiểm tra **cả hai điều kiện**: `v.status === 'IN_TOUR'` **HOẶC** xe đang có phân công hiệu lực trong ngày hiện tại tại bảng `tour_vehicle_assignments`.
- Ngược lại, đối với 6 xe đang có `vehicles.status = 'IN_TOUR'` tĩnh từ dữ liệu mẫu (`seed`) nhưng không có bản ghi phân công nào trong `tour_vehicle_assignments`, nếu giữ nguyên giá trị tĩnh `'IN_TOUR'` thì Nhân viên văn phòng sẽ không thể thao tác trên 6 xe này. Cần xác nhận xem có giữ nguyên trạng thái tĩnh `'IN_TOUR'` của 6 xe mẫu để phục vụ trình diễn giao diện hay chỉ coi xe là đang chạy tour khi có phân công thực tế.

---

### 6. Đánh giá khả năng lưu trữ của CSDL hiện tại và đề xuất thay đổi trong tương lai (nếu có)

#### 6.1. Đánh giá bảng `vehicle_status_history` hiện tại (Không cần sửa CSDL trong giai đoạn này)
Cấu trúc bảng `vehicle_status_history` tại [`travel_management.sql`](file:///d:/KLTN/travel-management-system/travel_management.sql#L2913-L2921):
- `history_id` (`int(11) NOT NULL AUTO_INCREMENT`)
- `vehicle_id` (`int(11) NOT NULL`)
- `old_status` (`varchar(50) DEFAULT NULL`)
- `new_status` (`varchar(50) DEFAULT NULL`)
- `reason` (`text DEFAULT NULL`)
- `updated_by` (`int(11) DEFAULT NULL`)
- `created_at` (`datetime DEFAULT current_timestamp()`)

**Kết luận khả năng đáp ứng hiện tại:**
- Đáp ứng **đầy đủ** việc lưu trạng thái trước/sau (`old_status`, `new_status`), kể cả trường hợp `old_status = new_status` (không có ràng buộc DB nào cấm 2 trường này giống nhau).
- Đáp ứng **đầy đủ** việc lưu thời điểm (`created_at`), lý do/ghi chú xử lý (`reason TEXT`), và người thực hiện (`updated_by` kết nối với `users.user_id`).
- **Điểm hạn chế nhỏ khi chưa sửa cấu trúc bảng:**
  1. Bảng `driver_incidents` không có cột lưu ghi chú xử lý riêng, nên trên bảng danh sách sự cố (`StaffVehicleIncidents.jsx`), nếu muốn xem lại các ghi chú xử lý đã nhập cho từng sự cố thì phải truy vấn từ `vehicle_status_history` (hoặc trả kèm ghi chú mới nhất trong API `getDriverIncidentsStaff`).
  2. Bảng `vehicle_status_history` yêu cầu `vehicle_id NOT NULL`. Nếu Tài xế nhập sai biển số xe (`driver_incidents.vehicle_number` không khớp với bất kỳ `vehicles.license_plate` nào), hệ thống không xác định được `vehicle_id` để chèn vào `vehicle_status_history`.

#### 6.2. Các thay đổi cơ sở dữ liệu có thể cân nhắc trong tương lai (Tùy chọn nâng cấp)
Nếu trong giai đoạn sau dự án cho phép mở rộng schema CSDL, có thể cân nhắc 3 cải tiến nhẹ (Backward-compatible):
1. **Bổ sung cột truy vết trực tiếp trên bảng `driver_incidents`:**
   - Thêm `resolution_notes TEXT DEFAULT NULL` (lưu ghi chú xử lý riêng biệt hoàn toàn với `description` của tài xế).
   - Thêm `updated_by INT(11) DEFAULT NULL` và `updated_at DATETIME DEFAULT NULL` (truy vết nhân viên xử lý sự cố gần nhất ngay trên bản ghi sự cố).
2. **Bổ sung khóa liên kết sự cố (`incident_id`) vào `vehicle_status_history` và `vehicle_maintenances`:**
   - Thêm `incident_id INT(11) DEFAULT NULL` vào `vehicle_status_history` và `vehicle_maintenances` để truy vết chính xác phiếu sửa chữa hoặc dòng lịch sử nào được sinh ra từ sự cố `incident_id` nào (thay vì chỉ đối chiếu qua chuỗi văn bản trong `reason` và `vehicle_number = license_plate`).
3. **Chuẩn hóa khóa ngoại phương tiện trên `driver_incidents`:**
   - Thêm `vehicle_id INT(11) DEFAULT NULL` tham chiếu tới `vehicles(vehicle_id)` bên cạnh `vehicle_number` để tránh lỗi lệch định dạng chuỗi biển số xe.

---
*Tài liệu được lập dựa trên kết quả khảo sát và đối chiếu trực tiếp mã nguồn, cơ sở dữ liệu và bộ tài liệu Use Case của dự án TravelVN ERP.*
