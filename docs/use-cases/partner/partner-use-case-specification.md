# TÀI LIỆU ĐẶC TẢ USE CASE NGHIỆP VỤ (USE CASE SPECIFICATION)
## PHÂN HỆ: CỔNG ĐỐI TÁC CUNG ỨNG (PARTNER PORTAL) – TRAVELVN ERP

---

### PHẦN I. TỔNG QUAN PHẠM VI NGHIỆP VỤ

#### 1. Mục tiêu tài liệu
Tài liệu đặc tả này xác lập chi tiết các yêu cầu chức năng, luồng sự kiện và quy tắc nghiệp vụ cho **3 Use Case cơ sở** thuộc phạm vi tác nhân **Đối tác cung ứng dịch vụ (Partner - Role ID: 7)** trong Hệ thống Quản trị và Điều hành Du lịch **TravelVN ERP**. Bản đặc tả được xây dựng theo chuẩn văn phong báo cáo phân tích thiết kế hệ thống trong Khóa luận tốt nghiệp ngành Hệ thống Thông tin, tập trung mô tả tương tác nghiệp vụ giữa người dùng và hệ thống, không đưa các chi tiết cài đặt kỹ thuật (như đường dẫn API, phương thức HTTP, tên bảng hay trường dữ liệu) vào luồng sự kiện.

#### 2. Danh mục 3 Use Case cơ sở của Đối tác

| STT | Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Tác nhân chính | Tác nhân phụ | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **`UC-PT-01`** | **Quản lý kho dịch vụ đối tác** | Quản lý danh mục dịch vụ | Đối tác | Quản lý tour | Cao |
| 2 | **`UC-PT-02`** | **Tiếp nhận và xử lý yêu cầu dịch vụ** | Điều phối & Cung ứng dịch vụ | Đối tác | Quản lý tour | Cao |
| 3 | **`UC-PT-03`** | **Xem tổng hợp cung cấp dịch vụ** | Báo cáo & Thống kê đối soát | Đối tác | Không | Trung bình |

> **Quy ước về chức năng nền tảng:**
> Chức năng *Đăng nhập*, *Đổi mật khẩu* và *Xem thông tin tài khoản* là các chức năng nền tảng dùng chung, đóng vai trò là Tiền điều kiện kỹ thuật để đối tác truy cập vào Cổng dịch vụ đối tác (Partner Portal).

---

### PHẦN II. ĐẶC TẢ CHI TIẾT 3 USE CASE CƠ SỞ

---

#### BẢNG ĐẶC TẢ USE CASE UC-PT-01: QUẢN LÝ KHO DỊCH VỤ ĐỐI TÁC

| Đối tác | System |
| :--- | :--- |
| **– Tên use case: Quản lý kho dịch vụ đối tác** | |
| **– Mã use case:** `UC-PT-01` | |
| **– Phân hệ nghiệp vụ:** Quản lý danh mục dịch vụ cung ứng | |
| **– Mục tiêu:** Cho phép Đối tác đăng ký, cập nhật và quản lý kho dịch vụ cung ứng (Khách sạn/Lưu trú, Nhà hàng/Ăn uống, Xe/Vận chuyển, Vé tham quan) của đơn vị mình lên hệ thống TravelVN ERP để phục vụ công tác thiết kế tour và liên kết cung ứng dịch vụ của công ty lữ hành. | |
| **– Mô tả sơ lược:** Đối tác truy cập chức năng “Kho Dịch vụ của tôi” (`PartnerInventory.jsx`), xem danh sách dịch vụ hiện có, đăng ký dịch vụ mới (ở trạng thái chờ duyệt), điều chỉnh đơn giá và số lượng cung cấp khả dụng đối với các dịch vụ đang mở bán, hoặc gỡ bỏ dịch vụ khỏi kệ hàng. | |
| **– Actor chính:** Đối tác (Partner) | |
| **– Actor phụ:** Quản lý tour, Quản trị viên (Admin) | |
| **– Tiền điều kiện (Pre-condition):** Đối tác đã đăng nhập thành công vào hệ thống với tài khoản thuộc nhóm đối tác cung ứng dịch vụ (`role_id = 7`). | |
| **– Hậu điều kiện (Post-condition):** Yêu cầu dịch vụ mới được lưu vào hệ thống ở trạng thái Chờ duyệt; hoặc thông tin giá/số lượng của dịch vụ hiện hành được cập nhật; hoặc dịch vụ được gỡ bỏ khỏi kho hàng. | |
| **– Luồng sự kiện chính (main flow - Đăng ký dịch vụ mới vào kho hàng):** | |
| 1. Chọn chức năng “Kho Dịch vụ của tôi” (`partner_inventory`) trên thanh điều hướng bên trái. | 2. Hệ thống tải và hiển thị danh sách các dịch vụ hiện có trong kho hàng của đối tác kèm thông tin: Hình ảnh đại diện, Tên dịch vụ, Đơn giá, Quỹ số lượng cung cấp tối đa, Trạng thái (Chờ duyệt, Đang bán) và các nút thao tác. |
| 3. Đối tác nhấn nút “+ Thêm Dịch vụ mới”. | 4. Hệ thống hiển thị biểu mẫu “Tạo Yêu Cầu Dịch Vụ Mới” và nạp danh mục các Tỉnh thành / Điểm đến du lịch khả dụng. |
| 5. Đối tác nhập thông tin chi tiết: Tên dịch vụ, Loại dịch vụ (Khách sạn/Lưu trú, Xe/Di chuyển, Nhà hàng/Ăn uống, Vé tham quan, Khác), Tỉnh thành / Điểm đến liên kết, Đơn vị tính (VD: Phòng/Đêm, Suất ăn), Sức chứa (VD: 2 người/phòng), Đơn giá đề xuất (VNĐ), Số lượng cung cấp tối đa, Mô tả dịch vụ và chọn hình ảnh đại diện từ máy tính. | 6. Hệ thống ghi nhận các thông tin vừa nhập trên biểu mẫu. |
| 7. Đối tác nhấn “Gửi Yêu Cầu Duyệt”. | 8. Hệ thống kiểm tra tính hợp lệ của dữ liệu: Tên dịch vụ, đơn giá đề xuất và số lượng cung ứng tối đa bắt buộc phải có; đơn giá và số lượng phải lớn hơn 0; dịch vụ không phải loại di chuyển bắt buộc phải chọn điểm đến. |
| | 9. Hệ thống lưu dịch vụ mới vào kho hàng của đối tác với trạng thái ban đầu là Chờ duyệt (`Pending`), tải lên tệp hình ảnh đại diện và hiển thị thông báo: “Đã gửi yêu cầu tạo dịch vụ thành công! Vui lòng chờ quản lý duyệt.”. Dịch vụ mới xuất hiện trong danh sách với nhãn “⏳ Chờ duyệt”. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 3.1. Đối tác muốn điều chỉnh đơn giá hoặc số lượng cung cấp tối đa của một dịch vụ đang mở bán (`Active`). | 3.2. Đối tác nhấn nút biểu tượng chỉnh sửa (✏️) tại dòng dịch vụ tương ứng. |
| 3.3. Hệ thống mở biểu mẫu “Cập nhật Giá & Số lượng”, điền sẵn mức giá và số lượng khả dụng hiện tại. | 3.4. Đối tác điều chỉnh mức giá mới và số lượng cung cấp mới, sau đó nhấn “Lưu Thay Đổi”. |
| 3.5. Hệ thống kiểm tra dữ liệu và lưu thông tin cập nhật, hiển thị thông báo “Đã cập nhật dịch vụ!” và làm mới bảng dữ liệu kho hàng. | |
| 3.6. Đối tác muốn ngừng cung cấp hoặc gỡ dịch vụ khỏi kệ hàng. | 3.7. Đối tác nhấn nút biểu tượng thùng rác (🗑️); hệ thống hiển thị hộp thoại xác nhận: “Bạn có chắc muốn xóa dịch vụ này khỏi kệ?”. |
| 3.8. Đối tác xác nhận đồng ý. | 3.9. Hệ thống xóa dịch vụ khỏi kho hàng của đối tác và thông báo: “Đã gỡ dịch vụ!”. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 8.1. Thiếu thông tin bắt buộc hoặc giá/số lượng không hợp lệ.<br>Hệ thống hiển thị cảnh báo yêu cầu điền đầy đủ thông tin hợp lệ. |
| | 8.2. Lỗi mạng hoặc lỗi máy chủ khi lưu dịch vụ.<br>Hệ thống hiển thị thông báo lỗi và giữ nguyên dữ liệu trên biểu mẫu để đối tác không bị mất thông tin đã nhập. |
| **– Quy tắc nghiệp vụ:** | |
| • **Kiểm duyệt chất lượng dịch vụ:** Dịch vụ mới do Đối tác tạo bắt buộc phải ở trạng thái Chờ duyệt (`Pending`) để Quản lý tour hoặc Quản trị viên thẩm định tiêu chuẩn chất lượng và giá cả trước khi đưa lên sàn dịch vụ mở bán (`Active`).<br>• **Quyền tự chủ về giá và quỹ số lượng:** Đối tác có toàn quyền linh hoạt điều chỉnh tăng/giảm đơn giá và số lượng cung cấp tối đa đối với các dịch vụ đang hoạt động (`Active`) nhằm phù hợp với chính sách kinh doanh và công suất thực tế theo từng thời điểm.<br>• **Ràng buộc địa phương:** Ngoại trừ loại dịch vụ di chuyển/xe đường dài có thể phục vụ liên tỉnh, các dịch vụ lưu trú, ăn uống và vé tham quan bắt buộc phải gắn với một Tỉnh thành / Điểm đến cụ thể trong hệ thống. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-PT-02: TIẾP NHẬN VÀ XỬ LÝ YÊU CẦU DỊCH VỤ

| Đối tác | System |
| :--- | :--- |
| **– Tên use case: Tiếp nhận và xử lý yêu cầu dịch vụ** | |
| **– Mã use case:** `UC-PT-02` | |
| **– Phân hệ nghiệp vụ:** Điều phối & Cung ứng dịch vụ du lịch | |
| **– Mục tiêu:** Cho phép Đối tác tiếp nhận, theo dõi chi tiết và đưa ra phản hồi (Chấp thuận hoặc Từ chối kèm lý do) đối với các yêu cầu cung cấp dịch vụ (phòng khách sạn, suất ăn nhà hàng, phương tiện vận chuyển ngoài) do Quản lý tour của công ty lữ hành gửi đến phục vụ các đoàn tour thực tế. | |
| **– Mô tả sơ lược:** Đối tác truy cập chức năng “Xử lý Yêu cầu dịch vụ” (`PartnerServiceRequests.jsx`), tra cứu danh sách yêu cầu được gửi tới đơn vị mình, kiểm tra năng lực đáp ứng thực tế theo ngày khởi hành/ngày về của đoàn tour và xác nhận Chấp nhận hoặc Từ chối cung ứng. | |
| **– Actor chính:** Đối tác (Partner) | |
| **– Actor phụ:** Quản lý tour | |
| **– Tiền điều kiện (Pre-condition):** Đối tác đã đăng nhập thành công vào hệ thống. Quản lý tour đã tạo và gửi nhóm yêu cầu dịch vụ (`UC-TM-01`) liên kết tới đối tác tương ứng. | |
| **– Hậu điều kiện (Post-condition):** Trạng thái yêu cầu dịch vụ được chuyển sang Đã chấp thuận (`Accepted`) hoặc Đã từ chối (`Rejected`); hệ thống tự động phát thông báo nội bộ cho Nhân viên văn phòng và Quản lý tour để phối hợp điều hành. | |
| **– Luồng sự kiện chính (main flow - Chấp nhận cung cấp dịch vụ cho đoàn tour):** | |
| 1. Chọn chức năng “Xử lý Yêu cầu dịch vụ” (`partner_requests`) trên thanh điều hướng bên trái. | 2. Hệ thống tải toàn bộ danh sách các yêu cầu dịch vụ gửi tới đối tác, hiển thị 4 thẻ thống kê: Yêu cầu chờ xử lý (`Pending`), Đã chấp nhận (`Accepted`), Đã từ chối (`Rejected`), Tổng số yêu cầu; cùng thanh tìm kiếm và các bộ lọc (loại dịch vụ, trạng thái, thời gian). |
| 3. Đối tác xem danh sách các yêu cầu đang ở trạng thái “Chờ xử lý” (được đánh dấu nổi bật) và nhấn nút “Xem chi tiết” tại một yêu cầu cần xử lý. | 4. Hệ thống hiển thị hộp thoại chi tiết yêu cầu cung cấp dịch vụ, bao gồm: Mã nhóm yêu cầu, Tên tour, Đợt khởi hành (ngày đi, ngày về), Loại dịch vụ, Số lượng suất/phòng/xe yêu cầu, Đơn giá dự kiến, Tổng giá trị tạm tính và ghi chú dặn dò của Quản lý tour. |
| 5. Đối tác kiểm tra công suất buồng phòng/bàn ăn/xe của đơn vị mình trong khoảng thời gian diễn ra tour và nhấn nút “Chấp nhận cung cấp”. | 6. Hệ thống hiển thị hộp thoại xác nhận cam kết cung ứng dịch vụ. |
| 7. Đối tác xác nhận đồng ý. | 8. Hệ thống kiểm tra tính hợp lệ và trạng thái yêu cầu. |
| | 9. Hệ thống cập nhật trạng thái yêu cầu dịch vụ sang Đã chấp thuận (`Accepted`), ghi nhận thời điểm chấp thuận, phát thông báo xác nhận tự động tới Quản lý tour và làm mới danh sách yêu cầu với nhãn xanh “✅ Đã chấp nhận”. |
| **– Luồng sự kiện thay thế (alternate flow - Từ chối cung cấp dịch vụ khi hết công suất):** | |
| 5.1. Đối tác kiểm tra và nhận thấy đơn vị đã hết phòng/hết bàn hoặc không thể đáp ứng được tiêu chuẩn dịch vụ theo yêu cầu của đoàn tour. | 5.2. Đối tác nhấn nút “Từ chối cung cấp”. |
| 5.3. Hệ thống hiển thị hộp thoại yêu cầu nhập lý do từ chối: “Vui lòng nhập lý do từ chối cung cấp dịch vụ”. | 5.4. Đối tác nhập lý do cụ thể (ví dụ: “Khách sạn đã kín phòng Standard trong giai đoạn ngày khởi hành này”) và nhấn “Xác nhận từ chối”. |
| 5.5. Hệ thống kiểm tra: Lý do từ chối không được để trống. | 5.6. Hệ thống cập nhật trạng thái yêu cầu sang Đã từ chối (`Rejected`), lưu trữ lý do từ chối, phát thông báo cảnh báo cho Quản lý tour để kịp thời tìm đối tác thay thế, và hiển thị nhãn đỏ “❌ Đã từ chối”. |
| 3.1. Đối tác sử dụng bộ lọc trạng thái để rà soát các yêu cầu đã chấp nhận hoặc đã từ chối trong quá khứ. | 3.2. Hệ thống lọc và hiển thị danh sách tương ứng, hỗ trợ đối tác tra cứu lịch sử phục vụ các đoàn tour. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 5.5.1. Để trống lý do khi từ chối dịch vụ.<br>Hệ thống cảnh báo: “Vui lòng nhập lý do từ chối!”. |
| | 8.1. Yêu cầu dịch vụ đã được xử lý trước đó hoặc bị đợt khởi hành hủy bỏ.<br>Hệ thống thông báo trạng thái hiện tại và ngăn chặn ghi đè thao tác. |
| **– Quy tắc nghiệp vụ:** | |
| • **Phân quyền theo nhóm đối tác (`partner_group`):** Đối tác chỉ được phép xem và xử lý các yêu cầu dịch vụ đúng với phân khúc chuyên môn của đơn vị mình (Khách sạn chỉ nhận yêu cầu lưu trú `HOTEL`, Nhà hàng chỉ nhận yêu cầu ăn uống `RESTAURANT`, Đơn vị vận chuyển chỉ nhận yêu cầu xe `TRANSPORTATION`).<br>• **Bắt buộc giải trình khi từ chối:** Khi từ chối cung cấp dịch vụ, Đối tác bắt buộc phải nhập lý do giải trình rõ ràng để làm căn cứ cho công ty lữ hành điều chuyển yêu cầu dịch vụ sang đối tác dự phòng (`UC-TM-01`).<br>• **Tính ràng buộc của xác nhận chấp thuận:** Khi Đối tác đã bấm “Chấp nhận cung cấp”, thỏa thuận cung ứng dịch vụ được xác lập trong hệ thống phục vụ công tác đối soát công nợ và quyết toán đoàn tour. | |

---

#### BẢNG ĐẶC TẢ USE CASE UC-PT-03: XEM TỔNG HỢP CUNG CẤP DỊCH VỤ

| Đối tác | System |
| :--- | :--- |
| **– Tên use case: Xem tổng hợp cung cấp dịch vụ** | |
| **– Mã use case:** `UC-PT-03` | |
| **– Phân hệ nghiệp vụ:** Báo cáo & Thống kê đối soát công nợ | |
| **– Mục tiêu:** Cho phép Đối tác theo dõi bức tranh tổng hợp về khối lượng dịch vụ đã nhận cung cấp và đang chờ xử lý theo từng đợt khởi hành của các tour du lịch, hỗ trợ đơn vị chủ động điều phối buồng phòng/suất ăn/xe và đối soát số liệu quyết toán tài chính với công ty lữ hành. | |
| **– Mô tả sơ lược:** Đối tác truy cập chức năng “Tổng hợp cung cấp dịch vụ” (`PartnerServiceSummary.jsx`), theo dõi bảng tổng hợp số lượng dịch vụ theo từng chuyến tour (phân rã chi tiết theo loại phòng khách sạn, số suất ăn nhà hàng hoặc số lượt xe), xem lịch sử các đợt đặt ban đầu và đợt bổ sung tăng khách cận ngày. | |
| **– Actor chính:** Đối tác (Partner) | |
| **– Actor phụ:** Không | |
| **– Tiền điều kiện (Pre-condition):** Đối tác đã đăng nhập thành công vào hệ thống. Đơn vị đã có các yêu cầu dịch vụ liên kết với các đợt khởi hành. | |
| **– Hậu điều kiện (Post-condition):** Bảng tổng hợp số lượng dịch vụ được hiển thị trực quan và chi tiết theo thời gian thực; đối tác nắm bắt chính xác công suất phục vụ để chuẩn bị nguồn lực. | |
| **– Luồng sự kiện chính (main flow):** | |
| 1. Chọn chức năng “Tổng hợp cung cấp dịch vụ” (`partner_summary`) trên thanh điều hướng bên trái. | 2. Hệ thống tải dữ liệu và hiển thị bảng tổng hợp cung cấp dịch vụ nhóm theo từng Đợt khởi hành và Tuyến tour, bao gồm: Tên tour, Ngày khởi hành của đoàn, Số lượng dịch vụ Đã chấp nhận (`Accepted`), Số lượng dịch vụ Đang chờ (`Pending`), Tổng nhu cầu dịch vụ, và nút “Xem chi tiết”. |
| 3. Hệ thống tự động phân loại cấu trúc hiển thị theo đặc thù của từng nhóm đối tác:<br>• **Đối với Khách sạn (`HOTEL`):** Bóc tách chi tiết số lượng buồng phòng theo từng hạng phòng cụ thể (ví dụ: Standard: 10 phòng \| Deluxe: 5 phòng).<br>• **Đối với Nhà hàng (`RESTAURANT`):** Hiển thị tổng số suất ăn theo từng bữa phục vụ đoàn.<br>• **Đối với Đơn vị vận chuyển ngoài (`TRANSPORTATION`):** Hiển thị số lượng xe và lịch trình điều động. | 4. Đối tác theo dõi số lượng dịch vụ để lên kế hoạch giữ chỗ, chuẩn bị nguyên liệu thực phẩm hoặc bố trí phương tiện phục vụ đoàn chu đáo. |
| 5. Đối tác nhấn nút “Xem chi tiết” tại một đợt khởi hành cụ thể. | 6. Hệ thống hiển thị hộp thoại chi tiết toàn bộ các lần phát sinh yêu cầu của đợt khởi hành đó, bóc tách rõ ràng giữa Yêu cầu đặt ban đầu (`INITIAL`) và các Yêu cầu bổ sung (`SUPPLEMENT`) do đoàn tăng khách cận ngày. |
| 7. Đối tác đối chiếu số lượng dịch vụ thực tế đã phục vụ với các mốc thời gian ghi nhận trong hệ thống. | 8. Hệ thống duy trì giao diện đối soát minh bạch phục vụ công tác nghiệm thu thanh toán. |
| **– Luồng sự kiện thay thế (alternate flow):** | |
| 1.1. Đối tác sử dụng thanh tìm kiếm để tìm nhanh chuyến tour theo tên tuyến điểm hoặc mã tour. | 1.2. Hệ thống lọc và hiển thị danh sách các chuyến đi phù hợp theo thời gian thực. |
| 1.3. Đối tác sử dụng bộ lọc trạng thái để xem riêng các đợt tour còn yêu cầu dịch vụ đang chờ xử lý (`Pending`) hoặc các đợt đã hoàn tất chấp thuận (`Accepted`). | 1.4. Hệ thống cập nhật bảng dữ liệu tương ứng theo tiêu chí lọc được chọn. |
| **– Luồng sự kiện ngoại lệ (exception flow):** | |
| | 2.1. Đơn vị đối tác chưa có bất kỳ yêu cầu dịch vụ nào trong hệ thống.<br>Hệ thống hiển thị thông báo: “Chưa có dữ liệu tổng hợp cung cấp dịch vụ.”. |
| **– Quy tắc nghiệp vụ:** | |
| • **Đồng bộ hóa dữ liệu thời gian thực:** Bảng tổng hợp được tính toán tự động dựa trên toàn bộ các yêu cầu thành phần trong bảng dữ liệu giao dịch dịch vụ (`service_requests`), phản ánh chính xác biến động tăng/giảm số lượng khách của đoàn tour.<br>• **Phân tách minh bạch giữa yêu cầu gốc và yêu cầu bổ sung:** Hệ thống bắt buộc phải bóc tách rõ ràng khối lượng đặt ban đầu và khối lượng bổ sung phát sinh sau đó để đối tác nắm được tiến độ tăng khách cận ngày và đối soát hóa đơn thanh toán chuẩn xác. | |

---

### PHẦN III. TỔNG KẾT VÀ BẢNG ÁNH XẠ VAI TRÒ ĐỐI TÁC

| Mã Use Case | Tên Use Case | Phân hệ nghiệp vụ | Mục tiêu cốt lõi |
| :---: | :--- | :--- | :--- |
| **`UC-PT-01`** | **Quản lý kho dịch vụ đối tác** | Quản lý danh mục dịch vụ | Đăng ký dịch vụ mới, cập nhật đơn giá đề xuất và quỹ số lượng cung cấp tối đa của đối tác. |
| **`UC-PT-02`** | **Tiếp nhận và xử lý yêu cầu dịch vụ** | Điều phối & Cung ứng dịch vụ | Tiếp nhận yêu cầu đặt dịch vụ cho đoàn tour từ Quản lý tour, xác nhận Chấp thuận hoặc Từ chối kèm lý do. |
| **`UC-PT-03`** | **Xem tổng hợp cung cấp dịch vụ** | Báo cáo & Thống kê đối soát | Báo cáo tổng hợp số lượng suất/phòng/xe đã nhận theo từng đợt khởi hành để chuẩn bị nguồn lực và đối soát công nợ. |

---
*Tài liệu được kết xuất từ mã nguồn TravelVN ERP phục vụ Báo cáo Khóa luận Tốt nghiệp ngành Hệ thống Thông tin.*
