# BÁO CÁO RÀ SOÁT VÀ KIỂM TRA MÃ NGUỒN (AUDIT REPORT)
## PHÂN HỆ: NHÂN VIÊN VĂN PHÒNG (OFFICE STAFF) – TRAVELVN ERP

---

### 1. Mục đích và Tiêu chí rà soát
Tài liệu này ghi nhận kết quả rà soát, đối chiếu và kiểm tra chéo (Cross-verification) giữa mã nguồn thực tế của hệ thống TravelVN ERP và tài liệu đặc tả Use Case cho vai trò **Nhân viên văn phòng (Office Staff - Role ID: 4)**. Báo cáo cung cấp các bằng chứng kỹ thuật cụ thể từ mã nguồn Frontend, API Gateway, Microservices và Cơ sở dữ liệu nhằm bảo đảm tính chính xác, minh bạch và nhất quán về mặt nghiệp vụ.

**Tiêu chí phân loại trạng thái rà soát:**
- **Đã xác minh đầy đủ:** Chức năng có đầy đủ giao diện, API xử lý, logic nghiệp vụ phía backend và tác động cơ sở dữ liệu đã được kiểm chứng từ mã nguồn.
- **Đã triển khai một phần:** Nghiệp vụ đã có luồng xử lý cơ bản nhưng còn thiếu một số bước xử lý tự động hoặc có sự chưa đồng bộ giữa các phân hệ.
- **Có sự không đồng bộ giữa Frontend và Backend:** Có sự khác biệt giữa giao diện người dùng và xử lý thực tế tại máy chủ.
- **Chưa đủ căn cứ:** Nội dung nghiệp vụ không tìm thấy mã nguồn hoặc logic xử lý tương ứng trong hệ thống hiện tại.

---

### 2. Kết quả rà soát chi tiết theo các Use Case chính (UC-OS-01 đến UC-OS-07)

#### 2.1. UC-OS-01 — Tư vấn khách hàng
- **Trạng thái rà soát:** **Đã xác minh đầy đủ**
- **Bằng chứng mã nguồn:**
  - *Frontend:* [`frontend/src/components/StaffLiveChat.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffLiveChat.jsx) thiết lập kết nối Socket.IO tới cổng 5005, lắng nghe các sự kiện `new_message`, `conversation_updated`.
  - *Backend:* [`microservices/chat-service/server.js`](file:///d:/KLTN/travel-management-system/microservices/chat-service/server.js) xử lý phát sự kiện socket, lưu trữ bản ghi vào bảng `chat_messages` và cập nhật bảng `chat_conversations`.
  - *Lưu trữ tệp:* Lưu trữ cục bộ tại thư mục `shared-uploads/chat` qua Multer (`POST /api/chat/upload`), hỗ trợ gửi tệp văn bản, ảnh và âm thanh thoại.
- **Nội dung điều chỉnh chuẩn hóa:**
  - Lược bỏ các chi tiết kỹ thuật giao diện thuần túy (như hiệu ứng gõ phím `customer_typing`, bộ đếm số lượng tin nhắn chưa đọc) ra khỏi luồng nghiệp vụ chính. Luồng chính tập trung hoàn toàn vào tương tác nghiệp vụ tư vấn, giải đáp dịch vụ và hỗ trợ khách hàng.

#### 2.2. UC-OS-02 — Thiết kế tour riêng
- **Trạng thái rà soát:** **Đã xác minh đầy đủ**
- **Bằng chứng mã nguồn:**
  - *Frontend:* [`frontend/src/components/StaffTourRequestManager.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffTourRequestManager.jsx) (Tab `tour_requests`), [`frontend/src/components/StaffTourDesigner.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffTourDesigner.jsx) và [`frontend/src/components/TourBuilder/TimelineBuilder.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/TourBuilder/TimelineBuilder.jsx) cung cấp công cụ xây dựng lịch trình các ngày, cấu hình khối định phí và biến phí.
  - *Cơ chế bóc tách chi phí tự động:* Hệ thống tự động tổng hợp chi phí vé tham quan / hoạt động (`autoTicketsCost`) từ lịch trình các ngày; tự động tính định phí xe nguyên chuyến (`fixedTransport`) dựa trên số ngày tour x đơn giá ngày của xe từ đội xe thực tế; phân tách rõ định phí (xe, HDV) và biến phí (khách sạn chia 2, vé tham quan, ăn uống, bảo hiểm).
  - *Hiển thị minh bạch giá:* Tính toán và hiển thị rõ ràng đơn giá theo 4 nhóm khách (Người lớn, Trẻ em, Trẻ nhỏ, Em bé) và **Tổng giá tour toàn đoàn** (`grandTotalRevenue`) trong modal chi tiết; đồng thời hiển thị nổi bật Tổng giá tour toàn đoàn trên danh sách ngoài `tour_requests` thay vì đơn giá từng khách lẻ.
  - *Backend:* [`microservices/tour-service/controllers/customTourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/customTourController.js) (hàm `submitToManager` dòng 578):
    - Đóng gói dữ liệu lịch trình (`itinerary`), chi phí gốc (`base_cost`), giá đề xuất (`quote_price`).
    - Thêm bản ghi vào bảng `custom_tour_quotes` với trạng thái `approval_status = 'Pending_Approval'`.
    - Cập nhật bảng `custom_tour_requests` sang trạng thái `status = 'Pending_Manager_Approval'`.
- **Ranh giới thẩm quyền được xác minh:**
  - Nhân viên văn phòng thiết kế và tính toán chi phí nhưng **không có quyền tự duyệt** bản thiết kế để gửi cho khách. Quyền phê duyệt bản thiết kế (`POST /quotes/:quoteId/manager-review`) thuộc về Quản lý Tour (`role_id = 3`).

#### 2.3. UC-OS-03 — Thiết kế tour cố định
- **Trạng thái rà soát:** **Đã xác minh đầy đủ**
- **Bằng chứng mã nguồn:**
  - *Frontend:* [`frontend/src/components/StaffFixedTourDesigner.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffFixedTourDesigner.jsx).
  - *Backend:* [`microservices/tour-service/controllers/tourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/tourController.js) (hàm `saveFixedTourDesign` dòng 513):
    - Khởi tạo Database Transaction, lưu bản ghi vào bảng `tours` với trạng thái mặc định `status = 'Pending'`, lưu toàn bộ cấu hình định phí/biến phí vào trường `design_data`.
    - Lưu chi tiết lịch trình các ngày và các hoạt động vào bảng `itineraries` và `itinerary_activities`.
  - *Mô hình vận chuyển và dữ liệu đội xe thực tế:* Dropdown chọn phương tiện di chuyển chính được tải trực tiếp từ Quản lý đội xe thực tế của hệ thống (`GET /api/tours/fleet/vehicles`, bảng `vehicles`), hiển thị đầy đủ tên xe, biển số, số chỗ ngồi và giá xe/ngày tự động tính vào định phí xe trọn gói theo số ngày tour; phân tách riêng biệt với vé máy bay (tính theo vé/khách).
- **Ranh giới thẩm quyền được xác minh:**
  - Nhân viên văn phòng chỉ tạo tour ở trạng thái Chờ duyệt (`Pending`), không có quyền kích hoạt mở bán (`Active`) hay khởi tạo đợt khởi hành bán vé (`departures`).

#### 2.4. UC-OS-04 — Xử lý hủy, đổi lịch
- **Trạng thái rà soát:** **Đã xác minh (có lưu ý kỹ thuật về luồng đổi lịch)**
- **Bằng chứng mã nguồn:**
  - *Frontend:* [`frontend/src/components/StaffChangeRequestManager.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffChangeRequestManager.jsx) và [`frontend/src/components/StaffBookingManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffBookingManagement.jsx).
  - *Backend:* [`microservices/booking-service/controllers/bookingController.js`](file:///d:/KLTN/travel-management-system/microservices/booking-service/controllers/bookingController.js) (hàm `processChangeRequest` dòng 768 và `updateBookingStatus` dòng 985).
  - *Xác minh biểu phí phạt hủy:* Hệ thống tự tính số ngày trước khởi hành (`days_before_departure`) và áp dụng biểu phí: $\ge 30$ ngày (phạt 10%, hoàn 90%), $15 - 29$ ngày (phạt 30%, hoàn 70%), $7 - 14$ ngày (phạt 50%, hoàn 50%), $3 - 6$ ngày (phạt 75%, hoàn 25%), $< 3$ ngày (phạt 100%, không hoàn tiền).
  - *Xác minh đơn chưa thanh toán:* Đơn chưa thanh toán (`Unpaid`) có mức phí phạt là 0 đồng (không áp dụng phạt tiền), hệ thống hủy đơn và hoàn trả chỗ ngay lập tức.
  - *Xác minh luồng Hủy tour:*
    - Cập nhật `bookings.booking_status = 'Cancelled'`.
    - Hoàn trả chỗ trống: `UPDATE departures SET available_slots = LEAST(max_slots, available_slots + num_people)`.
    - Cập nhật `payments.payment_status = 'Refunded'`: Đây là bước ghi nhận kế toán nội bộ trên hệ thống; việc chuyển khoản tiền thực tế trả lại khách hàng do bộ phận kế toán thực hiện sau đó dựa trên thông tin số tài khoản của khách.
  - *Xác minh cơ chế vô hiệu hóa mã QR vé:*
    - Khi hủy đơn, hệ thống cập nhật `booking_passengers.is_checked_in = 0` (đặt lại trạng thái chưa điểm danh).
    - Tại ứng dụng điểm danh của Hướng dẫn viên ([`microservices/hr-service/controllers/guideController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/guideController.js) dòng 272), khi quét mã QR của đơn hàng đã hủy, hệ thống kiểm tra `passList[0].booking_status === 'Cancelled'` và trả về cảnh báo chặn: *"🚫 VÉ ĐÃ BỊ HỦY (VOID)! Mã đơn vé đã được nhân viên chấp thuận hủy vé. Toàn bộ mã QR check-in của vé này đã hết hiệu lực và bị vô hiệu hóa hoàn toàn."*. Như vậy, vé bị vô hiệu hóa check-in là do ràng buộc trạng thái `booking_status = 'Cancelled'`.
- **Lưu ý kỹ thuật về Luồng Đổi lịch trình (Reschedule):**
  - Trong hàm `processChangeRequest` (dòng 830), mã nguồn hiện tại chỉ thực hiện:
    `UPDATE bookings SET departure_id = ? WHERE booking_id = ?`
  - Hệ thống **chưa có câu lệnh tự động cập nhật tăng/giảm `available_slots` giữa đợt khởi hành cũ và đợt khởi hành mới** trong luồng `Reschedule`. Đây là điểm cần người phát triển lưu ý hoàn thiện câu lệnh SQL trong tương lai.

#### 2.5. UC-OS-05 — Xác nhận thanh toán
- **Trạng thái rà soát:** **Đã xác minh đầy đủ**
- **Bằng chứng mã nguồn:**
  - *Frontend:* [`frontend/src/components/StaffPaymentManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffPaymentManagement.jsx).
  - *Backend:* [`microservices/booking-service/controllers/bookingController.js`](file:///d:/KLTN/travel-management-system/microservices/booking-service/controllers/bookingController.js) (hàm `confirmCashByStaff` dòng 488, `checkSepayPaymentStatus` dòng 1607, `sepayWebhook` dòng 1737, `markOrderPaidFromSepay` dòng 1460).
  - *Phân biệt 2 cơ chế thanh toán:*
    1. **Thanh toán Chuyển khoản VietQR SePay:** Hệ thống tự động xác nhận qua Webhook hoặc Polling API (`markOrderPaidFromSepay`). Nhân viên đóng vai trò theo dõi đối soát trên danh sách giao dịch.
    2. **Thanh toán Tiền mặt tại quầy (`Cash`):** Do Nhân viên văn phòng trực tiếp kiểm đếm tiền và nhấn "Xác nhận thu tiền" (`confirmCashByStaff`).
  - *Xác minh các tác vụ tự động kích hoạt sau khi thanh toán thành công:*
    - Bảng `payments` chuyển sang `Success`, `bookings` chuyển sang `Paid` và `Confirmed`.
    - Hàm `autoSyncAttendanceForTourDate(bookingId)` tự động kiểm tra ngày khởi hành và ghi nhận công cho Hướng dẫn viên phụ trách đoàn vào bảng `timekeeping`.
    - Hàm `sendPaymentSuccessEmail(bookingId)` tự động gửi vé điện tử có mã QR check-in tới hộp thư của khách hàng.

#### 2.6. UC-OS-06A — Theo dõi và cập nhật trạng thái xe
- **Trạng thái rà soát:** **Đã triển khai một phần (Cần điều chỉnh phân quyền và chuẩn hóa thao tác trạng thái)**
- **Bằng chứng mã nguồn đã xác minh:**
  - *Frontend:*
    - [`frontend/src/components/StaffVehicleManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleManagement.jsx) (Tab `staff_fleet_vehicles`): Hiển thị danh sách đội xe, lọc trạng thái (`AVAILABLE`, `IN_TOUR`, `MAINTENANCE`, `REPAIR`) và mở modal cập nhật bảo dưỡng ([L182-L237](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleManagement.jsx#L182-L237)).
    - [`frontend/src/components/StaffVehicleHistory.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleHistory.jsx) (Tab `staff_vehicle_history`): Hiển thị dòng thời gian tổng hợp 3 nguồn sự kiện (`INCIDENT`, `MAINTENANCE`, `STATUS_CHANGE`).
  - *Backend:* [`microservices/tour-service/controllers/vehicleController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/vehicleController.js):
    - Hàm `getAllVehicles` (dòng 4): Trả về danh sách xe kèm lịch bảo dưỡng hiện hành (`current_maintenance`) và lịch chạy tour hiện hành (`current_tour` từ bảng `tour_vehicle_assignments`).
    - Hàm `updateVehicleStatusStaff` (dòng 410): Kiểm tra chặn `if (new_status === 'IN_TOUR' || currentStatus === 'IN_TOUR') return res.status(403)...` (dòng 427); cập nhật `vehicles.status`; ghi nhận vào `vehicle_status_history` (`vehicle_id`, `old_status`, `new_status`, `reason`, `updated_by`); tạo phiếu `vehicle_maintenances` (`status = 'IN_PROGRESS'`) khi chuyển sang `MAINTENANCE` / `REPAIR` và đóng phiếu (`status = 'COMPLETED'`) khi chuyển về `AVAILABLE`.
    - Hàm `getVehicleHistoryStaff` (dòng 571): Trả về thông tin xe, lịch sử `vehicle_status_history` (JOIN `users.full_name AS user_name`), `vehicle_maintenances` và `driver_incidents`.
- **Các điểm chưa đáp ứng yêu cầu nghiệp vụ trong mã nguồn hiện tại:**
  1. **Vi phạm phạm vi quyền hạn quản lý hồ sơ phương tiện:**
     - Trên [`StaffVehicleManagement.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleManagement.jsx), giao diện đang hiển thị nút `+ Thêm xe mới` (dòng 286), `✏️ Sửa` (dòng 408), `🗑️ Xóa` (dòng 456) và Modal CRUD hồ sơ/giá xe (dòng 476–699).
     - Tại [`microservices/tour-service/routes/tourRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/tourRoutes.js#L72-L79), các route `POST /fleet/vehicles`, `PUT /fleet/vehicles/:id`, `DELETE /fleet/vehicles/:id` và `POST /fleet/maintenance` đang cấu hình `restrictTo(1, 3, 4)`, cho phép `role_id = 4` thêm/sửa/xóa phương tiện và làm thay đổi giá vốn/giá bán trong bảng `services`.
  2. **Thiếu sót trong kiểm tra chuyển trạng thái tại `updateVehicleStatusStaff` và `StaffVehicleManagement.jsx`:**
     - Trên `StaffVehicleManagement.jsx` (dòng 431–441), nút `🔧 Bảo dưỡng` chỉ hỗ trợ chuyển sang `MAINTENANCE` hoặc hoàn tất khi đang `MAINTENANCE`; chưa hỗ trợ chuyển sang `REPAIR` trực tiếp hoặc hoàn tất khi xe đang ở trạng thái `REPAIR`.
     - Trong `updateVehicleStatusStaff` (dòng 410–464), backend chưa kiểm tra danh sách trạng thái đích hợp lệ cho `role_id = 4` (`['AVAILABLE', 'MAINTENANCE', 'REPAIR']`), chưa chặn khi `currentStatus === new_status` (gây ghi trùng lịch sử), chưa kiểm tra điều kiện xe đang có chuyến đi thực tế trong `tour_vehicle_assignments` (`CURRENT_DATE() BETWEEN start_date AND end_date`), và khi chuyển về `AVAILABLE` chưa cập nhật `end_date = CURDATE()` cho `vehicle_maintenances`.
  3. **Vi phạm chế độ chỉ xem (Read-only) tại trang Lịch sử xe:**
     - Tại [`StaffVehicleHistory.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleHistory.jsx#L390-L396), trang lịch sử đang có nút `"Hoàn tất sửa chữa (Đưa về Sẵn sàng)"` và hàm `handleQuickResolve` (dòng 111–134) cho phép thay đổi trạng thái xe trực tiếp từ màn hình tra cứu lịch sử.

#### 2.7. UC-OS-06B — Tiếp nhận và xử lý sự cố xe
- **Trạng thái rà soát:** **Đã triển khai một phần (Cần chuẩn hóa quy tắc xử lý sự cố khi xe đang chạy tour và lưu ghi chú xử lý)**
- **Bằng chứng mã nguồn đã xác minh:**
  - *Frontend:* [`frontend/src/components/StaffVehicleIncidents.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffVehicleIncidents.jsx) (Tab `staff_vehicle_incidents`): Hiển thị danh sách sự cố từ Tài xế và modal xử lý sự cố với 3 tùy chọn (`REPAIR`, `PROCESSING`, `RESOLVED`).
  - *Backend:*
    - Tạo sự cố từ phía Tài xế: [`microservices/hr-service/controllers/driverController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/driverController.js#L367-L420) (`reportIncident`) thêm bản ghi vào `driver_incidents` (`status = 'Reported'`) và gửi thông báo cho `target_role = 'STAFF'`.
    - Tiếp nhận & xử lý phía Nhân viên văn phòng: [`microservices/tour-service/controllers/vehicleController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/vehicleController.js#L466-L569) (`getDriverIncidentsStaff`, `updateDriverIncidentStaff`).
- **Các điểm chưa đáp ứng yêu cầu nghiệp vụ trong mã nguồn hiện tại:**
  1. **Chưa chặn chuyển trạng thái xe sang `REPAIR` khi xe đang chạy tour (`IN_TOUR`):**
     - Trong `updateDriverIncidentStaff` (dòng 501–516), khi `action === 'REPAIR'`, hệ thống chỉ kiểm tra `if (v.status !== 'REPAIR')` và lập tức cập nhật `UPDATE vehicles SET status = 'REPAIR'`, **không kiểm tra** xem xe có đang ở trạng thái `IN_TOUR` hoặc đang gắn với chuyến đi đang diễn ra trong `tour_vehicle_assignments` hay không (trái với Phương án A đã thống nhất).
  2. **Mất nội dung ghi chú xử lý (`reason`) khi trạng thái xe không thay đổi và sai nội dung thông báo:**
     - Khi Nhân viên văn phòng chọn `action === 'PROCESSING'` (hoặc `action === 'RESOLVED'` mà trạng thái xe không đổi), biến `reason` gửi lên bị bỏ qua, không được lưu vào bảng `vehicle_status_history`.
     - Đồng thời, thông báo gửi cho Tài xế tại dòng 548–551 luôn hiển thị *"đã được Ban điều hành tiếp nhận và chuyển xe vào xưởng sửa chữa"* ngay cả khi nhân viên chỉ chọn `PROCESSING` (không đưa vào xưởng).
  3. **Tự động đóng phiếu sửa chữa và chuyển xe về `AVAILABLE` mà không kiểm tra các sự cố khác chưa giải quyết:**
     - Khi hoàn tất một sự cố (`action === 'RESOLVED'`, dòng 519–541), hệ thống chuyển ngay `vehicles.status = 'AVAILABLE'` và đóng toàn bộ `vehicle_maintenances` đang `IN_PROGRESS` của xe đó mà chưa kiểm tra xem xe còn sự cố nào khác đang ở trạng thái `Reported` hoặc `Processing` trong bảng `driver_incidents` hay không.
  4. **Lệch `action_url` thông báo:**
     - Trong `driverController.js` (dòng 405), khi Tài xế báo cáo sự cố, thông báo lưu `action_url = 'vehicle_incidents'`, trong khi mã tab trên `Dashboard.jsx` (dòng 434) là `'staff_vehicle_incidents'`.

#### 2.8. UC-OS-07 — Báo giá và điều chỉnh báo giá tour riêng
- **Trạng thái rà soát:** **Đã xác minh đầy đủ**
- **Bằng chứng mã nguồn:**
  - *Frontend:* [`frontend/src/components/StaffTourRequestManager.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffTourRequestManager.jsx) (Tab `tour_requests_pending`) và [`frontend/src/components/StaffPendingTours.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffPendingTours.jsx) (Tab `approved_tours`).
  - *Backend:* [`microservices/tour-service/controllers/customTourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/customTourController.js):
    - *Giai đoạn 1 (Báo giá sơ bộ - Initial Quote):* Hàm `sendInitialQuote` (dòng 525) lưu bản ghi vào `custom_tour_quotes` với `approval_status = 'Initial_Quoted'`, cập nhật `custom_tour_requests.status = 'Initial_Quoted'` để định hướng ngân sách cho khách hàng.
    - *Giai đoạn 2 (Báo giá chính thức - Official Quote):* Hàm `sendToCustomer` (dòng 669) chỉ được thực hiện sau khi Quản lý Tour duyệt (`Manager_Approved`), cập nhật `approval_status = 'Quote_Sent'`, chuyển trạng thái yêu cầu sang `Sent_To_Customer` và gửi thông báo cho khách hàng để khách đặt cọc/đặt tour.
- **Ranh giới nghiệp vụ được xác minh:**
  - Phân biệt rõ ranh giới với `UC-OS-02`: `UC-OS-02` là hành động xây dựng lịch trình và bóc tách cấu trúc chi phí để trình duyệt nội bộ; còn `UC-OS-07` là hành động gửi thông tin báo giá (sơ bộ hoặc chính thức) tới khách hàng.

#### 2.9. UC-OS-08 — Chỉnh sửa thiết kế tour
- **Trạng thái rà soát:** **Đã xác minh đầy đủ**
- **Bằng chứng mã nguồn:**
  - *Frontend:* [`frontend/src/components/StaffTourRequestManager.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffTourRequestManager.jsx) (Tab `tour_requests_revision`), [`frontend/src/components/StaffTourDesigner.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/StaffTourDesigner.jsx).
    - Cấu hình phân hệ chuyên biệt `STAGE_CONFIGS.tour_requests_revision` với bộ lọc và 4 thẻ thống kê: Tổng cần sửa, Khách yêu cầu sửa, Quản lý yêu cầu sửa, Đang xử lý lại.
    - Hiển thị nổi bật nội dung cần chỉnh sửa (`manager_note` hoặc `customer_note`) trong hộp cảnh báo màu đỏ; nút "Sửa ngay" (`startDesignDirectly`) điều hướng thẳng vào phòng thiết kế, nạp lại dữ liệu cũ để nhân viên chỉnh sửa.
  - *Backend:* [`microservices/tour-service/controllers/customTourController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/customTourController.js):
    - Hàm `getAllRequests`: Truy vấn `custom_tour_requests` kèm `customer_note`, `manager_note`, trạng thái `Customer_Revision`, `Manager_Rejected`, `Designing`.
    - Hàm `submitToManager`: Tạo bản ghi quote mới, reset `customer_note: null`, cập nhật trạng thái yêu cầu sang `Pending_Manager_Approval`.
    - Hàm `managerReview`: Khi Quản lý duyệt bản mới (`Manager_Approved`), dọn sạch ghi chú sửa cũ (`customer_note = NULL`, `manager_note = NULL`), tự động đưa hồ sơ ra khỏi danh mục cần sửa và hoàn tất quy trình chỉnh sửa.
- **Ranh giới nghiệp vụ được xác minh:**
  - `UC-OS-08` giải quyết bài toán tái thiết kế theo vòng lặp phản hồi (Feedback loop) của cả 2 tác nhân (Sếp hoặc Khách). Đảm bảo bản thiết kế mới được duyệt sẽ hoàn tất triệt để yêu cầu sửa, không bị hiển thị lặp lại trong danh sách cần sửa.

---

### 3. Tổng hợp các điểm cần người phát triển lưu ý hoàn thiện

1. **Điều chỉnh chỗ trống trong luồng Đổi lịch trình (`UC-OS-04`):**
   - Trong hàm `processChangeRequest`, khi duyệt yêu cầu Đổi lịch (`Reschedule`), hệ thống mới chỉ cập nhật `departure_id` mới vào bảng `bookings`. Cần bổ sung câu lệnh hoàn trả chỗ trống cho đợt khởi hành cũ (`available_slots + num_people`) và trừ chỗ trống ở đợt khởi hành mới (`available_slots - num_people`) để bảo đảm tính toàn vẹn dữ liệu đợt tour.
2. **Quy trình hoàn tiền thực tế (`UC-OS-04`):**
   - Trạng thái `Refunded` trong bảng `payments` đóng vai trò là căn cứ kế toán ghi nhận trên hệ thống. Cần có quy trình bàn giao danh sách số tài khoản ngân hàng sang phân hệ kế toán để thực hiện lệnh chuyển khoản tiền thực tế lại cho khách hàng.
3. **Thanh toán trực tuyến SePay (`UC-OS-05`):**
   - Luồng tự động xác nhận qua Webhook và Polling API đã hoạt động ổn định trên môi trường kiểm thử; khi triển khai thực tế trên Internet (Production) cần bảo đảm cấu hình đúng tên miền và Secret Token của SePay Webhook.
4. **Siết chặt phân quyền và chuẩn hóa nghiệp vụ Đội xe cho Nhân viên văn phòng (`UC-OS-06A` & `UC-OS-06B`):**
   - **Phân quyền Backend & Frontend:** Đổi middleware của `POST /api/tours/fleet/vehicles`, `PUT /api/tours/fleet/vehicles/:id`, `DELETE /api/tours/fleet/vehicles/:id`, `POST /api/tours/fleet/maintenance` tại `tourRoutes.js` từ `restrictTo(1, 3, 4)` thành `restrictTo(1, 3)`; đồng thời gỡ bỏ nút Thêm, Sửa hồ sơ, Xóa xe trên `StaffVehicleManagement.jsx`.
   - **Kiểm soát trạng thái `IN_TOUR` và lịch điều phối (`current_tour`):** Khi xe đang ở trạng thái `IN_TOUR` hoặc có lịch phân công đang diễn ra trong `tour_vehicle_assignments`, chặn chuyển trạng thái xe sang `REPAIR` trong cả `updateVehicleStatusStaff` và `updateDriverIncidentStaff` (Phương án A).
   - **Lưu vết ghi chú xử lý sự cố (`vehicle_status_history`):** Ghi nhận mọi bước xử lý sự cố (bao gồm `PROCESSING` và `RESOLVED` khi trạng thái xe không đổi, tức `old_status = new_status`) vào bảng `vehicle_status_history` kèm `reason` và `updated_by`, tuyệt đối giữ nguyên `driver_incidents.description`.
   - **Kiểm tra sự cố tồn đọng khi hoàn tất:** Chỉ tự động chuyển xe từ `REPAIR` về `AVAILABLE` khi xe không còn sự cố nào khác đang ở trạng thái `Processing`.
   - **Chế độ chỉ xem cho Lịch sử xe:** Gỡ bỏ nút `"Hoàn tất sửa chữa (Đưa về Sẵn sàng)"` (`handleQuickResolve`) khỏi `StaffVehicleHistory.jsx`.

---
*Báo cáo được hoàn thành dựa trên việc đối soát trực tiếp mã nguồn của hệ thống TravelVN ERP.*
