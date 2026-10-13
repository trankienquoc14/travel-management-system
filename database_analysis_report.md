## BÁO CÁO PHÂN TÍCH DATABASE - CẤU TRÚC TOUR

### TỔNG QUAN
| tour_id | tour_name | nguồn | lỗi | mức độ | đề xuất |
|---------|-----------|-------|-----|--------|---------|
| 7 | Khám phá Đà Lạt | Thiết kế tour | OK | INFO | No action needed |
| 8 | Khám phá Phú Quốc | Thiết kế tour | OK | INFO | No action needed |
| 9 | Tour Đà Lạt  | Thiết kế tour | 3 errors | INFO | Check detailed tables |
| 10 | Khám phá Phú Quốc  | Thiết kế tour | OK | INFO | No action needed |
| 27 | Khám phá Đà Lạt - Nha Trang 4N3Đ | Thiết kế tour | 3 errors | INFO | Check detailed tables |
| 29 | Khám phá Đà Lạt - Nha Trang | Thiết kế tour | 3 errors | INFO | Check detailed tables |
| 31 | Khám phá Đảo Ngọc Phú Quốc 3N2Đ (Cao cấp) | Thiết kế tour | 2 errors | INFO | Check detailed tables |
| 32 | Tour Đà Nẵng - Bà Nà Hills - Phố Cổ Hội An 3N2Đ | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 33 | Tour Đà Nẵng - Huế - Bà Nà - Động Phong Nha 5N4Đ | AI IMPORT | 4 errors | INFO | Check detailed tables |
| 34 | Tour Phú Quốc 3N2Đ: Grand World - VinWonders - Cáp Treo Hòn Thơm | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 35 | Tour Phú Quốc Hè 3N2Đ: Grand World - VinWonders - Safari - Hòn Thơm | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 36 | Tour Hạ Long - Tràng An - Sapa - Fansipan 4N3Đ | AI IMPORT | 3 errors | INFO | Check detailed tables |
| 37 | Tour Vịnh Hạ Long 4N3Đ - Du Thuyền 5 Sao Sang Trọng | AI IMPORT | 3 errors | INFO | Check detailed tables |
| 38 | Tour Hà Nội - Sapa - Chinh Phục Đỉnh Fansipan 3N2Đ | AI IMPORT | 4 errors | CRITICAL | Check detailed tables |
| 39 | Tour Hà Nội - Chùa Tam Chúc - Ninh Bình - Tràng An 3N2Đ | AI IMPORT | 4 errors | CRITICAL | Check detailed tables |
| 40 | Tour Hà Giang - Quản Bạ - Sông Nho Quế 4N3Đ | AI IMPORT | 3 errors | INFO | Check detailed tables |
| 41 | Tour Quy Nhơn Mùa Hè 3N2Đ: Hầm Hồ - Ghềnh Ráng - Kỳ Co - Eo Gió | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 42 | Tour Quy Nhơn - Phú Yên 4N3Đ: Mũi Điện - Gành Đá Đĩa - Kỳ Co | AI IMPORT | 3 errors | INFO | Check detailed tables |
| 43 | Tour Đà Lạt Mùa Hè 4N3Đ: Thác Bobla - Vùng Đất Cổ Tích | AI IMPORT | 3 errors | INFO | Check detailed tables |
| 44 | Tour Đà Lạt 3N3Đ: Săn Mây - Trạm Ký Ức - Fresh Garden | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 45 | Tour Vĩnh Hy - Nha Trang 3N3Đ Mùa Hè | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 46 | Tour Phan Thiết 3N2Đ: Đảo Phú Quý - Thiên Đường Biển Xanh | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 47 | Tour Hồ Tràm 2N1Đ: Tận Hưởng Biển Xanh - Nghỉ Dưỡng Cao Cấp | AI IMPORT | 1 errors | INFO | Check detailed tables |
| 48 | Tour Tây Nguyên 3N3Đ: Măng Đen - Pleiku - Buôn Ma Thuột | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 49 | Tour Miền Tây 3N2Đ: Mỹ Tho - Cần Thơ - Sóc Trăng - Bạc Liêu - Cà Mau | AI IMPORT | 2 errors | INFO | Check detailed tables |
| 50 | Tour Đồng Tháp - Làng Hoa Sa Đéc - Cần Thơ 2N1Đ | AI IMPORT | 1 errors | INFO | Check detailed tables |
| 51 | Tour Tây Ninh 1N: Núi Bà Đen - Đỉnh Vân Sơn - Buffet Năm Châu | AI IMPORT | OK | INFO | No action needed |
| 52 | Tour Xuyên Việt 8N7Đ: Phú Yên - Quy Nhơn - Đà Nẵng - Huế - Quảng Bình | AI IMPORT | 7 errors | INFO | Check detailed tables |

### 1. TOUR CÓ DESTINATION SAI
| tour_id | ngày | destination_id hiện tại | tồn tại? | destination đề xuất | lý do |
|---------|------|-------------------------|----------|---------------------|-------|
| Trống | | | | | |

### 2. TOUR CÓ ACCOMMODATION SAI
| tour_id | service_id | service hiện tại | service_type | partner | lỗi |
|---------|------------|------------------|--------------|---------|-----|
| 38 | 12 | Phòng Deluxe Hướng Biển | Khách sạn | NULL | INVALID_PARTNER_TYPE |
| 38 | 12 | Phòng Deluxe Hướng Biển | Khách sạn | NULL | INVALID_PARTNER_TYPE |
| 39 | 13 | Phòng Suite Cao Cấp | Accommodation | NULL | INVALID_PARTNER_TYPE |
| 39 | 13 | Phòng Suite Cao Cấp | Accommodation | NULL | INVALID_PARTNER_TYPE |

### 3. HOTEL SERVICE THIẾU DETAILS
| service_id | service_name | partner | lỗi |
|------------|--------------|---------|-----|
| Trống | | | |

### 4. PARTNER HOTEL THIẾU DESTINATION
| partner_id | partner_name | destination_id |
|------------|--------------|----------------|
| Trống | | |

### 5. SERVICE DESTINATION MISMATCH
| service_id | service_name | partner_id | partner_destination | service_destination |
|------------|--------------|------------|---------------------|---------------------|
| 32 | Phòng Standard | 18 | 20 | 10 |
| 95 | Phòng Superior | 18 | 20 | 10 |
| 96 | Phòng Deluxe | 18 | 20 | 10 |
| 97 | Phòng Executive | 18 | 20 | 10 |
| 98 | Phòng Suite | 18 | 20 | 10 |
| 458 | Phòng Standard | 9 | 5 | 33 |
| 459 | Phòng Standard | 354 | 3 | null |
| 460 | Phòng Standard | 355 | 8 | null |
| 461 | Phòng Standard | 356 | 19 | null |
| 462 | Phòng Standard | 357 | 19 | null |
| 463 | Phòng Standard | 358 | 10 | null |
| 464 | Phòng Standard | 359 | 2 | null |
| 465 | Phòng Standard | 360 | 1 | null |

### 6. SERVICE HOTEL TRÙNG / CÓ KHẢ NĂNG TRÙNG
| service_id | service_name | partner | destination | service tương tự |
|------------|--------------|---------|-------------|------------------|
| Trống | | | | |

### 7. MEAL / RESTAURANT ISSUE
| tour_id | destination | meals | restaurant data | vấn đề |
|---------|-------------|-------|-----------------|--------|
| All | | OK | No hardcoded ID | Trống |

### 8. SNAPSHOT NAME MISMATCH
| tour_id | service_id | accommodation.name | services.service_name |
|---------|------------|--------------------|-----------------------|
| 9 | 457 | Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm | Phòng Standard |
| 9 | 457 | Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm | Phòng Standard |
| 9 | 457 | Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm | Phòng Standard |
| 27 | 8 | Phòng Superior (hoặc tương đương) | Phòng Superior |
| 27 | 7 | Phòng Standard Hướng Phố (hoặc tương đương) | Phòng Standard Hướng Phố |
| 27 | 7 | Phòng Standard Hướng Phố (hoặc tương đương) | Phòng Standard Hướng Phố |
| 29 | 8 | Phòng Superior (hoặc tương đương) | Phòng Superior |
| 29 | 7 | Phòng Standard Hướng Phố (hoặc tương đương) | Phòng Standard Hướng Phố |
| 29 | 7 | Phòng Standard Hướng Phố (hoặc tương đương) | Phòng Standard Hướng Phố |
| 31 | 10 | Emerald Bay View (JW Marriott) | Emerald Bay View |
| 31 | 10 | Emerald Bay View (JW Marriott) | Emerald Bay View |
| 32 | 454 | Khách sạn 4★ Sala Đà Nẵng Beach | Phòng Standard |
| 32 | 454 | Khách sạn 4★ Sala Đà Nẵng Beach | Phòng Standard |
| 33 | 458 | Khách sạn 4★ Mường Thanh Đà Nẵng | Phòng Standard |
| 33 | 458 | Khách sạn 4★ Mường Thanh Đà Nẵng | Phòng Standard |
| 33 | 38 | Khách sạn 4★ Century Riverside Huế | Phòng Standard |
| 33 | 41 | Khách sạn 4★ Mường Thanh Quảng Bình | Phòng Standard |
| 34 | 459 | Vinholidays Fiesta Phú Quốc 4★ | Phòng Standard |
| 34 | 459 | Vinholidays Fiesta Phú Quốc 4★ | Phòng Standard |
| 35 | 6 | Vinpearl Resort & Spa Phú Quốc 5★ | Phòng Deluxe Ocean View |
| 35 | 6 | Vinpearl Resort & Spa Phú Quốc 5★ | Phòng Deluxe Ocean View |
| 36 | 7 | Khách sạn 4★ Mường Thanh Hạ Long | Phòng Standard Hướng Phố |
| 36 | 8 | Khách sạn 4★ Sapa Horizon | Phòng Superior |
| 36 | 8 | Khách sạn 4★ Sapa Horizon | Phòng Superior |
| 37 | 9 | Du thuyền 5★ Ambassador Cruise Hạ Long | Villa 1 Phòng Ngủ (Cổ điển) |
| 37 | 10 | Emeralda Resort Ninh Bình 5★ | Emerald Bay View |
| 37 | 460 | Khách sạn 5★ Hotel de l'Opera Hà Nội | Phòng Standard |
| 38 | 12 | Khách sạn 3★ Sapa Unique | Phòng Deluxe Hướng Biển |
| 38 | 12 | Khách sạn 3★ Sapa Unique | Phòng Deluxe Hướng Biển |
| 39 | 13 | Khách sạn 4★ The Readon Ninh Bình | Phòng Suite Cao Cấp |
| 39 | 13 | Khách sạn 4★ The Readon Ninh Bình | Phòng Suite Cao Cấp |
| 40 | 26 | Khách sạn 3★ Đồng Văn Hoa Cổ | Phòng Standard |
| 40 | 461 | Homestay Panorama Mèo Vạc | Phòng Standard |
| 40 | 462 | Khách sạn 3★ Hà Giang Historic | Phòng Standard |
| 41 | 463 | Khách sạn 4★ Anya Quy Nhơn | Phòng Standard |
| 41 | 463 | Khách sạn 4★ Anya Quy Nhơn | Phòng Standard |
| 42 | 29 | Khách sạn 4★ Sala Phú Yên Beach | Phòng Standard |
| 42 | 32 | Khách sạn 4★ Seagull Quy Nhơn | Phòng Standard |
| 42 | 32 | Khách sạn 4★ Seagull Quy Nhơn | Phòng Standard |
| 43 | 20 | Khách sạn 4★ Golf Valley Đà Lạt | Phòng Suite Cơ Bản |
| 43 | 20 | Khách sạn 4★ Golf Valley Đà Lạt | Phòng Suite Cơ Bản |
| 43 | 20 | Khách sạn 4★ Golf Valley Đà Lạt | Phòng Suite Cơ Bản |
| 44 | 464 | Khách sạn 3★ Duparc Đà Lạt | Phòng Standard |
| 44 | 464 | Khách sạn 3★ Duparc Đà Lạt | Phòng Standard |
| 45 | 465 | Khách sạn 4★ Vinpearl Condotel Nha Trang | Phòng Standard |
| 45 | 465 | Khách sạn 4★ Vinpearl Condotel Nha Trang | Phòng Standard |
| 46 | 69 | Phú Quý Island Hotel 3★ | Phòng Standard |
| 46 | 69 | Phú Quý Island Hotel 3★ | Phòng Standard |
| 47 | 59 | The Grand Ho Tram Resort 5★ (hoặc tương đương) | Phòng Standard |
| 48 | 63 | Khách sạn 3★ Pleiku Hotel | Phòng Standard |
| 48 | 26 | Khách sạn 4★ Saigon Ban Me | Phòng Standard |
| 49 | 27 | Khách sạn 4★ TTC Cần Thơ | Phòng Standard |
| 49 | 28 | Khách sạn 3★ Mũi Cà Mau | Phòng Standard |
| 50 | 29 | Khách sạn 3★ Ninh Kiều Cần Thơ | Phòng Standard |
| 52 | 30 | Khách sạn 4★ Sala Phú Yên Beach | Phòng Standard |
| 52 | 31 | Khách sạn 4★ Sunset Beach Quy Nhơn | Phòng Standard |
| 52 | 32 | Khách sạn 4★ Phố Cổ Hội An | Phòng Standard |
| 52 | 454 | Khách sạn 4★ Sala Đà Nẵng Beach | Phòng Standard |
| 52 | 38 | Khách sạn 4★ Century Riverside Huế | Phòng Standard |
| 52 | 41 | Khách sạn 4★ Mường Thanh Quảng Bình | Phòng Standard |
| 52 | 41 | Khách sạn 4★ Mường Thanh Quảng Bình | Phòng Standard |

### TỔNG KẾT & ĐỀ XUẤT
**A. Những lỗi chắc chắn cần sửa trong DATABASE:**
- Các lỗi sai Destination ID của các ngày trong Tour (nếu có).
- Cập nhật Partner/Service thiếu Destination.

**B. Những lỗi thuộc FRONTEND/BACKEND, không nên sửa DB:**
- Không có lỗi frontend/backend nghiêm trọng nào được phát hiện trong cách lưu Meal.

**C. Những dữ liệu cần tạo mới:**
- Không cần nếu không có Service bị NOT FOUND.

**D. Những dữ liệu cần UPDATE:**
- 0 mapping destination_id sai trong design_data.
- Cập nhật name snapshot (tùy chọn).

**E. Những dữ liệu tuyệt đối không nên sửa:**
- Nội dung chương trình, các trường is_custom, giá tour.
- Không sửa meal logic hiện tại.

**F. Những trường hợp cần tôi xác nhận thủ công:**
- Các điểm đến có đề xuất "NEEDS_MANUAL_REVIEW".
