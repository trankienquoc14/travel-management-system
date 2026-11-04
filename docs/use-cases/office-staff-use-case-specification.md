# TÀI LIỆU ĐẶC TẢ USE CASE NGHIỆP VỤ (USE CASE SPECIFICATION)
## PHÂN HỆ: NHÂN VIÊN VĂN PHÒNG (OFFICE STAFF) – TRAVELVN ERP

---

### PHẦN I. TỔNG QUAN PHẠM VI NGHIỆP VỤ

#### 1. Mục tiêu tài liệu
Tài liệu đặc tả này xác lập chi tiết các yêu cầu chức năng, điều kiện tiên quyết, luồng sự kiện và các quy tắc nghiệp vụ cho bộ Use Case chính thuộc phạm vi tác nghiệp của vai trò **Nhân viên văn phòng (Office Staff - Role ID: 4)** trong Hệ thống Quản trị và Điều hành Du lịch **TravelVN ERP** (bao gồm 9 Use Case từ `UC-OS-01` đến `UC-OS-08`, trong đó nhóm nghiệp vụ đội xe `UC-OS-06` được tách rõ thành `UC-OS-06A` và `UC-OS-06B`). Bản đặc tả được trình bày theo cấu trúc bảng biểu chuẩn của Khóa luận Tốt nghiệp ngành Hệ thống Thông tin (theo mẫu báo cáo khóa luận tham chiếu), tích hợp toàn bộ Thông tin chung, Luồng sự kiện chính, Luồng sự kiện thay thế, Luồng ngoại lệ và Quy tắc nghiệp vụ vào từng bảng Use Case duy nhất.

#### 2. Danh mục Use Case nghiệp vụ chính

| STT | Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Tác nhân chính | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | **`UC-OS-01`** | **Tư vấn khách hàng** | Chăm sóc khách hàng | Nhân viên văn phòng | Cao |
| 2 | **`UC-OS-02`** | **Thiết kế tour riêng** | Quản lý thiết kế tour | Nhân viên văn phòng | Cao |
| 3 | **`UC-OS-03`** | **Thiết kế tour cố định** | Quản lý sản phẩm tour | Nhân viên văn phòng | Trung bình |
| 4 | **`UC-OS-04`** | **Xử lý hủy, đổi lịch** | Quản trị đơn đặt tour | Nhân viên văn phòng | Cao |
| 5 | **`UC-OS-05`** | **Xác nhận thanh toán** | Quản lý thanh toán | Nhân viên văn phòng | Cao |
| 6 | **`UC-OS-06A`** | **Theo dõi và cập nhật trạng thái xe** | Quản lý đội xe nội bộ | Nhân viên văn phòng | Trung bình |
| 7 | **`UC-OS-06B`** | **Tiếp nhận và xử lý sự cố xe** | Quản lý đội xe nội bộ | Nhân viên văn phòng | Cao |
| 8 | **`UC-OS-07`** | **Gửi báo giá thiết kế tour riêng** | Quản lý báo giá | Nhân viên văn phòng | Cao |
| 9 | **`UC-OS-08`** | **Chỉnh sửa thiết kế tour** | Quản lý thiết kế tour | Nhân viên văn phòng | Cao |

> **Quy ước về các chức năng nền tảng dùng chung:**
> Các chức năng như *Đăng nhập*, *Đổi mật khẩu*, *Chấm công GPS* hay *Tiếp nhận thông báo* là các chức năng dùng chung cho toàn bộ nhân sự nội bộ công ty (`isInternalStaff`), đóng vai trò là Tiền điều kiện tiên quyết và không tách thành các Use Case độc lập trong phân hệ này.

---

### PHẦN II. ĐẶC TẢ CHI TIẾT CÁC USE CASE CHÍNH

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-01: TƯ VẤN KHÁCH HÀNG

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Tư vấn khách hàng** | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng tương tác trực tuyến với khách hàng qua hệ thống trò chuyện thời gian thực (Live Chat) để tư vấn thông tin tour, giải đáp thắc mắc và tiếp nhận yêu cầu từ khách hàng. | |
| **– Actor chính:** Nhân viên văn phòng | |
| **– Actor phụ:** Khách hàng | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống. Dịch vụ máy chủ trò chuyện trực tuyến Socket.IO đang hoạt động. | |
| **– Hậu điều kiện (Post-condition):** Tin nhắn và tài liệu tư vấn được gửi thành công đến khách hàng. Toàn bộ lịch sử trò chuyện được lưu trữ vào cơ sở dữ liệu. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Tư vấn khách hàng” trên thanh điều hướng. | 2. Hệ thống kết nối máy chủ Socket.IO và hiển thị danh sách các cuộc hội thoại bao gồm: tên khách hàng, tin nhắn gần nhất, thời gian và số lượng tin nhắn chưa đọc. |
| 3. Nhân viên chọn một cuộc hội thoại của khách hàng cần tư vấn. | 4. Hệ thống hiển thị toàn bộ lịch sử tin nhắn của cuộc trò chuyện và đặt lại bộ đếm tin nhắn chưa đọc về 0. |
| 5. Nhân viên nhập nội dung tin nhắn và nhấn “Gửi”. | 6. Hệ thống kiểm tra dữ liệu vừa nhập. |
| | 7. Hệ thống lưu tin nhắn vào cơ sở dữ liệu, phát tin nhắn thời gian thực đến khách hàng và cập nhật tin nhắn gần nhất của cuộc hội thoại. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| | 6.1. Bỏ trống nội dung tin nhắn.<br>Hiển thị thông báo “Vui lòng nhập nội dung tin nhắn!”. |
| 5.1. Nhân viên nhấn nút đính kèm tệp, chọn file hình ảnh hoặc tài liệu từ thiết bị và nhấn “Gửi”. | 5.1. Hệ thống kiểm tra tệp, lưu vào thư mục lưu trữ máy chủ và gửi tin nhắn đính kèm tệp đến khách hàng theo thời gian thực. |
| | 5.2. Chọn file đính kèm có dung lượng vượt quá 25MB.<br>Hiển thị thông báo “Dung lượng tệp đính kèm vượt quá giới hạn 25MB!”. |
| 3.1. Nhân viên chọn khách hàng từ danh sách khách hàng để bắt đầu hội thoại mới. | 3.1. Hệ thống nạp hoặc khởi tạo cuộc hội thoại mới và chuyển sang bước 5. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 2.1. Mất kết nối tới máy chủ Socket.IO.<br>Hiển thị thông báo “Mất kết nối máy chủ chat. Đang kết nối lại...”. |

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-02: THIẾT KẾ TOUR RIÊNG

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Thiết kế tour riêng** | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng xây dựng lịch trình chi tiết theo yêu cầu may đo của khách hàng bằng công cụ Timeline Builder; bóc tách định phí (xe, hướng dẫn viên) và biến phí (khách sạn, vé tham quan, ăn uống); tính toán giá bán đề xuất và gửi bản thiết kế lên Quản lý Tour phê duyệt. | |
| **– Actor chính:** Nhân viên văn phòng | |
| **– Actor phụ:** Quản lý Tour | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống. Yêu cầu thiết kế tour riêng đang ở trạng thái “Designing” hoặc bị từ chối “Manager_Rejected”. | |
| **– Hậu điều kiện (Post-condition):** Bản thiết kế tour riêng được lưu trữ vào cơ sở dữ liệu với trạng thái “Pending_Approval”. Trạng thái yêu cầu chuyển sang “Pending_Manager_Approval”. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Yêu cầu tour riêng”, chọn yêu cầu cần thiết kế và nhấn “Vào phòng thiết kế”. | 2. Hệ thống hiển thị giao diện Timeline Builder, nạp danh mục điểm đến, kho dịch vụ đối tác và khởi tạo số ngày hành trình theo yêu cầu của khách. |
| 3. Nhân viên thiết lập lịch trình từng ngày: chọn điểm xuất phát, điểm đến, thêm hoạt động tham quan, ăn uống, lưu trú. | 4. Hệ thống ghi nhận các hoạt động và tự động liên kết đơn giá dịch vụ vào biến phí của từng ngày, đồng thời tự động tổng hợp chi phí vé tham quan / hoạt động (`autoTicketsCost`). |
| 5. Nhân viên cấu hình khối Định phí (chọn xe từ đội xe hoặc đối tác, hệ thống tự động tính chi phí xe trọn gói theo số ngày của tour x đơn giá ngày xe, công tác phí HDV/ngày, số khách hòa vốn). | 6. Hệ thống tự động tính tổng định phí toàn đoàn. |
| 7. Nhân viên cấu hình khối Biến phí (chọn khách sạn, định mức bữa ăn, bảo hiểm du lịch trên đầu khách). | 8. Hệ thống tự động tính tổng biến phí trên đầu khách. |
| 9. Nhân viên thiết lập tỷ lệ lợi nhuận mong muốn (Margin %) và chính sách giá trẻ em. | 10. Hệ thống tự động tính giá bán đề xuất cho từng khách theo nhóm tuổi (Người lớn, Trẻ em, Trẻ nhỏ, Em bé), tổng giá tour trọn gói toàn đoàn (`grandTotalRevenue`), tổng hợp Doanh thu dự kiến, Chi phí dự kiến và Lợi nhuận gộp. |
| 11. Nhân viên nhấn “Chốt Thiết Kế & Gửi Quản Lý”. | 12. Hệ thống kiểm tra dữ liệu vừa nhập. |
| | 13. Hệ thống lưu bản thiết kế vào cơ sở dữ liệu với trạng thái Pending_Approval, cập nhật trạng thái yêu cầu sang Pending_Manager_Approval và hiển thị thông báo “Đã chốt bản thiết kế & Gửi Quản lý phê duyệt thành công!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| | 12.1. Có ngày trong lịch trình chưa có hoạt động nào.<br>Hiển thị thông báo “Vui lòng thiết lập ít nhất một hoạt động cho mỗi ngày trong lịch trình!”. |
| | 12.2. Số khách hòa vốn nhỏ hơn 1.<br>Hiển thị thông báo “Số khách tối thiểu (Điểm hòa vốn) phải từ 1 khách trở lên!”. |
| 1.1. Bản thiết kế bị Quản lý Tour từ chối (Manager_Rejected), nhân viên mở lại yêu cầu từ danh sách. | 1.1. Hệ thống nạp lại toàn bộ lịch trình cũ và hiển thị nội dung góp ý của Quản lý Tour. |
| 11.1. Nhân viên chỉnh sửa theo góp ý và nhấn “Chốt Thiết Kế & Gửi Quản Lý”. | 11.1. Hệ thống cập nhật bản thiết kế và tiếp tục thực hiện từ bước 12. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 13.1. Lỗi kết nối máy chủ khi gửi phê duyệt.<br>Hiển thị thông báo “Lỗi khi gửi phê duyệt!”. |
| **– Quy tắc hiển thị danh mục:** | |
| • **Tổng giá tour toàn đoàn trên danh sách:** Tại màn hình danh sách "Thiết kế tour đã báo giá", cột giá hiển thị giá trị **Tổng giá tour toàn đoàn** (`grandTotalRevenue`) tương ứng với toàn bộ số lượng khách thay vì chỉ hiển thị đơn giá một khách lẻ; modal chi tiết bản thiết kế hiển thị đầy đủ cả đơn giá theo khách và bảng phân tích nhóm khách chi tiết. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-03: THIẾT KẾ TOUR CỐ ĐỊNH

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Thiết kế tour cố định** | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng xây dựng sản phẩm tour trọn gói cố định mới của công ty; thiết lập lịch trình tiêu chuẩn từng ngày, chọn lựa phương tiện và dịch vụ lưu trú, tính toán chi phí gốc và cấu hình giá bán niêm yết ở trạng thái chờ duyệt mở bán. | |
| **– Actor chính:** Nhân viên văn phòng | |
| **– Actor phụ:** Không | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống với quyền hạn hợp lệ. | |
| **– Hậu điều kiện (Post-condition):** Bản ghi tour mới được lưu vào bảng tours với trạng thái mặc định “Pending”. Lịch trình và cấu trúc định giá được lưu trữ thành công vào cơ sở dữ liệu. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Tạo tour cố định mới” trên thanh điều hướng. | 2. Hệ thống hiển thị biểu mẫu thiết kế tour cố định, nạp danh mục điểm đến và dịch vụ. |
| 3. Nhân viên nhập các thông tin tổng quan: Tên tour, Điểm đến chính, Thời gian (số ngày, số đêm), Mô tả giới thiệu và tải ảnh đại diện tour. | 4. Hệ thống kiểm tra và ghi nhận các thông tin cơ bản của tour. |
| 5. Nhân viên thiết lập lịch trình từng ngày: Điểm xuất phát, điểm kết thúc, thêm hoạt động tham quan và dịch vụ tương ứng. | 6. Hệ thống tự động liên kết chi phí vé tham quan vào biến phí của từng ngày. |
| 7. Nhân viên cấu hình định phí phương tiện và Hướng dẫn viên: chọn loại xe từ danh mục Quản lý đội xe thực tế của hệ thống (`/api/tours/fleet/vehicles`, hiển thị tên xe, biển số, số chỗ ngồi và giá xe/ngày tự động tính theo số ngày tour; hoặc chọn vé máy bay từ dịch vụ đối tác), công tác phí HDV/ngày và số khách hòa vốn. | 8. Hệ thống tự động tính tổng định phí của tour. |
| 9. Nhân viên cấu hình biến phí lưu trú, ăn uống và bảo hiểm: chọn khách sạn, định mức bữa ăn, đơn giá bảo hiểm trên đầu khách. | 10. Hệ thống tự động tính tổng biến phí trên đầu khách. |
| 11. Nhân viên thiết lập tỷ lệ lợi nhuận mong muốn (Margin %) và chính sách giá trẻ em theo độ tuổi. | 12. Hệ thống tính toán và hiển thị giá bán niêm yết đề xuất cho Người lớn và Trẻ em. |
| 13. Nhân viên nhấn “Lưu Tour”. | 14. Hệ thống kiểm tra dữ liệu vừa nhập. |
| | 15. Hệ thống lưu thông tin tour mới với trạng thái mặc định là Pending, lưu dữ liệu lịch trình và chi phí vào cơ sở dữ liệu và hiển thị thông báo “Tạo Tour thành công!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| | 14.1. Bỏ trống Tên tour.<br>Hiển thị thông báo “Vui lòng nhập tên Tour!”. |
| | 14.2. Số khách hòa vốn nhỏ hơn 1.<br>Hiển thị thông báo “Số khách tối thiểu (Điểm hòa vốn) phải từ 1 khách trở lên!”. |
| 1.1. Nhân viên chọn chỉnh sửa tour đang ở trạng thái Pending từ danh mục tour đã thiết kế. | 1.1. Hệ thống nạp lại toàn bộ dữ liệu thiết kế tour vào biểu mẫu chỉnh sửa. |
| 13.1. Nhân viên điều chỉnh thông tin hoặc định mức giá và nhấn “Cập nhật Tour”. | 13.1. Hệ thống kiểm tra dữ liệu và hiển thị thông báo “Cập nhật thành công!”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 15.1. Lỗi kết nối cơ sở dữ liệu khi lưu tour.<br>Hiển thị thông báo “Lỗi khi lưu!”. |

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-04: XỬ LÝ HỦY, ĐỔI LỊCH

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Xử lý hủy, đổi lịch** | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng tiếp nhận và thẩm định các yêu cầu Hủy tour (`Cancel`) hoặc Đổi ngày khởi hành (`Reschedule`) của khách hàng; áp dụng biểu phí phạt tài chính tự động theo số ngày còn lại trước khởi hành; thực hiện hoàn trả số chỗ trống, vô hiệu hóa hiệu lực điểm danh của vé và ghi nhận trạng thái hoàn tiền trên hệ thống để chuyển bộ phận kế toán chi trả. | |
| **– Actor chính:** Nhân viên văn phòng | |
| **– Actor phụ:** Khách hàng | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống. Đơn đặt tour của khách hàng đang ở trạng thái hợp lệ (`booking_status != 'Cancelled'` và `!= 'Completed'`). | |
| **– Hậu điều kiện (Post-condition):** Trạng thái đơn đặt tour được cập nhật thành Đã hủy (`Cancelled`) hoặc cập nhật đợt khởi hành mới (`departure_id = new_departure_id`). Số chỗ trống được hoàn trả; trạng thái thanh toán chuyển sang Đã hoàn tiền (`Refunded`). | |
| **– Luồng sự kiện chính (main flow - Phê duyệt yêu cầu Hủy tour):** | |
| 1. Chọn chức năng “Xử Lý Hủy / Đổi Lịch” trên thanh điều hướng. | 2. Hệ thống hiển thị danh sách các yêu cầu hủy/đổi lịch đang chờ xử lý (Pending). |
| 3. Nhân viên chọn một yêu cầu Hủy tour (type = 'Cancel'). | 4. Hệ thống hiển thị chi tiết yêu cầu: Mã đơn hàng, tên tour, ngày khởi hành, số ngày trước khởi hành, tỷ lệ phạt (%) và số tiền hoàn lại dự kiến theo biểu phí, lý do hủy, thông tin tài khoản ngân hàng của khách (Ngân hàng, STK, Tên chủ thẻ). |
| 5. Nhân viên kiểm tra tính hợp lệ của lý do hủy và đối soát thông tin tài khoản ngân hàng nhận tiền hoàn. | |
| 6. Nhân viên nhập ghi chú xử lý và nhấn “Phê duyệt”. | 7. Hệ thống kiểm tra dữ liệu vừa nhập và trạng thái yêu cầu. |
| | 8. Hệ thống cập nhật trạng thái yêu cầu sang Approved; cập nhật đơn đặt tour sang Cancelled; hoàn trả số chỗ trống (available_slots = available_slots + num_tickets); đặt lại cờ điểm danh (is_checked_in = 0); cập nhật trạng thái thanh toán sang Refunded. |
| | 9. Hệ thống gửi thông báo kết quả phê duyệt và số tiền hoàn lại cho khách hàng, đồng thời hiển thị thông báo “Đã duyệt yêu cầu thành công!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Yêu cầu của khách hàng là Đổi ngày khởi hành (type = 'Reschedule'). | 3.1. Hệ thống hiển thị thông tin đợt khởi hành mới và mức phí đổi lịch tương ứng. |
| 6.1. Nhân viên kiểm tra đợt khởi hành mới, nhập ghi chú và nhấn “Phê duyệt”. | 6.1. Hệ thống cập nhật yêu cầu sang Approved, cập nhật mã đợt khởi hành mới vào đơn hàng (departure_id = new_departure_id), gửi thông báo cho khách và hiển thị thông báo “Đã duyệt yêu cầu thành công!”. |
| 6.2. Yêu cầu không hợp lệ, nhân viên nhập lý do từ chối vào ô ghi chú và nhấn “Từ chối”. | 6.2. Hệ thống cập nhật trạng thái yêu cầu sang Rejected, giữ nguyên trạng thái đơn hàng, gửi thông báo từ chối cho khách hàng và hiển thị thông báo “Đã từ chối yêu cầu!”. |
| 1.1. Khách hàng yêu cầu hủy tour trực tiếp tại quầy, nhân viên mở chi tiết đơn hàng tại phân hệ Đặt tour và nhấn “Hủy đơn”. | 1.1. Hệ thống tự động tính số ngày còn lại trước khởi hành, hiển thị mức phạt và số tiền hoàn lại theo biểu phí. |
| 6.3. Nhân viên nhập lý do hủy tại quầy và xác nhận hủy. | 6.3. Hệ thống cập nhật đơn sang Cancelled, hoàn trả chỗ trống, chuyển thanh toán sang Refunded và hiển thị thông báo “Hủy đơn đặt tour thành công!”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 7.1. Yêu cầu không tồn tại hoặc đã được xử lý trước đó.<br>Hiển thị thông báo “Yêu cầu không tồn tại hoặc đã được xử lý trước đó!”. |
| | 7.2. Lỗi máy chủ khi xử lý yêu cầu.<br>Hiển thị thông báo “Có lỗi xảy ra khi xử lý!”. |

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-05: XÁC NHẬN THANH TOÁN

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Xác nhận thanh toán** | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng theo dõi danh sách các giao dịch thanh toán; đối soát các khoản chuyển khoản trực tuyến SePay VietQR (hệ thống tự động xử lý qua Webhook) và trực tiếp xác nhận đã thu đủ tiền mặt từ khách hàng tại quầy giao dịch; kích hoạt cập nhật trạng thái đơn hàng sang Đã thanh toán, phát hành vé điện tử có mã QR check-in và tự động chốt công phục vụ cho Hướng dẫn viên vào ngày khởi hành. | |
| **– Actor chính:** Nhân viên văn phòng | |
| **– Actor phụ:** Khách hàng | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống. Đơn hàng ở trạng thái Chờ thanh toán (`payment_status = 'Unpaid'`), khách hàng thanh toán bằng phương thức Tiền mặt (`Cash`) và đã nộp đủ tiền mặt tại quầy. | |
| **– Hậu điều kiện (Post-condition):** Giao dịch thanh toán chuyển sang `Success`; đơn hàng chuyển sang `Paid` và `Confirmed`; khách hàng nhận được email vé điện tử kèm mã QR check-in; công tác của Hướng dẫn viên được tự động ghi nhận vào ngày khởi hành. | |
| **– Luồng sự kiện chính (main flow - Xác nhận thu tiền mặt tại quầy):** | |
| 1. Chọn chức năng “Xác Nhận Thanh Toán” trên thanh điều hướng. | 2. Hệ thống hiển thị danh sách các giao dịch thanh toán trong hệ thống kèm bộ lọc trạng thái. |
| 3. Nhân viên lọc danh sách giao dịch ở trạng thái Chờ thanh toán (Pending), tìm theo mã đơn hoặc tên khách nộp tiền. | 4. Hệ thống hiển thị thông tin chi tiết: Mã thanh toán, Mã đơn đặt tour, Tên khách hàng, Số tiền cần thu, Phương thức thanh toán (Tiền mặt). |
| 5. Sau khi kiểm đếm đủ tiền mặt thực tế từ khách hàng, nhân viên nhấn nút “Xác nhận thu tiền”. | 6. Hệ thống hiển thị hộp thoại xác nhận yêu cầu kiểm tra lại số tiền đã thu và mã đơn đặt tour. |
| 7. Nhân viên nhấn nút “Đồng ý”. | 8. Hệ thống kiểm tra trạng thái đơn hàng và thực hiện giao dịch cơ sở dữ liệu. |
| | 9. Hệ thống cập nhật bản ghi thanh toán sang Success; cập nhật đơn hàng sang Paid và Confirmed; tự động đồng bộ công cho Hướng dẫn viên vào ngày khởi hành; gửi email vé điện tử QR cho khách hàng. |
| | 10. Hệ thống hiển thị thông báo “Xác nhận thu tiền mặt & chốt đơn thành công!” và cập nhật trạng thái đơn hàng trên giao diện. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Khách hàng thanh toán bằng quét mã SePay VietQR trực tuyến. | 3.1. Hệ thống tự động tiếp nhận dữ liệu đối soát qua Webhook, khớp mã đơn và số tiền, tự động cập nhật đơn sang Paid, gửi email vé QR và đồng bộ công HDV. Nhân viên theo dõi kết quả đối soát trên danh sách mà không cần thao tác xác nhận thủ công. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Đơn hàng đã được xác nhận thanh toán trước đó.<br>Hiển thị thông báo “Đơn hàng này đã được xác nhận thanh toán trước đó!”. |
| | 8.2. Đơn hàng đã bị hủy trước khi thu tiền.<br>Hiển thị thông báo “Đơn hàng này đã bị hủy, không thể xác nhận thanh toán!”. |

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-06A: THEO DÕI VÀ CẬP NHẬT TRẠNG THÁI XE

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Theo dõi và cập nhật trạng thái xe** | |
| **– Mã use case:** `UC-OS-06A` | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng theo dõi danh sách và tình trạng vận hành của đội xe nội bộ; thực hiện cập nhật trạng thái kỹ thuật hợp lệ của phương tiện giữa Sẵn sàng phục vụ (`AVAILABLE`), Bảo dưỡng định kỳ (`MAINTENANCE`) và Sửa chữa (`REPAIR`); xác nhận hoàn tất bảo dưỡng/sửa chữa để đưa xe về sẵn sàng; đồng thời tra cứu dòng thời gian lịch sử xe ở chế độ chỉ xem (Read-only). | |
| **– Actor chính:** Nhân viên văn phòng (`role_id = 4`) | |
| **– Actor phụ:** Không | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống với quyền hạn hợp lệ. Phương tiện cần theo dõi hoặc cập nhật trạng thái đã tồn tại trong danh mục phương tiện nội bộ (`vehicles`) do Quản lý Tour khởi tạo. | |
| **– Hậu điều kiện (Post-condition):** Trạng thái kỹ thuật của xe (`vehicles.status`) được cập nhật hợp lệ. Nhật ký thay đổi trạng thái kèm người thực hiện và lý do được ghi nhận vào bảng `vehicle_status_history`; phiếu bảo dưỡng/sửa chữa trong bảng `vehicle_maintenances` được tạo mới (`IN_PROGRESS`) hoặc cập nhật hoàn tất (`COMPLETED`). | |
| **– Luồng sự kiện chính (main flow - Chuyển trạng thái xe sang Bảo dưỡng / Sửa chữa):** | |
| 1. Chọn chức năng “Theo dõi & Trạng thái xe” (Tab `staff_fleet_vehicles`) trên thanh điều hướng. | 2. Hệ thống tải và hiển thị danh sách phương tiện nội bộ kèm thông tin vận hành (Biển số, Hãng/Model, Số ghế, Màu sắc, Lịch chạy hiện tại `current_tour`) và bộ đếm thống kê theo trạng thái (`AVAILABLE`, `IN_TOUR`, `MAINTENANCE`, `REPAIR`). |
| 3. Nhân viên chọn một phương tiện đang ở trạng thái Sẵn sàng (`AVAILABLE`) và nhấn nút cập nhật trạng thái (`Bảo dưỡng / Sửa chữa`). | 4. Hệ thống hiển thị biểu mẫu cập nhật trạng thái gồm: Trạng thái đích (`MAINTENANCE` hoặc `REPAIR`), Ngày bắt đầu (`start_date`), Ngày kết thúc dự kiến (`end_date`) và Lý do thực hiện (`reason`). |
| 5. Nhân viên chọn trạng thái đích, nhập khoảng thời gian dự kiến, nhập lý do chi tiết và nhấn “Xác nhận”. | 6. Hệ thống kiểm tra phân quyền, kiểm tra dữ liệu đầu vào (bắt buộc có lý do, ngày hợp lệ) và xác minh xe không đang ở trạng thái `IN_TOUR` cũng như không gắn với chuyến đi đang diễn ra (`current_tour`). |
| | 7. Hệ thống cập nhật `vehicles.status` sang trạng thái mới (`MAINTENANCE` hoặc `REPAIR`), ghi nhận bản ghi nhật ký vào `vehicle_status_history` (`old_status`, `new_status`, `reason`, `updated_by`) và tạo phiếu theo dõi mới trong `vehicle_maintenances` với `status = 'IN_PROGRESS'`. |
| | 8. Hệ thống hiển thị thông báo “Cập nhật trạng thái thành công!” và làm mới trạng thái phương tiện trên giao diện. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| | 6.1. Bỏ trống Lý do cập nhật trạng thái (`reason`).<br>Hệ thống chặn thao tác và hiển thị thông báo “Vui lòng nhập lý do bảo dưỡng / cập nhật trạng thái phương tiện!”. |
| 3.1. Phương tiện đang ở trạng thái `MAINTENANCE` hoặc `REPAIR` đã hoàn thành công việc tại xưởng, nhân viên nhấn nút “Hoàn tất bảo dưỡng / sửa chữa (Về Sẵn sàng)”, nhập ghi chú nghiệm thu và xác nhận. | 3.1. Hệ thống kiểm tra xe không còn sự cố nào khác đang ở trạng thái `Processing` (nếu hoàn tất từ trạng thái `REPAIR`), cập nhật `vehicles.status = 'AVAILABLE'`, cập nhật phiếu `vehicle_maintenances` đang `IN_PROGRESS` sang `COMPLETED` (kèm `end_date` thực tế), ghi nhật ký vào `vehicle_status_history` và thông báo “Cập nhật trạng thái thành công!”. |
| 3.2. Phương tiện đang ở trạng thái `MAINTENANCE` nhưng phát hiện hỏng hóc kỹ thuật cần chuyển sang `REPAIR`, nhân viên chọn cập nhật sang `REPAIR` và nhập lý do. | 3.2. Hệ thống cập nhật `vehicles.status = 'REPAIR'`, ghi nhật ký chuyển trạng thái `MAINTENANCE` $\rightarrow$ `REPAIR` vào `vehicle_status_history` và cập nhật giao diện. |
| 1.1. Nhân viên chọn chức năng “Lịch sử xe” (Tab `staff_vehicle_history`) trên thanh điều hướng hoặc nhấn liên kết “Xem lịch sử” từ thẻ xe. | 1.1. Hệ thống hiển thị trang tra cứu lịch sử ở chế độ **chỉ xem (Read-only)**, tổng hợp dòng thời gian 3 nhóm sự kiện (`INCIDENT` từ `driver_incidents`, `MAINTENANCE` từ `vehicle_maintenances`, `STATUS_CHANGE` từ `vehicle_status_history`), cho phép lọc theo xe, loại sự kiện và từ khóa mà không cho phép sửa/xóa lịch sử hay đổi trạng thái xe tại đây. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 6.2. Thao tác thay đổi trạng thái trên phương tiện đang chạy tour (`status = 'IN_TOUR'` hoặc có `current_tour` đang diễn ra) hoặc yêu cầu chuyển thủ công sang `IN_TOUR` / `INACTIVE`.<br>Hệ thống từ chối thao tác (mã lỗi `403 Forbidden`) và hiển thị thông báo “Không thể chuyển thủ công trạng thái Đang đi tour hoặc trạng thái ngoài phạm vi phân quyền!”. |
| | 6.3. Trạng thái đích trùng với trạng thái hiện tại của phương tiện (`new_status === old_status`).<br>Hệ thống chặn thao tác (`400 Bad Request`) để tránh ghi trùng lặp nhật ký lịch sử. |
| **– Quy tắc nghiệp vụ:** | |
| • **Giới hạn quyền hạn:** Nhân viên văn phòng (`role_id = 4`) chỉ được xem danh sách xe và cập nhật trạng thái kỹ thuật hợp lệ (`AVAILABLE` $\leftrightarrow$ `MAINTENANCE` / `REPAIR`); tuyệt đối không được Thêm xe mới, Sửa thông tin hồ sơ/giá xe, hoặc Xóa phương tiện (các quyền này thuộc Quản lý Tour `role_id = 3` và Admin `role_id = 1` tại `UC-TM-04`).<br>• **Bảo vệ trạng thái điều hành (`IN_TOUR`):** Trạng thái `IN_TOUR` gắn liền với lịch phân công chuyến đi (`tour_vehicle_assignments`), nhân viên không được gán hoặc gỡ `IN_TOUR` thủ công.<br>• **Chế độ chỉ xem tại Lịch sử xe:** Trang Lịch sử xe (`StaffVehicleHistory.jsx`) chỉ phục vụ tra cứu và lọc dữ liệu lịch sử; mọi thao tác hoàn tất bảo dưỡng/sửa chữa phải thực hiện tại trang Trạng thái xe (`UC-OS-06A`) hoặc trang Xử lý sự cố (`UC-OS-06B`). | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-06B: TIẾP NHẬN VÀ XỬ LÝ SỰ CỐ XE

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Tiếp nhận và xử lý sự cố xe** | |
| **– Mã use case:** `UC-OS-06B` | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng tiếp nhận các báo cáo sự cố phương tiện do Tài xế gửi lên (`driver_incidents`); ghi nhận nội dung xử lý từng bước vào lịch sử phương tiện mà không làm mất nội dung báo cáo ban đầu của tài xế; chuyển trạng thái xe sang Sửa chữa (`REPAIR`) khi xe đủ điều kiện (không đang chạy tour); và xác nhận hoàn tất sự cố (`Resolved`). | |
| **– Actor chính:** Nhân viên văn phòng (`role_id = 4`) | |
| **– Actor phụ:** Tài xế (`role_id = 8`), Quản lý Tour (`role_id = 3` - phối hợp điều phối thay thế xe khi sự cố xảy ra trong tour) | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống. Có báo cáo sự cố phương tiện do Tài xế gửi lên trong bảng `driver_incidents` ở trạng thái Mới báo cáo (`Reported`) hoặc Đang xử lý (`Processing`). | |
| **– Hậu điều kiện (Post-condition):** Trạng thái sự cố (`driver_incidents.status`) được cập nhật (`Processing` hoặc `Resolved`); nội dung báo cáo ban đầu của tài xế (`driver_incidents.description`) được giữ nguyên vẹn; nội dung ghi chú xử lý và người thực hiện được lưu vào `vehicle_status_history`; trạng thái xe (`vehicles.status`) và phiếu sửa chữa (`vehicle_maintenances`) được cập nhật đồng bộ theo quy tắc nghiệp vụ; Tài xế nhận được thông báo kết quả xử lý (`notifications`). | |
| **– Luồng sự kiện chính (main flow - Tiếp nhận sự cố và đưa xe vào xưởng sửa chữa khi xe không chạy tour):** | |
| 1. Chọn chức năng “Báo cáo sự cố xe” (Tab `staff_vehicle_incidents`) trên thanh điều hướng. | 2. Hệ thống truy vấn danh sách sự cố từ bảng `driver_incidents` kết nối với bảng `vehicles` (qua `vehicle_number = license_plate`), hiển thị thông tin: Ngày báo cáo, Biển số xe, Trạng thái xe hiện tại, Tiêu đề, Mô tả của tài xế, Vị trí, Hình ảnh hiện trường và Trạng thái sự cố (`Reported`, `Processing`, `Resolved`). |
| 3. Nhân viên chọn một sự cố chưa hoàn tất (`Reported` hoặc `Processing`) và nhấn nút “Xử lý”. | 4. Hệ thống hiển thị hộp thoại xử lý sự cố, hiển thị trạng thái hiện tại của xe và các hướng xử lý kèm ô nhập Ghi chú / Nội dung xử lý (`reason`). |
| 5. Đối với xe không đang chạy tour (`status != 'IN_TOUR'` và không có chuyến đi đang diễn ra) cần đưa vào xưởng khắc phục, nhân viên chọn hướng xử lý “Tiếp nhận & Đưa xe vào xưởng sửa chữa (`REPAIR`)”, nhập ghi chú xử lý và nhấn “Xác nhận cập nhật”. | 6. Hệ thống kiểm tra phân quyền, kiểm tra nội dung ghi chú và xác minh phương tiện không ở trạng thái `IN_TOUR` cũng như không gắn với chuyến đi đang diễn ra (`tour_vehicle_assignments`). |
| | 7. Hệ thống cập nhật `driver_incidents.status = 'Processing'`; cập nhật `vehicles.status = 'REPAIR'`; tạo bản ghi lịch sử trong `vehicle_status_history` (`old_status`, `new_status = 'REPAIR'`, `reason`, `updated_by`); tạo phiếu sửa chữa trong `vehicle_maintenances` (`status = 'IN_PROGRESS'`); và gửi thông báo (`notifications`) cho Tài xế. |
| | 8. Hệ thống hiển thị thông báo cập nhật thành công và làm mới danh sách sự cố. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 5.1. Sự cố nhẹ có thể xử lý tại chỗ hoặc xe đang trong chuyến đi (`IN_TOUR`) cần ghi nhận tiếp nhận trước: Nhân viên chọn hướng xử lý “Chỉ ghi nhận đang xử lý (`PROCESSING` - Không đổi trạng thái xe)”, nhập ghi chú xử lý và nhấn “Xác nhận cập nhật”. | 5.1. Hệ thống cập nhật `driver_incidents.status = 'Processing'`, **giữ nguyên trạng thái hiện tại của xe (`vehicles.status`)**, ghi nhận sự kiện xử lý vào bảng `vehicle_status_history` với `old_status = new_status = currentStatus` kèm nội dung ghi chú `reason` và `updated_by` (không ghi đè vào `driver_incidents.description`), đồng thời gửi thông báo đã tiếp nhận xử lý cho Tài xế. |
| 5.2. Khi sự cố đã được khắc phục xong: Nhân viên mở hộp thoại xử lý của sự cố đó, chọn “Hoàn tất sự cố (`RESOLVED`)”, nhập ghi chú kết quả nghiệm thu và nhấn “Xác nhận cập nhật”. | 5.2. Hệ thống cập nhật `driver_incidents.status = 'Resolved'` cho đúng sự cố đang xử lý (không tự động đóng các sự cố khác của xe); kiểm tra nếu xe không còn sự cố nào khác đang ở trạng thái `Processing` thì chuyển `vehicles.status` từ `REPAIR` về `AVAILABLE` và đóng phiếu `vehicle_maintenances` (`status = 'COMPLETED'`, `end_date = NOW()`); ghi nhận vào `vehicle_status_history` và gửi thông báo hoàn tất cho Tài xế. |
| 5.3. Khi hoàn tất một sự cố (`RESOLVED`) nhưng phương tiện vẫn còn một sự cố khác chưa được giải quyết (`status = 'Processing'`). | 5.3. Hệ thống chỉ đóng sự cố hiện tại (`Resolved`), **giữ nguyên trạng thái xe là `REPAIR`** và phiếu sửa chữa để tiếp tục khắc phục sự cố còn lại, đồng thời ghi nhận bước xử lý vào `vehicle_status_history` (`old_status = 'REPAIR'`, `new_status = 'REPAIR'`, kèm ghi chú). |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 6.1. Xe đang ở trạng thái `IN_TOUR` (hoặc đang gắn với chuyến đi đang diễn ra trong `tour_vehicle_assignments`) nhưng nhân viên chọn chuyển trạng thái xe sang `REPAIR`.<br>Hệ thống chặn thao tác đổi trạng thái xe (`403 Forbidden`) và hiển thị cảnh báo: “Xe đang thực hiện hành trình Tour. Nhân viên văn phòng chỉ được phép Tiếp nhận & Ghi nhận xử lý sự cố. Nếu xe không thể tiếp tục hành trình, vui lòng thông báo Quản lý Tour điều phối xe thay thế trước khi chuyển xe vào xưởng sửa chữa!”. |
| | 6.2. Biển số xe trong báo cáo sự cố (`driver_incidents.vehicle_number`) không khớp với bất kỳ phương tiện nào trong bảng `vehicles`.<br>Hệ thống vẫn cập nhật trạng thái `driver_incidents.status` nhưng cảnh báo không tìm thấy hồ sơ phương tiện vật lý tương ứng để đồng bộ trạng thái xe. |
| | 3.1. Sự cố đã ở trạng thái Đã giải quyết (`Resolved`).<br>Hệ thống ẩn/khóa nút xử lý trên giao diện và chặn cập nhật lại ở máy chủ (`400 Bad Request`). |
| **– Quy tắc nghiệp vụ:** | |
| • **Xử lý sự cố khi xe đang chạy tour (Phương án A):** Khi xe đang `IN_TOUR` và gắn với chuyến đi đang diễn ra, Nhân viên văn phòng không được trực tiếp chuyển trạng thái xe sang `REPAIR`. Nếu xe hỏng nặng không thể đi tiếp, Quản lý Tour (`role_id = 3`) thực hiện nghiệp vụ điều phối/thay thế xe theo quy trình điều hành (`UC-TM-07`); sau khi xe được gỡ khỏi chuyến đi đang chạy, trạng thái xe mới được chuyển sang `REPAIR`.<br>• **Bảo toàn báo cáo gốc của Tài xế:** Trường `driver_incidents.description` chỉ lưu nội dung báo cáo ban đầu của tài xế, tuyệt đối không nối hoặc ghi đè ghi chú xử lý vào trường này. Toàn bộ ghi chú xử lý (`reason`), thời điểm (`created_at`) và người thực hiện (`updated_by`) được lưu vào `vehicle_status_history` (kể cả khi `old_status` và `new_status` giống nhau).<br>• **Tính độc lập giữa các sự cố:** Hoàn tất (`Resolved`) một sự cố chỉ đóng đúng `incident_id` đó, không tự động đóng các sự cố khác chưa giải quyết của cùng phương tiện. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-07: BÁO GIÁ VÀ ĐIỀU CHỈNH BÁO GIÁ TOUR RIÊNG

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Báo giá và điều chỉnh báo giá tour riêng** | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng tiếp nhận nhu cầu du lịch may đo của khách hàng để lập, tính toán, gửi và điều chỉnh báo giá sơ bộ (Initial Quote), bao gồm cả việc tiếp nhận phản hồi và cập nhật lại báo giá khi khách hàng yêu cầu điều chỉnh trước khi bước vào giai đoạn thiết kế tour chi tiết (`Customer_Revision` ở giai đoạn báo giá). Nhân viên có thể tùy biến phương án đề xuất (khách sạn, phương tiện, ăn uống, HDV, vé tham quan), thiết lập tỷ lệ lợi nhuận, cấu hình Chính sách giá trẻ em theo từng độ tuổi và gửi báo giá kèm giải trình cho khách hàng. | |
| **– Actor chính:** Nhân viên văn phòng | |
| **– Actor phụ:** Khách hàng, Quản lý Tour | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống. Hồ sơ yêu cầu thiết kế tour đang ở trạng thái Mới (`Pending`), Đang xử lý (`Processing`) hoặc Khách hàng yêu cầu điều chỉnh báo giá sơ bộ (`Customer_Revision` chưa có lịch trình thiết kế chi tiết). | |
| **– Hậu điều kiện (Post-condition):** Bản ghi báo giá sơ bộ được lưu trữ vào bảng `custom_tour_quotes` kèm chi tiết phân rã chi phí (`price_breakdown`) và phương án đề xuất (`proposed_plan`); trạng thái yêu cầu chuyển sang `Initial_Quoted`; khách hàng nhận được thông báo để xem phương án giá và phản hồi (Đồng ý hoặc Yêu cầu điều chỉnh). | |
| **– Luồng sự kiện chính (main flow - Lập và gửi báo giá sơ bộ ban đầu):** | |
| 1. Chọn chức năng “Báo giá tour theo yêu cầu” (`tour_requests_pending`) trên thanh điều hướng bên trái. | 2. Hệ thống hiển thị danh sách các yêu cầu báo giá kèm thanh công cụ tìm kiếm, bộ lọc trạng thái và 5 thẻ thống kê nghiệp vụ: Tổng yêu cầu, Chờ báo giá (`Pending`), Cần sửa báo giá (`Customer_Revision`), Đã gửi báo giá (`Initial_Quoted`), Khách đã xác nhận (`Initial_Accepted`). |
| 3. Nhân viên chọn một hồ sơ ở trạng thái “Chờ báo giá” hoặc bấm nút “Báo giá”. | 4. Hệ thống mở modal “Lập phương án & Báo giá tour riêng”, hiển thị thông tin nhu cầu gốc của khách (tuyến điểm, thời gian khởi hành, cơ cấu thành viên đoàn, ngân sách dự kiến) và tự động tải danh mục dịch vụ đối tác tại điểm đến. |
| 5. Nhân viên kiểm tra và điều chỉnh các hạng mục dịch vụ đề xuất: chọn phương tiện vận chuyển phù hợp từ đội xe hoặc đối tác, nâng/hạ hạng phòng lưu trú, bật/tắt suất ăn, cấu hình công tác phí HDV và thêm/bớt điểm tham quan kèm lý do điều chỉnh để giải trình cho khách hàng. | 6. Hệ thống tự động tính toán tổng chi phí giá vốn (`totalCost`), cập nhật tỷ lệ lợi nhuận (`markup_percent`) và tính toán đơn giá bán đề xuất cho người lớn (`suggestedPrice`). |
| 7. Nhân viên cấu hình **Chính sách giá trẻ em**: chọn mẫu nhanh (Mẫu 1: Đường bộ 50% - 0% - 0%, Mẫu 2: Hàng không 85% - 50% - 0% + Phụ thu) hoặc chọn Tùy chỉnh (Custom) để nhập trực tiếp tỷ lệ % và phụ thu cố định (đ) cho từng nhóm tuổi: Trẻ em (5-11 tuổi), Trẻ nhỏ (2-4 tuổi), Em bé (<2 tuổi). | 8. Hệ thống tự động tính toán đơn giá bán riêng cho từng nhóm trẻ em và tính ra **Tổng kết chi phí cho toàn đoàn** (`grandTotalPrice`), đồng thời đối chiếu và hiển thị trực quan mức độ chênh lệch so với ngân sách dự kiến của khách (Trong ngân sách / Vượt ngân sách). |
| 9. Nhân viên nhập ghi chú tư vấn, giải thích phương án và nhấn nút “Gửi Báo Giá Cho Khách”. | 10. Hệ thống kiểm tra tính hợp lệ của dữ liệu; lưu thông tin báo giá, cơ cấu phân rã giá (`price_breakdown` gồm giá người lớn, giá trẻ em, tỷ lệ % và loại mẫu chính sách) và toàn bộ phương án đề xuất (`proposed_plan` bao gồm `childPolicy`, chi phí xe, khách sạn, ăn uống, HDV) vào cơ sở dữ liệu. |
| | 11. Hệ thống cập nhật trạng thái yêu cầu và báo giá sang `Initial_Quoted`, gửi thông báo đến tài khoản khách hàng và hiển thị thông báo thành công: “Đã gửi báo giá sơ bộ kèm bảng giải thích thay đổi cho khách hàng!”. |
| **– Luồng sự kiện thay thế (alternate flow - Xử lý khi khách yêu cầu chỉnh sửa lại báo giá):** | |
| 3.1. Khách hàng xem báo giá sơ bộ và nhấn “Yêu cầu điều chỉnh” kèm ghi chú phản hồi (`Customer_Revision`); hồ sơ hiển thị trong danh sách Báo giá với nhãn “KHÁCH YÊU CẦU SỬA” và thẻ thống kê “Cần sửa báo giá” tăng lên. | 3.1. Nhân viên nhấn nút “Sửa báo giá” hoặc bấm vào dòng hồ sơ tương ứng. |
| 5.1. Nhân viên đọc nội dung yêu cầu điều chỉnh của khách được hiển thị nổi bật trong khung cảnh báo màu đỏ/cam tại đầu modal. | 5.1. **Hệ thống tự động khôi phục 100% dữ liệu đã báo giá trước đó**: nạp lại đúng phương án xe/khách sạn đã chọn, bảo lưu chính xác tỷ lệ % và phụ thu cố định của Chính sách giá trẻ em (`childPolicy`) cùng loại mẫu áp dụng (`policyType`), nạp lại đơn giá ăn uống và phụ cấp HDV. |
| 7.1. Nhân viên tiến hành tinh chỉnh lại các dịch vụ hoặc tỷ lệ lợi nhuận theo đúng phản hồi của khách, cập nhật nội dung tư vấn mới và nhấn “Gửi Báo Giá Cho Khách” (hoặc nhấn “Lưu Bản Nháp” để tiếp tục xử lý sau). | 7.1. Hệ thống cập nhật lại bản ghi báo giá mới nhất, chuyển trạng thái sang `Initial_Quoted`, lưu giữ đầy đủ chính sách trẻ em vừa tinh chỉnh và gửi thông báo báo giá mới đến khách hàng. |
| 9.1. Nhân viên muốn trình phương án báo giá lên Quản lý Tour duyệt nội bộ trước khi gửi khách. | 9.1. Nhân viên nhấn “Trình Quản Lý Duyệt”; hệ thống lưu `proposed_plan` và chuyển trạng thái sang `Pending_Manager_Approval` (`approval_status = 'Pending_Approval'`). |
| 9.2. Khách hàng đồng ý mức giá sơ bộ (`Initial_Accepted`), nhân viên bấm “Vào thiết kế” để chuyển tiếp hồ sơ sang phân hệ Thiết kế tour chi tiết (`UC-OS-02`). | 9.2. Hệ thống chuyển trạng thái sang `Designing` và mở giao diện thiết kế lịch trình Timeline Builder. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 10.1. Đơn giá báo sơ bộ nhỏ hơn hoặc bằng 0.<br>Hệ thống cảnh báo: “Vui lòng nhập định mức chi phí hợp lệ để tính toán giá bán!”. |
| | 10.2. Lỗi kết nối mạng hoặc lỗi cơ sở dữ liệu khi gửi báo giá.<br>Hệ thống thông báo “Lỗi gửi báo giá sơ bộ!” và giữ nguyên dữ liệu đang thao tác để nhân viên không bị mất dữ liệu đã nhập. |
| **– Quy tắc nghiệp vụ:** | |
| • **Tập trung hóa xử lý báo giá:** Toàn bộ vòng đời báo giá sơ bộ (từ lúc tiếp nhận mới `Pending` đến khi khách yêu cầu sửa đổi `Customer_Revision` và chốt mức giá `Initial_Accepted`) được quản lý tập trung và khép kín tại phân hệ Báo giá (`tour_requests_pending`), không đẩy sang phân hệ Chỉnh sửa thiết kế.<br>• **Bảo toàn và khôi phục Chính sách giá trẻ em:** Mọi thông số tỷ lệ % chiết khấu theo giá người lớn và mức phụ thu cố định của 3 nhóm tuổi (Trẻ em 5-11 tuổi, Trẻ nhỏ 2-4 tuổi, Em bé <2 tuổi) bắt buộc phải được lưu đồng bộ vào cả `proposed_plan` và `price_breakdown`. Khi nhân viên mở lại hồ sơ để chỉnh sửa, hệ thống bắt buộc phải nạp lại đúng 100% tỷ lệ % và phụ thu đã cấu hình trước đó (tự động nhận diện cả dữ liệu cũ thông qua đơn giá phân rã), tuyệt đối không tự ý reset về giá trị mặc định.<br>• **Minh bạch cơ sở định giá:** Bảng báo giá phải phân định rõ ràng giữa Chi phí trực tiếp (Xe, Khách sạn, Vé tham quan, Ăn uống, HDV), Tỷ lệ lợi nhuận công ty (`markup_percent`) và hiển thị bảng so sánh chênh lệch giữa phương án công ty đề xuất với yêu cầu ban đầu của khách hàng kèm lý do giải trình cụ thể. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-OS-08: CHỈNH SỬA THIẾT KẾ TOUR

| Nhân viên văn phòng | System |
| :--- | :--- |
| **– Tên use case: Chỉnh sửa thiết kế tour** | |
| **– Mô tả sơ lược:** Use case này cho phép Nhân viên văn phòng tiếp nhận, quản lý và xử lý các bản thiết kế tour riêng cần chỉnh sửa theo quy trình khép kín chuyên biệt: (1) Quản lý Tour từ chối duyệt bản thiết kế chi tiết và yêu cầu chỉnh sửa lại (`Manager_Rejected` kèm `manager_note`), hoặc (2) Khách hàng gửi yêu cầu điều chỉnh lại chi tiết bản thiết kế sau khi bản thiết kế đã được Quản lý phê duyệt và gửi đến tài khoản khách hàng (`Customer_Revision` kèm `customer_note` trên hồ sơ đã có thiết kế tour). Chức năng này độc lập và chuyên biệt xử lý bản thiết kế tour, tuyệt đối không tiếp nhận chỉnh sửa báo giá sơ bộ (vốn thuộc UC-OS-07). Nhân viên xem nội dung phản hồi, truy cập thẳng vào phòng thiết kế Timeline Builder, điều chỉnh lại hành trình/dịch vụ/giá bán và nộp duyệt lại cho Quản lý Tour. | |
| **– Actor chính:** Nhân viên văn phòng | |
| **– Actor phụ:** Quản lý Tour, Khách hàng | |
| **– Tiền điều kiện (Pre-condition):** Nhân viên văn phòng đã đăng nhập thành công vào hệ thống. Bản thiết kế tour chi tiết đang ở trạng thái cần sửa: Quản lý từ chối duyệt (`Manager_Rejected`), Khách yêu cầu sửa thiết kế sau khi duyệt (`Customer_Revision` đã có lịch trình chi tiết), hoặc hồ sơ đang trong quá trình chỉnh sửa lại (`Designing` có ghi chú yêu cầu sửa). | |
| **– Hậu điều kiện (Post-condition):** Bản thiết kế điều chỉnh được cập nhật vào bảng `custom_tour_quotes`, trạng thái yêu cầu chuyển sang `Pending_Manager_Approval` (`approval_status = 'Pending_Approval'`); khi Quản lý duyệt bản mới (`Manager_Approved`), hệ thống tự động hoàn tất yêu cầu chỉnh sửa, đưa hồ sơ ra khỏi danh mục cần sửa và sẵn sàng gửi khách hàng. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Chỉnh sửa thiết kế” (`tour_requests_revision`) trên thanh điều hướng bên trái. | 2. Hệ thống hiển thị danh sách các bản thiết kế tour đang cần chỉnh sửa, nạp 4 thẻ thống kê nghiệp vụ chuyên biệt: Tổng thiết kế cần sửa, Quản lý yêu cầu sửa (`Manager_Rejected`), Khách yêu cầu sửa (`Customer_Revision`), Đang xử lý lại (`Designing`). |
| 3. Nhân viên lọc và tìm kiếm hồ sơ cần xử lý; đọc nội dung yêu cầu chỉnh sửa được hiển thị trực tiếp tại cột “Nội dung cần chỉnh sửa” và khung cảnh báo (ghi chú từ Quản lý hoặc phản hồi của Khách hàng). | 4. Hệ thống hiển thị thông tin tóm tắt: Mã yêu cầu (`#REQ-...`), tên khách hàng, số điện thoại, tuyến điểm, thời lượng, ngày khởi hành, trạng thái hiện tại và nội dung phản hồi chi tiết. |
| 5. Nhân viên nhấn nút “Sửa ngay” (hoặc bấm vào dòng hồ sơ). | 6. Hệ thống tự động chuyển sang giao diện phòng thiết kế Timeline Builder (`StaffTourDesigner`), tự động nạp lại toàn bộ lịch trình ngày/đêm, địa điểm đón/trả, dịch vụ lưu trú, phương tiện đã thiết kế trước đó, đồng thời hiển thị nội dung yêu cầu sửa từ Sếp hoặc Khách tại thanh công cụ để đối chiếu. |
| 7. Nhân viên tiến hành điều chỉnh thiết kế theo đúng góp ý: kéo thả đổi thứ tự ngày, thêm/xóa/đổi điểm tham quan, đổi khách sạn, chọn lại xe vận chuyển từ dữ liệu Đội xe nội bộ thực tế, hoặc điều chỉnh định mức ăn uống, tỷ lệ lợi nhuận. | 8. Hệ thống tự động tính toán lại toàn bộ biến phí (vé tham quan, ăn uống, phòng nghỉ), định phí (tiền xe nguyên chuyến theo ngày từ đội xe, HDV), đơn giá từng nhóm khách và **Tổng giá tour toàn đoàn** (`grandTotalRevenue`). |
| 9. Nhân viên nhấn “Chốt Thiết Kế & Gửi Quản Lý”. | 10. Hệ thống kiểm tra dữ liệu, lưu bản thiết kế mới vào bảng `custom_tour_quotes` với trạng thái `Pending_Approval`, cập nhật trạng thái yêu cầu sang `Pending_Manager_Approval`, và hiển thị thông báo: “Đã gửi quản lý phê duyệt!”. |
| | 11. Khi Quản lý Tour phê duyệt bản thiết kế mới (`Manager_Approved`), hệ thống tự động hoàn tất chu trình chỉnh sửa, dọn sạch ghi chú sửa cũ trên bản duyệt mới và đưa hồ sơ về trạng thái sẵn sàng gửi khách (`sendToCustomer`). |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 5.1. Nhân viên nhấn xem chi tiết hồ sơ thiết kế trước khi mở phòng thiết kế. | 5.1. Hệ thống mở modal chi tiết bản thiết kế hiện tại, hiển thị toàn bộ lịch trình từng ngày, hình ảnh, bảng kê tài chính định phí/biến phí và nút “Mở phòng thiết kế” để bắt đầu chỉnh sửa. |
| 7.1. Khách hàng chỉ yêu cầu đổi phương tiện di chuyển sang dòng xe cao cấp hơn hoặc xe nhiều chỗ hơn. | 7.1. Nhân viên mở danh sách chọn phương tiện, lọc theo nhóm xe thực tế của hệ thống (Sedan 4-5 chỗ, MPV/SUV 7 chỗ, Limousine VIP 9 chỗ, Xe 16-29-45 chỗ), chọn xe mong muốn; hệ thống tự động cập nhật lại tiền xe nguyên chuyến và đơn giá tour toàn đoàn. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 10.1. Lịch trình sau khi sửa có ngày chưa có hoạt động hoặc chưa có dịch vụ lưu trú bắt buộc.<br>Hệ thống cảnh báo: “Vui lòng hoàn thiện hoạt động cho tất cả các ngày trong lịch trình trước khi gửi duyệt!”. |
| | 10.2. Lỗi kết nối máy chủ hoặc lỗi cơ sở dữ liệu khi gửi duyệt.<br>Hệ thống thông báo “Lỗi khi gửi phê duyệt!” và giữ nguyên toàn bộ trạng thái đang thiết kế trên màn hình để nhân viên không bị mất dữ liệu. |
| **– Quy tắc nghiệp vụ:** | |
| • **Phân định ranh giới nghiêm ngặt:** Phân hệ Chỉnh sửa thiết kế CHỈ tiếp nhận các hồ sơ đã có bản thiết kế tour chi tiết (đã bước vào giai đoạn thiết kế, gửi duyệt hoặc đã gửi khách sau duyệt). Tuyệt đối không tiếp nhận các yêu cầu sửa đổi mức giá ở giai đoạn báo giá sơ bộ ban đầu.<br>• **Phân loại nguồn gốc yêu cầu sửa:** Giao diện phân loại tách bạch rõ ràng giữa yêu cầu sửa do Khách hàng phản hồi (`Customer_Revision` — gắn nhãn cam) và do Quản lý từ chối (`Manager_Rejected` — gắn nhãn đỏ) để nhân viên nắm bắt đúng trọng tâm cần hoàn thiện.<br>• **Khép kín vòng đời thiết kế:** Sau khi bản thiết kế mới được Quản lý phê duyệt thành công (`Manager_Approved`), hệ thống tự động xóa hồ sơ khỏi danh mục “Chỉnh sửa thiết kế” và chuyển sang trạng thái “Sếp đã duyệt - Chờ gửi khách” tại danh sách Thiết kế tour đã báo giá (`tour_requests`). | |

### PHẦN III. BẢNG TỔNG HỢP MỤC TIÊU VÀ PHÂN HỆ CỦA CÁC USE CASE

| Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Mục tiêu nghiệp vụ cốt lõi |
| :---: | :--- | :--- | :--- |
| **`UC-OS-01`** | **Tư vấn khách hàng** | Chăm sóc khách hàng | Hỗ trợ, giải đáp thông tin và tiếp nhận nhu cầu du lịch của khách hàng thời gian thực qua Live Chat. |
| **`UC-OS-02`** | **Thiết kế tour riêng** | Quản lý thiết kế tour | Xây dựng lịch trình chi tiết kéo thả từng ngày, bóc tách định phí/biến phí và trình Quản lý Tour thẩm duyệt. |
| **`UC-OS-03`** | **Thiết kế tour cố định** | Quản lý sản phẩm tour | Tạo mới sản phẩm tour trọn gói cố định mở bán công khai của công ty ở trạng thái chờ duyệt. |
| **`UC-OS-04`** | **Xử lý hủy, đổi lịch** | Quản trị đơn đặt tour | Thẩm định và xử lý yêu cầu hủy tour hoặc đổi ngày khởi hành của khách hàng theo biểu phí phạt tài chính tự động. |
| **`UC-OS-05`** | **Xác nhận thanh toán** | Quản lý thanh toán | Đối soát các khoản thanh toán, xác nhận thu tiền mặt tại quầy để kích hoạt xuất vé điện tử và mã QR check-in. |
| **`UC-OS-06A`** | **Theo dõi và cập nhật trạng thái xe** | Quản lý đội xe nội bộ | Theo dõi danh sách/thông tin vận hành xe, cập nhật trạng thái bảo dưỡng/sửa chữa hợp lệ (`AVAILABLE` $\leftrightarrow$ `MAINTENANCE`/`REPAIR`) và tra cứu lịch sử xe ở chế độ chỉ xem. |
| **`UC-OS-06B`** | **Tiếp nhận và xử lý sự cố xe** | Quản lý đội xe nội bộ | Tiếp nhận báo cáo sự cố xe từ Tài xế, ghi nhận tiến độ xử lý vào lịch sử, chuyển xe vào xưởng sửa chữa (khi không chạy tour) và hoàn tất sự cố. |
| **`UC-OS-07`** | **Gửi báo giá thiết kế tour riêng** | Quản lý báo giá | Gửi báo giá sơ bộ ban đầu cho khách hàng và gửi bản báo giá/thiết kế chính thức sau khi Quản lý Tour đã phê duyệt. |
| **`UC-OS-08`** | **Chỉnh sửa thiết kế tour** | Quản lý thiết kế tour | Tiếp nhận bản thiết kế bị Quản lý Tour từ chối hoặc Khách hàng yêu cầu chỉnh sửa sau khi duyệt, mở phòng thiết kế điều chỉnh lịch trình, dịch vụ và nộp duyệt lại. |

---
*Tài liệu được kết xuất và chuẩn hóa từ mã nguồn TravelVN ERP phục vụ Báo cáo Khóa luận Tốt nghiệp ngành Hệ thống Thông tin.*
