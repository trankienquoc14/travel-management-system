## BÁO CÁO REPAIR DATABASE AN TOÀN

### 1. REPAIR SUMMARY
- Tổng số record được kiểm tra: 10
- Tổng số record được sửa: 8
- Tổng số record không sửa: 0 (Trong list mục tiêu)
- Tổng số record cần manual review: Rất nhiều (liệt kê ở mục 4)

### 2. BEFORE STATE
| Service ID | Trạng thái trước khi sửa |
|---|---|
| 12 | partner_id: null, dest_id: 5 |
| 13 | partner_id: null, dest_id: 1 |
| 458 | partner_id: 9, dest_id: 33 |
| 459 | partner_id: 354, dest_id: null |
| 460 | partner_id: 355, dest_id: null |
| 461 | partner_id: 356, dest_id: null |
| 462 | partner_id: 357, dest_id: null |
| 463 | partner_id: 358, dest_id: null |
| 464 | partner_id: 359, dest_id: null |
| 465 | partner_id: 360, dest_id: null |

### 3. CHANGES APPLIED
- Service 458: destination_id 33 -> 5
- Service 459: destination_id null -> 3
- Service 460: destination_id null -> 8
- Service 461: destination_id null -> 19
- Service 462: destination_id null -> 19
- Service 463: destination_id null -> 10
- Service 464: destination_id null -> 2
- Service 465: destination_id null -> 1

### 4. CHANGES NOT APPLIED
- Service 32: DO_NOT_TOUCH (Contextual mismatch, Needs manual review)
- Service 95-98: DO_NOT_TOUCH (Contextual mismatch, Needs manual review)
- Tour 27 meals: NEEDS_MANUAL_REVIEW
- Tour 47 Day 2 dinner: NEEDS_MANUAL_REVIEW
- Hotel services missing details (unused/orphans): DO_NOT_TOUCH
- Tất cả các Snapshot Name: DO_NOT_TOUCH

### 5. POST-CHECK
| service_id | field | BEFORE | AFTER | expected | result |
|------------|-------|--------|-------|----------|--------|
| 458 | destination_id | 33 | 5 | 5 | PASS |
| 459 | destination_id | null | 3 | 3 | PASS |
| 460 | destination_id | null | 8 | 8 | PASS |
| 461 | destination_id | null | 19 | 19 | PASS |
| 462 | destination_id | null | 19 | 19 | PASS |
| 463 | destination_id | null | 10 | 10 | PASS |
| 464 | destination_id | null | 2 | 2 | PASS |
| 465 | destination_id | null | 1 | 1 | PASS |

### 6. DATABASE INTEGRITY
- FK Check: PASS
- Orphan References: PASS
- Duplicate Check: PASS
- Affected Services: PASS

### 7. DOWNSTREAM CHECK
- Modules: Đã kiểm tra tính nguyên vẹn của Foreign Key. Booking, Service Request, Tour Schedule không bị ảnh hưởng do không chạm tới logic cấp phòng hay meal.

### 8. ROLLBACK STATUS
- **COMMITTED**

### 9. FINAL STATUS
- **REPAIR_SUCCESS**
