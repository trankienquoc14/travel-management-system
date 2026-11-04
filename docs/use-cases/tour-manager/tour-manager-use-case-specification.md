# TÀI LIỆU ĐẶC TẢ USE CASE NGHIỆP VỤ (USE CASE SPECIFICATION)
## PHÂN HỆ: QUẢN LÝ TOUR (TOUR MANAGER) – TRAVELVN ERP

---

### PHẦN I. TỔNG QUAN PHẠM VI NGHIỆP VỤ

#### 1. Mục tiêu tài liệu
Tài liệu đặc tả này xác lập chi tiết các yêu cầu chức năng, luồng sự kiện và quy tắc nghiệp vụ cho **9 Use Case cơ sở** thuộc phạm vi tác nhân **Quản lý tour (Tour Manager)** trong Hệ thống Quản trị và Điều hành Du lịch **TravelVN ERP**. Bản đặc tả được xây dựng theo chuẩn văn phong báo cáo phân tích thiết kế hệ thống trong Khóa luận tốt nghiệp ngành Hệ thống Thông tin, tập trung mô tả tương tác nghiệp vụ giữa người dùng và hệ thống, không đưa các chi tiết cài đặt kỹ thuật (như đường dẫn API, phương thức HTTP, tên bảng hay trường dữ liệu) vào luồng sự kiện.

#### 2. Danh mục 9 Use Case cơ sở

| STT | Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Tác nhân chính | Tác nhân phụ | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **`UC-TM-01`** | **Gửi yêu cầu cung cấp dịch vụ** | Quản lý dịch vụ đối tác | Quản lý tour | Đối tác (Partner) | Cao |
| 2 | **`UC-TM-02`** | **Quản lý tour** | Quản trị sản phẩm tour | Quản lý tour | Không | Cao |
| 3 | **`UC-TM-03`** | **Quản lý đối tác** | Quản lý mạng lưới đối tác | Quản lý tour | Không | Cao |
| 4 | **`UC-TM-04`** | **Quản lý xe** | Quản lý đội xe nội bộ | Quản lý tour | Không | Trung bình |
| 5 | **`UC-TM-05`** | **Phê duyệt thiết kế tour** | Quản lý thiết kế & duyệt tour | Quản lý tour | Nhân viên văn phòng | Cao |
| 6 | **`UC-TM-06`** | **Xử lý sự cố tour** | Quản trị rủi ro & sự cố đoàn | Quản lý tour | Hướng dẫn viên | Cao |
| 7 | **`UC-TM-07`** | **Thiết lập lịch trình tour** | Kế hoạch lịch trình & nhân sự | Quản lý tour | Hướng dẫn viên, Tài xế | Cao |
| 8 | **`UC-TM-08`** | **Thiết lập vận hành tour** | Giám sát & Điều hành tour | Quản lý tour | Không | Cao |
| 9 | **`UC-TM-09`** | **Xem báo cáo thống kê** | Báo cáo & Thống kê điều hành | Quản lý tour | Hướng dẫn viên | Trung bình |

> **Quy ước về các chức năng nền tảng dùng chung:**
> Các chức năng như *Đăng nhập*, *Đổi mật khẩu*, *Cập nhật hồ sơ cá nhân* hay *Điểm danh GPS cá nhân* là các chức năng nền tảng dùng chung cho toàn bộ nhân sự nội bộ công ty, đóng vai trò là Tiền điều kiện kỹ thuật và được phân tách độc lập khỏi 9 Use Case nghiệp vụ này.

---

### PHẦN II. ĐẶC TẢ CHI TIẾT 9 USE CASE

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-01: GỬI YÊU CẦU CUNG CẤP DỊCH VỤ

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Gửi yêu cầu cung cấp dịch vụ** | |
| **– Mô tả sơ lược:** Use case này cho phép Quản lý tour lập và gửi nhóm yêu cầu cung cấp dịch vụ (lưu trú khách sạn, ăn uống nhà hàng, xe vận chuyển ngoài) phục vụ cho đợt khởi hành tới các đối tác cung ứng; đồng thời cho phép tạo yêu cầu bổ sung khi đoàn phát sinh tăng khách cận ngày và theo dõi phản hồi từ các đối tác. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Đối tác cung ứng (Partner) | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập thành công vào hệ thống. Đợt khởi hành liên quan đã được thiết lập trong hệ thống. | |
| **– Hậu điều kiện (Post-condition):** Nhóm yêu cầu dịch vụ và các yêu cầu thành phần được lưu vào hệ thống ở trạng thái Chờ xử lý. Tài khoản đối tác nhận được thông báo tiếp nhận trên cổng dịch vụ đối tác. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Tạo yêu cầu cung cấp dịch vụ” trên thanh điều hướng. | 2. Hệ thống hiển thị danh sách các đợt khởi hành chưa có yêu cầu ban đầu và danh mục các đối tác cung ứng đang hoạt động. |
| 3. Quản lý chọn Đợt khởi hành cần đặt dịch vụ. | 4. Hệ thống tự động nạp số lượng khách thực tế, ngày đi, ngày về và danh sách các dịch vụ cần thiết theo lịch trình tour. |
| 5. Quản lý chọn nhà cung cấp đối tác và cấu hình chi tiết cho từng dịch vụ: Khách sạn, Nhà hàng, Phương tiện vận chuyển ngoài. | 6. Hệ thống ghi nhận số lượng và thông tin chi tiết của từng dịch vụ được chỉ định. |
| 7. Quản lý kiểm tra toàn bộ danh sách dịch vụ và nhấn “Gửi yêu cầu dịch vụ”. | 8. Hệ thống kiểm tra: Phải chọn nhà cung cấp cho tất cả các dịch vụ trong danh sách và số lượng dịch vụ phải lớn hơn 0. |
| | 9. Hệ thống lưu nhóm yêu cầu ban đầu, tự động phân tách thành các yêu cầu dịch vụ thành phần gửi đến từng đối tác, phát thông báo tiếp nhận cho đối tác và hiển thị thông báo “Tạo yêu cầu thành công!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 1.1. Quản lý chọn chức năng “Tạo yêu cầu bổ sung” cho đợt khởi hành đã có yêu cầu ban đầu nhưng phát sinh tăng thêm khách. | 1.2. Hệ thống hiển thị biểu mẫu lập yêu cầu bổ sung, hiển thị số khách tăng thêm và các dịch vụ cần đặt bù. |
| 1.3. Quản lý nhập số lượng dịch vụ phát sinh tăng và nhấn “Gửi yêu cầu bổ sung”. | 1.4. Hệ thống lưu nhóm yêu cầu bổ sung, tạo các yêu cầu dịch vụ chênh lệch gửi đến đối tác và hiển thị thông báo thành công. |
| 3.1. Quản lý vào mục “Danh sách yêu cầu dịch vụ” để theo dõi tiến độ. | 3.2. Hệ thống hiển thị trạng thái phản hồi của từng đối tác: Đang chờ, Đã chấp thuận, hoặc Bị từ chối kèm ghi chú phản hồi. |
| 3.3. Khi có đối tác từ chối cung cấp, Quản lý tiến hành tạo yêu cầu mới với đối tác khác thay thế bằng thao tác thủ công. | 3.4. Hệ thống ghi nhận yêu cầu dịch vụ mới gửi đến đối tác thay thế. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Đợt khởi hành đã có yêu cầu ban đầu.<br>Hệ thống hiển thị cảnh báo: “Lịch khởi hành này đã có Yêu cầu cung cấp dịch vụ. Vui lòng sử dụng chức năng Yêu cầu bổ sung nếu có nhu cầu phát sinh.”. |
| | 8.2. Chưa chọn nhà cung cấp cho dịch vụ.<br>Hệ thống hiển thị cảnh báo: “Vui lòng chọn nhà cung cấp cho tất cả các dịch vụ hoặc xóa các mục không cần thiết.”. |
| **– Quy tắc nghiệp vụ:** | |
| • Mỗi đợt khởi hành chỉ có duy nhất một nhóm yêu cầu ban đầu; các phát sinh tăng khách sau đó bắt buộc sử dụng yêu cầu bổ sung.<br>• Khi đối tác từ chối, Quản lý tour theo dõi và chủ động tạo yêu cầu mới thủ công với đối tác thay thế.<br>• Thông báo được gửi nội bộ qua hệ thống tới tài khoản của đối tác; hệ thống không gửi email hay tin nhắn SMS ra bên ngoài. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-02: QUẢN LÝ TOUR

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Quản lý tour** | |
| **– Mô tả sơ lược:** Use case này cho phép Quản lý tour quản trị danh mục sản phẩm tour trọn gói của công ty: xem danh sách, cập nhật thông tin chi tiết, điều chỉnh giá bán niêm yết, đóng/mở bán sản phẩm và xóa tour tuân thủ ràng buộc toàn vẹn dữ liệu. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Không | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập thành công vào hệ thống với quyền hạn hợp lệ. | |
| **– Hậu điều kiện (Post-condition):** Thông tin sản phẩm tour, giá bán niêm yết hoặc trạng thái kinh doanh được cập nhật thành công vào hệ thống. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Danh Mục Tour” trên thanh điều hướng. | 2. Hệ thống tải và hiển thị danh sách toàn bộ các sản phẩm tour kèm ảnh đại diện, tên tour, điểm đến, thời lượng (ngày/đêm), giá niêm yết và trạng thái hoạt động (Đang mở bán, Tạm dừng, Chờ duyệt). |
| 3. Quản lý sử dụng thanh tìm kiếm hoặc bộ lọc trạng thái để chọn sản phẩm tour cần thao tác. | 4. Hệ thống lọc và hiển thị danh sách tour tương ứng theo thời gian thực. |
| 5. Quản lý nhấn nút “Điều chỉnh giá” trên thẻ thông tin tour. | 6. Hệ thống hiển thị hộp thoại cập nhật giá bán, hiển thị giá vốn hiện tại, giá niêm yết hiện tại và tỷ lệ lợi nhuận định mức. |
| 7. Quản lý nhập mức giá niêm yết mới và tỷ lệ lợi nhuận mới, sau đó nhấn “Lưu giá”. | 8. Hệ thống kiểm tra dữ liệu giá nhập vào (phải là số dương). |
| | 9. Hệ thống cập nhật mức giá mới cho tour, bảo toàn nguyên vẹn giá của các đơn đặt chỗ cũ đã phát sinh trước đó, và hiển thị thông báo “Cập nhật giá bán thành công!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 5.1. Quản lý nhấn nút chuyển đổi trạng thái trên tour đang mở bán. | 5.2. Hệ thống hiển thị hộp thoại xác nhận tạm dừng mở bán tour. |
| 5.3. Quản lý xác nhận đồng ý. | 5.4. Hệ thống chuyển trạng thái tour sang Tạm dừng, ẩn tour khỏi cổng đặt tour công khai và hiển thị thông báo thành công. |
| 5.5. Quản lý nhấn chuyển đổi trạng thái trên tour đang tạm dừng. | 5.6. Hệ thống mở lại tour trên trang đặt tour công khai và thông báo thành công. |
| 5.7. Quản lý nhấn nút “Xóa tour” trên một sản phẩm tour. | 5.8. Hệ thống kiểm tra ràng buộc dữ liệu: Nếu tour chưa từng phát sinh đợt khởi hành hoặc đơn đặt chỗ, hệ thống xóa sản phẩm tour và thông báo “Xóa Tour thành công!”. |
| 5.9. Quản lý nhấn “Chỉnh sửa” để cập nhật nội dung giới thiệu tour. | 5.10. Hệ thống mở biểu mẫu chỉnh sửa thông tin. Quản lý sửa mô tả, hình ảnh và nhấn “Lưu Tour”. Hệ thống lưu thay đổi và thông báo thành công. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 5.8.1. Xóa tour đã có đợt khởi hành hoặc đơn đặt chỗ liên kết.<br>Hệ thống chặn thao tác xóa và hiển thị thông báo cảnh báo: “Không thể xóa! Tour này đang có Ngày khởi hành hoặc Đơn đặt hàng liên kết.”. |
| **– Quy tắc nghiệp vụ:** | |
| • Hệ thống chặn xóa đối với các tour đã phát sinh dữ liệu đợt khởi hành hoặc đơn đặt chỗ để bảo toàn tính toàn vẹn dữ liệu kế toán và lịch sử khách hàng.<br>• Việc điều chỉnh giá niêm yết chỉ áp dụng cho các đơn đặt tour tạo mới sau thời điểm điều chỉnh, không ảnh hưởng đến các đơn đặt chỗ đã xác nhận trước đó. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-03: QUẢN LÝ ĐỐI TÁC

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Quản lý đối tác** | |
| **– Mô tả sơ lược:** Use case này cho phép Quản lý tour xây dựng, cập nhật và quản lý danh mục hồ sơ các đối tác cung cấp dịch vụ du lịch (Khách sạn, Nhà hàng, Vận tải, Điểm tham quan, Hướng dẫn viên địa phương) phục vụ công tác thiết kế và điều hành tour. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Không | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập vào hệ thống với quyền hạn hợp lệ. | |
| **– Hậu điều kiện (Post-condition):** Hồ sơ đối tác được lưu trữ, cập nhật hoặc xóa khỏi hệ thống. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Quản lý Đối tác” trên thanh điều hướng. | 2. Hệ thống hiển thị danh mục các đối tác cung ứng phân loại theo 5 nhóm dịch vụ: Khách sạn, Nhà hàng, Vận tải, Điểm tham quan và Hướng dẫn viên địa phương. |
| 3. Quản lý nhấn nút “Thêm đối tác mới”. | 4. Hệ thống hiển thị biểu mẫu nhập hồ sơ đối tác. |
| 5. Quản lý nhập thông tin: Tên đối tác, Loại hình dịch vụ, Tỉnh/Thành phố, Tên người liên hệ, Số điện thoại, Email, Địa chỉ kinh doanh và Ghi chú. | 6. Hệ thống kiểm tra dữ liệu: Tên đối tác không được để trống, số điện thoại và email phải đúng định dạng. |
| 7. Quản lý nhấn “Lưu thông tin”. | 8. Hệ thống lưu bản ghi mới vào danh mục đối tác và hiển thị thông báo “Thêm mới đối tác thành công!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Quản lý chọn một đối tác từ danh sách và nhấn nút “Chỉnh sửa”. | 3.2. Hệ thống nạp thông tin hồ sơ cũ của đối tác vào biểu mẫu chỉnh sửa. |
| 3.3. Quản lý cập nhật số điện thoại, người liên hệ hoặc địa chỉ mới và nhấn “Lưu thay đổi”. | 3.4. Hệ thống lưu thông tin cập nhật và hiển thị thông báo “Cập nhật đối tác thành công!”. |
| 3.5. Quản lý nhấn nút “Xóa đối tác” đối với đối tác không còn hợp tác. | 3.6. Hệ thống kiểm tra ràng buộc: Nếu đối tác chưa từng có liên kết dữ liệu dịch vụ, hệ thống xóa đối tác và hiển thị thông báo “Đã xóa đối tác thành công!”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 3.6.1. Xóa đối tác đang có liên kết dịch vụ.<br>Hệ thống chặn thao tác xóa và hiển thị thông báo cảnh báo: “Không thể xóa đối tác này do đang có dữ liệu dịch vụ liên kết!”. |
| | 6.1. Bỏ trống tên đối tác hoặc nhập sai định dạng.<br>Hệ thống hiển thị cảnh báo: “Vui lòng nhập tên đối tác và kiểm tra định dạng email, số điện thoại hợp lệ!”. |
| **– Quy tắc nghiệp vụ:** | |
| • Danh mục đối tác được quản lý trực tiếp qua các thao tác Thêm, Sửa, Xóa; hệ thống không hỗ trợ cơ chế tạm dừng hay vô hiệu hóa đối tác.<br>• Thao tác xóa đối tác bị chặn hoàn toàn nếu đối tác đã từng được sử dụng trong các yêu cầu dịch vụ của đợt khởi hành. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-04: QUẢN LÝ XE

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Quản lý xe** | |
| **– Mô tả sơ lược:** Use case này cho phép Quản lý tour quản lý tài sản phương tiện vật lý thuộc đội xe nội bộ của doanh nghiệp: xem danh sách, thêm xe mới, cập nhật thông tin xe, lập phiếu bảo dưỡng định kỳ và theo dõi lịch sử trạng thái của từng xe. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Không | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập vào hệ thống với vai trò Quản lý tour hoặc Quản trị viên. | |
| **– Hậu điều kiện (Post-condition):** Thông tin phương tiện, phiếu bảo dưỡng hoặc lịch sử trạng thái được lưu trữ vào hệ thống. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Quản lý Xe” trên thanh điều hướng. | 2. Hệ thống hiển thị danh sách các xe nội bộ kèm thông tin: Biển số, Hãng xe/Model, Số chỗ ngồi, Màu sơn, Trạng thái kỹ thuật (Sẵn sàng, Bảo dưỡng, Sửa chữa, Đang đi tour) và gói dịch vụ vận chuyển liên kết. |
| 3. Quản lý nhấn nút “Thêm phương tiện mới”. | 4. Hệ thống hiển thị biểu mẫu thêm xe vào đội xe. |
| 5. Quản lý nhập: Biển số xe, Hãng xe/Model, Số chỗ ngồi, Màu sơn, Ghi chú và chọn gói dịch vụ liên kết tương ứng. | 6. Hệ thống kiểm tra sơ bộ định dạng dữ liệu. |
| 7. Quản lý nhấn “Lưu phương tiện”. | 8. Hệ thống kiểm tra trùng lặp biển số xe trong cơ sở dữ liệu. |
| | 9. Hệ thống lưu xe mới vào đội xe với trạng thái ban đầu là Sẵn sàng (`AVAILABLE`) và hiển thị thông báo “Đã thêm phương tiện vào đội xe!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Quản lý chọn một xe và nhấn nút “Lập phiếu bảo dưỡng”. | 3.2. Hệ thống hiển thị biểu mẫu lập kế hoạch bảo dưỡng phương tiện. |
| 3.3. Quản lý nhập ngày bắt đầu, ngày kết thúc dự kiến, hạng mục bảo dưỡng, chi phí ước tính và nhấn “Xác nhận”. | 3.4. Hệ thống lưu phiếu bảo dưỡng, tự động chuyển trạng thái xe sang Bảo dưỡng (`MAINTENANCE`), ghi nhật ký lịch sử xe và hiển thị thông báo thành công. |
| 3.5. Quản lý chọn xe và nhấn nút “Xem lịch sử”. | 3.6. Hệ thống hiển thị dòng thời gian các lần thay đổi trạng thái, bảo dưỡng và sự cố kỹ thuật của xe. |
| 3.7. Quản lý chỉnh sửa thông tin xe hoặc xóa xe chưa từng phân công. | 3.8. Hệ thống lưu thông tin cập nhật hoặc xóa bản ghi và thông báo kết quả. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Biển số xe bị trùng lặp.<br>Hệ thống phát hiện biển số xe đã tồn tại và hiển thị thông báo cảnh báo: “Biển số xe này đã tồn tại trong hệ thống!”. |
| | 8.2. Bỏ trống biển số xe.<br>Hệ thống hiển thị cảnh báo: “Biển số xe là bắt buộc!”. |
| **– Quy tắc nghiệp vụ:** | |
| • Phân định rõ ràng: Hệ thống quản lý từng chiếc xe vật lý cụ thể (biển số, số chỗ, màu xe) và liên kết với danh mục dịch vụ vận chuyển thương mại.<br>• Trạng thái “Đang đi tour” do hệ thống tự động ghi nhận khi xe đang phục vụ đợt khởi hành thực tế, người dùng không thể chuyển đổi thủ công sang trạng thái này. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-05: PHÊ DUYỆT THIẾT KẾ TOUR

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Phê duyệt thiết kế tour** | |
| **– Mô tả sơ lược:** Use case này cho phép Quản lý tour thẩm định tính khả thi kỹ thuật và cơ cấu tài chính (định phí xe/HDV, biến phí phòng/ăn/vé, tỷ lệ lợi nhuận margin %) của các bản thiết kế tour riêng do Nhân viên văn phòng trình lên để ra quyết định phê duyệt hoặc từ chối kèm góp ý sửa đổi; đồng thời phê duyệt các sản phẩm tour cố định mới được tạo ở trạng thái chờ duyệt sang trạng thái mở bán chính thức. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Nhân viên văn phòng | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập vào hệ thống. Có bản thiết kế tour riêng ở trạng thái Chờ phê duyệt hoặc tour cố định mới ở trạng thái Chờ duyệt. | |
| **– Hậu điều kiện (Post-condition):** Bản ghi báo giá tour riêng được chuyển sang trạng thái Đã duyệt (hoặc Bị từ chối kèm góp ý) và yêu cầu tour riêng chuyển trạng thái tương ứng. Tour cố định mới chuyển sang trạng thái Đang mở bán. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Phê duyệt Thiết kế” trên thanh điều hướng. | 2. Hệ thống hiển thị danh sách các yêu cầu tour riêng đang chờ phê duyệt (tab Tour Riêng) và danh sách tour cố định mới đang chờ duyệt mở bán (tab Tour Cố Định). |
| 3. Quản lý chọn một bản thiết kế tour riêng cần thẩm định từ tab Tour Riêng. | 4. Hệ thống hiển thị chi tiết hồ sơ thiết kế: Hành trình từng ngày, danh mục điểm đến, cơ cấu Định phí (xe, HDV), Biến phí (khách sạn, suất ăn, vé tham quan, bảo hiểm), Giá vốn bình quân trên khách, Tỷ lệ margin (%) và Giá bán đề xuất cho người lớn và trẻ em. |
| 5. Quản lý kiểm tra tính hợp lý của chi phí và tỷ suất sinh lời, sau đó nhấn nút “Phê duyệt (Approve)”. | 6. Hệ thống hiển thị hộp thoại xác nhận phê duyệt. |
| 7. Quản lý xác nhận đồng ý. | 8. Hệ thống kiểm tra dữ liệu vừa duyệt. |
| | 9. Hệ thống cập nhật bản thiết kế sang trạng thái Đã duyệt (`Approved`), cập nhật yêu cầu tour riêng sang trạng thái Quản lý đã duyệt (`Manager_Approved`), ghi nhận mã Quản lý duyệt và hiển thị thông báo “Đã duyệt bản thiết kế”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 5.1. Quản lý nhận thấy tỷ lệ lợi nhuận quá thấp hoặc chi phí chưa hợp lý, nhấn nút “Từ chối (Reject)”. | 5.2. Hệ thống hiển thị hộp thoại yêu cầu nhập nội dung góp ý chỉnh sửa. |
| 5.3. Quản lý nhập lý do góp ý (ví dụ: “Cần tính toán lại chi phí xe và tăng số khách hòa vốn lên 15 khách”) và nhấn “Xác nhận từ chối”. | 5.4. Hệ thống kiểm tra nội dung góp ý. |
| | 5.5. Hệ thống cập nhật bản thiết kế sang trạng thái Bị từ chối (`Rejected`), lưu nội dung góp ý, chuyển yêu cầu tour riêng về trạng thái Đang thiết kế (`Designing`), và hiển thị thông báo “Đã từ chối bản thiết kế”. Nhân viên văn phòng sẽ mở lại hồ sơ để điều chỉnh. |
| 3.1. Quản lý chuyển sang tab “Tour Cố Định Chờ Duyệt”, chọn một sản phẩm tour đang ở trạng thái Chờ duyệt. | 3.2. Hệ thống hiển thị thông tin giới thiệu, lịch trình tiêu chuẩn và biểu giá niêm yết của tour. |
| 3.3. Quản lý nhấn “Phê duyệt mở bán”. | 3.4. Hệ thống chuyển trạng thái tour sang Đang mở bán (`Active`) và hiển thị thông báo “Đã cập nhật trạng thái thành Active”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Lỗi máy chủ khi cập nhật trạng thái.<br>Hệ thống hiển thị thông báo: “Lỗi máy chủ khi xử lý phê duyệt, vui lòng thử lại sau!”. |
| **– Quy tắc nghiệp vụ:** | |
| • Quyền phê duyệt bản thiết kế thuộc thẩm quyền của Quản lý tour và Quản trị viên; Nhân viên văn phòng không có quyền tự phê duyệt bản thiết kế do mình tạo ra.<br>• Khi phê duyệt hoặc từ chối, hệ thống cập nhật trạng thái trong cơ sở dữ liệu; Nhân viên văn phòng theo dõi kết quả thông qua danh sách phân hệ trên giao diện làm việc. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-06: XỬ LÝ SỰ CỐ TOUR

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Xử lý sự cố tour** | |
| **– Mã use case:** `UC-TM-06` | |
| **– Mục tiêu:** Cho phép Quản lý tour tiếp nhận các báo cáo sự cố phát sinh trên đường tour do Hướng dẫn viên gửi về từ ứng dụng thực địa, tiếp nhận xử lý, chỉ đạo phương án tháo gỡ tại chỗ và ghi nhận biên bản giải quyết hoàn tất sự cố. | |
| **– Mô tả sơ lược:** Quản lý tour theo dõi danh sách sự cố của các đoàn tour tại giao diện `IncidentManagement.jsx`, xem chi tiết sự cố do HDV gửi lên, liên hệ chỉ đạo khắc phục, và cập nhật trạng thái hoàn thành (`Resolved`) kèm ghi chú giải pháp. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Hướng dẫn viên | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập vào hệ thống với vai trò Quản lý tour hoặc Quản trị viên. Có báo cáo sự cố do Hướng dẫn viên gửi về trên hệ thống. | |
| **– Hậu điều kiện (Post-condition):** Trạng thái sự cố được cập nhật thành Đã giải quyết (`Resolved`) kèm nội dung ghi chú phương án xử lý. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Xử lý sự cố Tour” trên thanh điều hướng. | 2. Hệ thống hiển thị danh sách toàn bộ các sự cố từ các đoàn tour kèm thông tin: Tên tour, Ngày khởi hành, Hướng dẫn viên báo cáo, Số điện thoại HDV, Tiêu đề sự cố và Trạng thái (Đang mở, Đã giải quyết). |
| 3. Quản lý chọn một sự cố đang ở trạng thái Đang mở (`Open`) để xem chi tiết. | 4. Hệ thống hiển thị chi tiết nội dung tường trình sự cố và thông tin đợt khởi hành liên quan. |
| 5. Quản lý liên hệ với Hướng dẫn viên và các đối tác liên quan để chỉ đạo phương án khắc phục sự cố tại hiện trường. | 6. Hệ thống duy trì sự cố ở trạng thái Đang mở trong suốt thời gian xử lý. |
| 7. Sau khi tình hình đoàn tour đã ổn định, Quản lý nhấn nút “Giải quyết sự cố (Resolve)”. | 8. Hệ thống hiển thị hộp thoại yêu cầu nhập ghi chú phương án xử lý sự cố. |
| 9. Quản lý nhập tóm tắt phương án đã thực hiện và nhấn “Xác nhận giải quyết”. | 10. Hệ thống kiểm tra: Ghi chú giải pháp không được để trống. |
| | 11. Hệ thống cập nhật trạng thái sự cố sang Đã giải quyết (`Resolved`), lưu nội dung ghi chú giải pháp và hiển thị thông báo “Cập nhật trạng thái sự cố và ghi chú giải quyết thành công!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Quản lý lọc xem các sự cố đã đóng và phát hiện sự cố có phát sinh tình tiết mới cần xử lý tiếp. | 3.2. Hệ thống hiển thị nút “Mở lại sự cố”. |
| 3.3. Quản lý nhấn “Mở lại sự cố” và xác nhận đồng ý. | 3.4. Hệ thống chuyển lại trạng thái sự cố sang Đang mở (`Open`) và thông báo “Đã mở lại sự cố thành công!”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 10.1. Để trống ghi chú giải pháp khi đóng sự cố.<br>Hệ thống hiển thị cảnh báo: “Vui lòng nhập ghi chú hoặc chỉ đạo giải quyết sự cố.”. |
| **– Quy tắc nghiệp vụ:** | |
| • Sự cố chỉ được chuyển sang trạng thái Đã giải quyết khi có đầy đủ nội dung ghi chú phương án xử lý.<br>• Hệ thống chỉ lưu trạng thái và ghi chú giải quyết; các chi phí bồi thường hoặc phát sinh tài chính do bộ phận kế toán xử lý độc lập ngoài màn hình này. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-07: THIẾT LẬP LỊCH TRÌNH TOUR

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Thiết lập lịch trình tour** | |
| **– Mã use case:** `UC-TM-07` | |
| **– Mục tiêu:** Cho phép Quản lý tour lên kế hoạch các đợt khởi hành định kỳ cho từng sản phẩm tour, cấu hình ngày đi, ngày về, giá bán đợt khởi hành, số chỗ mở bán; đồng thời thực hiện điều phối Hướng dẫn viên (kiểm tra chống trùng lịch công tác) và phân công Xe/Tài xế nội bộ trước khi lưu cấu hình vận hành. | |
| **– Mô tả sơ lược:** Quản lý tour chọn tour tại giao diện `TourOperationalManager.jsx`, thiết lập các đợt khởi hành, chọn Hướng dẫn viên từ danh sách sẵn sàng (đã được lọc kiểm tra lịch trùng) và chọn Xe/Tài xế nội bộ, sau đó lưu cấu hình lịch trình vào hệ thống. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Hướng dẫn viên, Tài xế | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập vào hệ thống. Sản phẩm tour đang ở trạng thái hoạt động (`Active`). | |
| **– Hậu điều kiện (Post-condition):** Bản ghi đợt khởi hành mới hoặc cập nhật được lưu vào hệ thống, thông tin phân công Hướng dẫn viên và Phương tiện/Tài xế được xác lập thành công. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Thiết lập Lịch trình” trên thanh điều hướng. | 2. Hệ thống hiển thị danh mục các tour đang mở bán, lịch làm việc của đội ngũ Hướng dẫn viên và danh sách xe nội bộ khả dụng. |
| 3. Quản lý chọn một tour cần lập kế hoạch và nhấn nút “Thêm lịch khởi hành”. | 4. Hệ thống tạo một dòng đợt khởi hành mới trong danh sách. |
| 5. Quản lý chọn Ngày khởi hành. | 6. Hệ thống tự động tính toán Ngày kết thúc chuyến đi dựa trên ngày khởi hành và thời lượng số ngày của tour. |
| 7. Quản lý nhập Số chỗ tối đa mở bán và Số khách tối thiểu để khởi hành. | 8. Hệ thống ghi nhận số chỗ mở bán của đợt khởi hành. |
| 9. Quản lý mở danh sách Hướng dẫn viên để phân công. | 10. Hệ thống đối chiếu khoảng thời gian chuyến đi với lịch công tác của các HDV, tự động đánh dấu cảnh báo “Bận” đối với các HDV có lịch trùng để người dùng tránh lựa chọn. |
| 11. Quản lý chọn Hướng dẫn viên sẵn sàng và chọn Xe nội bộ, Tài xế phụ trách đoàn. | 12. Hệ thống ghi nhận nhân sự và phương tiện được chỉ định. |
| 13. Quản lý nhấn “Lưu cấu hình lịch trình”. | 14. Hệ thống kiểm tra: Ngày khởi hành và ngày về không được nằm trong quá khứ so với ngày hiện tại. |
| | 15. Hệ thống lưu cấu hình đợt khởi hành, lưu thông tin phân công nhân sự và phương tiện, phát thông báo phân công cho HDV và Tài xế, và hiển thị thông báo “Đã lưu cấu hình lịch trình & phân công nhân sự thành công!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 11.1. Đợt khởi hành là tour máy bay hoặc tour thuê xe ngoài của đối tác (không dùng xe nội bộ). | 11.2. Quản lý để trống mục Xe nội bộ và Tài xế. Hệ thống lưu đợt khởi hành không gán xe nội bộ. |
| 5.1. Quản lý chỉnh sửa đợt khởi hành đã có sẵn trong danh sách. | 5.2. Hệ thống nạp lại thông tin đợt cũ. Quản lý điều chỉnh ngày hoặc phân công lại nhân sự và nhấn “Lưu cấu hình lịch trình”. Hệ thống cập nhật đợt khởi hành tương ứng. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 14.1. Tạo đợt khởi hành mới ở ngày quá khứ.<br>Hệ thống chặn lưu và hiển thị cảnh báo: “Không thể tạo đợt khởi hành mới ở ngày quá khứ.”. |
| | 14.2. Chỉnh sửa đợt khởi hành đã kết thúc hoặc đã bị khóa.<br>Hệ thống chặn sửa đổi và hiển thị cảnh báo: “Đợt khởi hành đã kết thúc hoặc ở trạng thái KHÓA (CLOSED). Không thể phân công HDV/Tài xế mới hoặc thay đổi lịch vận hành!”. |
| **– Quy tắc nghiệp vụ:** | |
| • *Kiểm tra ngày quá khứ:* Hệ thống kiểm tra chặt chẽ cả ở giao diện và máy chủ, không cho phép tạo đợt khởi hành trong quá khứ.<br>• *Kiểm tra trùng lịch Hướng dẫn viên:* Hệ thống hỗ trợ trực quan trên giao diện để cảnh báo và lọc các HDV đang bận lịch công tác khác.<br>• *Tự động tính ngày kết thúc:* Ngày kết thúc được hệ thống tự động suy ra dựa trên ngày khởi hành và tổng số ngày hành trình của tour. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-08: THIẾT LẬP VẬN HÀNH TOUR

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Thiết lập vận hành tour** | |
| **– Mã use case:** `UC-TM-08` | |
| **– Mục tiêu:** Cho phép Quản lý tour theo dõi và đánh giá tình trạng gom khách của từng đợt khởi hành dựa trên mô hình đếm ngược các mốc thời gian T-21, T-14, T-7 so với ngày đi; so sánh lượng khách thực tế với điểm hòa vốn để đưa ra các quyết định vận hành: Xác nhận khởi hành (`Confirmed`), Tiếp tục xem xét (`Reviewing`), hoặc Hủy/Đóng đợt khởi hành (`Cancelled`/`Closed`); tự động lưu vết lịch sử ra quyết định vào hệ thống. | |
| **– Mô tả sơ lược:** Quản lý tour theo dõi danh sách đợt khởi hành tại giao diện `TourOperations.jsx`, đánh giá số khách gom được tại các mốc cảnh báo, ra quyết định vận hành và hệ thống ghi vết tự động vào lịch sử quyết định. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Không | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập vào hệ thống. Có các đợt khởi hành đang mở bán hoặc đang chờ xem xét. | |
| **– Hậu điều kiện (Post-condition):** Trạng thái vận hành, trạng thái mở bán và lịch sử quyết định của đợt khởi hành được cập nhật trong hệ thống. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Vận hành Tour” trên thanh điều hướng. | 2. Hệ thống tải và hiển thị danh sách đợt khởi hành được tính toán phân loại theo mốc ngày: T-21 (còn trên 14 ngày), T-14 (còn từ 8 đến 14 ngày), T-7 (còn từ 1 đến 7 ngày); hiển thị số khách đã đặt, điểm hòa vốn, trạng thái bán và trạng thái vận hành. |
| 3. Quản lý chọn một đợt khởi hành tại mốc T-14 hoặc T-7 có số lượng khách thực tế lớn hơn hoặc bằng điểm hòa vốn. | 4. Hệ thống mở cửa sổ chi tiết đợt khởi hành, hiển thị đánh giá “✓ Đạt yêu cầu tối thiểu”. |
| 5. Quản lý nhập ghi chú chỉ đạo và nhấn nút “✓ Xác nhận vận hành”. | 6. Hệ thống tiếp nhận thao tác và kiểm tra dữ liệu. |
| | 7. Hệ thống cập nhật trạng thái vận hành của đợt khởi hành sang Xác nhận vận hành (`Confirmed`), ghi lại dòng nhật ký mới vào lịch sử quyết định (gồm: thao tác, ghi chú, người duyệt, số khách tại thời điểm quyết định, thời gian thực hiện) và hiển thị thông báo “Đã lưu quyết định thành công.”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 5.1. Tại mốc T-14, số khách chưa đạt hòa vốn nhưng nhận định còn tiềm năng bán thêm vé, Quản lý nhập ghi chú và nhấn “⏳ Tiếp tục vận hành”. | 5.2. Hệ thống chuyển trạng thái vận hành sang Đang xem xét (`Reviewing`), lưu nhật ký vào lịch sử quyết định và hiển thị thông báo thành công. |
| 5.3. Tại mốc T-7 (hạn chốt), số khách quá thấp không đủ bù đắp chi phí đoàn, Quản lý nhập lý do và nhấn “✖ Đóng / Hủy tour”. | 5.4. Hệ thống chuyển trạng thái vận hành sang Đã hủy (`Cancelled`), chuyển trạng thái mở bán sang Đã đóng (`Closed`), lưu nhật ký vào lịch sử quyết định và hiển thị thông báo thành công. |
| 5.5. Quản lý muốn chốt sổ không nhận thêm khách mới cận ngày khởi hành, nhấn “🔒 Đóng Booking”. | 5.6. Hệ thống chuyển trạng thái mở bán sang Đã đóng (`Closed`), lưu nhật ký vào lịch sử quyết định và thông báo thành công. |
| 3.1. Quản lý xem lại lịch sử các quyết định đã ban hành cho đợt khởi hành. | 3.2. Hệ thống trích xuất và hiển thị danh sách dòng thời gian gồm thời điểm, người thực hiện, hành động và ghi chú giải trình. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 7.1. Lỗi kết nối máy chủ khi lưu quyết định.<br>Hệ thống giữ nguyên trạng thái cũ và hiển thị cảnh báo: “Có lỗi xảy ra khi lưu quyết định.”. |
| **– Quy tắc nghiệp vụ:** | |
| • *Mốc thời gian T-21, T-14, T-7:* Được hệ thống tính toán động dựa trên số ngày còn lại đến ngày khởi hành để hỗ trợ Quản lý tour theo dõi và đưa ra quyết định kịp thời.<br>• *Lịch sử quyết định:* Mọi thao tác xác nhận, theo dõi, đóng hoặc hủy đợt khởi hành đều được lưu vết chi tiết phục vụ kiểm tra và thanh tra nghiệp vụ.<br>• *Giới hạn thực tế:* Hệ thống không tự động gửi thông báo hay tự động hoàn tiền khi hủy đợt khởi hành; các công việc liên hệ khách và hoàn tiền do nhân viên thực hiện thủ công ngoài luồng này. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-TM-09: XEM BÁO CÁO THỐNG KÊ

| Quản lý tour | System |
| :--- | :--- |
| **– Tên use case: Xem báo cáo thống kê** | |
| **– Mã use case:** `UC-TM-09` | |
| **– Mục tiêu:** Cho phép Quản lý tour theo dõi các chỉ tiêu tổng hợp về hoạt động kinh doanh lữ hành, tiến độ hoàn thành các chuyến đi của Hướng dẫn viên, duyệt báo cáo kết thúc tour của HDV, thống kê sự cố toàn hệ thống, theo dõi nhân sự nghỉ phép và xuất báo cáo doanh thu ra định dạng tệp PDF. | |
| **– Mô tả sơ lược:** Quản lý tour truy cập trung tâm báo cáo điều hành tại giao diện `GeneralOverview.jsx`, xem xét 5 phân hệ báo cáo chuyên đề, thực hiện duyệt báo cáo chuyến đi của Hướng dẫn viên và xuất tệp báo cáo PDF. | |
| **– Actor chính:** Quản lý tour | |
| **– Actor phụ:** Hướng dẫn viên, Admin | |
| **– Tiền điều kiện (Pre-condition):** Quản lý tour đã đăng nhập vào hệ thống với vai trò Quản lý tour hoặc Quản trị viên. | |
| **– Hậu điều kiện (Post-condition):** Báo cáo chuyến đi của Hướng dẫn viên được cập nhật trạng thái đã duyệt trong hệ thống. Tệp báo cáo PDF được kết xuất về máy của người dùng. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Tổng quan & Báo cáo” trên thanh điều hướng. | 2. Hệ thống hiển thị bảng điều khiển trung tâm với 5 chuyên đề báo cáo: Báo cáo chuyến đi HDV, Doanh thu & Bán vé, Thống kê nhân sự, Sự cố, và Chất lượng đối tác. |
| 3. Mặc định hệ thống mở chuyên đề Báo cáo chuyến đi HDV, hiển thị các chỉ số: Tổng số tour đã hoàn thành, Điểm đánh giá trung bình và danh sách báo cáo chuyến đi nộp về từ Hướng dẫn viên. | 4. Quản lý kiểm tra báo cáo chuyến đi của một Hướng dẫn viên và nhấn “Phê duyệt hoàn tất chuyến đi”. |
| 5. Quản lý xác nhận phê duyệt. | 6. Hệ thống cập nhật trạng thái báo cáo chuyến đi sang Đã duyệt và hiển thị thông báo “Đã phê duyệt hoàn tất chuyến đi!”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 2.1. Quản lý chuyển sang chuyên đề “Doanh Thu & Bán Vé (Xuất PDF)”. | 2.2. Hệ thống hiển thị bảng điều khiển doanh thu với tổng doanh thu thực tế, số vé đã bán và biểu đồ tăng trưởng. |
| 2.3. Quản lý nhấn nút “Tải File PDF”. | 2.4. Hệ thống chuyển đổi vùng nội dung báo cáo thành tệp tài liệu PDF và tự động tải xuống máy tính của người dùng. |
| 2.5. Quản lý chuyển sang chuyên đề Thống kê nhân sự hoặc Thống kê sự cố. | 2.6. Hệ thống hiển thị danh sách đơn nghỉ phép của nhân sự hoặc danh sách tổng hợp các sự cố phát sinh trên toàn hệ thống. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 2.4.1. Lỗi khi xuất tệp PDF.<br>Nếu quá trình tạo tệp PDF gặp lỗi, hệ thống tự động mở hộp thoại in của trình duyệt để người dùng in hoặc lưu tệp trực tiếp. |
| **– Quy tắc nghiệp vụ:** | |
| • Thao tác phê duyệt báo cáo chuyến đi của Hướng dẫn viên là một tác vụ hành chính được tích hợp chung trong màn hình báo cáo tổng quan.<br>• Chức năng xuất PDF được xử lý trực tiếp trên trình duyệt của người dùng để tải về tệp báo cáo nhanh chóng. | |

---

### PHẦN III. TỔNG KẾT VÀ KẾT LUẬN

Bộ tài liệu 9 bảng đặc tả Use Case trên phản ánh chân thực, chính xác và đầy đủ các nghiệp vụ thuộc phạm vi tác nhân **Quản lý tour (Tour Manager)** trong Hệ thống TravelVN ERP. Mọi luồng sự kiện chính, luồng thay thế, luồng ngoại lệ và quy tắc nghiệp vụ đều đã được chuẩn hóa theo đúng văn phong phân tích nghiệp vụ của Khóa luận tốt nghiệp ngành Hệ thống Thông tin, loại bỏ toàn bộ các chi tiết cài đặt kỹ thuật (như đường dẫn API, phương thức HTTP, tên bảng hay cột dữ liệu), sẵn sàng để đưa trực tiếp vào Chương 3 của Khóa luận tốt nghiệp.

---
*Tài liệu được kết xuất từ mã nguồn TravelVN ERP phục vụ Báo cáo Khóa luận Tốt nghiệp ngành Hệ thống Thông tin.*
