# BẢNG KIỂM KÊ VÀ ÁNH XẠ KỸ THUẬT USE CASE (USE CASE INVENTORY)
## PHÂN HỆ: CỔNG ĐỐI TÁC CUNG ỨNG (PARTNER PORTAL) – TRAVELVN ERP

---

### 1. Tổng quan phạm vi nghiệp vụ
Tài liệu này xác lập danh mục và bảng ánh xạ kỹ thuật truy vết cho **3 Use Case nghiệp vụ** thuộc phạm vi tác nhân **Đối tác cung ứng dịch vụ (Partner - Role ID: 7)** trong Hệ thống Quản trị và Điều hành Du lịch **TravelVN ERP**.

Danh mục 3 Use Case cơ sở bao gồm:
1. `UC-PT-01`: Quản lý kho dịch vụ đối tác
2. `UC-PT-02`: Tiếp nhận và xử lý yêu cầu dịch vụ
3. `UC-PT-03`: Xem tổng hợp cung cấp dịch vụ

---

### 2. Bảng kiểm kê trạng thái triển khai Use Case

| STT | Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Trạng thái triển khai | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | `UC-PT-01` | Quản lý kho dịch vụ đối tác | Quản lý danh mục dịch vụ | **Đã xác minh qua mã nguồn** | Cao |
| 2 | `UC-PT-02` | Tiếp nhận và xử lý yêu cầu dịch vụ | Điều phối & Cung ứng dịch vụ | **Đã xác minh qua mã nguồn** | Cao |
| 3 | `UC-PT-03` | Xem tổng hợp cung cấp dịch vụ | Báo cáo & Thống kê đối soát | **Đã xác minh qua mã nguồn** | Trung bình |

---

### 3. Ma trận ánh xạ kỹ thuật (Technical Traceability Matrix)

| Mã UC | Tên Use Case | Component Giao diện (Frontend) | Tuyến đường (Route / Tab) | Phương thức & API Endpoint Backend | File xử lý Backend (Controller) | Bảng dữ liệu tác động (MySQL) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UC-PT-01` | Quản lý kho dịch vụ đối tác | `PartnerInventory.jsx` | Tab `partner_inventory` | `GET /api/destinations`<br>`GET /api/partner-services/my-inventory`<br>`POST /api/partner-services`<br>`PUT /api/partner-services/:id`<br>`DELETE /api/partner-services/:id` | `microservices/hr-service/controllers/partnerServiceController.js` | `partner_services`, `partners`, `destinations` |
| `UC-PT-02` | Tiếp nhận và xử lý yêu cầu dịch vụ | `PartnerServiceRequests.jsx` | Tab `partner_requests` | `GET /api/service-requests/partner/my-requests`<br>`POST /api/service-requests/partner/:id/accept`<br>`POST /api/service-requests/partner/:id/reject` | `microservices/tour-service/controllers/serviceRequestController.js` | `service_requests`, `service_request_groups`, `departures`, `tours`, `partners`, `notifications` |
| `UC-PT-03` | Xem tổng hợp cung cấp dịch vụ | `PartnerServiceSummary.jsx` | Tab `partner_summary` | `GET /api/service-requests/partner/my-summary` | `microservices/tour-service/controllers/serviceRequestController.js` | `service_requests`, `service_request_groups`, `departures`, `tours`, `partners` |

---

### 4. Tóm tắt kết quả kiểm chứng mã nguồn thực tế

1. **`UC-PT-01` (Quản lý kho dịch vụ đối tác):**
   - **Xác minh chức năng:** Đối tác xem được toàn bộ danh mục dịch vụ thuộc sở hữu của mình qua API `GET /api/partner-services/my-inventory`.
   - **Thêm mới dịch vụ:** Hỗ trợ tải tệp hình ảnh đại diện (`multipart/form-data`), gán điểm đến địa phương (`destination_id`), thiết lập đơn vị tính, sức chứa, đơn giá và số lượng khả dụng. Dịch vụ mới được tạo với `status = 'Pending'` để chờ Quản lý duyệt.
   - **Cập nhật & Xóa:** Hỗ trợ cập nhật nhanh `price` và `available_quantity` khi dịch vụ đã ở trạng thái `Active`. Hỗ trợ xóa gỡ dịch vụ khỏi kệ qua `DELETE /api/partner-services/:id`.
   - **Giới hạn thực tế:** Khi sửa dịch vụ đang hoạt động, hệ thống chỉ cho phép cập nhật đơn giá và số lượng khả dụng; các thông tin cấu trúc như tên dịch vụ, loại dịch vụ hay điểm đến cố định để bảo đảm tính nhất quán với các tour đã liên kết.

2. **`UC-PT-02` (Tiếp nhận và xử lý yêu cầu dịch vụ):**
   - **Xác minh chức năng:** Đối tác nhận các yêu cầu dịch vụ do Quản lý tour gửi từ `UC-TM-01`. Danh sách truy vấn qua `getMyPartnerRequests` có kiểm tra lọc nghiêm ngặt theo nhóm đối tác (`partner_group` từ bảng `users`).
   - **Chấp nhận yêu cầu:** Endpoint `POST /api/service-requests/partner/:id/accept` kiểm tra quyền sở hữu của đối tác, cập nhật `service_requests.status = 'Accepted'`, đồng thời tự động tạo bản ghi thông báo loại `PARTNER_ACCEPTED` vào bảng `notifications` cho nhân sự công ty lữ hành.
   - **Từ chối yêu cầu:** Endpoint `POST /api/service-requests/partner/:id/reject` bắt buộc truyền tham số `reason`, cập nhật `service_requests.status = 'Rejected'`, lưu lý do vào `rejection_reason` và tạo thông báo loại `PARTNER_REJECTED` vào bảng `notifications`.
   - **Giới hạn thực tế:** Giao tiếp giữa đối tác và công ty lữ hành được thực hiện khép kín qua hệ thống thông báo nội bộ và bảng điều khiển; hệ thống không gửi tin nhắn SMS hay email ra bên ngoài.

3. **`UC-PT-03` (Xem tổng hợp cung cấp dịch vụ):**
   - **Xác minh chức năng:** Endpoint `GET /api/service-requests/partner/my-summary` gom nhóm các yêu cầu dịch vụ theo từng đợt khởi hành (`departure_id`) và đối tác (`partner_id`).
   - **Tự động thích ứng theo ngành hàng:**
     - Đối với Khách sạn (`HOTEL`): Tự động phân rã chi tiết số lượng phòng theo từng loại phòng cụ thể (Standard, Deluxe, VIP) nhờ liên kết với bảng `services`.
     - Đối với Nhà hàng (`RESTAURANT`): Tính tổng số suất ăn đã chấp thuận (`Accepted`) và đang chờ (`Pending`).
     - Đối với Vận chuyển ngoài (`TRANSPORTATION`): Thống kê số lượt xe phục vụ.
   - **Bóc tách đợt bổ sung:** Hỗ trợ xem chi tiết phân tách giữa yêu cầu đặt ban đầu (`INITIAL`) và yêu cầu đặt bổ sung cận ngày (`SUPPLEMENT`).

---

### 5. Mối quan hệ tương hỗ giữa Cổng Đối tác và các phân hệ khác

```
+-------------------------------------------------------------+
|                     QUẢN LÝ TOUR (UC-TM-01)                 |
|       Tạo và gửi yêu cầu cung cấp dịch vụ (Initial/Supp)     |
+-------------------------------------------------------------+
                               |
                               v (service_requests)
+-------------------------------------------------------------+
|                 CỔNG ĐỐI TÁC (UC-PT-02 / UC-PT-03)          |
|  - Tiếp nhận yêu cầu, xem chi tiết đoàn tour                |
|  - Xác nhận Chấp thuận (Accepted) hoặc Từ chối (Rejected)   |
|  - Xem báo cáo tổng hợp buồng phòng / suất ăn đối soát      |
+-------------------------------------------------------------+
                               |
                               v (notifications)
+-------------------------------------------------------------+
|                CÔNG TY LỮ HÀNH (ĐIỀU HÀNH TOUR)             |
|  - Nhận thông báo xác nhận từ đối tác                       |
|  - Quản lý tour chủ động điều phối đối tác thay thế nếu hủy |
+-------------------------------------------------------------+
```

1. **Khép kín quy trình cung ứng với `UC-TM-01` (Gửi yêu cầu cung cấp dịch vụ):**
   - Quản lý tour tạo nhóm yêu cầu dịch vụ cho đợt khởi hành; hệ thống tự động bóc tách thành các bản ghi `service_requests` gửi tới Cổng đối tác.
   - Đối tác tại `UC-PT-02` tiếp nhận và phản hồi. Kết quả phản hồi của đối tác được đồng bộ tức thời hiển thị trên màn hình điều hành của Quản lý tour.
2. **Cung cấp nguồn dịch vụ cho `UC-OS-02` (Thiết kế tour riêng):**
   - Các dịch vụ được Đối tác đăng ký tại `UC-PT-01` sau khi được phê duyệt sẽ hiển thị trên kho tài nguyên dịch vụ đối tác, giúp Nhân viên văn phòng dễ dàng lựa chọn khách sạn, nhà hàng và vé tham quan khi xây dựng lịch trình tour.

---
*Tài liệu được kết xuất từ mã nguồn TravelVN ERP phục vụ Báo cáo Khóa luận Tốt nghiệp ngành Hệ thống Thông tin.*
