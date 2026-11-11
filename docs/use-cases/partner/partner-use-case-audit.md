# BÁO CÁO RÀ SOÁT VÀ KIỂM CHỨNG MÃ NGUỒN (AUDIT REPORT)
## PHÂN HỆ: CỔNG ĐỐI TÁC CUNG ỨNG (PARTNER PORTAL) – TRAVELVN ERP

---

### 1. Mục đích và Tiêu chí kiểm chứng
Tài liệu này ghi nhận kết quả rà soát, đối chiếu và kiểm chứng trực tiếp giữa mã nguồn thực tế của hệ thống TravelVN ERP và tài liệu đặc tả nghiệp vụ cho **3 Use Case cơ sở** thuộc vai trò **Đối tác cung ứng dịch vụ (Partner - Role ID: 7)**.

**Tiêu chí phân loại trạng thái kiểm chứng:**
- **Đã xác minh qua mã nguồn:** Chức năng có giao diện thực tế (component JSX), có API endpoint backend xử lý logic hợp lệ, có bảng dữ liệu MySQL tương ứng và hoạt động thông suốt.
- **Tích hợp giao diện:** Có giao diện tương tác nhưng luồng xử lý dữ liệu backend đang ở dạng giả lập hoặc chưa hoàn chỉnh.
- **Chưa triển khai:** Chỉ có trên tài liệu phân tích, chưa xuất hiện trong mã nguồn.

---

### 2. Kết quả rà soát chi tiết theo từng Use Case

---

#### 2.1. UC-PT-01 — Quản lý kho dịch vụ đối tác
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/PartnerInventory.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/PartnerInventory.jsx): Quản lý kho dịch vụ của đối tác. Hiển thị danh sách dịch vụ, modal thêm mới với tải ảnh (`image`), modal chỉnh sửa giá/số lượng và nút xóa dịch vụ.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/hr-service/routes/partnerServiceRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/routes/partnerServiceRoutes.js).
    - Controller: [`microservices/hr-service/controllers/partnerServiceController.js`](file:///d:/KLTN/travel-management-system/microservices/hr-service/controllers/partnerServiceController.js):
      + Hàm `getMyInventory` (dòng 4): Truy vấn danh sách dịch vụ thuộc sở hữu của đối tác từ bảng `partner_services` kèm ảnh đại diện `image_url` và tên điểm đến từ bảng `destinations`.
      + Hàm `addServiceToInventory` (dòng 31): Xử lý tệp hình ảnh upload bằng Multer, lưu bản ghi mới vào `partner_services` với trạng thái ban đầu là `Pending`.
      + Hàm `updatePartnerService` (dòng 106): Cập nhật đơn giá `price` và số lượng khả dụng `available_quantity`.
      + Hàm `deletePartnerService` (dòng 85): Xóa bản ghi dịch vụ khỏi bảng `partner_services`.
  - *Cơ sở dữ liệu:* Bảng `partner_services`, `partners`, `destinations`.
- **Hành vi được xác minh:** Thêm dịch vụ mới kèm tải ảnh, cập nhật giá/số lượng, gỡ bỏ dịch vụ và hiển thị trạng thái `Pending` / `Active`.
- **Giới hạn thực tế:** Khi chỉnh sửa dịch vụ đang hoạt động, hệ thống chỉ hỗ trợ sửa giá và số lượng khả dụng nhằm tránh sai lệch thông tin danh mục dịch vụ đã liên kết với các tour trước đó.

---

#### 2.2. UC-PT-02 — Tiếp nhận và xử lý yêu cầu dịch vụ
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/PartnerServiceRequests.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/PartnerServiceRequests.jsx): Tab `partner_requests`. Hiển thị 4 thẻ thống kê (Chờ xử lý, Đã chấp nhận, Đã từ chối, Tổng số), bảng yêu cầu dịch vụ, modal xem chi tiết yêu cầu, nút Chấp nhận và modal nhập lý do từ chối.
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/serviceRequestRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/serviceRequestRoutes.js).
    - Controller: [`microservices/tour-service/controllers/serviceRequestController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/serviceRequestController.js):
      + Hàm `getMyPartnerRequests` (dòng 217): Lấy `partner_group` từ bảng `users`, truy vấn các bản ghi `service_requests` tương ứng kèm thông tin đợt khởi hành `departure_date`, tên tour `tour_name` và tên đối tác `partner_name`.
      + Hàm `acceptRequest` (dòng 257): Kiểm tra quyền hạn đối tác, cập nhật `service_requests.status = 'Accepted'`, và tạo bản ghi thông báo loại `PARTNER_ACCEPTED` vào bảng `notifications`.
      + Hàm `rejectRequest` (dòng 317): Kiểm tra `reason`, cập nhật `service_requests.status = 'Rejected'`, lưu lý do vào `rejection_reason` và tạo thông báo loại `PARTNER_REJECTED` vào bảng `notifications`.
  - *Cơ sở dữ liệu:* Bảng `service_requests`, `service_request_groups`, `departures`, `tours`, `partners`, `notifications`.
- **Hành vi được xác minh:** Xem danh sách yêu cầu theo ngành hàng, duyệt chấp nhận cung cấp dịch vụ, từ chối cung cấp kèm lý do giải trình bắt buộc, tự động phát sinh thông báo cho nhân sự công ty lữ hành.
- **Giới hạn thực tế:** Hệ thống gửi thông báo nội bộ qua bảng `notifications` hiển thị trên chuông thông báo; chưa tích hợp gửi tin nhắn SMS hay email ra cổng dịch vụ bên ngoài.

---

#### 2.3. UC-PT-03 — Xem tổng hợp cung cấp dịch vụ
- **Trạng thái kiểm chứng:** **Đã xác minh qua mã nguồn**
- **Bằng chứng kỹ thuật:**
  - *Frontend:*
    - [`frontend/src/components/PartnerServiceSummary.jsx`](file:///d:/KLTN/travel-management-system/frontend/src/components/PartnerServiceSummary.jsx): Tab `partner_summary`. Hiển thị bảng tổng hợp dịch vụ đã nhận theo từng đợt khởi hành, hỗ trợ bóc tách chi tiết buồng phòng khách sạn theo từng hạng phòng, suất ăn nhà hàng hoặc lượt xe. Có modal xem lịch sử phân tách giữa yêu cầu đặt ban đầu (`INITIAL`) và yêu cầu bổ sung (`SUPPLEMENT`).
  - *Backend Route & Controller:*
    - Tuyến đường: [`microservices/tour-service/routes/serviceRequestRoutes.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/routes/serviceRequestRoutes.js).
    - Controller: [`microservices/tour-service/controllers/serviceRequestController.js`](file:///d:/KLTN/travel-management-system/microservices/tour-service/controllers/serviceRequestController.js):
      + Hàm `getPartnerSummary` (dòng 381): Lấy thông tin `partner_group` của user, truy vấn toàn bộ các yêu cầu thành phần trong `service_requests` gắn với đợt khởi hành và nhóm theo từng tour. Đối với khách sạn (`HOTEL`), hệ thống bóc tách `content.items` và liên kết với bảng `services` để lấy đúng tên loại phòng (Standard, Deluxe, Suite, v.v.).
  - *Cơ sở dữ liệu:* Bảng `service_requests`, `service_request_groups`, `departures`, `tours`, `partners`, `services`.
- **Hành vi được xác minh:** Tổng hợp số lượng dịch vụ theo từng chuyến tour thời gian thực; hiển thị chi tiết số lượng đã chấp nhận, số lượng chờ xử lý; xem chi tiết từng lần phát sinh yêu cầu gốc và yêu cầu bổ sung.
- **Giới hạn thực tế:** Màn hình này phục vụ công tác theo dõi công suất và chuẩn bị nguồn lực của đối tác; việc chốt số liệu công nợ và thanh toán chuyển khoản được thực hiện độc lập tại phân hệ kế toán.

---

### 3. Bảng tổng hợp trạng thái kiểm chứng toàn phân hệ Đối tác

| Mã Use Case | Tên Use Case | Kiểm chứng Frontend | Kiểm chứng API Backend | Kiểm chứng Cơ sở dữ liệu | Đánh giá tổng thể |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **`UC-PT-01`** | Quản lý kho dịch vụ đối tác | Đã xác minh | Đã xác minh | Đã xác minh | **Đã xác minh qua mã nguồn** |
| **`UC-PT-02`** | Tiếp nhận và xử lý yêu cầu dịch vụ | Đã xác minh | Đã xác minh | Đã xác minh | **Đã xác minh qua mã nguồn** |
| **`UC-PT-03`** | Xem tổng hợp cung cấp dịch vụ | Đã xác minh | Đã xác minh | Đã xác minh | **Đã xác minh qua mã nguồn** |

---
*Tài liệu được kết xuất từ mã nguồn TravelVN ERP phục vụ Báo cáo Khóa luận Tốt nghiệp ngành Hệ thống Thông tin.*
