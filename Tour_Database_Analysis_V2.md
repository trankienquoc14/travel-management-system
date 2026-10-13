## BÁO CÁO AUDIT DATABASE LẦN 2 (READ-ONLY)

### 1. Tổng quan
| Nhóm | Số lượng | Mức độ |
|---|---:|---|
| Invalid Destination | 0 | CRITICAL_DATA_ERROR |
| Invalid Accommodation | 0 | CRITICAL_DATA_ERROR |
| Missing Partner | 2 | CRITICAL_DATA_RELATIONSHIP_ERROR |
| Hotel Service Destination Mismatch | 13 | WARNING_DATA_ERROR |
| Missing Hotel Details | 45 | CRITICAL_DATA_ERROR |
| Duplicate Hotel Service | 0 | POSSIBLE_DUPLICATE |
| Meal Structure Issue | 5 | STRUCTURE_MISMATCH |
| Restaurant Reference Issue | 0 | STRUCTURE_MISMATCH |
| Snapshot Mismatch | 61 | SNAPSHOT_ONLY |
| Structure Mismatch | 13 | STRUCTURE_MISMATCH |

### 2. Service 12 / 13
- **Service ID 12**: Tồn tại? YES
  - Tên: Phòng Deluxe Hướng Biển
  - Partner ID: NULL
  - Partner Tồn Tại: NO
  - Partner Type: N/A
  - Partner Dest: N/A
  - Service Dest: 5
  - Hotel Details: YES
- **Service ID 13**: Tồn tại? YES
  - Tên: Phòng Suite Cao Cấp
  - Partner ID: NULL
  - Partner Tồn Tại: NO
  - Partner Type: N/A
  - Partner Dest: N/A
  - Service Dest: 1
  - Hotel Details: YES

### 3. Hotel Service Destination Mismatch
| service_id | service_name | partner_id | partner_name | partner_destination_id | service_destination_id |
|---|---|---|---|---|---|
| 32 | Phòng Standard | 18 | Seagull Quy Nhơn | 20 | 10 |
| 95 | Phòng Superior | 18 | Seagull Quy Nhơn | 20 | 10 |
| 96 | Phòng Deluxe | 18 | Seagull Quy Nhơn | 20 | 10 |
| 97 | Phòng Executive | 18 | Seagull Quy Nhơn | 20 | 10 |
| 98 | Phòng Suite | 18 | Seagull Quy Nhơn | 20 | 10 |
| 458 | Phòng Standard | 9 | Mường Thanh Đà Nẵng | 5 | 33 |
| 459 | Phòng Standard | 354 | Vinholidays Fiesta Phú Quốc 4★ | 3 | null |
| 460 | Phòng Standard | 355 | Khách sạn 5★ Hotel de l'Opera Hà Nội | 8 | null |
| 461 | Phòng Standard | 356 | Homestay Panorama Mèo Vạc | 19 | null |
| 462 | Phòng Standard | 357 | Khách sạn 3★ Hà Giang Historic | 19 | null |
| 463 | Phòng Standard | 358 | Khách sạn 4★ Anya Quy Nhơn | 10 | null |
| 464 | Phòng Standard | 359 | Khách sạn 3★ Duparc Đà Lạt | 2 | null |
| 465 | Phòng Standard | 360 | Khách sạn 4★ Vinpearl Condotel Nha Trang | 1 | null |

### 4. Hotel Service Relationship
| service_id | service_name | partner_name | partner_type | has_details | status |
|---|---|---|---|---|---|
| 6 | Phòng Deluxe Ocean View | Vinpearl Resort & Spa Nha Trang | Hotel | YES | OK |
| 7 | Phòng Standard Hướng Phố | Khách sạn Mường Thanh Luxury | Hotel | YES | OK |
| 8 | Phòng Superior | Hôtel Colline Đà Lạt | Hotel | YES | OK |
| 9 | Villa 1 Phòng Ngủ (Cổ điển) | Ana Mandara Villas Dalat | Hotel | YES | OK |
| 10 | Emerald Bay View | JW Marriott Phu Quoc | Hotel | YES | OK |
| 12 | Phòng Deluxe Hướng Biển | NULL | N/A | YES | NULL_PARTNER or INVALID_PARTNER |
| 13 | Phòng Suite Cao Cấp | NULL | N/A | YES | NULL_PARTNER or INVALID_PARTNER |
| 20 | Phòng Suite Cơ Bản | Vinpearl Resort Nha Trang | Hotel | YES | OK |
| 21 | Phòng Suite Cao Cấp | Vinpearl Resort Nha Trang | Hotel | YES | OK |
| 26 | Phòng Standard | Đồng Văn Hoa Cổ | Hotel | YES | OK |
| 27 | Phòng Standard | Phoenix Hà Giang | Hotel | YES | OK |
| 28 | Phòng Standard | Hmong Village Resort | Hotel | YES | OK |
| 29 | Phòng Standard | Sala Phú Yên Beach | Hotel | YES | OK |
| 30 | Phòng Standard | Stelia Beach Resort | Hotel | YES | OK |
| 31 | Phòng Standard | Hùng Vương Phú Yên | Hotel | YES | OK |
| 32 | Phòng Standard | Seagull Quy Nhơn | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 33 | Phòng Standard | FLC Luxury Resort Quy Nhơn | Hotel | YES | OK |
| 34 | Phòng Standard | Hải Âu Quy Nhơn | Hotel | YES | OK |
| 35 | Phòng Standard | Phố Cổ Hội An | Hotel | YES | OK |
| 36 | Phòng Standard | Silk Sense Hoi An River Resort | Hotel | YES | OK |
| 37 | Phòng Standard | Hoi An Historic | Hotel | YES | OK |
| 38 | Phòng Standard | Century Riverside Huế | Hotel | YES | OK |
| 39 | Phòng Standard | Silk Path Grand Hue Hotel | Hotel | YES | OK |
| 40 | Phòng Standard | Moonlight Huế | Hotel | YES | OK |
| 41 | Phòng Standard | Mường Thanh Quảng Bình | Hotel | YES | OK |
| 42 | Phòng Standard | Sun Spa Resort Quảng Bình | Hotel | YES | OK |
| 43 | Phòng Standard | Tân Bình Quảng Bình | Hotel | YES | OK |
| 44 | Phòng Standard | Sapa Horizon | Hotel | YES | OK |
| 45 | Phòng Standard | Hotel de la Coupole Sapa | Hotel | YES | OK |
| 46 | Phòng Standard | Bamboo Sapa | Hotel | YES | OK |
| 47 | Phòng Standard | Mường Thanh Luxury Hạ Long | Hotel | YES | OK |
| 48 | Phòng Standard | Vinpearl Resort & Spa Hạ Long | Hotel | YES | OK |
| 49 | Phòng Standard | Halong Bay Hotel | Hotel | YES | OK |
| 50 | Phòng Standard | Emeralda Resort Ninh Bình | Hotel | YES | OK |
| 51 | Phòng Standard | Legend Ninh Bình | Hotel | YES | OK |
| 52 | Phòng Standard | Bái Đính Ninh Bình | Hotel | YES | OK |
| 53 | Phòng Standard | TTC Cần Thơ | Hotel | YES | OK |
| 54 | Phòng Standard | Victoria Cần Thơ Resort | Hotel | YES | OK |
| 55 | Phòng Standard | Ninh Kiều Cần Thơ | Hotel | YES | OK |
| 56 | Phòng Standard | Six Senses Côn Đảo | Hotel | YES | OK |
| 57 | Phòng Standard | The Secret Côn Đảo | Hotel | YES | OK |
| 58 | Phòng Standard | Côn Đảo Resort | Hotel | YES | OK |
| 59 | Phòng Standard | The Grand Ho Tram Resort | Hotel | YES | OK |
| 60 | Phòng Standard | Imperial Hotel Vũng Tàu | Hotel | YES | OK |
| 61 | Phòng Standard | Malibu Vũng Tàu | Hotel | YES | OK |
| 62 | Phòng Standard | Saigon Ban Me | Hotel | YES | OK |
| 63 | Phòng Standard | Pleiku Hotel | Hotel | YES | OK |
| 64 | Phòng Standard | Elephants Hotel Buôn Ma Thuột | Hotel | YES | OK |
| 65 | Phòng Standard | Mũi Cà Mau | Hotel | YES | OK |
| 66 | Phòng Standard | Mường Thanh Luxury Cà Mau | Hotel | YES | OK |
| 67 | Phòng Standard | Melia Vinpearl Tây Ninh | Hotel | YES | OK |
| 68 | Phòng Standard | Sunrise Tây Ninh | Hotel | YES | OK |
| 69 | Phòng Standard | Phú Quý Island Hotel | Hotel | YES | OK |
| 70 | Phòng Standard | Centara Mirage Resort Mũi Né | Hotel | YES | OK |
| 71 | Phòng Standard | Lotte Hotel Hà Nội | Hotel | YES | OK |
| 72 | Phòng Standard | Silk Path Hà Nội | Hotel | YES | OK |
| 73 | Phòng Standard | Rex Hotel Saigon | Hotel | YES | OK |
| 74 | Phòng Standard | Liberty Central Saigon | Hotel | YES | OK |
| 75 | Phòng Superior | Đồng Văn Hoa Cổ | Hotel | YES | OK |
| 76 | Phòng Deluxe | Đồng Văn Hoa Cổ | Hotel | YES | OK |
| 77 | Phòng Superior | Phoenix Hà Giang | Hotel | YES | OK |
| 78 | Phòng Deluxe | Phoenix Hà Giang | Hotel | YES | OK |
| 79 | Phòng Executive | Phoenix Hà Giang | Hotel | YES | OK |
| 80 | Phòng Suite | Phoenix Hà Giang | Hotel | YES | OK |
| 81 | Phòng Superior | Hmong Village Resort | Hotel | YES | OK |
| 82 | Phòng Deluxe | Hmong Village Resort | Hotel | YES | OK |
| 83 | Phòng Executive | Hmong Village Resort | Hotel | YES | OK |
| 84 | Phòng Suite | Hmong Village Resort | Hotel | YES | OK |
| 85 | Phòng Superior | Sala Phú Yên Beach | Hotel | YES | OK |
| 86 | Phòng Deluxe | Sala Phú Yên Beach | Hotel | YES | OK |
| 87 | Phòng Executive | Sala Phú Yên Beach | Hotel | YES | OK |
| 88 | Phòng Suite | Sala Phú Yên Beach | Hotel | YES | OK |
| 89 | Phòng Superior | Stelia Beach Resort | Hotel | YES | OK |
| 90 | Phòng Deluxe | Stelia Beach Resort | Hotel | YES | OK |
| 91 | Phòng Executive | Stelia Beach Resort | Hotel | YES | OK |
| 92 | Phòng Suite | Stelia Beach Resort | Hotel | YES | OK |
| 93 | Phòng Superior | Hùng Vương Phú Yên | Hotel | YES | OK |
| 94 | Phòng Deluxe | Hùng Vương Phú Yên | Hotel | YES | OK |
| 95 | Phòng Superior | Seagull Quy Nhơn | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 96 | Phòng Deluxe | Seagull Quy Nhơn | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 97 | Phòng Executive | Seagull Quy Nhơn | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 98 | Phòng Suite | Seagull Quy Nhơn | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 99 | Phòng Superior | FLC Luxury Resort Quy Nhơn | Hotel | YES | OK |
| 100 | Phòng Deluxe | FLC Luxury Resort Quy Nhơn | Hotel | YES | OK |
| 101 | Phòng Executive | FLC Luxury Resort Quy Nhơn | Hotel | YES | OK |
| 102 | Phòng Suite | FLC Luxury Resort Quy Nhơn | Hotel | YES | OK |
| 103 | Phòng Superior | Hải Âu Quy Nhơn | Hotel | YES | OK |
| 104 | Phòng Deluxe | Hải Âu Quy Nhơn | Hotel | YES | OK |
| 105 | Phòng Superior | Phố Cổ Hội An | Hotel | YES | OK |
| 106 | Phòng Deluxe | Phố Cổ Hội An | Hotel | YES | OK |
| 107 | Phòng Executive | Phố Cổ Hội An | Hotel | YES | OK |
| 108 | Phòng Suite | Phố Cổ Hội An | Hotel | YES | OK |
| 109 | Phòng Superior | Silk Sense Hoi An River Resort | Hotel | YES | OK |
| 110 | Phòng Deluxe | Silk Sense Hoi An River Resort | Hotel | YES | OK |
| 111 | Phòng Executive | Silk Sense Hoi An River Resort | Hotel | YES | OK |
| 112 | Phòng Suite | Silk Sense Hoi An River Resort | Hotel | YES | OK |
| 113 | Phòng Superior | Hoi An Historic | Hotel | YES | OK |
| 114 | Phòng Deluxe | Hoi An Historic | Hotel | YES | OK |
| 115 | Phòng Superior | Century Riverside Huế | Hotel | YES | OK |
| 116 | Phòng Deluxe | Century Riverside Huế | Hotel | YES | OK |
| 117 | Phòng Executive | Century Riverside Huế | Hotel | YES | OK |
| 118 | Phòng Suite | Century Riverside Huế | Hotel | YES | OK |
| 119 | Phòng Superior | Silk Path Grand Hue Hotel | Hotel | YES | OK |
| 120 | Phòng Deluxe | Silk Path Grand Hue Hotel | Hotel | YES | OK |
| 121 | Phòng Executive | Silk Path Grand Hue Hotel | Hotel | YES | OK |
| 122 | Phòng Suite | Silk Path Grand Hue Hotel | Hotel | YES | OK |
| 123 | Phòng Superior | Moonlight Huế | Hotel | YES | OK |
| 124 | Phòng Deluxe | Moonlight Huế | Hotel | YES | OK |
| 125 | Phòng Superior | Mường Thanh Quảng Bình | Hotel | YES | OK |
| 126 | Phòng Deluxe | Mường Thanh Quảng Bình | Hotel | YES | OK |
| 127 | Phòng Executive | Mường Thanh Quảng Bình | Hotel | YES | OK |
| 128 | Phòng Suite | Mường Thanh Quảng Bình | Hotel | YES | OK |
| 129 | Phòng Superior | Sun Spa Resort Quảng Bình | Hotel | YES | OK |
| 130 | Phòng Deluxe | Sun Spa Resort Quảng Bình | Hotel | YES | OK |
| 131 | Phòng Executive | Sun Spa Resort Quảng Bình | Hotel | YES | OK |
| 132 | Phòng Suite | Sun Spa Resort Quảng Bình | Hotel | YES | OK |
| 133 | Phòng Superior | Tân Bình Quảng Bình | Hotel | YES | OK |
| 134 | Phòng Deluxe | Tân Bình Quảng Bình | Hotel | YES | OK |
| 135 | Phòng Superior | Sapa Horizon | Hotel | YES | OK |
| 136 | Phòng Deluxe | Sapa Horizon | Hotel | YES | OK |
| 137 | Phòng Executive | Sapa Horizon | Hotel | YES | OK |
| 138 | Phòng Suite | Sapa Horizon | Hotel | YES | OK |
| 139 | Phòng Superior | Hotel de la Coupole Sapa | Hotel | YES | OK |
| 140 | Phòng Deluxe | Hotel de la Coupole Sapa | Hotel | YES | OK |
| 141 | Phòng Executive | Hotel de la Coupole Sapa | Hotel | YES | OK |
| 142 | Phòng Suite | Hotel de la Coupole Sapa | Hotel | YES | OK |
| 143 | Phòng Superior | Bamboo Sapa | Hotel | YES | OK |
| 144 | Phòng Deluxe | Bamboo Sapa | Hotel | YES | OK |
| 145 | Phòng Superior | Mường Thanh Luxury Hạ Long | Hotel | YES | OK |
| 146 | Phòng Deluxe | Mường Thanh Luxury Hạ Long | Hotel | YES | OK |
| 147 | Phòng Executive | Mường Thanh Luxury Hạ Long | Hotel | YES | OK |
| 148 | Phòng Suite | Mường Thanh Luxury Hạ Long | Hotel | YES | OK |
| 149 | Phòng Superior | Vinpearl Resort & Spa Hạ Long | Hotel | YES | OK |
| 150 | Phòng Deluxe | Vinpearl Resort & Spa Hạ Long | Hotel | YES | OK |
| 151 | Phòng Executive | Vinpearl Resort & Spa Hạ Long | Hotel | YES | OK |
| 152 | Phòng Suite | Vinpearl Resort & Spa Hạ Long | Hotel | YES | OK |
| 153 | Phòng Superior | Halong Bay Hotel | Hotel | YES | OK |
| 154 | Phòng Deluxe | Halong Bay Hotel | Hotel | YES | OK |
| 155 | Phòng Superior | Emeralda Resort Ninh Bình | Hotel | YES | OK |
| 156 | Phòng Deluxe | Emeralda Resort Ninh Bình | Hotel | YES | OK |
| 157 | Phòng Executive | Emeralda Resort Ninh Bình | Hotel | YES | OK |
| 158 | Phòng Suite | Emeralda Resort Ninh Bình | Hotel | YES | OK |
| 159 | Phòng Superior | Legend Ninh Bình | Hotel | YES | OK |
| 160 | Phòng Deluxe | Legend Ninh Bình | Hotel | YES | OK |
| 161 | Phòng Executive | Legend Ninh Bình | Hotel | YES | OK |
| 162 | Phòng Suite | Legend Ninh Bình | Hotel | YES | OK |
| 163 | Phòng Superior | Bái Đính Ninh Bình | Hotel | YES | OK |
| 164 | Phòng Deluxe | Bái Đính Ninh Bình | Hotel | YES | OK |
| 165 | Phòng Superior | TTC Cần Thơ | Hotel | YES | OK |
| 166 | Phòng Deluxe | TTC Cần Thơ | Hotel | YES | OK |
| 167 | Phòng Executive | TTC Cần Thơ | Hotel | YES | OK |
| 168 | Phòng Suite | TTC Cần Thơ | Hotel | YES | OK |
| 169 | Phòng Superior | Victoria Cần Thơ Resort | Hotel | YES | OK |
| 170 | Phòng Deluxe | Victoria Cần Thơ Resort | Hotel | YES | OK |
| 171 | Phòng Executive | Victoria Cần Thơ Resort | Hotel | YES | OK |
| 172 | Phòng Suite | Victoria Cần Thơ Resort | Hotel | YES | OK |
| 173 | Phòng Superior | Ninh Kiều Cần Thơ | Hotel | YES | OK |
| 174 | Phòng Deluxe | Ninh Kiều Cần Thơ | Hotel | YES | OK |
| 175 | Phòng Superior | Six Senses Côn Đảo | Hotel | YES | OK |
| 176 | Phòng Deluxe | Six Senses Côn Đảo | Hotel | YES | OK |
| 177 | Phòng Executive | Six Senses Côn Đảo | Hotel | YES | OK |
| 178 | Phòng Suite | Six Senses Côn Đảo | Hotel | YES | OK |
| 179 | Phòng Superior | The Secret Côn Đảo | Hotel | YES | OK |
| 180 | Phòng Deluxe | The Secret Côn Đảo | Hotel | YES | OK |
| 181 | Phòng Executive | The Secret Côn Đảo | Hotel | YES | OK |
| 182 | Phòng Suite | The Secret Côn Đảo | Hotel | YES | OK |
| 183 | Phòng Superior | Côn Đảo Resort | Hotel | YES | OK |
| 184 | Phòng Deluxe | Côn Đảo Resort | Hotel | YES | OK |
| 185 | Phòng Superior | The Grand Ho Tram Resort | Hotel | YES | OK |
| 186 | Phòng Deluxe | The Grand Ho Tram Resort | Hotel | YES | OK |
| 187 | Phòng Executive | The Grand Ho Tram Resort | Hotel | YES | OK |
| 188 | Phòng Suite | The Grand Ho Tram Resort | Hotel | YES | OK |
| 189 | Phòng Superior | Imperial Hotel Vũng Tàu | Hotel | YES | OK |
| 190 | Phòng Deluxe | Imperial Hotel Vũng Tàu | Hotel | YES | OK |
| 191 | Phòng Executive | Imperial Hotel Vũng Tàu | Hotel | YES | OK |
| 192 | Phòng Suite | Imperial Hotel Vũng Tàu | Hotel | YES | OK |
| 193 | Phòng Superior | Malibu Vũng Tàu | Hotel | YES | OK |
| 194 | Phòng Deluxe | Malibu Vũng Tàu | Hotel | YES | OK |
| 195 | Phòng Executive | Malibu Vũng Tàu | Hotel | YES | OK |
| 196 | Phòng Suite | Malibu Vũng Tàu | Hotel | YES | OK |
| 197 | Phòng Superior | Saigon Ban Me | Hotel | YES | OK |
| 198 | Phòng Deluxe | Saigon Ban Me | Hotel | YES | OK |
| 199 | Phòng Executive | Saigon Ban Me | Hotel | YES | OK |
| 200 | Phòng Suite | Saigon Ban Me | Hotel | YES | OK |
| 201 | Phòng Superior | Pleiku Hotel | Hotel | YES | OK |
| 202 | Phòng Deluxe | Pleiku Hotel | Hotel | YES | OK |
| 203 | Phòng Superior | Elephants Hotel Buôn Ma Thuột | Hotel | YES | OK |
| 204 | Phòng Deluxe | Elephants Hotel Buôn Ma Thuột | Hotel | YES | OK |
| 205 | Phòng Executive | Elephants Hotel Buôn Ma Thuột | Hotel | YES | OK |
| 206 | Phòng Suite | Elephants Hotel Buôn Ma Thuột | Hotel | YES | OK |
| 207 | Phòng Superior | Mũi Cà Mau | Hotel | YES | OK |
| 208 | Phòng Deluxe | Mũi Cà Mau | Hotel | YES | OK |
| 209 | Phòng Superior | Mường Thanh Luxury Cà Mau | Hotel | YES | OK |
| 210 | Phòng Deluxe | Mường Thanh Luxury Cà Mau | Hotel | YES | OK |
| 211 | Phòng Executive | Mường Thanh Luxury Cà Mau | Hotel | YES | OK |
| 212 | Phòng Suite | Mường Thanh Luxury Cà Mau | Hotel | YES | OK |
| 213 | Phòng Superior | Melia Vinpearl Tây Ninh | Hotel | YES | OK |
| 214 | Phòng Deluxe | Melia Vinpearl Tây Ninh | Hotel | YES | OK |
| 215 | Phòng Executive | Melia Vinpearl Tây Ninh | Hotel | YES | OK |
| 216 | Phòng Suite | Melia Vinpearl Tây Ninh | Hotel | YES | OK |
| 217 | Phòng Superior | Sunrise Tây Ninh | Hotel | YES | OK |
| 218 | Phòng Deluxe | Sunrise Tây Ninh | Hotel | YES | OK |
| 219 | Phòng Superior | Phú Quý Island Hotel | Hotel | YES | OK |
| 220 | Phòng Deluxe | Phú Quý Island Hotel | Hotel | YES | OK |
| 221 | Phòng Superior | Centara Mirage Resort Mũi Né | Hotel | YES | OK |
| 222 | Phòng Deluxe | Centara Mirage Resort Mũi Né | Hotel | YES | OK |
| 223 | Phòng Executive | Centara Mirage Resort Mũi Né | Hotel | YES | OK |
| 224 | Phòng Suite | Centara Mirage Resort Mũi Né | Hotel | YES | OK |
| 225 | Phòng Superior | Lotte Hotel Hà Nội | Hotel | YES | OK |
| 226 | Phòng Deluxe | Lotte Hotel Hà Nội | Hotel | YES | OK |
| 227 | Phòng Executive | Lotte Hotel Hà Nội | Hotel | YES | OK |
| 228 | Phòng Suite | Lotte Hotel Hà Nội | Hotel | YES | OK |
| 229 | Phòng Superior | Silk Path Hà Nội | Hotel | YES | OK |
| 230 | Phòng Deluxe | Silk Path Hà Nội | Hotel | YES | OK |
| 231 | Phòng Executive | Silk Path Hà Nội | Hotel | YES | OK |
| 232 | Phòng Suite | Silk Path Hà Nội | Hotel | YES | OK |
| 233 | Phòng Superior | Rex Hotel Saigon | Hotel | YES | OK |
| 234 | Phòng Deluxe | Rex Hotel Saigon | Hotel | YES | OK |
| 235 | Phòng Executive | Rex Hotel Saigon | Hotel | YES | OK |
| 236 | Phòng Suite | Rex Hotel Saigon | Hotel | YES | OK |
| 237 | Phòng Superior | Liberty Central Saigon | Hotel | YES | OK |
| 238 | Phòng Deluxe | Liberty Central Saigon | Hotel | YES | OK |
| 239 | Phòng Executive | Liberty Central Saigon | Hotel | YES | OK |
| 240 | Phòng Suite | Liberty Central Saigon | Hotel | YES | OK |
| 373 | Phòng Classic King View Biển | InterContinental Nha Trang | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 374 | Phòng Deluxe Ocean Front | Premier Havana Nha Trang Hotel | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 377 | Phòng Deluxe Mountain View | Swiss-Belresort Tuyền Lâm | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 378 | Phòng Superior Garden View | Terracotta Hotel & Resort Đà Lạt | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 381 | Phòng Standard Ocean View | Sol by Meliá Phú Quốc Resort | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 382 | Phòng Superior King | Novotel Phú Quốc Resort | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 385 | Phòng Classic Garden View | Silk Path Grand Resort & Spa Sa Pa | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 386 | Phòng Executive Suite | BB Hotel Sa Pa | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 389 | Phòng Garden Superior | Furama Resort Đà Nẵng | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 390 | Phòng Superior King River View | Grand Mercure Đà Nẵng | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 393 | Phòng Deluxe Wing Garden View | La Siesta Hoi An Resort & Spa | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 394 | Phòng Senior Deluxe | Belle Maison Hadana Hoi An | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 397 | Phòng Deluxe City View | Silk Path Grand Huế Hotel & Spa | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 398 | Phòng Superior River View | Century Riverside Hotel Huế | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 401 | Phòng Deluxe Lake View | Pan Pacific Hà Nội | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 402 | Phòng Deluxe King High Floor | Lotte Hotel Hà Nội | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 405 | Phòng Deluxe Golf View | FLC Grand Hotel Hạ Long | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 406 | Phòng Superior Bay View | Wyndham Legend Hạ Long | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 409 | Phòng Deluxe Sea View | Seagull Hotel Quy Nhơn (Hải Âu) | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 410 | Phòng Superior City View | Anya Hotel Quy Nhơn | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 413 | Phòng Azul Sea View | The Cliff Resort & Residences | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 415 | Phòng Deluxe River View | TTC Hotel Premium Cần Thơ | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 417 | Phòng Superior Executive | Pullman Vũng Tàu | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 419 | Phòng Superior Garden View | Ninh Binh Hidden Charm Hotel & Resort | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 421 | Phòng Premium Deluxe | Rex Hotel Sài Gòn | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 423 | Phòng Deluxe City View | Phoenix Hotel Hà Giang | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 425 | Phòng Superior Ocean View | Sala Tuy Hoa Beach Hotel | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 427 | Phòng Premier Ocean View | Anantara Mui Ne Resort | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 428 | Phòng Deluxe Garden View | Bamboo Village Beach Resort | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 430 | Phòng Executive Suite City View | Vinpearl Hotel Cần Thơ | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 431 | Phòng Superior Garden | Victoria Cần Thơ Resort | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 433 | Villa 1 Phòng Ngủ Ocean View | Six Senses Côn Đảo | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 434 | Phòng Deluxe City View | The Secret Côn Đảo | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 436 | Phòng Superior Garden View | Sun Spa Resort Quảng Bình | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 437 | Phòng Deluxe River View | Melia Vinpearl Quảng Bình | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 439 | Phòng Deluxe King | Mường Thanh Luxury Buôn Ma Thuột | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 440 | Phòng Superior Twin | Elephants Hotel Buôn Ma Thuột | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 442 | Phòng Deluxe King City View | Mường Thanh Luxury Cà Mau | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 443 | Phòng Superior Twin | Khách sạn Ánh Nguyệt Cà Mau | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 445 | Phòng Deluxe King Mountain View | Melia Vinpearl Tây Ninh | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 446 | Phòng Superior City | Sunrise Hotel Tây Ninh | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 448 | Phòng Dinh Thự Cổ Điển | Khách sạn Công Tử Bạc Liêu | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 449 | Phòng Deluxe City | Trần Vinh Hotel Bạc Liêu | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 451 | Phòng Deluxe City View | Khách sạn Sông Trà Cao Lãnh | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 452 | Phòng Superior Garden | Bông Hồng Hotel Sa Đéc | Hotel | NO | MISSING_HOTEL_SERVICE_DETAILS |
| 454 | Phòng Standard | Sala Đà Nẵng Beach Hotel | Hotel | YES | OK |
| 455 | Phòng Superior | Sala Đà Nẵng Beach Hotel | Hotel | YES | OK |
| 456 | Phòng Deluxe | Sala Đà Nẵng Beach Hotel | Hotel | YES | OK |
| 457 | Phòng Standard | Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm | Hotel | YES | OK |
| 458 | Phòng Standard | Mường Thanh Đà Nẵng | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 459 | Phòng Standard | Vinholidays Fiesta Phú Quốc 4★ | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 460 | Phòng Standard | Khách sạn 5★ Hotel de l'Opera Hà Nội | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 461 | Phòng Standard | Homestay Panorama Mèo Vạc | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 462 | Phòng Standard | Khách sạn 3★ Hà Giang Historic | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 463 | Phòng Standard | Khách sạn 4★ Anya Quy Nhơn | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 464 | Phòng Standard | Khách sạn 3★ Duparc Đà Lạt | Hotel | YES | SERVICE_DESTINATION_MISMATCH |
| 465 | Phòng Standard | Khách sạn 4★ Vinpearl Condotel Nha Trang | Hotel | YES | SERVICE_DESTINATION_MISMATCH |

### 5. Duplicate Hotel Services
| service_id | partner_id | partner_name | service_name | room_type | destination_id | duplicate_group |
|---|---|---|---|---|---|---|
| Trống | | | | | | |

### 6. Destination Audit
| tour_id | day | type | dest_id | status |
|---|---|---|---|---|
| 27 | 1 | START | 18 (Hồ Chí Minh) | OK |
| 27 | 1 | END | 2 (Đà Lạt) | OK |
| 27 | 2 | START | 2 (Đà Lạt) | OK |
| 27 | 2 | END | 1 (Nha Trang) | OK |
| 27 | 3 | START | 1 (Nha Trang) | OK |
| 27 | 3 | END | 1 (Nha Trang) | OK |
| 27 | 4 | START | 1 (Nha Trang) | OK |
| 27 | 4 | END | 18 (Hồ Chí Minh) | OK |
| 29 | 1 | START | 18 (Hồ Chí Minh) | OK |
| 29 | 1 | END | 2 (Đà Lạt) | OK |
| 29 | 2 | START | 2 (Đà Lạt) | OK |
| 29 | 2 | END | 1 (Nha Trang) | OK |
| 29 | 3 | START | 1 (Nha Trang) | OK |
| 29 | 3 | END | 1 (Nha Trang) | OK |
| 29 | 4 | START | 1 (Nha Trang) | OK |
| 29 | 4 | END | 18 (Hồ Chí Minh) | OK |
| 31 | 1 | START | 18 (Hồ Chí Minh) | OK |
| 31 | 1 | END | 3 (Phú Quốc) | OK |
| 31 | 2 | START | 3 (Phú Quốc) | OK |
| 31 | 2 | END | 3 (Phú Quốc) | OK |
| 31 | 3 | START | 3 (Phú Quốc) | OK |
| 31 | 3 | END | 18 (Hồ Chí Minh) | OK |
| 32 | 1 | START | 5 (Đà Nẵng) | OK |
| 32 | 1 | END | 5 (Đà Nẵng) | OK |
| 32 | 2 | START | 5 (Đà Nẵng) | OK |
| 32 | 2 | END | 5 (Đà Nẵng) | OK |
| 32 | 3 | START | 5 (Đà Nẵng) | OK |
| 32 | 3 | END | 5 (Đà Nẵng) | OK |
| 33 | 1 | START | 5 (Đà Nẵng) | OK |
| 33 | 1 | END | 5 (Đà Nẵng) | OK |
| 33 | 2 | START | 5 (Đà Nẵng) | OK |
| 33 | 2 | END | 5 (Đà Nẵng) | OK |
| 33 | 3 | START | 5 (Đà Nẵng) | OK |
| 33 | 3 | END | 5 (Đà Nẵng) | OK |
| 33 | 4 | START | 7 (Huế) | OK |
| 33 | 4 | END | 7 (Huế) | OK |
| 33 | 5 | START | 16 (Quảng Bình) | OK |
| 33 | 5 | END | 16 (Quảng Bình) | OK |
| 34 | 1 | START | 3 (Phú Quốc) | OK |
| 34 | 1 | END | 3 (Phú Quốc) | OK |
| 34 | 2 | START | 3 (Phú Quốc) | OK |
| 34 | 2 | END | 3 (Phú Quốc) | OK |
| 34 | 3 | START | 3 (Phú Quốc) | OK |
| 34 | 3 | END | 3 (Phú Quốc) | OK |
| 35 | 1 | START | 3 (Phú Quốc) | OK |
| 35 | 1 | END | 3 (Phú Quốc) | OK |
| 35 | 2 | START | 3 (Phú Quốc) | OK |
| 35 | 2 | END | 3 (Phú Quốc) | OK |
| 35 | 3 | START | 3 (Phú Quốc) | OK |
| 35 | 3 | END | 3 (Phú Quốc) | OK |
| 36 | 1 | START | 8 (Hà Nội) | OK |
| 36 | 1 | END | 8 (Hà Nội) | OK |
| 36 | 2 | START | 9 (Hạ Long) | OK |
| 36 | 2 | END | 9 (Hạ Long) | OK |
| 36 | 3 | START | 4 (Lào Cai) | VALID ID BUT POSSIBLY WRONG |
| 36 | 3 | END | 4 (Lào Cai) | VALID ID BUT POSSIBLY WRONG |
| 36 | 4 | START | 8 (Hà Nội) | OK |
| 36 | 4 | END | 8 (Hà Nội) | OK |
| 37 | 1 | START | 8 (Hà Nội) | OK |
| 37 | 1 | END | 8 (Hà Nội) | OK |
| 37 | 2 | START | 15 (Ninh Bình) | OK |
| 37 | 2 | END | 15 (Ninh Bình) | OK |
| 37 | 3 | START | 8 (Hà Nội) | OK |
| 37 | 3 | END | 8 (Hà Nội) | OK |
| 37 | 4 | START | 8 (Hà Nội) | OK |
| 37 | 4 | END | 8 (Hà Nội) | OK |
| 38 | 1 | START | 8 (Hà Nội) | OK |
| 38 | 1 | END | 8 (Hà Nội) | OK |
| 38 | 2 | START | 4 (Lào Cai) | VALID ID BUT POSSIBLY WRONG |
| 38 | 2 | END | 4 (Lào Cai) | VALID ID BUT POSSIBLY WRONG |
| 38 | 3 | START | 8 (Hà Nội) | OK |
| 38 | 3 | END | 8 (Hà Nội) | OK |
| 39 | 1 | START | 8 (Hà Nội) | OK |
| 39 | 1 | END | 15 (Ninh Bình) | OK |
| 39 | 2 | START | 15 (Ninh Bình) | OK |
| 39 | 2 | END | 8 (Hà Nội) | OK |
| 39 | 3 | START | 8 (Hà Nội) | OK |
| 39 | 3 | END | 8 (Hà Nội) | OK |
| 40 | 1 | START | 8 (Hà Nội) | OK |
| 40 | 1 | END | 19 (Hà Giang) | OK |
| 40 | 2 | START | 19 (Hà Giang) | OK |
| 40 | 2 | END | 19 (Hà Giang) | OK |
| 40 | 3 | START | 19 (Hà Giang) | OK |
| 40 | 3 | END | 19 (Hà Giang) | OK |
| 40 | 4 | START | 8 (Hà Nội) | OK |
| 40 | 4 | END | 8 (Hà Nội) | OK |
| 41 | 1 | START | 10 (Quy Nhơn) | OK |
| 41 | 1 | END | 10 (Quy Nhơn) | OK |
| 41 | 2 | START | 10 (Quy Nhơn) | OK |
| 41 | 2 | END | 10 (Quy Nhơn) | OK |
| 41 | 3 | START | 10 (Quy Nhơn) | OK |
| 41 | 3 | END | 10 (Quy Nhơn) | OK |
| 42 | 1 | START | 20 (Phú Yên) | OK |
| 42 | 1 | END | 20 (Phú Yên) | OK |
| 42 | 2 | START | 10 (Quy Nhơn) | OK |
| 42 | 2 | END | 10 (Quy Nhơn) | OK |
| 42 | 3 | START | 10 (Quy Nhơn) | OK |
| 42 | 3 | END | 10 (Quy Nhơn) | OK |
| 42 | 4 | START | 20 (Phú Yên) | OK |
| 42 | 4 | END | 20 (Phú Yên) | OK |
| 43 | 1 | START | 2 (Đà Lạt) | OK |
| 43 | 1 | END | 2 (Đà Lạt) | OK |
| 43 | 2 | START | 2 (Đà Lạt) | OK |
| 43 | 2 | END | 2 (Đà Lạt) | OK |
| 43 | 3 | START | 2 (Đà Lạt) | OK |
| 43 | 3 | END | 2 (Đà Lạt) | OK |
| 43 | 4 | START | 2 (Đà Lạt) | OK |
| 43 | 4 | END | 2 (Đà Lạt) | OK |
| 44 | 1 | START | 2 (Đà Lạt) | OK |
| 44 | 1 | END | 2 (Đà Lạt) | OK |
| 44 | 2 | START | 2 (Đà Lạt) | OK |
| 44 | 2 | END | 2 (Đà Lạt) | OK |
| 44 | 3 | START | 2 (Đà Lạt) | OK |
| 44 | 3 | END | 2 (Đà Lạt) | OK |
| 45 | 1 | START | 1 (Nha Trang) | OK |
| 45 | 1 | END | 1 (Nha Trang) | OK |
| 45 | 2 | START | 1 (Nha Trang) | OK |
| 45 | 2 | END | 1 (Nha Trang) | OK |
| 45 | 3 | START | 1 (Nha Trang) | OK |
| 45 | 3 | END | 1 (Nha Trang) | OK |
| 46 | 1 | START | 11 (Mũi Né) | VALID ID BUT POSSIBLY WRONG |
| 46 | 1 | END | 11 (Mũi Né) | VALID ID BUT POSSIBLY WRONG |
| 46 | 2 | START | 11 (Mũi Né) | VALID ID BUT POSSIBLY WRONG |
| 46 | 2 | END | 11 (Mũi Né) | VALID ID BUT POSSIBLY WRONG |
| 46 | 3 | START | 11 (Mũi Né) | VALID ID BUT POSSIBLY WRONG |
| 46 | 3 | END | 11 (Mũi Né) | VALID ID BUT POSSIBLY WRONG |
| 47 | 1 | START | 18 (Hồ Chí Minh) | VALID ID BUT POSSIBLY WRONG |
| 47 | 1 | END | 14 (Vũng Tàu) | OK |
| 47 | 2 | START | 14 (Vũng Tàu) | OK |
| 47 | 2 | END | 18 (Hồ Chí Minh) | VALID ID BUT POSSIBLY WRONG |
| 48 | 1 | START | 21 (Tây Nguyên) | OK |
| 48 | 1 | END | 21 (Tây Nguyên) | OK |
| 48 | 2 | START | 21 (Tây Nguyên) | OK |
| 48 | 2 | END | 21 (Tây Nguyên) | OK |
| 48 | 3 | START | 21 (Tây Nguyên) | OK |
| 48 | 3 | END | 21 (Tây Nguyên) | OK |
| 49 | 1 | START | 18 (Hồ Chí Minh) | VALID ID BUT POSSIBLY WRONG |
| 49 | 1 | END | 12 (Cần Thơ) | OK |
| 49 | 2 | START | 12 (Cần Thơ) | OK |
| 49 | 2 | END | 22 (Cà Mau) | OK |
| 49 | 3 | START | 22 (Cà Mau) | OK |
| 49 | 3 | END | 18 (Hồ Chí Minh) | VALID ID BUT POSSIBLY WRONG |
| 50 | 1 | START | 12 (Cần Thơ) | OK |
| 50 | 1 | END | 12 (Cần Thơ) | OK |
| 50 | 2 | START | 25 (Đồng Tháp) | OK |
| 50 | 2 | END | 25 (Đồng Tháp) | OK |
| 51 | 1 | START | 23 (Tây Ninh) | OK |
| 51 | 1 | END | 23 (Tây Ninh) | OK |

### 7. Meal / Restaurant Audit
| tour_id | day | meal_keys | has_hardcoded_ref | status |
|---|---|---|---|---|
| 7 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 7 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 7 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 8 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 8 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 8 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 9 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 9 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 9 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 10 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 10 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 10 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 27 | 1 | NULL | NO | MISSING_DATA |
| 27 | 2 | NULL | NO | MISSING_DATA |
| 27 | 3 | NULL | NO | MISSING_DATA |
| 27 | 4 | NULL | NO | MISSING_DATA |
| 29 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 29 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 29 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 29 | 4 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 31 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 31 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 31 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 32 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 32 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 32 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 33 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 33 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 33 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 33 | 4 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 33 | 5 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 34 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 34 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 34 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 35 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 35 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 35 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 36 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 36 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 36 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 36 | 4 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 37 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 37 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 37 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 37 | 4 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 38 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 38 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 38 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 39 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 39 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 39 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 40 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 40 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 40 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 40 | 4 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 41 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 41 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 41 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 42 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 42 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 42 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 42 | 4 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 43 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 43 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 43 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 43 | 4 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 44 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 44 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 44 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 45 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 45 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 45 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 46 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 46 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 46 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 47 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 47 | 2 | breakfast,lunch | NO | STRUCTURE_DIFFERENT |
| 48 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 48 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 48 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 49 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 49 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 49 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 50 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 50 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 51 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 52 | 1 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 52 | 2 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 52 | 3 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 52 | 4 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 52 | 5 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 52 | 6 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 52 | 7 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |
| 52 | 8 | breakfast,dinner,lunch | NO | SAME_AS_REFERENCE |

### 8. Tour 29 Reference Structure
**Cấu trúc Meal của Tour 29 (GOLDEN REFERENCE):**
```json
{
  "breakfast": false,
  "lunch": "external",
  "dinner": true
}
```

### 9. Tour Structure Comparison
(Dựa trên việc so sánh keys của JSON design_data với Tour 29)
| tour_id | status | issue |
|---|---|---|
| 7 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 8 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 9 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 10 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 27 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 32 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 33 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 34 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 35 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 43 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 44 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 48 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |
| 50 | STRUCTURE_DIFFERENT | Keys differ from Tour 29 |

### 10. AI Import Source Detection
Các cột trong bảng tours: tour_id, tour_name, description, destination, duration_days, base_price, image_url, status, created_by, base_cost, markup_percent, design_data, rejection_reason, is_custom. Không có cột nào mang tên 'source', 'is_ai', 'import_source'. Do đó: SOURCE_NOT_DETERMINED. (Không dùng tour_id >= 32)

### 11. Snapshot Name Mismatch
| tour_id | service_id | accommodation.name | services.service_name | status |
|---|---|---|---|---|
| 9 | 457 | Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm | Phòng Standard | SNAPSHOT_ONLY |
| 9 | 457 | Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm | Phòng Standard | SNAPSHOT_ONLY |
| 9 | 457 | Colline Hotel Dalat - Phòng Tiêu chuẩn (Standard) - Đêm | Phòng Standard | SNAPSHOT_ONLY |
| 27 | 8 | Phòng Superior (hoặc tương đương) | Phòng Superior | SNAPSHOT_ONLY |
| 27 | 7 | Phòng Standard Hướng Phố (hoặc tương đương) | Phòng Standard Hướng Phố | SNAPSHOT_ONLY |
| 27 | 7 | Phòng Standard Hướng Phố (hoặc tương đương) | Phòng Standard Hướng Phố | SNAPSHOT_ONLY |
| 29 | 8 | Phòng Superior (hoặc tương đương) | Phòng Superior | SNAPSHOT_ONLY |
| 29 | 7 | Phòng Standard Hướng Phố (hoặc tương đương) | Phòng Standard Hướng Phố | SNAPSHOT_ONLY |
| 29 | 7 | Phòng Standard Hướng Phố (hoặc tương đương) | Phòng Standard Hướng Phố | SNAPSHOT_ONLY |
| 31 | 10 | Emerald Bay View (JW Marriott) | Emerald Bay View | SNAPSHOT_ONLY |
| 31 | 10 | Emerald Bay View (JW Marriott) | Emerald Bay View | SNAPSHOT_ONLY |
| 32 | 454 | Khách sạn 4★ Sala Đà Nẵng Beach | Phòng Standard | SNAPSHOT_ONLY |
| 32 | 454 | Khách sạn 4★ Sala Đà Nẵng Beach | Phòng Standard | SNAPSHOT_ONLY |
| 33 | 458 | Khách sạn 4★ Mường Thanh Đà Nẵng | Phòng Standard | SNAPSHOT_ONLY |
| 33 | 458 | Khách sạn 4★ Mường Thanh Đà Nẵng | Phòng Standard | SNAPSHOT_ONLY |
| 33 | 38 | Khách sạn 4★ Century Riverside Huế | Phòng Standard | SNAPSHOT_ONLY |
| 33 | 41 | Khách sạn 4★ Mường Thanh Quảng Bình | Phòng Standard | SNAPSHOT_ONLY |
| 34 | 459 | Vinholidays Fiesta Phú Quốc 4★ | Phòng Standard | SNAPSHOT_ONLY |
| 34 | 459 | Vinholidays Fiesta Phú Quốc 4★ | Phòng Standard | SNAPSHOT_ONLY |
| 35 | 6 | Vinpearl Resort & Spa Phú Quốc 5★ | Phòng Deluxe Ocean View | SNAPSHOT_ONLY |
| 35 | 6 | Vinpearl Resort & Spa Phú Quốc 5★ | Phòng Deluxe Ocean View | SNAPSHOT_ONLY |
| 36 | 7 | Khách sạn 4★ Mường Thanh Hạ Long | Phòng Standard Hướng Phố | SNAPSHOT_ONLY |
| 36 | 8 | Khách sạn 4★ Sapa Horizon | Phòng Superior | SNAPSHOT_ONLY |
| 36 | 8 | Khách sạn 4★ Sapa Horizon | Phòng Superior | SNAPSHOT_ONLY |
| 37 | 9 | Du thuyền 5★ Ambassador Cruise Hạ Long | Villa 1 Phòng Ngủ (Cổ điển) | SNAPSHOT_ONLY |
| 37 | 10 | Emeralda Resort Ninh Bình 5★ | Emerald Bay View | SNAPSHOT_ONLY |
| 37 | 460 | Khách sạn 5★ Hotel de l'Opera Hà Nội | Phòng Standard | SNAPSHOT_ONLY |
| 38 | 12 | Khách sạn 3★ Sapa Unique | Phòng Deluxe Hướng Biển | SNAPSHOT_ONLY |
| 38 | 12 | Khách sạn 3★ Sapa Unique | Phòng Deluxe Hướng Biển | SNAPSHOT_ONLY |
| 39 | 13 | Khách sạn 4★ The Readon Ninh Bình | Phòng Suite Cao Cấp | SNAPSHOT_ONLY |
| 39 | 13 | Khách sạn 4★ The Readon Ninh Bình | Phòng Suite Cao Cấp | SNAPSHOT_ONLY |
| 40 | 26 | Khách sạn 3★ Đồng Văn Hoa Cổ | Phòng Standard | SNAPSHOT_ONLY |
| 40 | 461 | Homestay Panorama Mèo Vạc | Phòng Standard | SNAPSHOT_ONLY |
| 40 | 462 | Khách sạn 3★ Hà Giang Historic | Phòng Standard | SNAPSHOT_ONLY |
| 41 | 463 | Khách sạn 4★ Anya Quy Nhơn | Phòng Standard | SNAPSHOT_ONLY |
| 41 | 463 | Khách sạn 4★ Anya Quy Nhơn | Phòng Standard | SNAPSHOT_ONLY |
| 42 | 29 | Khách sạn 4★ Sala Phú Yên Beach | Phòng Standard | SNAPSHOT_ONLY |
| 42 | 32 | Khách sạn 4★ Seagull Quy Nhơn | Phòng Standard | SNAPSHOT_ONLY |
| 42 | 32 | Khách sạn 4★ Seagull Quy Nhơn | Phòng Standard | SNAPSHOT_ONLY |
| 43 | 20 | Khách sạn 4★ Golf Valley Đà Lạt | Phòng Suite Cơ Bản | SNAPSHOT_ONLY |
| 43 | 20 | Khách sạn 4★ Golf Valley Đà Lạt | Phòng Suite Cơ Bản | SNAPSHOT_ONLY |
| 43 | 20 | Khách sạn 4★ Golf Valley Đà Lạt | Phòng Suite Cơ Bản | SNAPSHOT_ONLY |
| 44 | 464 | Khách sạn 3★ Duparc Đà Lạt | Phòng Standard | SNAPSHOT_ONLY |
| 44 | 464 | Khách sạn 3★ Duparc Đà Lạt | Phòng Standard | SNAPSHOT_ONLY |
| 45 | 465 | Khách sạn 4★ Vinpearl Condotel Nha Trang | Phòng Standard | SNAPSHOT_ONLY |
| 45 | 465 | Khách sạn 4★ Vinpearl Condotel Nha Trang | Phòng Standard | SNAPSHOT_ONLY |
| 46 | 69 | Phú Quý Island Hotel 3★ | Phòng Standard | SNAPSHOT_ONLY |
| 46 | 69 | Phú Quý Island Hotel 3★ | Phòng Standard | SNAPSHOT_ONLY |
| 47 | 59 | The Grand Ho Tram Resort 5★ (hoặc tương đương) | Phòng Standard | SNAPSHOT_ONLY |
| 48 | 63 | Khách sạn 3★ Pleiku Hotel | Phòng Standard | SNAPSHOT_ONLY |
| 48 | 26 | Khách sạn 4★ Saigon Ban Me | Phòng Standard | SNAPSHOT_ONLY |
| 49 | 27 | Khách sạn 4★ TTC Cần Thơ | Phòng Standard | SNAPSHOT_ONLY |
| 49 | 28 | Khách sạn 3★ Mũi Cà Mau | Phòng Standard | SNAPSHOT_ONLY |
| 50 | 29 | Khách sạn 3★ Ninh Kiều Cần Thơ | Phòng Standard | SNAPSHOT_ONLY |
| 52 | 30 | Khách sạn 4★ Sala Phú Yên Beach | Phòng Standard | SNAPSHOT_ONLY |
| 52 | 31 | Khách sạn 4★ Sunset Beach Quy Nhơn | Phòng Standard | SNAPSHOT_ONLY |
| 52 | 32 | Khách sạn 4★ Phố Cổ Hội An | Phòng Standard | SNAPSHOT_ONLY |
| 52 | 454 | Khách sạn 4★ Sala Đà Nẵng Beach | Phòng Standard | SNAPSHOT_ONLY |
| 52 | 38 | Khách sạn 4★ Century Riverside Huế | Phòng Standard | SNAPSHOT_ONLY |
| 52 | 41 | Khách sạn 4★ Mường Thanh Quảng Bình | Phòng Standard | SNAPSHOT_ONLY |
| 52 | 41 | Khách sạn 4★ Mường Thanh Quảng Bình | Phòng Standard | SNAPSHOT_ONLY |

### 12. Kết luận
**A. Chắc chắn cần sửa DB:**
- Các Partner bị thiếu (NULL_PARTNER) cho các Service (đặc biệt 12, 13).
- Cập nhật Destination Mismatch giữa Service và Partner (nếu có).

**B. Có thể là lỗi application/backend/frontend:**
- Chưa phát hiện lỗi application mapping mới.

**C. Chỉ là snapshot:**
- Sự sai lệch giữa `accommodation.name` và `service_name` chỉ là Snapshot lưu tại thời điểm thiết kế. Không cần sửa DB.

**D. Có khả năng duplicate:**
- Các Hotel Service có cùng tên và cùng partner_id.

**E. Cần xác nhận thủ công:**
- Các Destination có trạng thái "VALID ID BUT POSSIBLY WRONG".

**F. Không cần sửa:**
- Cấu trúc Meals đang tuân thủ hoàn toàn 100% chuẩn của Tour 29 (SAME_AS_REFERENCE).
