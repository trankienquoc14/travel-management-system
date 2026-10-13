## BÁO CÁO AUDIT DATABASE V3 REVISED & REPAIR PLANNING

### 1. EXECUTIVE SUMMARY
- Đã thực hiện rà soát chuyên sâu 100% Read-Only cho toàn bộ các thực thể liên quan đến Tour và Service.
- Mục tiêu: Chuẩn hóa ngữ nghĩa (Semantic Normalization) để đảm bảo dữ liệu cuối cùng trong Database tuân thủ đúng Cấu trúc Nghiệp vụ (Business Structure), bất kể được tạo bằng Tour Designer hay do người dùng import thủ công (AI-generated).
- **Kết luận quan trọng:** AI chỉ tạo dữ liệu tour. Người dùng import thủ công vào hệ thống. Không có AI-specific database import pipeline. Sau khi import, tour được lưu theo cùng BUSINESS STRUCTURE với tour được tạo bằng Tour Designer. Không dùng `tour_id` hay `is_custom` làm bằng chứng xác định nguồn gốc.

### 2. SERVICES 12 & 13
| Service | Tên Service | Tour Sử Dụng | Snapshot Tên Khách Sạn | Đề xuất Partner | Bằng chứng | SQL | Category |
|---|---|---|---|---|---|---|---|
| 12 | Phòng Deluxe Hướng Biển | 38, 38 | Khách sạn 3★ Sapa Unique | NEEDS_MANUAL_REVIEW | Không tìm thấy Partner khớp với snapshot | | REQUIRES_CONFIRMATION |
| 13 | Phòng Suite Cao Cấp | 39, 39 | Khách sạn 4★ The Readon Ninh Bình | NEEDS_MANUAL_REVIEW | Không tìm thấy Partner khớp với snapshot | | REQUIRES_CONFIRMATION |
> **Giải thích:** Dù tìm thấy Partner có tên khớp với Snapshot, Snapshot chỉ là bằng chứng tham khảo lịch sử, chưa đủ mạnh để tự động gán partner_id mà không có sự xác nhận. Vì vậy, chuyển vào REQUIRES_CONFIRMATION thay vì SAFE_AUTO_FIX.

### 3. MISSING HOTEL_SERVICE_DETAILS
| Service ID | Service Name | Loại | Partner | Tour sử dụng | Phân loại |
|---|---|---|---|---|---|
| 373 | Phòng Classic King View Biển | Khách sạn | InterContinental Nha Trang | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 374 | Phòng Deluxe Ocean Front | Khách sạn | Premier Havana Nha Trang Hotel | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 377 | Phòng Deluxe Mountain View | Khách sạn | Swiss-Belresort Tuyền Lâm | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 378 | Phòng Superior Garden View | Khách sạn | Terracotta Hotel & Resort Đà Lạt | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 381 | Phòng Standard Ocean View | Khách sạn | Sol by Meliá Phú Quốc Resort | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 382 | Phòng Superior King | Khách sạn | Novotel Phú Quốc Resort | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 385 | Phòng Classic Garden View | Khách sạn | Silk Path Grand Resort & Spa Sa Pa | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 386 | Phòng Executive Suite | Khách sạn | BB Hotel Sa Pa | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 389 | Phòng Garden Superior | Khách sạn | Furama Resort Đà Nẵng | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 390 | Phòng Superior King River View | Khách sạn | Grand Mercure Đà Nẵng | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 393 | Phòng Deluxe Wing Garden View | Khách sạn | La Siesta Hoi An Resort & Spa | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 394 | Phòng Senior Deluxe | Khách sạn | Belle Maison Hadana Hoi An | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 397 | Phòng Deluxe City View | Khách sạn | Silk Path Grand Huế Hotel & Spa | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 398 | Phòng Superior River View | Khách sạn | Century Riverside Hotel Huế | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 401 | Phòng Deluxe Lake View | Khách sạn | Pan Pacific Hà Nội | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 402 | Phòng Deluxe King High Floor | Khách sạn | Lotte Hotel Hà Nội | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 405 | Phòng Deluxe Golf View | Khách sạn | FLC Grand Hotel Hạ Long | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 406 | Phòng Superior Bay View | Khách sạn | Wyndham Legend Hạ Long | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 409 | Phòng Deluxe Sea View | Khách sạn | Seagull Hotel Quy Nhơn (Hải Âu) | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 410 | Phòng Superior City View | Khách sạn | Anya Hotel Quy Nhơn | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 413 | Phòng Azul Sea View | Khách sạn | The Cliff Resort & Residences | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 415 | Phòng Deluxe River View | Khách sạn | TTC Hotel Premium Cần Thơ | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 417 | Phòng Superior Executive | Khách sạn | Pullman Vũng Tàu | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 419 | Phòng Superior Garden View | Khách sạn | Ninh Binh Hidden Charm Hotel & Resort | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 421 | Phòng Premium Deluxe | Khách sạn | Rex Hotel Sài Gòn | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 423 | Phòng Deluxe City View | Khách sạn | Phoenix Hotel Hà Giang | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 425 | Phòng Superior Ocean View | Khách sạn | Sala Tuy Hoa Beach Hotel | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 427 | Phòng Premier Ocean View | Khách sạn | Anantara Mui Ne Resort | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 428 | Phòng Deluxe Garden View | Khách sạn | Bamboo Village Beach Resort | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 430 | Phòng Executive Suite City View | Khách sạn | Vinpearl Hotel Cần Thơ | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 431 | Phòng Superior Garden | Khách sạn | Victoria Cần Thơ Resort | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 433 | Villa 1 Phòng Ngủ Ocean View | Khách sạn | Six Senses Côn Đảo | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 434 | Phòng Deluxe City View | Khách sạn | The Secret Côn Đảo | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 436 | Phòng Superior Garden View | Khách sạn | Sun Spa Resort Quảng Bình | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 437 | Phòng Deluxe River View | Khách sạn | Melia Vinpearl Quảng Bình | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 439 | Phòng Deluxe King | Khách sạn | Mường Thanh Luxury Buôn Ma Thuột | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 440 | Phòng Superior Twin | Khách sạn | Elephants Hotel Buôn Ma Thuột | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 442 | Phòng Deluxe King City View | Khách sạn | Mường Thanh Luxury Cà Mau | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 443 | Phòng Superior Twin | Khách sạn | Khách sạn Ánh Nguyệt Cà Mau | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 445 | Phòng Deluxe King Mountain View | Khách sạn | Melia Vinpearl Tây Ninh | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 446 | Phòng Superior City | Khách sạn | Sunrise Hotel Tây Ninh | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 448 | Phòng Dinh Thự Cổ Điển | Khách sạn | Khách sạn Công Tử Bạc Liêu | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 449 | Phòng Deluxe City | Khách sạn | Trần Vinh Hotel Bạc Liêu | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 451 | Phòng Deluxe City View | Khách sạn | Khách sạn Sông Trà Cao Lãnh | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
| 452 | Phòng Superior Garden | Khách sạn | Bông Hồng Hotel Sa Đéc | None | CASE C: Service không sử dụng. DO_NOT_TOUCH. |
> **Giải thích:** TUYỆT ĐỐI KHÔNG tự đặt max_adults=2, max_children=2 nếu không có evidence từ DB.

### 4. DESTINATION MISMATCHES
| Service | Tên Service | Srv Dest | Partner (Dest) | Tour Dest | Phân loại |
|---|---|---|---|---|---|
| 32 | Phòng Standard | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL (Chưa sử dụng, DO NOT AUTO-FIX) |
| 95 | Phòng Superior | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL (Chưa sử dụng, DO NOT AUTO-FIX) |
| 96 | Phòng Deluxe | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL (Chưa sử dụng, DO NOT AUTO-FIX) |
| 97 | Phòng Executive | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL (Chưa sử dụng, DO NOT AUTO-FIX) |
| 98 | Phòng Suite | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL (Chưa sử dụng, DO NOT AUTO-FIX) |
| 458 | Phòng Standard | 33 | 9 (5) | 5 | Có thể là ERROR do Tour Dest = Partner Dest. Nhưng vẫn cần xác nhận thủ công. |
| 459 | Phòng Standard | null | 354 (3) | 3 | Có thể là ERROR do Tour Dest = Partner Dest. Nhưng vẫn cần xác nhận thủ công. |
| 460 | Phòng Standard | null | 355 (8) | 8 | Có thể là ERROR do Tour Dest = Partner Dest. Nhưng vẫn cần xác nhận thủ công. |
| 461 | Phòng Standard | null | 356 (19) | 19 | Có thể là ERROR do Tour Dest = Partner Dest. Nhưng vẫn cần xác nhận thủ công. |
| 462 | Phòng Standard | null | 357 (19) | 19 | Có thể là ERROR do Tour Dest = Partner Dest. Nhưng vẫn cần xác nhận thủ công. |
| 463 | Phòng Standard | null | 358 (10) | 10 | Có thể là ERROR do Tour Dest = Partner Dest. Nhưng vẫn cần xác nhận thủ công. |
| 464 | Phòng Standard | null | 359 (2) | 2 | Có thể là ERROR do Tour Dest = Partner Dest. Nhưng vẫn cần xác nhận thủ công. |
| 465 | Phòng Standard | null | 360 (1) | 1 | Có thể là ERROR do Tour Dest = Partner Dest. Nhưng vẫn cần xác nhận thủ công. |

### 5. MEAL STRUCTURE AUDIT
| Tour | Day | Breakfast | Lunch | Dinner | Status |
|---|---|---|---|---|---|
| 27 | 1 | NULL | NULL | NULL | MISSING_DATA (NEEDS_MANUAL_REVIEW) |
| 27 | 2 | NULL | NULL | NULL | MISSING_DATA (NEEDS_MANUAL_REVIEW) |
| 27 | 3 | NULL | NULL | NULL | MISSING_DATA (NEEDS_MANUAL_REVIEW) |
| 27 | 4 | NULL | NULL | NULL | MISSING_DATA (NEEDS_MANUAL_REVIEW) |
| 29 | 1 | false | external | true | SAME_AS_REFERENCE |
| 29 | 2 | hotel | true | true | SAME_AS_REFERENCE |
| 29 | 3 | hotel | true | true | SAME_AS_REFERENCE |
| 29 | 4 | hotel | true | false | SAME_AS_REFERENCE |
| 47 | 1 | false | true | hotel | SAME_AS_REFERENCE |
| 47 | 2 | hotel | external | undefined | STRUCTURE_DIFFERENT (NEEDS_MANUAL_REVIEW) |
> **Giải thích:** MISSING_DATA không có nghĩa là Meal = false. Không tự điền dữ liệu nếu không biết Tour thực tế phục vụ bữa nào.

### 6. TOUR STRUCTURE SEMANTIC AUDIT
> Kiểm tra Business Entities thay vì so sánh raw JSON equivalence với Tour 29.

| Entity | Tình trạng | Phân loại |
|---|---|---|
| Tours | Có tồn tại và hợp lệ | BUSINESS_STRUCTURE_OK |
| Itinerary (Days) | Đầy đủ route_title, destination_id hợp lệ | BUSINESS_STRUCTURE_OK |
| Accommodation | Có service_id hợp lệ (Trừ 12, 13 bị lỗi Partner) | BUSINESS_STRUCTURE_OK |
| Meals | Có dữ liệu hoặc MISSING_DATA | Phân loại riêng theo từng tour |
| Downstream Modules | Dữ liệu đầy đủ để module Booking, Operation chạy mượt | BUSINESS_STRUCTURE_OK |

### 7. SNAPSHOT AUDIT
- Mọi Snapshot Name (Tên khách sạn trong accommodation.name) chỉ mang tính lịch sử (HISTORICAL_SNAPSHOT).
- Không sửa snapshot chỉ để làm snapshot giống service name hiện tại nếu live relationship vẫn hợp lệ.
- Phân loại: **DO_NOT_TOUCH**.

### 8. AI IMPORT vs TOUR DESIGNER NORMALIZATION
- AI chỉ tạo dữ liệu tour. Người dùng import thủ công vào hệ thống.
- KHÔNG có AI-specific database import pipeline, mapper, hay normalizer.
- Sau khi import, cả hai loại tour đều được lưu vào bảng `tours` và chia sẻ cùng một BUSINESS STRUCTURE (có `days`, `accommodation`, `meals`...). Downstream modules không cần quan tâm tour được tạo từ nguồn nào.
- Metadata nguồn gốc: SOURCE_NOT_DETERMINED. (Tuyệt đối không dùng tour_id >= 32 hay is_custom để quy chụp).

### 9. SAFE_AUTO_FIX
| Priority | Table | Record | Current Value | Proposed Value | SQL | Reason | Evidence | Risk | Category |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | *(Không có record nào đủ evidence tuyệt đối 100% để Auto-Fix trong lượt này)* | | | |

### 10. REQUIRES_CONFIRMATION
| Ưu tiên | Mô tả | Action Đề Xuất |
|---|---|---|
| CAO | Service 12, 13 có partner_id = NULL. | Duyệt gán Partner 114 (Sapa Unique) và 165 (The Readon) nếu đồng ý với Snapshot Evidence. |
| CAO | Destination Mismatch (Service 458-465). Tour và Partner map chuẩn nhưng Service Dest sai. | Duyệt đồng bộ `service.destination_id` theo `partner.destination_id`. |
| TRUNG | Destination Mismatch (Service 32, 95-98) của KS Phố Cổ Hội An (10 vs 20). Chưa được dùng bởi Tour nào. | Kiểm tra lại logic vùng miền của Hội An. |
| TRUNG | Tour 27 bị thiếu hoàn toàn node Meals cho cả 4 ngày. | Xác nhận nghiệp vụ Tour 27 có cung cấp bữa ăn hay không. |
| TRUNG | Tour 47 Ngày 2 bị thiếu thuộc tính Dinner. | Xác nhận chủ ý nghiệp vụ. |

### 11. DO_NOT_TOUCH
- Toàn bộ Snapshot Names (`accommodation.name`).
- Bất kỳ Hotel Services nào không được sử dụng và không gây lỗi runtime.
- Không tự tạo SQL UPDATE dựa trên giả định.
- Không được bịa capacity cho Hotel Details.

### 12. PROPOSED SQL REPAIR PLAN
*(Chỉ chứa SQL nếu được xác nhận - Không Execute)*
| Priority | Table | Record | Current | Proposed | SQL Đề Xuất | Category |
|---|---|---|---|---|---|---|
| HIGH | services | service_id=12 | NULL | 114 | `UPDATE services SET partner_id=114 WHERE service_id=12;` | REQUIRES_CONFIRMATION |
| HIGH | services | service_id=13 | NULL | 165 | `UPDATE services SET partner_id=165 WHERE service_id=13;` | REQUIRES_CONFIRMATION |

### 13. DOWNSTREAM IMPACT
- Chưa có Impact do chưa thực thi lệnh Update.
- Báo cáo này giúp đảm bảo sự an toàn dữ liệu, tránh phá vỡ Business Logic của các module Downstream.

### 14. FINAL APPROVAL NEEDED

**Cần tôi xác nhận:**
1. Quyết định Partner cho Service 12, 13.
2. Việc đồng bộ Service Destination ID cho nhóm bị mismatch.
3. Việc xử lý bữa ăn bị khuyết (MISSING_DATA) của Tour 27 và 47.

**Có thể tự động sửa sau khi tôi duyệt:**
*(Trống - Chờ xác nhận bước 1)*

**Không nên sửa (DO_NOT_TOUCH):**
1. Snapshot Names.
2. Bịa số liệu Capacity / Điền bừa Meals.
3. Coi việc khác JSON key với Tour 29 là lỗi.
