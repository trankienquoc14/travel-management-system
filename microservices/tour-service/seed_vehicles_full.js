const sequelize = require('./config/database');

const vehiclesData = [
    // --- 1. XE 4 CHỖ (6 xe) ---
    {
        vehicle_code: 'XE-4C-01',
        license_plate: '51K-123.45',
        seat_capacity: 4,
        vehicle_type: 'Xe 4 chỗ',
        brand_model: 'Toyota Camry 2.5Q (2024)',
        image_url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80',
        color: 'Đen sang trọng',
        status: 'AVAILABLE',
        notes: 'Dịch vụ đưa đón VIP, nội thất da cao cấp, wifi tốc độ cao.'
    },
    {
        vehicle_code: 'XE-4C-02',
        license_plate: '51K-678.90',
        seat_capacity: 4,
        vehicle_type: 'Xe 4 chỗ',
        brand_model: 'Mercedes-Benz E200 Exclusive',
        image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng Ngọc Trai',
        status: 'AVAILABLE',
        notes: 'Xe đón đoàn ngoại giao, phục vụ lãnh đạo và chuyên gia.'
    },
    {
        vehicle_code: 'XE-4C-03',
        license_plate: '29A-888.66',
        seat_capacity: 4,
        vehicle_type: 'Xe 4 chỗ',
        brand_model: 'Honda Accord 1.5 Turbo (2023)',
        image_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80',
        color: 'Xám Titan',
        status: 'IN_TOUR',
        notes: 'Đang phục vụ khách hàng tour thương mại Hà Nội - Ninh Bình.'
    },
    {
        vehicle_code: 'XE-4C-04',
        license_plate: '43A-555.22',
        seat_capacity: 4,
        vehicle_type: 'Xe 4 chỗ',
        brand_model: 'Mazda 6 2.0 Premium (2023)',
        image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        color: 'Đỏ Pha Lê',
        status: 'AVAILABLE',
        notes: 'Nội thất sang trọng, trang bị cửa sổ trời, dàn âm thanh Bose.'
    },
    {
        vehicle_code: 'XE-4C-05',
        license_plate: '79A-345.67',
        seat_capacity: 4,
        vehicle_type: 'Xe 4 chỗ',
        brand_model: 'Hyundai Elantra N-Line (2024)',
        image_url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
        color: 'Xanh Dương',
        status: 'AVAILABLE',
        notes: 'Đưa đón sân bay Cam Ranh - Nha Trang, vận hành mượt mà.'
    },
    {
        vehicle_code: 'XE-4C-06',
        license_plate: '49A-999.11',
        seat_capacity: 4,
        vehicle_type: 'Xe 4 chỗ',
        brand_model: 'VinFast Lux A2.0 Turbo',
        image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
        color: 'Bạc',
        status: 'MAINTENANCE',
        notes: 'Bảo dưỡng định kỳ 20.000km tại VinFast Đà Lạt.'
    },

    // --- 2. XE 7 CHỖ (6 xe) ---
    {
        vehicle_code: 'XE-7C-01',
        license_plate: '43A-123.45',
        seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ',
        brand_model: 'Toyota Fortuner Legender 2023',
        image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng',
        status: 'AVAILABLE',
        notes: 'Gầm cao máy khỏe, 2 cầu phù hợp tour Tây Nguyên & Tây Bắc.'
    },
    {
        vehicle_code: 'XE-7C-02',
        license_plate: '43A-999.88',
        seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ',
        brand_model: 'Toyota Innova Cross Hybrid (2024)',
        image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        color: 'Đen',
        status: 'AVAILABLE',
        notes: 'Xe siêu tiết kiệm nhiên liệu, cửa sổ trời toàn cảnh panorama.'
    },
    {
        vehicle_code: 'XE-7C-03',
        license_plate: '51H-888.99',
        seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ',
        brand_model: 'Ford Everest Titanium+ 4x4 (2023)',
        image_url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=80',
        color: 'Nâu Đồng',
        status: 'IN_TOUR',
        notes: 'Đang hành trình tour TP.HCM - Phan Thiết 3N2Đ.'
    },
    {
        vehicle_code: 'XE-7C-04',
        license_plate: '29B-777.33',
        seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ',
        brand_model: 'Kia Carnival Royal 7 chỗ (2024)',
        image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng Ngọc',
        status: 'AVAILABLE',
        notes: 'Ghế thương gia nâng chân, màn hình giải trí Android 15.6 inch.'
    },
    {
        vehicle_code: 'XE-7C-05',
        license_plate: '79A-666.22',
        seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ',
        brand_model: 'Mitsubishi Xpander Cross 2024',
        image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
        color: 'Cam Đen',
        status: 'AVAILABLE',
        notes: 'Khoang hành lý rộng rãi, điều hòa lạnh sâu phù hợp tour biển.'
    },
    {
        vehicle_code: 'XE-7C-06',
        license_plate: '65A-333.11',
        seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ',
        brand_model: 'Hyundai SantaFe Hybrid (2024)',
        image_url: 'https://images.unsplash.com/photo-1541348263662-e082662d82da?auto=format&fit=crop&w=600&q=80',
        color: 'Xám Lông Chuột',
        status: 'MAINTENANCE',
        notes: 'Kiểm tra hệ thống cảm biến va chạm và thay dầu động cơ.'
    },

    // --- 3. XE LIMOUSINE 9-11 CHỖ (6 xe) ---
    {
        vehicle_code: 'XE-LIMO-01',
        license_plate: '51B-999.01',
        seat_capacity: 9,
        vehicle_type: 'Xe Limousine 9 chỗ',
        brand_model: 'Dcar Limousine President (2023)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Đen Bạc VIP',
        status: 'AVAILABLE',
        notes: 'Ghế massage 8 chế độ, tủ lạnh âm, cổng sạc USB Type-C cho mỗi ghế.'
    },
    {
        vehicle_code: 'XE-LIMO-02',
        license_plate: '51B-999.02',
        seat_capacity: 9,
        vehicle_type: 'Xe Limousine 9 chỗ',
        brand_model: 'AutoKingdom Limousine VIP (2024)',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng Ánh Kim',
        status: 'IN_TOUR',
        notes: 'Phục vụ đoàn khách cao cấp Đà Lạt Săn Mây.'
    },
    {
        vehicle_code: 'XE-LIMO-03',
        license_plate: '29B-888.09',
        seat_capacity: 11,
        vehicle_type: 'Xe Limousine 11 chỗ',
        brand_model: 'Hyundai Solati Dcar Hạng Thương Gia',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Nâu Vàng',
        status: 'AVAILABLE',
        notes: 'Trần bầu trời sao Rolls-Royce, dàn loa Sony High-Res.'
    },
    {
        vehicle_code: 'XE-LIMO-04',
        license_plate: '43B-777.09',
        seat_capacity: 9,
        vehicle_type: 'Xe Limousine 9 chỗ',
        brand_model: 'Ford Transit Dcar VIP Lounge',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Đen Mờ',
        status: 'AVAILABLE',
        notes: 'Cửa lùa tự động chống kẹt, kính dán phim cách nhiệt 3M.'
    },
    {
        vehicle_code: 'XE-LIMO-05',
        license_plate: '79B-555.09',
        seat_capacity: 11,
        vehicle_type: 'Xe Limousine 11 chỗ',
        brand_model: 'Solati Skybus Pro VIP (2024)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Đỏ Đô',
        status: 'AVAILABLE',
        notes: 'Tivi 32 inch 4K gập trần, kết nối Apple CarPlay không dây.'
    },
    {
        vehicle_code: 'XE-LIMO-06',
        license_plate: '49B-333.09',
        seat_capacity: 9,
        vehicle_type: 'Xe Limousine 9 chỗ',
        brand_model: 'Dcar VIP Business (2023)',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Bạc Titan',
        status: 'MAINTENANCE',
        notes: 'Bảo dưỡng bọc lại da ghế massage số 3 và 4.'
    },

    // --- 4. XE 16 CHỖ (6 xe) ---
    {
        vehicle_code: 'XE-16C-01',
        license_plate: '43B-777.99',
        seat_capacity: 16,
        vehicle_type: 'Xe 16 chỗ',
        brand_model: 'Ford Transit Luxury 2023',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng',
        status: 'AVAILABLE',
        notes: 'Ghế da ngả thoải mái, điều hòa 2 dàn lạnh độc lập.'
    },
    {
        vehicle_code: 'XE-16C-02',
        license_plate: '51B-123.16',
        seat_capacity: 16,
        vehicle_type: 'Xe 16 chỗ',
        brand_model: 'Hyundai Solati DLX (2024)',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Bạc',
        status: 'AVAILABLE',
        notes: 'Trần xe cao 1m9 đứng thoải mái, hầm hành lý siêu rộng.'
    },
    {
        vehicle_code: 'XE-16C-03',
        license_plate: '29B-456.16',
        seat_capacity: 16,
        vehicle_type: 'Xe 16 chỗ',
        brand_model: 'Ford Transit Premium (2024)',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Đen',
        status: 'IN_TOUR',
        notes: 'Đang chạy tour Hạ Long 2N1Đ.'
    },
    {
        vehicle_code: 'XE-16C-04',
        license_plate: '79B-789.16',
        seat_capacity: 16,
        vehicle_type: 'Xe 16 chỗ',
        brand_model: 'Hyundai Solati Executive 2023',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng',
        status: 'AVAILABLE',
        notes: 'Đầy đủ trang thiết bị an toàn, búa thoát hiểm, bình chữa cháy.'
    },
    {
        vehicle_code: 'XE-16C-05',
        license_plate: '49B-111.16',
        seat_capacity: 16,
        vehicle_type: 'Xe 16 chỗ',
        brand_model: 'Ford Transit SVP 2023',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Ghi Vàng',
        status: 'AVAILABLE',
        notes: 'Chuyên leo đèo Mimosa & Prenn Đà Lạt êm ái.'
    },
    {
        vehicle_code: 'XE-16C-06',
        license_plate: '72B-222.16',
        seat_capacity: 16,
        vehicle_type: 'Xe 16 chỗ',
        brand_model: 'Mercedes-Benz Sprinter Executive',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        color: 'Xám',
        status: 'MAINTENANCE',
        notes: 'Bảo dưỡng định kỳ ga máy lạnh tại gara Vũng Tàu.'
    },

    // --- 5. XE 29 CHỖ (6 xe) ---
    {
        vehicle_code: 'XE-29C-01',
        license_plate: '43B-012.34',
        seat_capacity: 29,
        vehicle_type: 'Xe 29 chỗ',
        brand_model: 'Thaco Town TB79S (2023)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng - Xanh',
        status: 'AVAILABLE',
        notes: 'Trang bị wifi, tủ lạnh mini, Micro không dây, loa Karaoke.'
    },
    {
        vehicle_code: 'XE-29C-02',
        license_plate: '43B-055.66',
        seat_capacity: 29,
        vehicle_type: 'Xe 29 chỗ',
        brand_model: 'Hyundai County Premium 2023',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Bạc',
        status: 'AVAILABLE',
        notes: 'Đội xe du lịch chất lượng cao, lốp hơi béo êm ái.'
    },
    {
        vehicle_code: 'XE-29C-03',
        license_plate: '51B-888.29',
        seat_capacity: 29,
        vehicle_type: 'Xe 29 chỗ',
        brand_model: 'Thaco Garden 79S (2024)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Đỏ - Trắng',
        status: 'IN_TOUR',
        notes: 'Đang hành trình tour Miền Tây 4N3Đ.'
    },
    {
        vehicle_code: 'XE-29C-04',
        license_plate: '29B-999.29',
        seat_capacity: 29,
        vehicle_type: 'Xe 29 chỗ',
        brand_model: 'Samco Felix Giọt Sương (2023)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Xanh Lá - Trắng',
        status: 'AVAILABLE',
        notes: 'Động cơ Isuzu Nhật Bản êm ái, trang bị hệ thống phanh ABS.'
    },
    {
        vehicle_code: 'XE-29C-05',
        license_plate: '79B-333.29',
        seat_capacity: 29,
        vehicle_type: 'Xe 29 chỗ',
        brand_model: 'Thaco Meadow TB85S (2024)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Vàng - Trắng',
        status: 'AVAILABLE',
        notes: 'Ghế ngồi bọc da Châu Âu, có cổng sạc riêng cho từng hàng ghế.'
    },
    {
        vehicle_code: 'XE-29C-06',
        license_plate: '49B-777.29',
        seat_capacity: 29,
        vehicle_type: 'Xe 29 chỗ',
        brand_model: 'Isuzu Samco Growin (2023)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng - Xanh Dương',
        status: 'MAINTENANCE',
        notes: 'Kiểm tra bảo dưỡng định kỳ hệ thống điều hòa bóng hơi.'
    },

    // --- 6. XE 45 CHỖ (6 xe) ---
    {
        vehicle_code: 'XE-45C-01',
        license_plate: '43B-888.11',
        seat_capacity: 45,
        vehicle_type: 'Xe 45 chỗ',
        brand_model: 'Hyundai Universe Express Noble',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Đỏ - Trắng',
        status: 'AVAILABLE',
        notes: 'Hầm hàng rộng 3 khoang chứa 50 vali, dàn loa âm thanh hát Karaoke chuyên nghiệp.'
    },
    {
        vehicle_code: 'XE-45C-02',
        license_plate: '51B-123.45',
        seat_capacity: 45,
        vehicle_type: 'Xe 45 chỗ',
        brand_model: 'Thaco Bluesky 120S (2024)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Xanh Ngọc - Trắng',
        status: 'AVAILABLE',
        notes: 'Bầu hơi 6 túi êm ái vượt mọi địa hình, màn hình LCD 32 inch.'
    },
    {
        vehicle_code: 'XE-45C-03',
        license_plate: '29B-666.45',
        seat_capacity: 45,
        vehicle_type: 'Xe 45 chỗ',
        brand_model: 'Hyundai Universe Advanced (2023)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng - Xanh',
        status: 'IN_TOUR',
        notes: 'Đang chở đoàn Teambuilding Hà Nội - Sầm Sơn.'
    },
    {
        vehicle_code: 'XE-45C-04',
        license_plate: '79B-999.45',
        seat_capacity: 45,
        vehicle_type: 'Xe 45 chỗ',
        brand_model: 'Kia Granbird Silkroad (2024)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Đen - Bạc',
        status: 'AVAILABLE',
        notes: 'Xe siêu sang nhập khẩu, trang bị tủ lạnh lớn 50 lít, nước uống đóng chai miễn phí.'
    },
    {
        vehicle_code: 'XE-45C-05',
        license_plate: '49B-555.45',
        seat_capacity: 45,
        vehicle_type: 'Xe 45 chỗ',
        brand_model: 'Thaco Mobihome Universe (2023)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Vàng - Kim',
        status: 'AVAILABLE',
        notes: 'Chuyên chạy tuyến tour liên tỉnh xuyên Việt.'
    },
    {
        vehicle_code: 'XE-45C-06',
        license_plate: '65B-444.45',
        seat_capacity: 45,
        vehicle_type: 'Xe 45 chỗ',
        brand_model: 'King Long Euro 5 (2024)',
        image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        color: 'Trắng',
        status: 'MAINTENANCE',
        notes: 'Bảo dưỡng thay dầu hộp số và rà soát hệ thống lốp xe.'
    }
];

async function seedVehicles() {
    try {
        console.log('--- SEEDING FULL VEHICLES DATA (36 VEHICLES) ---');

        // Delete existing vehicles that might conflict or clear table cleanly
        await sequelize.query(`DELETE FROM tour_vehicle_assignments WHERE vehicle_id > 0`);
        await sequelize.query(`DELETE FROM vehicle_maintenances WHERE vehicle_id > 0`);
        await sequelize.query(`DELETE FROM vehicles WHERE vehicle_id > 0`);

        for (const v of vehiclesData) {
            await sequelize.query(`
                INSERT INTO vehicles (vehicle_code, license_plate, seat_capacity, vehicle_type, brand_model, image_url, color, status, notes, created_at)
                VALUES (
                    ${sequelize.escape(v.vehicle_code)},
                    ${sequelize.escape(v.license_plate)},
                    ${v.seat_capacity},
                    ${sequelize.escape(v.vehicle_type)},
                    ${sequelize.escape(v.brand_model)},
                    ${sequelize.escape(v.image_url)},
                    ${sequelize.escape(v.color)},
                    ${sequelize.escape(v.status)},
                    ${sequelize.escape(v.notes)},
                    NOW()
                )
            `);
        }

        console.log('Successfully inserted 36 vehicles!');

        // Check count by type
        const [counts] = await sequelize.query(`
            SELECT vehicle_type, COUNT(*) as total 
            FROM vehicles 
            GROUP BY vehicle_type
        `);
        console.log('\n--- VEHICLES COUNT BY TYPE ---');
        console.table(counts);

    } catch (e) {
        console.error('Error seeding vehicles:', e);
    } finally {
        await sequelize.close();
    }
}

seedVehicles();
