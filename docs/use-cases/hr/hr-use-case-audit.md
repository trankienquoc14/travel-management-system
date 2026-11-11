# BÁO CÁO RÀ SOÁT VÀ KIỂM CHỨNG MÃ NGUỒN (AUDIT REPORT)
## PHÂN HỆ: QUẢN LÝ NHÂN SỰ (HR MANAGEMENT) – TRAVELVN ERP

---

### 1. Mục đích và Tiêu chí kiểm chứng
Tài liệu này ghi nhận kết quả rà soát, đối chiếu và kiểm chứng trực tiếp giữa mã nguồn thực tế của hệ thống TravelVN ERP và tài liệu đặc tả nghiệp vụ cho **5 Use Case cơ sở** thuộc vai trò **Quản lý Nhân sự (HR Manager - Role ID: 2)**.

**Tiêu chí phân loại trạng thái kiểm chứng:**
- **Đã xác minh qua mã nguồn:** Chức năng có giao diện tương tác thực tế (component JSX), có API endpoint backend xử lý logic nghiệp vụ hoàn chỉnh, có bảng cơ sở dữ liệu MySQL tương ứng và hoạt động thông suốt.
- **Tích hợp giao diện:** Có giao diện người dùng nhưng dữ liệu đang ở dạng mẫu hoặc chưa kết nối cơ sở dữ liệu.
- **Chưa triển khai:** Mới có trên tài liệu phân tích thiết kế, chưa xuất hiện trong mã nguồn.

---

### 2. Kết quả rà soát chi tiết theo từng Use Case

---

#### 2.1. UC-HR-01 — Quản lý hồ sơ nhân sự
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/HREmployeeManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/HREmployeeManagement.jsx): Quản lý danh sách nhân sự toàn diện. Hỗ trợ tìm kiếm theo tên, email, điện thoại; hiển thị huy hiệu trạng thái (`Active`, `Inactive`, `Blocked`); biểu mẫu toàn trang thêm mới và chỉnh sửa thông tin nhân viên; nút xóa nhân sự.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/hr-service/routes/hrRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/routes/hrRoutes.js) (dòng 8-12).
    - Controller: [`microservices/hr-service/controllers/hrController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/hrController.js):
      + Hàm `getAllEmployees` (dòng 5): Truy vấn danh sách nhân viên nội bộ (`role_id NOT IN (6, 7)`) kèm tên vai trò từ bảng `roles`.
      + Hàm `createEmployee` (dòng 25): Kiểm tra tính duy nhất của email, mã hóa mật khẩu bằng `bcrypt`, ghi nhận bản ghi mới vào bảng `users`.
      + Hàm `updateEmployee` (dòng 71): Cập nhật thông tin họ tên, chức danh, số điện thoại, mật khẩu mới (nếu có) và trạng thái làm việc.
      + Hàm `deleteEmployee` (dòng 126): Xóa hoặc vô hiệu hóa tài khoản nhân sự có kiểm tra ràng buộc.
      + Hàm `getEmployeeTourStats` (dòng 340): Thống kê số lượng tour đã phục vụ của Hướng dẫn viên và Tài xế.
  - *Cơ sở dữ liệu:* Bảng `users`, `roles`, `departures`, `tours`.
- **Hành vi được xác minh:** Thêm mới nhân sự, chỉnh sửa hồ sơ, phân quyền chức danh, lọc tìm kiếm và vô hiệu hóa tài khoản.

---

#### 2.2. UC-HR-02 — Quản lý chấm công và ca làm việc
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/HRAttendance.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/HRAttendance.jsx): Giao diện chấm công chuyên nghiệp. Gồm 4 thẻ chỉ số KPI tổng hợp; 3 tab điều hướng (`summary`, `daily_detail`, `requests`); bộ chọn Tháng/Năm; bảng ma trận chấm công tháng dạng lưới từ ngày 1 đến ngày 31; bảng điểm danh chi tiết theo ngày có tọa độ GPS và nhận diện khuôn mặt; modal thiết lập ca làm việc (`company_shifts`); chức năng xuất báo cáo Excel CSV (`exportToCSV`).
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/hr-service/routes/hrRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/routes/hrRoutes.js) (dòng 27-30).
    - Controller: [`microservices/hr-service/controllers/hrController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/hrController.js):
      + Hàm `getAttendance` (dòng 432): Lấy danh sách chấm công của nhân sự theo ngày chỉ định kèm kiểm tra và cảnh báo cấu trúc bảng `timekeeping`.
      + Hàm `updateAttendance` (dòng 482): Cập nhật hoặc thêm mới chấm công thủ công có quản lý giao dịch CSDL (Transaction).
      + Hàm `getAttendanceHistory` (dòng 868): Truy vấn lịch sử chấm công cả tháng phục vụ bảng ma trận lưới, hỗ trợ bộ lọc đa chiều (ngày, trạng thái, chức danh, từ khóa tìm kiếm).
  - *Cơ sở dữ liệu:* Bảng `timekeeping`, `users`, `roles`.
- **Hành vi được xác minh:** Giám sát chấm công lưới cả tháng, xem chi tiết giờ vào/ra GPS/khuôn mặt, hiệu chỉnh công thủ công, thiết lập ca làm và xuất tệp CSV.

---

#### 2.3. UC-HR-03 — Phê duyệt đơn nghỉ phép và giải trình chấm công
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/HRAttendance.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/HRAttendance.jsx) (sub-tab `requests`) và [`frontend/src/components/HRLeaveRequest.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/HRLeaveRequest.jsx) (với `mode="approval"`): Hiển thị huy hiệu số đơn đang chờ xử lý; danh sách đơn nghỉ phép và giải trình; modal xem chi tiết đơn kèm tệp đính kèm chứng từ; ô nhập ý kiến chỉ đạo của quản lý; nút Duyệt (`Approved`) và Từ chối (`Rejected`).
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/hr-service/routes/hrRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/routes/hrRoutes.js) (dòng 47-48).
    - Controller: [`microservices/hr-service/controllers/hrController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/hrController.js):
      + Hàm `getAllLeaveRequests` (dòng 1245): Lấy toàn bộ đơn từ của nhân sự các phòng ban, sắp xếp đơn `Pending` lên đầu, hỗ trợ lọc theo trạng thái và loại đơn.
      + Hàm `reviewLeaveRequest` (dòng 1279): Cập nhật trạng thái đơn thành `Approved` hoặc `Rejected`. **Đặc biệt:** Khi duyệt đơn `Future_Leave`, tự động ghi nhận các ngày nghỉ vào bảng `timekeeping` (`status = 'Leave'`); khi duyệt đơn `Past_Explanation`, tự động cập nhật giờ chấm công `check_in`, `check_out` và tính lại trạng thái `Present` / `Late`.
  - *Cơ sở dữ liệu:* Bảng `leave_requests`, `timekeeping`, `users`, `roles`.
- **Hành vi được xác minh:** Thẩm định chứng từ minh chứng, phê duyệt hoặc từ chối đơn kèm lý do, tự động đồng bộ kết quả sang bảng chấm công không cần thao tác lặp lại.

---

#### 2.4. UC-HR-04 — Tính toán và quản lý bảng lương
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/HRPayroll.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/HRPayroll.jsx): Phân hệ Tính Lương Nhân Sự VietTravel ERP. Hỗ trợ chọn tháng kỳ lương (`YYYY-MM`); bảng tóm tắt cơ chế tính lương theo từng vị trí; bảng lương chi tiết hỗ trợ nhập và tự động tính lại thực lĩnh tức thời; nút Lưu bảng lương; modal Phiếu Lương Chi Tiết (`selectedSlip`) có tính năng in phiếu lương hoặc xuất PDF.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/hr-service/routes/hrRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/routes/hrRoutes.js) (dòng 33-34).
    - Controller: [`microservices/hr-service/controllers/hrController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/hrController.js):
      + Hàm `getPayroll` (dòng 554): Tính lương tự động theo từng vai trò:
        * Khối văn phòng: Tính theo ngày công thực tế từ bảng `timekeeping` (`base_salary / 26 * working_days`).
        * Hướng dẫn viên: Truy vấn bảng `departures` và `tours`, bóc tách `guidePerDay` từ `design_data` nhân với số ngày dẫn tour thực tế.
        * Tài xế: Tính lương cứng 5.000.000 ₫ cộng thù lao chạy tour 400.000 ₫/ngày.
      + Hàm `savePayroll` (dòng 804): Lưu trữ bảng lương đã chốt vào bảng `payroll`.
  - *Cơ sở dữ liệu:* Bảng `payroll`, `timekeeping`, `departures`, `tours`, `users`, `roles`.
- **Hành vi được xác minh:** Tính lương tự động đa vai trò, cho phép hiệu chỉnh phụ cấp/thưởng/phạt, lưu bảng lương tháng và in phiếu lương chi tiết.

---

#### 2.5. UC-HR-05 — Đánh giá hiệu suất nhân sự
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/HRPerformanceReview.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/HRPerformanceReview.jsx): Quản lý đánh giá hiệu suất. Hiển thị danh sách đánh giá của nhân sự; modal thêm đánh giá mới với lựa chọn nhân viên, nhập điểm từ 0-100, nhập nhận xét chi tiết và ngày đánh giá.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/hr-service/routes/hrRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/routes/hrRoutes.js) (dòng 14-15).
    - Controller: [`microservices/hr-service/controllers/hrController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/hrController.js):
      + Hàm `getAllPerformanceReviews` (dòng 156): Truy vấn lịch sử đánh giá kèm thông tin nhân viên từ bảng `users` và `roles`.
      + Hàm `createPerformanceReview` (dòng 177): Kiểm tra thang điểm 0-100, lưu bản ghi đánh giá vào bảng `performance_reviews`.
  - *Cơ sở dữ liệu:* Bảng `performance_reviews`, `users`, `roles`.
- **Hành vi được xác minh:** Xem lịch sử đánh giá, ghi nhận điểm số và nhận xét hiệu suất làm việc định kỳ cho từng nhân sự.
