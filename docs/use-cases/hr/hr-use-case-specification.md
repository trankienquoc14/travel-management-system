# TÀI LIỆU ĐẶC TẢ USE CASE NGHIỆP VỤ (USE CASE SPECIFICATION)
## PHÂN HỆ: QUẢN LÝ NHÂN SỰ (HR MANAGEMENT) – TRAVELVN ERP

---

### PHẦN I. TỔNG QUAN PHẠM VI NGHIỆP VỤ

#### 1. Mục tiêu tài liệu
Tài liệu đặc tả này xác lập chi tiết các yêu cầu chức năng, luồng sự kiện và quy tắc nghiệp vụ cho **5 Use Case cơ sở** thuộc phạm vi tác nhân **Quản lý Nhân sự (HR Manager - Role ID: 2)** trong Hệ thống Quản trị và Điều hành Du lịch **TravelVN ERP**. Bản đặc tả được xây dựng theo chuẩn văn phong báo cáo phân tích thiết kế hệ thống trong Khóa luận tốt nghiệp ngành Hệ thống Thông tin, tập trung mô tả tương tác nghiệp vụ giữa người dùng và hệ thống, không đưa các chi tiết cài đặt kỹ thuật (như đường dẫn API, phương thức HTTP, tên bảng hay trường dữ liệu) vào luồng sự kiện.

#### 2. Danh mục 5 Use Case cơ sở của Quản lý Nhân sự

| STT | Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Tác nhân chính | Tác nhân phụ | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **`UC-HR-01`** | **Quản lý hồ sơ nhân sự** | Quản trị tổ chức & Nhân sự | Quản lý Nhân sự | Quản trị viên (Admin) | Cao |
| 2 | **`UC-HR-02`** | **Quản lý chấm công và ca làm việc** | Quản lý công & Thời gian | Quản lý Nhân sự | Toàn bộ nhân viên nội bộ | Cao |
| 3 | **`UC-HR-03`** | **Phê duyệt đơn nghỉ phép và giải trình chấm công** | Quản trị chế độ & Phép | Quản lý Nhân sự | Nhân viên gửi đơn | Cao |
| 4 | **`UC-HR-04`** | **Tính toán và quản lý bảng lương** | Đãi ngộ & Tiền lương | Quản lý Nhân sự | Kế toán, Toàn bộ nhân viên | Cao |
| 5 | **`UC-HR-05`** | **Đánh giá hiệu suất nhân sự** | Đánh giá & Phát triển nhân sự | Quản lý Nhân sự | Quản lý Tour, Admin | Trung bình |

> **Quy ước về chức năng nền tảng:**
> Chức năng *Đăng nhập*, *Đổi mật khẩu*, *Xem hồ sơ cá nhân* và *Điểm danh cá nhân qua GPS/Khuôn mặt* là các chức năng nền tảng dùng chung của toàn bộ cán bộ công nhân viên nội bộ, đóng vai trò là Tiền điều kiện kỹ thuật để Quản lý Nhân sự truy cập và thực thi các chức năng quản trị chuyên sâu.

---

### PHẦN II. ĐẶC TẢ CHI TIẾT 5 USE CASE CƠ SỞ

---

#### BẢNG ĐẶC TẢ USE CASE UC-HR-01: QUẢN LÝ HỒ SƠ NHÂN SỰ

| Quản lý Nhân sự | System |
| :--- | :--- |
| **– Tên use case: Quản lý hồ sơ nhân sự** | |
| **– Mã use case:** `UC-HR-01` | |
| **– Phân hệ nghiệp vụ:** Quản trị tổ chức & Hồ sơ nhân sự | |
| **– Mục tiêu:** Cho phép Quản lý Nhân sự theo dõi, khởi tạo, cập nhật và quản lý toàn bộ hồ sơ nhân viên trong doanh nghiệp theo từng vị trí phòng ban (Nhân viên văn phòng, Quản lý Tour, Hướng dẫn viên, Tài xế, Quản lý Nhân sự), hỗ trợ điều động và phân bổ nguồn lực vận hành tour du lịch. | |
| **– Mô tả sơ lược:** Quản lý Nhân sự truy cập giao diện “Quản lý Nhân sự” (`HREmployeeManagement.jsx`), tra cứu danh sách nhân sự hiện hành, thêm nhân sự mới vào hệ thống, điều chỉnh thông tin hồ sơ hoặc trạng thái công tác (Đang làm việc, Tạm ngưng, Đã khóa), xem lịch sử tham gia phục vụ đoàn tour của từng nhân viên. | |
| **– Actor chính:** Quản lý Nhân sự (HR Manager) | |
| **– Actor phụ:** Quản trị viên (Admin), Quản lý Tour | |
| **– Tiền điều kiện (Pre-condition):** Quản lý Nhân sự đã đăng nhập thành công vào hệ thống với tài khoản có quyền hạn quản trị nhân sự (`role_id = 2` hoặc `role_id = 1`). | |
| **– Hậu điều kiện (Post-condition):** Hồ sơ nhân sự mới được lưu trữ trong hệ thống và kích hoạt tài khoản; hoặc thông tin cá nhân/chức vụ/trạng thái công tác của nhân sự được cập nhật; hoặc tài khoản nhân viên bị vô hiệu hóa. | |
| **– Luồng sự kiện chính (main flow - Thêm mới nhân viên vào hệ thống):** | |
| 1. Chọn chức năng “Quản lý Nhân sự” (`hr_employees`) trên thanh điều hướng bên trái thuộc nhóm chức năng Quản lý Nhân sự. | 2. Hệ thống tải và hiển thị danh sách toàn bộ nhân sự công ty, bao gồm: Mã nhân viên, Họ và tên, Email, Số điện thoại, Vai trò/Chức danh, Giới tính, Ngày sinh, Trạng thái hoạt động và các nút thao tác. |
| 3. Quản lý Nhân sự nhấn nút “+ Thêm Nhân viên mới”. | 4. Hệ thống hiển thị biểu mẫu toàn trang “Thêm Nhân viên mới” với các trường thông tin cần thiết. |
| 5. Quản lý Nhân sự nhập thông tin hồ sơ: Họ và tên, Email công việc, Mật khẩu ban đầu, Số điện thoại, Chọn vị trí/vai trò công việc (Nhân viên văn phòng, Quản lý Tour, Hướng dẫn viên, Tài xế, Quản lý Nhân sự), Giới tính, Ngày tháng năm sinh và chọn Trạng thái kích hoạt (Đang hoạt động). | 6. Hệ thống tiếp nhận và hiển thị trực quan các giá trị vừa nhập trên biểu mẫu. |
| 7. Quản lý Nhân sự nhấn nút “Lưu thông tin”. | 8. Hệ thống kiểm tra tính hợp lệ của dữ liệu: Họ tên, email và mật khẩu không được để trống; định dạng email phải hợp lệ; kiểm tra tính duy nhất của email (không được trùng với tài khoản đã có trong hệ thống). |
| | 9. Hệ thống mã hóa mật khẩu bảo mật, lưu hồ sơ nhân sự mới vào cơ sở dữ liệu, kích hoạt quyền đăng nhập tương ứng với vai trò đã chọn, thông báo “Thêm nhân viên thành công!”, đóng biểu mẫu và làm mới danh sách nhân sự. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Quản lý Nhân sự muốn tìm kiếm nhân viên theo tên, email hoặc số điện thoại. | 3.2. Quản lý Nhân sự nhập từ khóa vào ô tìm kiếm. Hệ thống tự động lọc danh sách nhân sự trên bảng dữ liệu theo thời gian thực phù hợp với từ khóa đã nhập. |
| 3.3. Quản lý Nhân sự muốn cập nhật thông tin hồ sơ của một nhân viên hiện có. | 3.4. Quản lý Nhân sự nhấn nút “Chỉnh sửa” (✏️) tại dòng nhân viên tương ứng. Hệ thống hiển thị biểu mẫu cập nhật và nạp toàn bộ thông tin hiện tại của nhân viên (mật khẩu để trống nếu không thay đổi). |
| 3.5. Quản lý Nhân sự điều chỉnh các thông tin: Họ tên, Số điện thoại, Vai trò, Giới tính, Ngày sinh, Trạng thái làm việc (Đang hoạt động, Tạm ngưng, Đã khóa), nhập mật khẩu mới nếu muốn đặt lại mật khẩu và nhấn “Cập nhật”. | 3.6. Hệ thống kiểm tra tính hợp lệ, lưu thông tin điều chỉnh và thông báo “Cập nhật nhân viên thành công!”, đóng biểu mẫu và làm mới danh sách nhân sự. |
| 3.7. Quản lý Nhân sự muốn hủy thao tác khi đang ở biểu mẫu thêm mới hoặc cập nhật nhân viên. | 3.8. Quản lý Nhân sự nhấn nút “⬅ Quay lại danh sách”. Hệ thống đóng biểu mẫu toàn trang và quay trở về bảng danh sách nhân sự mà không lưu thay đổi. |
| 3.9. Quản lý Nhân sự muốn xóa một tài khoản nhân sự khỏi hệ thống. | 3.10. Quản lý Nhân sự nhấn nút “Xóa” (🗑️) tại dòng nhân viên tương ứng. Hệ thống hiển thị hộp thoại xác nhận: “Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.”. Quản lý Nhân sự xác nhận đồng ý. Hệ thống thực hiện xóa bản ghi nhân viên, thông báo “Xóa nhân viên thành công!” và làm mới bảng danh sách. |
| 3.11. Trường hợp không tìm thấy nhân viên phù hợp với từ khóa tìm kiếm. | 3.12. Bảng dữ liệu hiển thị dòng thông báo: “Không tìm thấy nhân viên nào phù hợp.”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Email bị trùng lặp với tài khoản đã tồn tại.<br>Hệ thống hiển thị thông báo lỗi: “Email đã tồn tại trên hệ thống! Vui lòng sử dụng địa chỉ email khác.” và giữ nguyên thông tin trên biểu mẫu để sửa đổi. |
| | 8.2. Để trống họ tên hoặc nhập sai định dạng số điện thoại/ngày sinh.<br>Hệ thống khoanh đỏ các trường vi phạm và thông báo yêu cầu bổ sung thông tin chính xác. |
| | 3.10.1. Nhân viên đang được phân công phụ trách tour du lịch chưa hoàn thành.<br>Hệ thống từ chối xóa tài khoản và thông báo: “Không thể xóa nhân viên đang có lịch trình tour hoạt động. Vui lòng chuyển trạng thái sang Tạm ngưng hoặc bàn giao tour trước.” |
| **– Quy tắc nghiệp vụ:** | |
| • **Phân quyền truy cập theo vai trò:** Nhân viên được tạo với vai trò nào sẽ chỉ được cấp quyền truy cập vào đúng phân hệ chức năng đó (Ví dụ: Hướng dẫn viên chỉ vào được Workspace Hướng dẫn viên, Nhân viên văn phòng chỉ vào được phân hệ Báo giá và Thiết kế tour).<br>• **Bảo toàn dữ liệu lịch sử:** Tài khoản nhân viên đã phát sinh lịch sử chấm công, bảng lương hoặc lịch trình dẫn tour sẽ được chuyển trạng thái sang “Đã khóa” (`Blocked`) hoặc “Tạm ngưng” (`Inactive`) thay vì xóa cứng khỏi cơ sở dữ liệu nhằm bảo đảm toàn vẹn báo cáo kiểm toán.<br>• **Tính duy nhất của định danh:** Mỗi nhân viên sở hữu duy nhất một địa chỉ email định danh trong toàn hệ thống. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-HR-02: QUẢN LÝ CHẤM CÔNG VÀ CA LÀM VIỆC

| Quản lý Nhân sự | System |
| :--- | :--- |
| **– Tên use case: Quản lý chấm công và ca làm việc** | |
| **– Mã use case:** `UC-HR-02` | |
| **– Phân hệ nghiệp vụ:** Quản lý công & Thời gian làm việc | |
| **– Mục tiêu:** Cho phép Quản lý Nhân sự giám sát dữ liệu chấm công hàng ngày và tổng hợp tháng của toàn bộ nhân viên nội bộ (tích hợp GPS và nhận diện khuôn mặt), theo dõi tỷ lệ chuyên cần, thiết lập ca làm việc và điều chỉnh công thủ công khi có sai sót. | |
| **– Mô tả sơ lược:** Quản lý Nhân sự truy cập chức năng “Quản lý Chấm công” (`HRAttendance.jsx`), theo dõi 4 thẻ chỉ số KPI tổng hợp, xem bảng chấm công dạng lưới cả tháng của toàn thể nhân sự theo từng ngày từ 1 đến 31, tra cứu chi tiết giờ vào/ra, thiết lập ca làm việc của doanh nghiệp và xuất báo cáo chấm công ra tệp Excel. | |
| **– Actor chính:** Quản lý Nhân sự (HR Manager) | |
| **– Actor phụ:** Toàn bộ nhân viên nội bộ (đối tượng được chấm công) | |
| **– Tiền điều kiện (Pre-condition):** Quản lý Nhân sự đã đăng nhập hệ thống. Nhân viên đã thực hiện điểm danh qua ứng dụng di động/web (hoặc hệ thống đã khởi tạo danh sách điểm danh cho ngày làm việc). | |
| **– Hậu điều kiện (Post-condition):** Bảng công tháng được cập nhật chính xác làm căn cứ tính lương; các điều chỉnh thủ công hoặc cấu hình ca làm việc mới được lưu trữ trong hệ thống. | |
| **– Luồng sự kiện chính (main flow - Giám sát bảng tổng hợp chấm công tháng):** | |
| 1. Chọn chức năng “Quản lý Chấm công” (`hr_attendance`) trên thanh điều hướng bên trái. | 2. Hệ thống tải dữ liệu chấm công tháng hiện tại, hiển thị 4 thẻ chỉ số KPI: Số nhân viên đã có dữ liệu chấm công, Số lượng có mặt (đúng giờ & đi muộn), Số lượng chưa đủ vào/ra, Số lượng vắng (vắng mặt & nghỉ phép). |
| 3. Quản lý Nhân sự xem tab mặc định “Tổng hợp theo nhân viên (Bảng tháng)”. | 4. Hệ thống hiển thị bảng ma trận chấm công toàn diện: mỗi dòng là một nhân viên (kèm chức danh và email), các cột là các ngày trong tháng (từ ngày 1 đến ngày 28/30/31 kèm nhãn Thứ trong tuần: T2, T3, ..., CN). Mỗi ô thể hiện biểu tượng trạng thái trực quan: Có mặt (Xanh lá), Đi muộn (Vàng), Nghỉ phép (Tím), Vắng mặt (Đỏ) hoặc Chưa chấm. |
| 5. Quản lý Nhân sự chọn xem tháng và năm khác qua bộ chọn tháng/năm ở đầu trang để kiểm tra lịch sử công của các kỳ trước. | 6. Hệ thống tự động tính toán lại số ngày trong tháng và tải lại ma trận chấm công tương ứng theo tháng/năm vừa chọn. |
| 7. Quản lý Nhân sự nhấn nút “📥 Xuất Excel (CSV)”. | 8. Hệ thống tổng hợp toàn bộ dữ liệu chấm công của tháng, định dạng chuẩn Unicode UTF-8 kèm BOM và tự động tải tệp `Bao_cao_cham_cong_Thang_X_YYYY.csv` về máy tính của người dùng. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Quản lý Nhân sự chuyển sang tab “Chi tiết theo ngày (Điểm danh)” để theo dõi cụ thể tình hình làm việc của một ngày được chọn. | 3.2. Hệ thống hiển thị danh sách nhân sự trong ngày kèm thông tin chi tiết: Giờ vào (`check_in`), Giờ ra (`check_out`), Tổng số giờ làm việc thực tế, Tọa độ GPS & Địa chỉ điểm danh, Ảnh nhận diện khuôn mặt và Trạng thái xác thực. |
| 3.3. Quản lý Nhân sự muốn điều chỉnh giờ chấm công hoặc chấm bổ sung thủ công cho một nhân viên bị sự cố thiết bị. | 3.4. Quản lý Nhân sự chọn trạng thái mới (Có mặt, Đi muộn, Nghỉ phép, Vắng), điều chỉnh giờ vào/giờ ra và nhập ghi chú lý do hiệu chỉnh. |
| 3.5. Quản lý Nhân sự nhấn “Lưu bảng chấm công”. | 3.6. Hệ thống cập nhật bản ghi chấm công vào cơ sở dữ liệu và hiển thị thông báo thành công. |
| 3.7. Quản lý Nhân sự nhấn nút “⚙️ Thiết lập ca làm” để cấu hình ca làm việc của doanh nghiệp. | 3.8. Hệ thống mở cửa sổ thiết lập ca làm việc, hiển thị danh sách ca hiện có (Ca hành chính 08:00 - 17:00, Ca sáng, Ca chiều, Thời gian ân hạn 15 phút, Các ngày áp dụng). Quản lý Nhân sự có thể thêm ca mới hoặc chỉnh sửa giờ quy chuẩn và lưu thiết lập. |
| 3.9. Quản lý Nhân sự nhấn “📊 Thống kê chấm công & Biểu đồ” để xem báo cáo trực quan tỷ lệ đi làm đúng giờ, đi muộn và nghỉ việc toàn công ty. | 3.10. Hệ thống hiển thị biểu đồ phân bố chuyên cần theo từng phòng ban và chức danh. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Lỗi mạng hoặc cơ sở dữ liệu chưa sẵn sàng bảng chấm công.<br>Hệ thống hiển thị thông báo cảnh báo và cung cấp hướng dẫn khởi tạo bảng dữ liệu. |
| | 3.5.1. Giờ ra trước giờ vào khi chấm công thủ công.<br>Hệ thống cảnh báo lỗi: “Giờ ra không thể sớm hơn giờ vào! Vui lòng kiểm tra lại.” |
| **– Quy tắc nghiệp vụ:** | |
| • **Quy chuẩn tính công:** 1 ngày công chuẩn tính cho nhân viên có đủ lượt check-in và check-out với thời gian làm việc từ 7.5 giờ trở lên. Đi muộn trong giới hạn ân hạn (15 phút) vẫn được bảo toàn công nhưng được gắn cờ `Late` để phục vụ xét thi đua.<br>• **Ngày làm việc tiêu chuẩn:** Tháng tiêu chuẩn tính 26 ngày công làm việc (nghỉ ngày Chủ nhật, Thứ 7 làm nửa ngày hoặc làm cách tuần tùy cấu hình ca).<br>• **Chống gian lận điểm danh:** Dữ liệu check-in tự động bắt buộc phải ghi nhận tọa độ định vị GPS hợp lệ trong bán kính văn phòng/điểm đón khách và tỷ lệ nhận diện khuôn mặt khớp với ảnh hồ sơ. Mọi sửa đổi thủ công bởi Quản lý Nhân sự đều được ghi nhận dấu vết trong trường ghi chú. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-HR-03: PHÊ DUYỆT ĐƠN NGHỈ PHÉP VÀ GIẢI TRÌNH CHẤM CÔNG

| Quản lý Nhân sự | System |
| :--- | :--- |
| **– Tên use case: Phê duyệt đơn nghỉ phép và giải trình chấm công** | |
| **– Mã use case:** `UC-HR-03` | |
| **– Phân hệ nghiệp vụ:** Quản trị chế độ & Phép nhân viên | |
| **– Mục tiêu:** Cho phép Quản lý Nhân sự tiếp nhận, thẩm định chứng từ minh chứng và đưa ra quyết định (Phê duyệt hoặc Từ chối) đối với các đơn xin nghỉ phép trong tương lai hoặc đơn giải trình quên chấm công/đi muộn của nhân viên các phòng ban; tự động cập nhật kết quả vào bảng chấm công thời gian thực. | |
| **– Mô tả sơ lược:** Quản lý Nhân sự truy cập tab “Quản lý đơn” trên giao diện chấm công hoặc phân hệ Đơn từ (`HRLeaveRequest.jsx` ở chế độ `approval`), rà soát các đơn đang ở trạng thái Chờ duyệt (`Pending`), kiểm tra lý do và chứng từ đính kèm, thực hiện Duyệt hoặc Từ chối kèm ý kiến chỉ đạo. | |
| **– Actor chính:** Quản lý Nhân sự (HR Manager) | |
| **– Actor phụ:** Nhân viên nộp đơn | |
| **– Tiền điều kiện (Pre-condition):** Quản lý Nhân sự đã đăng nhập hệ thống. Nhân viên đã tạo và gửi đơn nghỉ phép hoặc đơn giải trình lên hệ thống. | |
| **– Hậu điều kiện (Post-condition):** Trạng thái đơn chuyển sang Đã duyệt (`Approved`) hoặc Đã từ chối (`Rejected`); hệ thống tự động đồng bộ ngày nghỉ hoặc giờ công bổ sung vào bảng chấm công (`timekeeping`) của nhân viên tương ứng. | |
| **– Luồng sự kiện chính (main flow - Phê duyệt đơn xin nghỉ phép):** | |
| 1. Chọn tab “Quản lý đơn” (`requests`) trong giao diện Chấm công hoặc mở phân hệ Đơn xin nghỉ phép với vai trò Quản lý. | 2. Hệ thống tải toàn bộ danh sách đơn từ của nhân sự, ưu tiên hiển thị các đơn đang ở trạng thái “Chờ duyệt” (`Pending`) lên đầu, kèm thông tin: Mã đơn, Nhân viên nộp đơn, Chức danh, Loại đơn (Nghỉ phép tương lai / Giải trình quá khứ), Loại nghỉ phép (Phép năm, Nghỉ ốm, Việc riêng, Nghỉ bù), Khoảng thời gian xin nghỉ, Lý do và Trạng thái. |
| 3. Quản lý Nhân sự nhấn vào dòng đơn cần xử lý để xem chi tiết. | 4. Hệ thống hiển thị cửa sổ thẩm định chi tiết đơn: Thông tin nhân viên, loại phép, thời gian nghỉ (từ ngày đến ngày, tổng số ngày nghỉ), lý do xin nghỉ và liên kết xem chứng từ đính kèm (giấy khám bệnh của bệnh viện, vé tàu xe, ảnh minh chứng sự cố thiết bị...). |
| 5. Quản lý Nhân sự kiểm tra quỹ phép năm còn lại và tính hợp lệ của hồ sơ minh chứng, nhập ý kiến phê duyệt vào ô “Ý kiến của Quản lý” (ví dụ: “Đồng ý cho nghỉ phép theo chế độ”). | 6. Hệ thống tiếp nhận ghi chú quản lý. |
| 7. Quản lý Nhân sự nhấn nút “✅ Phê duyệt”. | 8. Hệ thống kiểm tra trạng thái đơn hợp lệ. |
| | 9. Hệ thống cập nhật trạng thái đơn thành Đã duyệt (`Approved`), lưu mã người duyệt và ý kiến chỉ đạo. Đồng thời, hệ thống tự động lặp qua từng ngày trong khoảng thời gian nghỉ đã duyệt, ghi nhận trạng thái Nghỉ phép (`Leave`) vào bảng chấm công (`timekeeping`) của nhân viên. Hệ thống thông báo thành công và cập nhật số đơn chờ duyệt. |
| **– Luồng sự kiện thay thế (alternate flow - Từ chối đơn hoặc Phê duyệt giải trình chấm công):** | |
| 7.1. Quản lý Nhân sự nhận thấy đơn không hợp lệ (không có minh chứng, lý do không chính đáng hoặc trùng vào đợt cao điểm tour không đủ người trực). | 7.2. Quản lý Nhân sự nhập lý do từ chối cụ thể vào ô ý kiến quản lý và nhấn nút “❌ Từ chối”. |
| 7.3. Hệ thống kiểm tra: Ý kiến giải thích khi từ chối không được để trống. | 7.4. Hệ thống cập nhật trạng thái đơn thành Đã từ chối (`Rejected`), không làm thay đổi bảng chấm công và gửi thông báo phản hồi cho nhân viên. |
| 3.1. Đơn cần duyệt là “Giải trình chấm công quá khứ” (`Past_Explanation` - Quên check-in/out, lỗi GPS khi đi tour). | 3.2. Quản lý Nhân sự kiểm tra ngày giải trình, giờ vào/giờ ra đề xuất và minh chứng đính kèm (ảnh chụp tại điểm đến, xác nhận của Quản lý Tour). |
| 3.3. Khi nhấn “Phê duyệt”, hệ thống tự động cập nhật giờ vào, giờ ra đề xuất vào bảng chấm công (`timekeeping`) của ngày đó, tự động xếp trạng thái Đúng giờ (`Present`) nếu giờ vào hợp lệ (trước 08:15) hoặc Đi muộn (`Late`). | 3.4. Hệ thống lưu vết ghi chú: “Đã bổ sung giờ công theo đơn giải trình #ID”. |
| 3.5. Quản lý Nhân sự sử dụng bộ lọc để xem các đơn theo trạng thái (Tất cả, Chờ duyệt, Đã duyệt, Đã từ chối) hoặc loại đơn (Nghỉ phép, Giải trình). | 3.6. Hệ thống lọc và hiển thị danh sách đơn tương ứng. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 7.3.1. Để trống ý kiến giải thích khi từ chối đơn.<br>Hệ thống cảnh báo: “Vui lòng nhập lý do từ chối để nhân viên nắm rõ thông tin!”. |
| | 8.1. Đơn đã được duyệt hoặc hủy bởi một quản trị viên khác trước đó.<br>Hệ thống cảnh báo trạng thái mới nhất và không cho phép ghi đè thao tác trùng lặp. |
| **– Quy tắc nghiệp vụ:** | |
| • **Tự động đồng bộ liên kết bảng công:** Việc phê duyệt đơn nghỉ phép hoặc giải trình chấm công phải lập tức cập nhật trạng thái ngày công tương ứng trong bảng chấm công (`timekeeping`) nhằm loại bỏ việc nhập liệu thủ công lặp lại của bộ phận nhân sự.<br>• **Thời hạn giải trình:** Đơn giải trình quên chấm công trong quá khứ chỉ được nộp trong vòng tối đa 3 ngày làm việc kể từ ngày phát sinh sự cố.<br>• **Quy chế tính ngày phép:** Nghỉ phép năm được hưởng nguyên lương (tính đủ công theo quy định); nghỉ không phép hoặc việc riêng vượt quỹ phép bị trừ lương tương ứng trong bảng lương tháng. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-HR-04: TÍNH TOÁN VÀ QUẢN LÝ BẢNG LƯƠNG

| Quản lý Nhân sự | System |
| :--- | :--- |
| **– Tên use case: Tính toán và quản lý bảng lương** | |
| **– Mã use case:** `UC-HR-04` | |
| **– Phân hệ nghiệp vụ:** Đãi ngộ & Tiền lương (C&B) | |
| **– Mục tiêu:** Cho phép Quản lý Nhân sự tự động hóa quy trình tính lương hàng tháng cho toàn bộ các vị trí nhân sự nội bộ (Khối văn phòng, Quản lý Tour, Hướng dẫn viên, Tài xế) dựa trên số ngày công thực tế từ bảng chấm công, thù lao theo thiết kế tour và công tác phí lái xe; cho phép hiệu chỉnh phụ cấp, thưởng, khấu trừ, cập nhật trạng thái chi trả và in phiếu lương chi tiết cho từng nhân viên. | |
| **– Mô tả sơ lược:** Quản lý Nhân sự truy cập chức năng “Tính lương Nhân sự” (`HRPayroll.jsx`), chọn tháng kỳ lương (`YYYY-MM`), hệ thống tự động tổng hợp dữ liệu từ bảng chấm công và lịch trình điều hành tour thực tế; Quản lý Nhân sự kiểm tra, điều chỉnh các khoản thưởng/phạt, chuyển đổi trạng thái (Nháp / Đã trả), lưu bảng lương tháng và xuất/in phiếu lương thanh toán (`Pay Slip`) cho người lao động. | |
| **– Actor chính:** Quản lý Nhân sự (HR Manager) | |
| **– Actor phụ:** Quản trị viên (Admin) | |
| **– Tiền điều kiện (Pre-condition):** Quản lý Nhân sự đã đăng nhập vào hệ thống với vai trò Quản lý nhân sự (`role_id = 2`) hoặc Quản trị viên (`role_id = 1`). | |
| **– Hậu điều kiện (Post-condition):** Dữ liệu bảng lương tháng được lưu vào bảng cơ sở dữ liệu `payroll`; hoặc phiếu lương chi tiết được in ra cho nhân sự. | |
| **– Luồng sự kiện chính (main flow - Tính và lưu bảng lương tháng):** | |
| 1. Chọn chức năng “Tính lương Nhân sự” (`hr_payroll`) trên thanh điều hướng bên trái. | 2. Hệ thống tải dữ liệu bảng lương của tháng hiện tại (`YYYY-MM`), hiển thị: Bộ chọn tháng (`type="month"`), Khung tóm tắt chính sách tính lương theo từng vị trí công việc, và Bảng lương nhân sự với các cột: Nhân viên & Vai trò (kèm huy hiệu vai trò và ghi chú gợi ý), Lương cơ bản, Ngày công, Phụ cấp, Thưởng, Khấu trừ, Thực lĩnh, Trạng thái (Nháp / Đã trả) và nút thao tác “Phiếu lương”. |
| 3. Quản lý Nhân sự chọn tháng cần tính lương từ bộ chọn tháng (ví dụ: `2026-11`). | 4. Hệ thống nạp danh sách toàn bộ nhân sự nội bộ đang hoạt động và tự động tính toán số liệu ban đầu:<br>• **Khối Văn phòng (HR, Quản lý Tour, Nhân viên VP):** Lấy lương cơ bản chức danh (HR: 12tr, Tour Manager: 10tr, Staff: 8tr), số ngày công thực tế lấy từ bảng chấm công `timekeeping` (mặc định 26 ngày nếu chưa có dữ liệu): `Thực lĩnh = (Lương cơ bản / 26) × Ngày công`<br>• **Hướng dẫn viên (Tour Guide):** Tự động truy vấn các tour đã dẫn trong tháng từ bảng `departures` và `tours`, lấy đơn giá dẫn tour từ thiết kế tour (`guidePerDay`) nhân với số ngày dẫn tour thực tế: `Thù lao tour = Tổng (Số ngày × Đơn giá ngày)`, hiển thị ở cột Lương cơ bản/Thù lao tour, và tổng số ngày dẫn tour ở cột Ngày công.<br>• **Tài xế (Driver):** Lương cứng bảo dưỡng trực xe mặc định 5.000.000 ₫; truy vấn các chuyến xe tour phục vụ trong tháng, tính công tác phí 400.000 ₫/ngày tour hiển thị tại cột Phụ cấp: `Tổng phụ cấp = Số ngày chạy × 400.000 ₫`<br>*(Nếu kỳ lương đã được lưu trước đó trong bảng `payroll`, hệ thống ưu tiên nạp lại nguyên vẹn các số liệu đã lưu).* |
| 5. Quản lý Nhân sự rà soát bảng lương và có thể điều chỉnh trực tiếp trên các ô nhập số: Lương cơ bản, Ngày công, Phụ cấp, Thưởng, Khấu trừ và lựa chọn Trạng thái (“Nháp” hoặc “Đã trả”). | 6. Hệ thống tự động tính toán lại giá trị cột “Thực lĩnh” ngay tức thời khi người dùng thay đổi số liệu theo công thức tương ứng của từng vai trò:<br>• Hướng dẫn viên và Tài xế: `Thực lĩnh = Lương cơ bản + Phụ cấp + Thưởng – Khấu trừ`<br>• Khối văn phòng: `Thực lĩnh = (Lương cơ bản / 26) × Ngày công + Phụ cấp + Thưởng – Khấu trừ` |
| 7. Quản lý Nhân sự nhấn nút “Lưu bảng lương”. | 8. Hệ thống kiểm tra tính hợp lệ của toàn bộ mảng dữ liệu bảng lương tháng. |
| | 9. Hệ thống gửi yêu cầu lên máy chủ (`POST /api/hr/payroll`), lưu các bản ghi vào bảng `payroll` trong cơ sở dữ liệu, hiển thị thông báo thành công: “Lưu bảng lương tháng thành công!” và tải lại bảng lương mới nhất. |
| **– Luồng sự kiện thay thế (alternate flow - Xem và in phiếu lương chi tiết):** | |
| 3.1. Quản lý Nhân sự muốn xem chi tiết các khoản thu nhập hoặc in phiếu lương cho một nhân viên cụ thể. | 3.2. Quản lý Nhân sự nhấn nút “Phiếu lương” tại dòng nhân viên tương ứng. |
| 3.3. Hệ thống mở cửa sổ Modal “PHIẾU THANH TOÁN LƯƠNG NHÂN SỰ - THÁNG YYYY-MM”, hiển thị:<br>• Thông tin doanh nghiệp và nhân sự: Họ tên, Chức danh / Vai trò, Email, Ghi chú.<br>• Nếu là Hướng dẫn viên: Bảng kê chi tiết các tour dẫn trong tháng (Tên tour, Ngày khởi hành, Số ngày, Giá thiết kế / ngày, Thù lao tour) hoặc thông báo nếu chưa có lịch tour.<br>• Nếu là Tài xế: Bảng kê chi tiết các chuyến xe phục vụ tour trong tháng (Chuyến tour, Xe phục vụ, Ngày khởi hành, Số ngày, Phụ cấp chuyến 400k/ngày) hoặc thông báo nếu chưa có chuyến xe.<br>• Khối tổng hợp thanh toán: Diễn giải Lương cơ bản / Thù lao tour, Số ngày làm việc/đi tour, Lương theo công thực tế (với khối văn phòng), Phụ cấp, Thưởng, Khấu trừ và Thực lĩnh nhận về định dạng tiền tệ VNĐ.<br>• Khung chữ ký xác nhận của Người nhận và Người lập bảng lương (Phòng Nhân Sự TravelVN). | 3.4. Quản lý Nhân sự nhấn nút “In phiếu lương”. Hệ thống gọi lệnh in của trình duyệt (`window.print()`) để in phiếu lương ra giấy hoặc xuất tệp PDF. |
| 3.5. Quản lý Nhân sự nhấn nút “Đóng” để đóng cửa sổ modal phiếu lương và quay trở lại bảng lương. | |
| 3.6. Trường hợp không tìm thấy nhân viên nào để tính lương trong hệ thống. | 3.7. Bảng dữ liệu hiển thị dòng thông báo: “Không tìm thấy nhân viên nào để tính lương.”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Cơ sở dữ liệu chưa tạo bảng `payroll` (`needs_db_migration: true`).<br>Hệ thống hiển thị khung cảnh báo màu vàng: “⚠️ Cảnh báo: Cơ sở dữ liệu thiếu bảng 'payroll'” và khóa nút lưu bảng lương (“Không thể lưu! Vui lòng tạo bảng 'payroll' trong CSDL trước.”). |
| | 8.2. Khi Quản lý Nhân sự xóa trắng ô nhập số hoặc nhập giá trị không phải số.<br>Hệ thống tự động quy về giá trị 0 và tự động tính toán lại cột Thực lĩnh ngay lập tức. |
| | 8.3. Lỗi mạng hoặc lỗi máy chủ khi nạp hoặc lưu bảng lương.<br>Hệ thống hiển thị thông báo lỗi màu đỏ ở đầu bảng và giữ nguyên dữ liệu hiện có trên giao diện để người dùng không bị mất thông tin. |
| **– Quy tắc nghiệp vụ:** | |
| • **Cơ chế tính lương phân hóa đặc thù ngành du lịch:** Hệ thống áp dụng 3 cơ chế tính lương riêng biệt:<br>  + Khối văn phòng hưởng lương cơ bản theo ngày công chuẩn 26 ngày: `(Lương cơ bản / 26) × Ngày công + Phụ cấp + Thưởng – Khấu trừ`<br>  + Hướng dẫn viên hưởng thù lao tour trực tiếp gắn liền với đơn giá thiết kế tour (`guidePerDay`) nhân với số ngày dẫn tour thực tế.<br>  + Tài xế hưởng lương cứng bảo dưỡng (5.000.000 ₫) cộng công tác phí chạy tour theo ngày (400.000 ₫/ngày).<br>• **Quản lý trạng thái bảng lương:** Mỗi dòng lương nhân sự quản lý 2 trạng thái: “Nháp” (`Draft`) và “Đã trả” (`Paid`).<br>• **Lưu trữ và tái nạp theo kỳ:** Bảng lương được lưu trữ theo tháng (`salary_month`: `YYYY-MM`) và mã nhân viên (`employee_id`). Khi chọn lại tháng đã lưu, hệ thống ưu tiên hiển thị số liệu đã lưu từ bảng `payroll` thay vì tính lại từ đầu. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-HR-05: ĐÁNH GIÁ HIỆU SUẤT NHÂN SỰ

| Quản lý Nhân sự | System |
| :--- | :--- |
| **– Tên use case: Đánh giá hiệu suất nhân sự** | |
| **– Mã use case:** `UC-HR-05` | |
| **– Phân hệ nghiệp vụ:** Đánh giá & Phát triển nhân sự (Performance Review) | |
| **– Mục tiêu:** Cho phép Quản lý Nhân sự định kỳ ghi nhận, chấm điểm đánh giá hiệu suất làm việc (KPI) và đóng góp của cán bộ nhân viên trong công ty; tạo cơ sở dữ liệu đánh giá phục vụ công tác xét thưởng, tăng bậc lương và quy hoạch đào tạo nhân lực. | |
| **– Mô tả sơ lược:** Quản lý Nhân sự truy cập chức năng “Đánh giá Hiệu suất” (`HRPerformanceReview.jsx`), xem bảng lịch sử đánh giá của toàn bộ nhân sự, tạo phiếu đánh giá mới cho nhân viên kèm thang điểm chuẩn và nhận xét chi tiết của ban quản lý. | |
| **– Actor chính:** Quản lý Nhân sự (HR Manager) | |
| **– Actor phụ:** Quản lý Tour, Quản trị viên (Admin), Nhân viên được đánh giá | |
| **– Tiền điều kiện (Pre-condition):** Quản lý Nhân sự đã đăng nhập hệ thống. Tài khoản nhân viên cần đánh giá đang ở trạng thái hoạt động trong hệ thống. | |
| **– Hậu điều kiện (Post-condition):** Bản ghi đánh giá hiệu suất được lưu trữ trong hệ thống và gắn liền với hồ sơ nhân sự của nhân viên. | |
| **– Luồng sự kiện chính (main flow - Tạo mới phiếu đánh giá hiệu suất nhân sự):** | |
| 1. Chọn chức năng “Đánh giá Hiệu suất” (`hr_performance`) trên thanh điều hướng bên trái. | 2. Hệ thống tải và hiển thị danh sách các phiếu đánh giá hiệu suất nhân viên đã có, bao gồm: Mã ID (`#ID`), Nhân viên, Chức vụ, Điểm số (thang điểm 100), Xếp loại (Xuất sắc, Tốt, Khá (Đạt), Trung bình, Yếu (Cần cải thiện)), Nhận xét của HR, Người đánh giá (HR) và Ngày đánh giá. |
| 3. Quản lý Nhân sự nhấn nút “+ Thêm Đánh giá”. | 4. Hệ thống hiển thị biểu mẫu toàn trang “Thêm Phiếu Đánh giá Hiệu suất Nhân viên” và nạp danh sách nhân sự công ty vào hộp chọn dropdown “Chọn Nhân viên cần đánh giá”. |
| 5. Quản lý Nhân sự chọn nhân viên cần đánh giá từ danh sách dropdown, nhập Điểm hiệu suất (số từ 0 đến 100), chọn Ngày đánh giá (mặc định là ngày hiện tại) và nhập nội dung Nhận xét chi tiết & Đánh giá năng lực vào ô văn bản. | 6. Hệ thống tiếp nhận các thông tin vừa nhập trên biểu mẫu. |
| 7. Quản lý Nhân sự nhấn nút “Đăng phiếu đánh giá”. | 8. Hệ thống kiểm tra tính hợp lệ của dữ liệu: Bắt buộc chọn nhân viên cần đánh giá; Điểm đánh giá phải là số từ 0 đến 100; Nội dung nhận xét chi tiết không được để trống. |
| | 9. Hệ thống gửi dữ liệu lên máy chủ, lưu bản ghi mới vào cơ sở dữ liệu, hiển thị thông báo: “Thêm đánh giá nhân sự thành công!”, đóng biểu mẫu toàn trang, làm mới bảng danh sách và hiển thị phiếu đánh giá mới ở đầu bảng. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Quản lý Nhân sự đang mở biểu mẫu “Thêm Phiếu Đánh giá Hiệu suất Nhân viên” nhưng muốn hủy bỏ thao tác lập phiếu đánh giá. | 3.2. Quản lý Nhân sự nhấn nút “Hủy bỏ” hoặc nút “⬅ Quay lại danh sách”. |
| 3.3. Hệ thống đóng biểu mẫu toàn trang và quay trở lại màn hình bảng danh sách đánh giá hiệu suất nhân viên mà không lưu bất kỳ dữ liệu nào. | |
| 3.4. Trường hợp hệ thống chưa ghi nhận bất kỳ phiếu đánh giá hiệu suất nào. | 3.5. Bảng danh sách hiển thị thông báo rỗng: “Chưa có phiếu đánh giá hiệu suất nào.”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Nhập điểm đánh giá không hợp lệ (nhỏ hơn 0, lớn hơn 100 hoặc không phải là số).<br>Hệ thống cảnh báo lỗi: “Điểm đánh giá phải là số từ 0 đến 100.” |
| | 8.2. Chưa chọn nhân viên cần đánh giá hoặc để trống ô nhận xét.<br>Hệ thống cảnh báo lỗi: “Vui lòng chọn nhân viên cần đánh giá.” hoặc “Vui lòng nhập nhận xét.” |
| | 8.3. Lỗi mạng hoặc máy chủ khi lưu phiếu đánh giá.<br>Hệ thống hiển thị thông báo lỗi từ máy chủ và giữ nguyên nội dung biểu mẫu để người dùng không bị mất dữ liệu đã nhập. |
| **– Quy tắc nghiệp vụ:** | |
| • **Chuẩn hóa thang điểm đánh giá:** Điểm đánh giá được chuẩn hóa trên thang điểm 100 điểm. Xếp loại tiêu chuẩn: Từ 90-100 điểm: Xuất sắc (`Excellent`); Từ 80-89 điểm: Tốt (`Good`); Từ 65-79 điểm: Khá (`Fair`); Từ 50-64 điểm: Trung bình (`Average`); Dưới 50 điểm: Cần cải thiện (`Needs Improvement`).<br>• **Nguyên tắc đánh giá minh bạch:** Bản đánh giá phải có nhận xét định tính cụ thể đi kèm điểm số định lượng, không được đánh giá chung chung.<br>• **Bảo lưu hồ sơ đánh giá:** Dữ liệu đánh giá hiệu suất được lưu trữ vĩnh viễn theo mã nhân viên để phục vụ quá trình xét nâng ngạch lương, thăng chức hoặc tái ký hợp đồng lao động. | |
