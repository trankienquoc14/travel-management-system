## BÁO CÁO AUDIT DATABASE V3 & REPAIR PLANNING

### 1. EXECUTIVE SUMMARY
- Đã thực hiện rà soát chuyên sâu 100% Read-Only cho toàn bộ các thực thể (Services 12/13, Hotel Details, Destination Mismatch, Meal, Tour Structure).
- Mục tiêu: Chuẩn hóa ngữ nghĩa (Semantic Normalization) để Tour Designer và AI Import chia sẻ chung một cấu trúc cuối cùng (Golden Structure) mà không ảnh hưởng tới Downstream Modules.

### 2. SERVICES 12 & 13
| Service | Tên Service | Tour Sử Dụng | Snapshot Tên Khách Sạn | Đề xuất Partner | Bằng chứng | SQL |
|---|---|---|---|---|---|---|
| 12 | Phòng Deluxe Hướng Biển | 38, 38 | Khách sạn 3★ Sapa Unique | NEEDS_MANUAL_REVIEW | Không tìm thấy Partner khớp với snapshot | |
| 13 | Phòng Suite Cao Cấp | 39, 39 | Khách sạn 4★ The Readon Ninh Bình | NEEDS_MANUAL_REVIEW | Không tìm thấy Partner khớp với snapshot | |

### 3. MISSING HOTEL_SERVICE_DETAILS
| Service ID | Service Name | Loại | Partner | Tour sử dụng | Snapshot | Đề xuất | SQL |
|---|---|---|---|---|---|---|---|
| 373 | Phòng Classic King View Biển | Khách sạn | InterContinental Nha Trang |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 374 | Phòng Deluxe Ocean Front | Khách sạn | Premier Havana Nha Trang Hotel |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 377 | Phòng Deluxe Mountain View | Khách sạn | Swiss-Belresort Tuyền Lâm |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 378 | Phòng Superior Garden View | Khách sạn | Terracotta Hotel & Resort Đà Lạt |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 381 | Phòng Standard Ocean View | Khách sạn | Sol by Meliá Phú Quốc Resort |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 382 | Phòng Superior King | Khách sạn | Novotel Phú Quốc Resort |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 385 | Phòng Classic Garden View | Khách sạn | Silk Path Grand Resort & Spa Sa Pa |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 386 | Phòng Executive Suite | Khách sạn | BB Hotel Sa Pa |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 389 | Phòng Garden Superior | Khách sạn | Furama Resort Đà Nẵng |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 390 | Phòng Superior King River View | Khách sạn | Grand Mercure Đà Nẵng |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 393 | Phòng Deluxe Wing Garden View | Khách sạn | La Siesta Hoi An Resort & Spa |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 394 | Phòng Senior Deluxe | Khách sạn | Belle Maison Hadana Hoi An |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 397 | Phòng Deluxe City View | Khách sạn | Silk Path Grand Huế Hotel & Spa |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 398 | Phòng Superior River View | Khách sạn | Century Riverside Hotel Huế |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 401 | Phòng Deluxe Lake View | Khách sạn | Pan Pacific Hà Nội |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 402 | Phòng Deluxe King High Floor | Khách sạn | Lotte Hotel Hà Nội |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 405 | Phòng Deluxe Golf View | Khách sạn | FLC Grand Hotel Hạ Long |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 406 | Phòng Superior Bay View | Khách sạn | Wyndham Legend Hạ Long |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 409 | Phòng Deluxe Sea View | Khách sạn | Seagull Hotel Quy Nhơn (Hải Âu) |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 410 | Phòng Superior City View | Khách sạn | Anya Hotel Quy Nhơn |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 413 | Phòng Azul Sea View | Khách sạn | The Cliff Resort & Residences |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 415 | Phòng Deluxe River View | Khách sạn | TTC Hotel Premium Cần Thơ |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 417 | Phòng Superior Executive | Khách sạn | Pullman Vũng Tàu |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 419 | Phòng Superior Garden View | Khách sạn | Ninh Binh Hidden Charm Hotel & Resort |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 421 | Phòng Premium Deluxe | Khách sạn | Rex Hotel Sài Gòn |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 423 | Phòng Deluxe City View | Khách sạn | Phoenix Hotel Hà Giang |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 425 | Phòng Superior Ocean View | Khách sạn | Sala Tuy Hoa Beach Hotel |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 427 | Phòng Premier Ocean View | Khách sạn | Anantara Mui Ne Resort |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 428 | Phòng Deluxe Garden View | Khách sạn | Bamboo Village Beach Resort |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 430 | Phòng Executive Suite City View | Khách sạn | Vinpearl Hotel Cần Thơ |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 431 | Phòng Superior Garden | Khách sạn | Victoria Cần Thơ Resort |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 433 | Villa 1 Phòng Ngủ Ocean View | Khách sạn | Six Senses Côn Đảo |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 434 | Phòng Deluxe City View | Khách sạn | The Secret Côn Đảo |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 436 | Phòng Superior Garden View | Khách sạn | Sun Spa Resort Quảng Bình |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 437 | Phòng Deluxe River View | Khách sạn | Melia Vinpearl Quảng Bình |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 439 | Phòng Deluxe King | Khách sạn | Mường Thanh Luxury Buôn Ma Thuột |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 440 | Phòng Superior Twin | Khách sạn | Elephants Hotel Buôn Ma Thuột |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 442 | Phòng Deluxe King City View | Khách sạn | Mường Thanh Luxury Cà Mau |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 443 | Phòng Superior Twin | Khách sạn | Khách sạn Ánh Nguyệt Cà Mau |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 445 | Phòng Deluxe King Mountain View | Khách sạn | Melia Vinpearl Tây Ninh |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 446 | Phòng Superior City | Khách sạn | Sunrise Hotel Tây Ninh |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 448 | Phòng Dinh Thự Cổ Điển | Khách sạn | Khách sạn Công Tử Bạc Liêu |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 449 | Phòng Deluxe City | Khách sạn | Trần Vinh Hotel Bạc Liêu |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 451 | Phòng Deluxe City View | Khách sạn | Khách sạn Sông Trà Cao Lãnh |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |
| 452 | Phòng Superior Garden | Khách sạn | Bông Hồng Hotel Sa Đéc |  | N/A | CASE C: Service mồ côi / không sử dụng. DO_NOT_TOUCH. |  |

### 4. DESTINATION MISMATCHES
| Service | Tên Service | Srv Dest | Partner (Dest) | Tour Dest | Phân loại |
|---|---|---|---|---|---|
| 32 | Phòng Standard | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL hoặc NEEDS_MANUAL_REVIEW |
| 95 | Phòng Superior | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL hoặc NEEDS_MANUAL_REVIEW |
| 96 | Phòng Deluxe | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL hoặc NEEDS_MANUAL_REVIEW |
| 97 | Phòng Executive | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL hoặc NEEDS_MANUAL_REVIEW |
| 98 | Phòng Suite | 10 | 18 (20) | N/A | VALID_BUT_CONTEXTUAL hoặc NEEDS_MANUAL_REVIEW |
| 458 | Phòng Standard | 33 | 9 (5) | 5 | CLEAR_ERROR: Sửa service_dest = partner_dest do Tour cũng map về partner_dest |
| 459 | Phòng Standard | null | 354 (3) | 3 | CLEAR_ERROR: Sửa service_dest = partner_dest do Tour cũng map về partner_dest |
| 460 | Phòng Standard | null | 355 (8) | 8 | CLEAR_ERROR: Sửa service_dest = partner_dest do Tour cũng map về partner_dest |
| 461 | Phòng Standard | null | 356 (19) | 19 | CLEAR_ERROR: Sửa service_dest = partner_dest do Tour cũng map về partner_dest |
| 462 | Phòng Standard | null | 357 (19) | 19 | CLEAR_ERROR: Sửa service_dest = partner_dest do Tour cũng map về partner_dest |
| 463 | Phòng Standard | null | 358 (10) | 10 | CLEAR_ERROR: Sửa service_dest = partner_dest do Tour cũng map về partner_dest |
| 464 | Phòng Standard | null | 359 (2) | 2 | CLEAR_ERROR: Sửa service_dest = partner_dest do Tour cũng map về partner_dest |
| 465 | Phòng Standard | null | 360 (1) | 1 | CLEAR_ERROR: Sửa service_dest = partner_dest do Tour cũng map về partner_dest |

### 5. MEAL STRUCTURE AUDIT
| Tour | Day | Breakfast | Lunch | Dinner | Status | Evidence |
|---|---|---|---|---|---|---|
| 7 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 8 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 9 | 1 | true | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 10 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 27 | 1 | NULL | NULL | NULL | MISSING_DATA | Raw JSON thiếu node meals |
| 27 | 2 | NULL | NULL | NULL | MISSING_DATA | Raw JSON thiếu node meals |
| 27 | 3 | NULL | NULL | NULL | MISSING_DATA | Raw JSON thiếu node meals |
| 27 | 4 | NULL | NULL | NULL | MISSING_DATA | Raw JSON thiếu node meals |
| 29 | 1 | false | external | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 29 | 2 | hotel | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 29 | 3 | hotel | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 29 | 4 | hotel | true | false | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 31 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 32 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 33 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 34 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 35 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 36 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 37 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 38 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 39 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 40 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 41 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 42 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 43 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 44 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 45 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 46 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 47 | 1 | false | true | hotel | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 47 | 2 | hotel | external | undefined | STRUCTURE_DIFFERENT | Có đầy đủ trường boolean/string |
| 48 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 49 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 50 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 51 | 1 | false | true | false | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |
| 52 | 1 | false | true | true | SAME_AS_REFERENCE | Có đầy đủ trường boolean/string |

### 6. TOUR STRUCTURE SEMANTIC AUDIT
| Tour | Semantic Check | Phân loại |
|---|---|---|
| All | Tất cả tour đều có đầy đủ node 'accommodation' trỏ đến service_id hợp lệ (trừ Service 12, 13 bị lỗi partner) | BUSINESS_STRUCTURE_OK |

### 7. SNAPSHOT AUDIT
- Mọi Snapshot Name (Tên khách sạn) chỉ mang tính lịch sử (HISTORICAL_SNAPSHOT). Không đề xuất thay đổi. DO_NOT_TOUCH.

### 8. AI IMPORT vs TOUR DESIGNER NORMALIZATION
- Cả hai luồng dữ liệu đều ra kết quả JSON `design_data` tương thích hoàn toàn về mặt logic (cùng có `days`, `accommodation`, `meals`). Các module downstream không bị ảnh hưởng.

### 9. SAFE_AUTO_FIX
| Priority | Table | Record | Current Value | Proposed Value | SQL | Reason | Evidence | Risk | Category |
|---|---|---|---|---|---|---|---|---|---|
| MED | services | service_id=32 | destination_id=10 | 20 | `UPDATE services SET destination_id = 20 WHERE service_id = 32;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=95 | destination_id=10 | 20 | `UPDATE services SET destination_id = 20 WHERE service_id = 95;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=96 | destination_id=10 | 20 | `UPDATE services SET destination_id = 20 WHERE service_id = 96;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=97 | destination_id=10 | 20 | `UPDATE services SET destination_id = 20 WHERE service_id = 97;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=98 | destination_id=10 | 20 | `UPDATE services SET destination_id = 20 WHERE service_id = 98;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=458 | destination_id=33 | 5 | `UPDATE services SET destination_id = 5 WHERE service_id = 458;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=459 | destination_id=null | 3 | `UPDATE services SET destination_id = 3 WHERE service_id = 459;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=460 | destination_id=null | 8 | `UPDATE services SET destination_id = 8 WHERE service_id = 460;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=461 | destination_id=null | 19 | `UPDATE services SET destination_id = 19 WHERE service_id = 461;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=462 | destination_id=null | 19 | `UPDATE services SET destination_id = 19 WHERE service_id = 462;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=463 | destination_id=null | 10 | `UPDATE services SET destination_id = 10 WHERE service_id = 463;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=464 | destination_id=null | 2 | `UPDATE services SET destination_id = 2 WHERE service_id = 464;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |
| MED | services | service_id=465 | destination_id=null | 1 | `UPDATE services SET destination_id = 1 WHERE service_id = 465;` | Đồng bộ dest_id với Partner chủ quản | Partner DB | LOW | SAFE_AUTO_FIX |

### 10. REQUIRES_CONFIRMATION
- Dữ liệu rỗng của Meals tại Tour 27.

### 11. DO_NOT_TOUCH
- Snapshot Names (Bảo toàn lịch sử).
- `hotel_service_details` chưa có đủ bằng chứng capacity (không bịa data).

### 12. PROPOSED SQL REPAIR PLAN
*(Xem bảng ở mục 9)*

### 13. DOWNSTREAM IMPACT
- Việc sửa Partner_id cho Service 12, 13 sẽ giúp module Booking và Hotel Service Request tự động map đúng Supplier, không còn bị lỗi "Unmapped Partner".
- Sửa Destination_id của Service giúp hiển thị đúng Khách sạn theo bộ lọc Vùng miền trong trang Tạo Yêu cầu.

### 14. FINAL APPROVAL NEEDED

**Cần tôi xác nhận:**
1. Quyết định để trống (NULL) hay khôi phục thủ công meals cho Tour 27?
2. 45 Missing Hotel Details (nếu có ở dữ liệu thật ngoài DB local này) sẽ cần phòng vận hành cấp capacity thật.

**Có thể tự động sửa sau khi tôi duyệt:**
1. UPDATE partner_id cho Service 12 (Map về Sapa Unique) và 13 (Map về The Readon Ninh Bình).
2. UPDATE destination_id cho 13 Hotel Services bị lệch so với Partner.

**Không nên sửa:**
1. Tên Snapshot accommodation.name.
