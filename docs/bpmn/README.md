# HỆ THỐNG QUẢN LÝ TOUR DU LỊCH (TRAVELVN ERP)
## TÀI LIỆU CÁC QUY TRÌNH NGHIỆP VỤ HỆ THỐNG & SƠ ĐỒ BPMN 2.0
*(Tài liệu phục vụ Báo cáo Khóa luận Tốt nghiệp)*

---

### 1. Tổng quan hệ thống & Kiến trúc nghiệp vụ
Dự án **Travel Management System (TravelVN)** là hệ thống quản lý và điều hành du lịch được xây dựng trên kiến trúc **Microservices** kết hợp giao diện Web hiện đại:
- **API Gateway**: Định tuyến yêu cầu, quản lý tải và bảo mật truy cập.
- **Auth Service**: Xác thực JWT, phân quyền theo vai trò (RBAC), quản lý hồ sơ cá nhân.
- **Tour Service**: Thiết kế tour trọn gói, kéo thả tour riêng, quản lý đợt khởi hành, kho tài nguyên địa điểm/dịch vụ, điều hành đội xe.
- **Booking Service**: Tiếp nhận đơn đặt tour, kiểm tra điều kiện khởi hành và cơ cấu phòng, thanh toán trực tuyến SePay VietQR và tiền mặt, xử lý yêu cầu hủy/đổi lịch, đặt dịch vụ lẻ.
- **HR Service**: Quản trị nhân sự, chấm công GPS thời gian thực, quản lý đơn xin nghỉ phép/giải trình công, tính lương và đánh giá hiệu suất (KPI), không gian làm việc của Hướng dẫn viên và Tài xế.
- **Chat Service**: Trò chuyện trực tuyến giữa khách hàng và nhân viên tư vấn, hỗ trợ AI Bot Engine giải đáp thông tin tự động.

### 2. Danh mục vai trò và tác nhân (Actors / Pool & Lanes)
Căn cứ trên cấu trúc cơ sở dữ liệu (`roles`) và phân quyền phân hệ thực tế:
1. **Khách hàng (Customer - Role ID: 6)**: Khách vãng lai và khách hàng thành viên đặt tour, thanh toán, gửi yêu cầu thiết kế riêng, quản lý đơn hàng, yêu cầu hủy/đổi lịch.
2. **Nhân viên văn phòng / Điều hành kinh doanh (Office Staff - Role ID: 4)**: Tư vấn khách hàng, khảo sát và báo giá sơ bộ, thiết kế tour riêng, thiết kế tour cố định, xác nhận thanh toán tiền mặt, xử lý yêu cầu hủy/đổi lịch, tạo yêu cầu cung ứng dịch vụ gửi đối tác.
3. **Quản lý Tour (Tour Manager - Role ID: 3)**: Thẩm định và phê duyệt thiết kế tour/báo giá, theo dõi mốc gom khách T-21/T-14/T-7 và ra quyết định vận hành, phân công hướng dẫn viên, điều xe và tài xế, xử lý sự cố tour, phê duyệt báo cáo chuyến đi.
4. **Hướng dẫn viên (Tour Guide - Role ID: 5)**: Nhận tour phân công, quét mã QR check-in khách đoàn, cập nhật tiến độ hành trình (Live Trip Updates), báo cáo sự cố khẩn cấp, lập báo cáo tổng kết chuyến đi.
5. **Tài xế (Driver - Role ID: 8)**: Nhận chuyến xe phân công, kiểm tra phương tiện, kê khai chi phí phát sinh (xăng dầu, cầu đường) kèm ảnh hóa đơn, báo cáo sự cố xe.
6. **Đối tác cung ứng (Partner - Role ID: 7)**: Quản lý kho dịch vụ (khách sạn, nhà hàng, xe, vé tham quan), tiếp nhận và phê duyệt/từ chối các yêu cầu cung cấp dịch vụ đoàn và dịch vụ đơn lẻ.
7. **Quản lý Nhân sự (HR Manager - Role ID: 2)**: Quản lý hồ sơ nhân viên, phê duyệt đơn xin nghỉ phép/giải trình, theo dõi chấm công GPS, tự động tổng hợp công - tour - KPI để tính lương và chi trả hàng tháng.
8. **Quản trị viên (Administrator - Role ID: 1)**: Toàn quyền quản trị hệ thống, quản lý người dùng và phân vai trò.
9. **Hệ thống tự động (TravelVN System Services & SePay)**: Tự động hóa các nghiệp vụ logic: kiểm tra quy tắc 30 ngày, tính cơ cấu phòng, sinh mã giao dịch và VietQR động, lắng nghe Webhook ngân hàng, cập nhật bảng công vào ngày đi tour, tính biểu phí phạt hủy/đổi lịch tự động, sinh mã voucher.

---

### 3. Danh sách các quy trình nghiệp vụ BPMN 2.0

| Mã quy trình | Tên quy trình nghiệp vụ | Tác nhân chính (Lanes) | File BPMN | File SVG | File PNG |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **QTT-01** | **Quy trình Đặt tour có sẵn và Thanh toán trực tuyến** | Khách hàng, Hệ thống, Nhân viên VP / Thu ngân | [`QTT01_DatTourVaThanhToan.bpmn`](./QTT01_DatTourVaThanhToan.bpmn) | [`QTT01_DatTourVaThanhToan.svg`](./QTT01_DatTourVaThanhToan.svg) | [`QTT01_DatTourVaThanhToan.png`](./QTT01_DatTourVaThanhToan.png) |
| **QTT-02** | **Quy trình Yêu cầu thiết kế tour riêng, Báo giá và Phê duyệt** | Khách hàng, Nhân viên thiết kế tour, Quản lý Tour, Hệ thống | [`QTT02_ThietKeTourVaBaoGia.bpmn`](./QTT02_ThietKeTourVaBaoGia.bpmn) | [`QTT02_ThietKeTourVaBaoGia.svg`](./QTT02_ThietKeTourVaBaoGia.svg) | [`QTT02_ThietKeTourVaBaoGia.png`](./QTT02_ThietKeTourVaBaoGia.png) |
| **QTT-03** | **Quy trình Xử lý yêu cầu Hủy tour hoặc Đổi lịch trình** | Khách hàng, Hệ thống, Nhân viên văn phòng | [`QTT03_HuyDoiLichTour.bpmn`](./QTT03_HuyDoiLichTour.bpmn) | [`QTT03_HuyDoiLichTour.svg`](./QTT03_HuyDoiLichTour.svg) | [`QTT03_HuyDoiLichTour.png`](./QTT03_HuyDoiLichTour.png) |
| **QTT-04** | **Quy trình Quản lý Yêu cầu Cung ứng Dịch vụ Đối tác** | Điều hành tour, Hệ thống, Đối tác cung ứng | [`QTT04_CungUngDichVuDoiTac.bpmn`](./QTT04_CungUngDichVuDoiTac.bpmn) | [`QTT04_CungUngDichVuDoiTac.svg`](./QTT04_CungUngDichVuDoiTac.svg) | [`QTT04_CungUngDichVuDoiTac.png`](./QTT04_CungUngDichVuDoiTac.png) |
| **QTT-05** | **Quy trình Điều hành, Đánh giá Khả thi và Phân công Nguồn lực Tour** | Hệ thống, Quản lý Tour, Hướng dẫn viên, Tài xế | [`QTT05_DieuHanhVaPhanCongNguonLuc.bpmn`](./QTT05_DieuHanhVaPhanCongNguonLuc.bpmn) | [`QTT05_DieuHanhVaPhanCongNguonLuc.svg`](./QTT05_DieuHanhVaPhanCongNguonLuc.svg) | [`QTT05_DieuHanhVaPhanCongNguonLuc.png`](./QTT05_DieuHanhVaPhanCongNguonLuc.png) |
| **QTT-06** | **Quy trình Thực thi Tour, Điểm danh Hành khách và Xử lý Sự cố** | Khách hàng, Hướng dẫn viên, Tài xế, Quản lý Tour | [`QTT06_ThucThiTourVaXuLySuCo.bpmn`](./QTT06_ThucThiTourVaXuLySuCo.bpmn) | [`QTT06_ThucThiTourVaXuLySuCo.svg`](./QTT06_ThucThiTourVaXuLySuCo.svg) | [`QTT06_ThucThiTourVaXuLySuCo.png`](./QTT06_ThucThiTourVaXuLySuCo.png) |
| **QTT-07** | **Quy trình Chấm công GPS, Nghỉ phép và Tính lương Nhân sự** | Nhân viên / HDV / Tài xế, Hệ thống, Quản lý Nhân sự | [`QTT07_ChamCongNghiPhepTinhLuong.bpmn`](./QTT07_ChamCongNghiPhepTinhLuong.bpmn) | [`QTT07_ChamCongNghiPhepTinhLuong.svg`](./QTT07_ChamCongNghiPhepTinhLuong.svg) | [`QTT07_ChamCongNghiPhepTinhLuong.png`](./QTT07_ChamCongNghiPhepTinhLuong.png) |
| **QTT-08** | **Quy trình Đặt dịch vụ đơn lẻ và Phối hợp Đối tác** | Khách hàng, Nhân viên văn phòng, Đối tác cung ứng, Hệ thống | [`QTT08_DatDichVuDonLe.bpmn`](./QTT08_DatDichVuDonLe.bpmn) | [`QTT08_DatDichVuDonLe.svg`](./QTT08_DatDichVuDonLe.svg) | [`QTT08_DatDichVuDonLe.png`](./QTT08_DatDichVuDonLe.png) |

---

### 4. Chi tiết logic từng quy trình nghiệp vụ thực tế

#### 4.1. Quy trình QTT-01: Đặt tour có sẵn và Thanh toán trực tuyến
- **Mã nguồn**: `microservices/booking-service/controllers/bookingController.js` (`createBooking`, `initiatePayment`, `sepayWebhook`, `checkSepayPaymentStatus`, `confirmCashByStaff`).
- **Luồng logic**:
  1. Khách hàng lựa chọn tour và đợt khởi hành còn nhận khách (`status = 'Open'`).
  2. Điền thông tin hành khách (người lớn, trẻ em, trẻ nhỏ, em bé), tùy chọn phòng đơn.
  3. Hệ thống kiểm tra ràng buộc:
     - **Quy tắc 30 ngày**: Ngày khởi hành phải cách ngày hiện tại tối thiểu 30 ngày (`diffDays >= 30`) để kịp thời hạn chốt dịch vụ với nhà cung cấp. Nếu vi phạm, từ chối nhận đặt vé.
     - **Thuật toán xếp phòng (`calculateRooms`)**: Kiểm tra số người lớn tối đa/tối thiểu mỗi phòng, trẻ em kèm theo và kiểm tra khách sạn có hỗ trợ phòng đơn (`single_room_allowed`).
     - **Số chỗ trống (`available_slots`)**: Đảm bảo `available_slots >= num_people`.
  4. Hệ thống ghi nhận đơn `bookings` với trạng thái `booking_status = 'Pending'`, `payment_status = 'Unpaid'`, trừ số chỗ trống, lưu danh sách hành khách vào `booking_passengers`.
  5. Khách hàng chọn phương thức thanh toán:
     - **Chuyển khoản SePay (VietQR)**: Hệ thống sinh mã giao dịch `THANHTOAN{bookingId}` và mã QR ngân hàng động. Khách quét mã chuyển khoản qua Mobile Banking. SePay gửi Webhook hoặc API Polling đối soát giao dịch tự động. Nếu thanh toán thành công, hệ thống chuyển sang `Paid` & `Confirmed`, tự động sinh vé điện tử và mã QR check-in cho hành khách, đồng thời tự động chốt công cho HDV vào ngày khởi hành (`autoSyncAttendanceForTourDate`). Nếu quá hạn không thanh toán, hệ thống tự động hủy đơn và giải phóng vé.
     - **Tiền mặt tại quầy**: Khách hàng nộp tiền mặt tại văn phòng công ty. Nhân viên văn phòng kiểm tra và bấm xác nhận thu tiền (`confirmCashByStaff`), hệ thống chuyển đơn sang `Paid` & `Confirmed` và phát hành vé điện tử.

#### 4.2. Quy trình QTT-02: Yêu cầu thiết kế tour riêng, Báo giá và Phê duyệt
- **Mã nguồn**: `microservices/tour-service/controllers/customTourController.js` (`createCustomRequest`, `sendInitialQuote`, `startDesigning`, `submitToManager`, `managerReview`, `sendToCustomer`, `updateCustomerAction`, `bookCustomTourQuote`).
- **Luồng logic**:
  1. Khách hàng điền thông tin nhu cầu: Điểm đến, ngày đi/về, số người, ngân sách và sở thích du lịch (`POST /api/custom-tours/request`). Lưu vào `custom_tour_requests` với trạng thái `Pending`.
  2. Nhân viên thiết kế tour tiếp nhận, gửi **Báo giá sơ bộ** (`Initial_Quoted`) để định hướng ngân sách cho khách.
  3. Nhân viên chuyển sang trạng thái **Thiết kế chi tiết** (`Designing`), dùng công cụ kéo thả Tour Designer: chọn điểm tham quan, khách sạn, nhà xe, tính toán chi phí gốc (`base_cost`), tỷ lệ lợi nhuận (`markup_percent`) và giá báo (`quote_price`).
  4. Nhân viên gửi bản thiết kế lên Quản lý Tour thẩm duyệt (`submitToManager`), trạng thái chuyển sang `Pending_Manager_Approval` (quote `Pending_Approval`).
  5. Quản lý Tour kiểm tra:
     - Nếu không đạt: Quản lý từ chối (`action = 'reject'`), nhập góp ý `manager_note`, chuyển trạng thái `Manager_Rejected`. Bản thiết kế quay về Nhân viên chỉnh sửa lại.
     - Nếu đạt: Quản lý phê duyệt (`action = 'approve'`), chuyển trạng thái `Manager_Approved` (quote `Approved`).
  6. Nhân viên gửi thiết kế đã duyệt cho khách hàng (`sendToCustomer` -> `Sent_To_Customer`).
  7. Khách hàng xem xét:
     - Nếu muốn điều chỉnh: Khách gửi yêu cầu sửa (`Customer_Revision`) kèm ghi chú.
     - Nếu không đồng ý: Khách từ chối (`Customer_Rejected`).
     - Nếu đồng ý: Khách chấp nhận báo giá (`Customer_Accepted`) và bấm Đặt tour (`bookCustomTourQuote`).
  8. Hệ thống tự động: Tạo bản ghi `tours` mới (`is_custom = 1`), tạo đợt khởi hành riêng `departures` (`status = 'Closed'`), tạo đơn hàng `bookings` (`Confirmed`, `Unpaid`), lưu danh sách hành khách và chuyển tiếp sang quy trình thanh toán.

#### 4.3. Quy trình QTT-03: Xử lý yêu cầu Hủy tour hoặc Đổi lịch trình
- **Mã nguồn**: `microservices/booking-service/controllers/bookingController.js` (`createChangeRequest`, `processChangeRequest`, `updateBookingStatus`).
- **Luồng logic**:
  1. Khách hàng gửi yêu cầu Hủy (`Cancel`) hoặc Đổi lịch (`Reschedule`) kèm lý do và ngày đi mới (nếu đổi lịch).
  2. Hệ thống kiểm tra tình trạng thanh toán:
     - **Nếu đơn chưa thanh toán (`Unpaid`) và khách xin hủy**: Hệ thống tự động duyệt hủy ngay, cập nhật `bookings.booking_status = 'Cancelled'`, hoàn trả chỗ trống (`available_slots`), ghi nhận mức phí 0đ và gửi thông báo hoàn tất.
     - **Nếu đơn đã thanh toán (`Paid`) hoặc yêu cầu đổi lịch**: Hệ thống tự động tính số ngày còn lại trước ngày khởi hành (`daysBeforeDeparture = depDate - today`) và áp dụng biểu phí:
       * *Hủy tour*: >=30 ngày (phạt 10%, hoàn 90%); 15-29 ngày (phạt 30%, hoàn 70%); 7-14 ngày (phạt 50%, hoàn 50%); 3-6 ngày (phạt 75%, hoàn 25%); <3 ngày (phạt 100%, hoàn 0%).
       * *Đổi lịch*: >=30 ngày (phí 0%); 15-29 ngày (phí 10%); 7-14 ngày (phí 20%); 3-6 ngày (phí 40%); <3 ngày (không hỗ trợ đổi, phí 100%).
       Lưu yêu cầu vào `booking_change_requests` ở trạng thái `Pending`.
  3. Nhân viên văn phòng kiểm tra và xử lý (`processChangeRequest`):
     - **Từ chối (`Rejected`)**: Nhập lý do từ chối `staff_note`, hệ thống thông báo cho khách, giữ nguyên đơn hàng.
     - **Phê duyệt (`Approved`)**:
       * *Nếu là Hủy tour*: Cập nhật `bookings.booking_status = 'Cancelled'`, hoàn lại số chỗ trống cho đợt khởi hành, vô hiệu hóa toàn bộ mã QR check-in (`booking_passengers.is_checked_in = 0`), cập nhật trạng thái thanh toán sang `Refunded` và chuyển kế toán hoàn tiền.
       * *Nếu là Đổi lịch*: Cập nhật `bookings.departure_id = new_departure_id` và cập nhật vé điện tử mới cho khách hàng.

#### 4.4. Quy trình QTT-04: Quản lý Yêu cầu Cung ứng Dịch vụ Đối tác
- **Mã nguồn**: `microservices/tour-service/controllers/serviceRequestController.js` (`createGroup`, `createSupplement`, `getMyPartnerRequests`, `acceptRequest`, `rejectRequest`).
- **Luồng logic**:
  1. Trước ngày khởi hành tour (hoặc sau mốc chốt khách trước 30 ngày), Điều hành tour truy cập phân hệ Tạo yêu cầu cung cấp dịch vụ.
  2. Điều hành chọn đợt khởi hành, nhập số lượng khách đoàn, chọn các dịch vụ cần cung ứng (khách sạn, xe, ăn uống, vé vui chơi).
  3. Hệ thống sinh mã nhóm yêu cầu ban đầu (`code = 'YCT-XXXX'`, `request_type = 'INITIAL'`), lưu trạng thái `PROCESSING`, tự động phân tách thành các yêu cầu con theo từng `partner_id` và `service_type` (`Pending`), gửi thông báo đích danh đến tài khoản Đối tác.
  4. Nếu có phát sinh thêm khách hoặc bổ sung dịch vụ: Điều hành lập **Yêu cầu bổ sung** (`createSupplement`), mã dạng `YCB-XXXX-YY`, liên kết nhóm cha `parent_id`.
  5. Đối tác đăng nhập hệ thống, kiểm tra ngày sử dụng, công suất phòng/xe/bàn ăn khả dụng:
     - Nếu không đủ năng lực: Bấm Từ chối (`rejectRequest`) kèm lý do. Điều hành nhận cảnh báo để điều phối đối tác thay thế.
     - Nếu đáp ứng được: Bấm Chấp nhận (`acceptRequest`), hệ thống cập nhật `status = 'Accepted'`.
  6. Khi tất cả các dịch vụ thành phần trong nhóm được đối tác xác nhận, nhóm yêu cầu chuyển sang hoàn tất (`COMPLETED`), khóa danh sách dịch vụ sẵn sàng khởi hành.

#### 4.5. Quy trình QTT-05: Điều hành, Đánh giá Khả thi và Phân công Nguồn lực Tour
- **Mã nguồn**: `microservices/tour-service/controllers/tourController.js` (`getOperationalDepartures`, `makeOperationalDecision`, `saveTourOperationalSchedule`), `vehicleController.js` (`dispatchVehicle`).
- **Luồng logic**:
  1. Hệ thống đếm ngược đến các mốc đánh giá đợt khởi hành: T-21, T-14, T-7 ngày trước khởi hành; tính số lượng khách thực tế (`current_pax`) và nhu cầu phòng khách sạn (`total_required_rooms`).
  2. Quản lý Tour rà soát tình hình gom khách so với ngưỡng khởi hành tối thiểu (`min_pax` - mặc định 15 khách).
  3. Quản lý Tour ra quyết định vận hành (`makeOperationalDecision`):
     - **Đóng tour**: Nếu lượng khách quá ít hoặc sự cố bất khả kháng, chuyển `operational_status = 'Cancelled'`, `status = 'Closed'`, ghi nhật ký `decision_history`, kích hoạt thông báo hủy và bồi hoàn khách hàng.
     - **Tiếp tục xem xét**: Chuyển `Reviewing`, tiếp tục gom khách đến mốc kế tiếp.
     - **Xác nhận vận hành**: Khi đủ khách khởi hành, chuyển `Confirmed`.
  4. Quản lý Tour tiến hành phân công nguồn lực (`saveTourOperationalSchedule`):
     - Phân công Hướng dẫn viên chính phụ trách đoàn (`guide_id`).
     - Lựa chọn Phương tiện xe từ đội xe sẵn sàng (`vehicle_number`).
     - Phân công Tài xế phụ trách phương tiện (`driver_id`).
  5. Hệ thống lưu phân công vào `guide_assignments` và `tour_vehicle_assignments` (`ASSIGNED`), đồng thời gửi thông báo phân công tức thời (`GUIDE_ASSIGNED`, `DRIVER_ASSIGNED`) đến ứng dụng của HDV và Tài xế để sẵn sàng phục vụ.

#### 4.6. Quy trình QTT-06: Thực thi Tour, Điểm danh Hành khách và Xử lý Sự cố
- **Mã nguồn**: `microservices/hr-service/controllers/guideController.js` (`qrCheckinPassenger`, `checkinPassenger`, `createDepartureUpdate`, `reportIncident`, `updateIncidentStatus`, `submitTripReport`, `approveTripReport`), `driverController.js` (`createTripExpense`, `reportVehicleIncident`).
- **Luồng logic**:
  1. Ngày đi tour: Khách hàng xuất trình vé điện tử có mã QR check-in tại điểm hẹn.
  2. Hướng dẫn viên dùng ứng dụng quét mã QR check-in hoặc kiểm tra danh sách đoàn, hệ thống xác nhận và cập nhật `booking_passengers.is_checked_in = 1`.
  3. Đoàn khởi hành, chuyển trạng thái chuyến đi sang Đang diễn ra (`Ongoing`).
  4. Trong suốt hành trình:
     - HDV đăng tải các cập nhật tiến độ thực địa (`createDepartureUpdate`) kèm hình ảnh để điều hành và khách theo dõi.
     - Tài xế kê khai chi phí phát sinh thực tế (xăng dầu, cầu đường, bến đỗ) kèm hóa đơn chứng từ (`createTripExpense`).
  5. Khi phát sinh sự cố bất thường (hỏng xe, sự cố sức khỏe của khách, thời tiết xấu...):
     - HDV hoặc Tài xế lập Báo cáo sự cố khẩn cấp (`reportIncident` / `reportVehicleIncident`), chọn mức độ nghiêm trọng (Low, Medium, High, Critical) và gửi hình ảnh hiện trường.
     - Quản lý Tour nhận cảnh báo tức thời trên Dashboard, chỉ đạo giải pháp cứu hộ (xe thay thế, bệnh viện, điều chỉnh lộ trình), cập nhật tiến độ từ `Investigating` sang `Resolved`.
  6. Kết thúc chuyến đi: HDV đưa đoàn về điểm trả an toàn, lập **Báo cáo tổng kết chuyến đi** (`submitTripReport`) đánh giá chất lượng dịch vụ khách sạn, nhà hàng, xe và mức độ hài lòng của khách.
  7. Quản lý Tour thẩm duyệt báo cáo (`approveTripReport`) và đóng đợt khởi hành sang Hoàn thành (`Completed`).

#### 4.7. Quy trình QTT-07: Chấm công GPS, Nghỉ phép và Tính lương Nhân sự
- **Mã nguồn**: `microservices/hr-service/controllers/hrController.js` (`gpsCheckIn`, `createLeaveRequest`, `reviewLeaveRequest`, `getPayroll`, `savePayroll`).
- **Luồng logic**:
  1. Chấm công GPS: Nhân viên mở ứng dụng điểm danh GPS, hệ thống kiểm tra tọa độ thực tế so với vị trí văn phòng/điểm xuất phát tour và ghi nhận giờ Check-in / Check-out vào bảng công `timekeeping` (`Present`).
  2. Xin nghỉ phép / Giải trình: Nhân viên tạo đơn (`createLeaveRequest`), chọn loại nghỉ, ngày bắt đầu/kết thúc, lý do và minh chứng kèm theo. HR Manager thẩm định:
     - Nếu từ chối: Nhập lý do từ chối (`Rejected`).
     - Nếu duyệt: Phê duyệt đơn (`Approved`), hệ thống tự động đồng bộ ngày nghỉ hợp lệ vào bảng công `timekeeping` (`Leave`).
  3. Kỳ chốt lương hàng tháng:
     - HR Manager mở bảng tính lương (`getPayroll`), hệ thống tự động tổng hợp dữ liệu từ: Bảng công GPS, số tour HDV đã dẫn, số chuyến tài xế đã chạy, đánh giá hiệu suất (KPI), lương cơ bản và các khoản phụ cấp.
     - HR Manager rà soát, điều chỉnh thưởng phạt và bấm Lưu/Chốt bảng lương (`savePayroll`), cập nhật trạng thái `Paid` và gửi phiếu lương điện tử cho nhân viên.

#### 4.8. Quy trình QTT-08: Đặt dịch vụ đơn lẻ và Phối hợp Đối tác
- **Mã nguồn**: `microservices/booking-service/controllers/bookingController.js` (`bookStandaloneService`, `confirmServiceBooking`, `forwardToPartner`, `getPartnerRequests`, `updatePartnerRequestStatus`).
- **Luồng logic**:
  1. Khách hàng lựa chọn dịch vụ lẻ (khách sạn, xe đưa đón, vé vui chơi), nhập số lượng và ngày sử dụng (`bookStandaloneService`).
  2. Hệ thống kiểm tra:
     - Nếu dịch vụ đã gắn sẵn đối tác (`partner_id`): Tự động chuyển yêu cầu sang Đối tác (`SentToPartner`, ghi nhận vào `service_requests`).
     - Nếu dịch vụ chưa gắn đối tác: Lưu ở trạng thái `Pending`, chuyển đến hàng đợi của Nhân viên văn phòng để nhân viên chọn đối tác và chuyển tiếp (`forwardToPartner`).
  3. Đối tác xem yêu cầu trong cổng thông tin, kiểm tra công suất:
     - Nếu từ chối: Bấm Từ chối (`Rejected`), hệ thống thông báo để nhân viên đổi dịch vụ hoặc hoàn tiền cho khách.
     - Nếu chấp thuận: Bấm Chấp thuận cung ứng dịch vụ.
  4. Nhân viên văn phòng bấm Xác nhận dịch vụ (`confirmServiceBooking`), hệ thống sinh mã voucher điện tử duy nhất (`VOUCHER-XXXXXX`), cập nhật trạng thái `Confirmed`.
  5. Khách hàng nhận voucher điện tử và xuất trình mã khi sử dụng dịch vụ tại cơ sở đối tác.

---

### 5. Hướng dẫn sử dụng file sơ đồ

1. **Xem trực tiếp trên trình duyệt / Báo cáo**:
   - Các file hình ảnh vector **SVG** (`.svg`) có thể mở trực tiếp bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox) với độ phân giải sắc nét, có thể phóng to thu nhỏ không vỡ nét.
   - Các file hình ảnh raster **PNG** (`.png`) có thể chèn trực tiếp vào tài liệu Word, PowerPoint hoặc PDF của Khóa luận tốt nghiệp.
2. **Mở và chỉnh sửa file BPMN chuẩn**:
   - Sử dụng công cụ trực tuyến miễn phí [demo.bpmn.io](https://demo.bpmn.io) hoặc phần mềm chuyên nghiệp **Camunda Modeler** để mở các file `.bpmn`.
   - Toàn bộ sơ đồ đều được xây dựng đúng chuẩn **BPMN 2.0 XML** và có đầy đủ tầng biểu diễn đồ họa **BPMNDI (Diagram Interchange)**, hiển thị đầy đủ Pool, Lane, Task, Gateway và Sequence Flow.
