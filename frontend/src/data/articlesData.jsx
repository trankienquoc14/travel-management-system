import React from 'react';

export const articleCategories = [
    { id: 'all', name: 'Tất cả bài viết', icon: '🌟' },
    { id: 'destinations', name: 'Cẩm nang Điểm Đến', icon: '🏝️' },
    { id: 'tips', name: 'Mẹo & Kinh nghiệm', icon: '🎒' },
    { id: 'culture', name: 'Ẩm thực & Văn hóa', icon: '🍜' },
    { id: 'company', name: 'Về VietTravel ERP', icon: '🏢' }
];

export const articlesList = [
    {
        slug: 'phu-quoc-guide',
        badge: '🔥 HOT TREND',
        category: 'Cẩm nang Điểm Đến',
        categorySlug: 'destinations',
        title: 'Cẩm Nang Du Lịch Phú Quốc 2026: Lịch Trình 4N3Đ & Mẹo Tiết Kiệm Chi Phí',
        subtitle: 'Bí kíp vi vu Đảo Ngọc trọn vẹn từ vé máy bay, chọn resort đến điểm ngắm hoàng hôn đẹp mê hồn.',
        readTime: '6 phút đọc',
        updated: 'Cập nhật: Tháng 10/2026',
        author: 'Ban Biên Tập VietTravel ERP',
        authorRole: 'Chuyên gia Du lịch Biển Đảo',
        heroImage: 'https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=1200',
        featured: true,
        summary: 'Kinh nghiệm thực tế từ A-Z: thời điểm đẹp nhất, cách chọn khách sạn, điểm check-in Sunset Sanato, cáp treo Hòn Thơm và thưởng thức ẩm thực đặc sắc Đảo Ngọc.',
        tourLink: '/tours?search=Phú Quốc',
        tourBtnText: 'Xem các Tour Phú Quốc trọn gói',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    <strong>Phú Quốc (Kiên Giang)</strong> — hòn đảo ngọc lớn nhất Việt Nam luôn là điểm đến hấp dẫn du khách trong và ngoài nước bởi những bãi biển cát trắng mịn màng, làn nước trong xanh màu ngọc bích và hệ sinh thái rừng nguyên sinh kỳ thú. Năm 2026, Phú Quốc tiếp tục nâng cấp hạ tầng du lịch vượt bậc với nhiều khu nghỉ dưỡng đẳng cấp quốc tế và tổ hợp giải trí đỉnh cao.
                </p>

                <div style={{ background: '#f0f9ff', borderRadius: '16px', padding: '20px 24px', borderLeft: '4px solid #0194f3', margin: '24px 0' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0369a1', fontSize: '17px', fontWeight: '800' }}>☀️ Thời điểm lý tưởng nhất để du lịch Phú Quốc</h4>
                    <p style={{ margin: 0, color: '#334155', fontSize: '14.5px', lineHeight: '1.6' }}>
                        Thời điểm đẹp nhất để khám phá Phú Quốc là từ <strong>tháng 10 đến tháng 4 năm sau</strong>. Lúc này biển êm, sóng lặng, trời trong xanh và nắng ấm áp, cực kỳ thuận lợi cho các hoạt động tắm biển, lặn ngắm san hô và đi thuyền tham quan 4 đảo.
                    </p>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    1. Gợi Ý Lịch Trình 4 Ngày 3 Đêm Chuẩn Chuyên Gia
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px' }}>
                        <strong style={{ color: '#0284c7', fontSize: '15.5px' }}>📍 Ngày 1: Đón sân bay – Check-in Resort – Hoàng hôn Dinh Cậu & Chợ Đêm Phú Quốc</strong>
                        <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                            Sau khi hạ cánh sân bay Phú Quốc, xe du lịch đưa đoàn về khách sạn nhận phòng. Chiều ngắm hoàng hôn lãng mạn tại Dinh Cậu, tối hòa mình vào không khí sôi động thưởng thức hải sản tươi rói tại Chợ đêm Bạch Đằng.
                        </p>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px' }}>
                        <strong style={{ color: '#0284c7', fontSize: '15.5px' }}>📍 Ngày 2: Tour Cano 4 Đảo – Công viên Cáp Treo Hòn Thơm vượt biển dài nhất thế giới</strong>
                        <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                            Trải nghiệm cano cao tốc lướt sóng đến Hòn Mây Rút, Hòn Móng Tay, Hòn Gầm Ghì lặn ngắm san hô tự nhiên, chụp ảnh SUP flycam đỉnh cao. Chiều trải nghiệm cáp treo 3 dây vượt biển ngoạn mục tại Sun World Hòn Thơm.
                        </p>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px' }}>
                        <strong style={{ color: '#0284c7', fontSize: '15.5px' }}>📍 Ngày 3: Khám phá Bắc Đảo – VinWonders – Vinpearl Safari & Grand World Không Ngủ</strong>
                        <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                            Thăm công viên chăm sóc và bảo tồn động vật bán hoang dã Safari đầu tiên tại Việt Nam. Chiều thỏa thích vui chơi công viên chủ đề VinWonders và tối xem show thực cảnh Tinh Hoa Việt Nam tại "Thành phố không ngủ" Grand World.
                        </p>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px' }}>
                        <strong style={{ color: '#0284c7', fontSize: '15.5px' }}>📍 Ngày 4: Mua sắm đặc sản ngọc trai & Nước mắm truyền thống – Tạm biệt Đảo Ngọc</strong>
                        <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                            Thong thả dạo bộ bãi biển buổi sớm, ghé thăm cơ sở nuôi cấy ngọc trai cao cấp và nhà thùng nước mắm truyền thống Phú Quốc mua quà lưu niệm trước khi ra sân bay về lại TP.HCM / Hà Nội.
                        </p>
                    </div>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    2. Top 5 Đặc Sản Phú Quốc Nhất Định Phải Thử
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>
                    <li><strong>Bún quậy Kiến Xây:</strong> Món bún tự pha nước chấm độc đáo từ quất, muối, ớt, đường và tôm mực tươi xay nhuyễn.</li>
                    <li><strong>Gỏi cá trích:</strong> Vị ngọt bùi của thịt cá tươi ăn kèm dừa nạo sợi và nước mắm chấm chua ngọt đậm vị.</li>
                    <li><strong>Nhum biển nướng mỡ hành:</strong> Món ăn bổ dưỡng giàu khoáng chất thơm phức béo ngậy.</li>
                    <li><strong>Ghẹ Hàm Ninh:</strong> Thịt ghẹ chắc nịch, thơm ngọt tự nhiên chấm muối tiêu chanh chuẩn vị biển cả.</li>
                    <li><strong>Rượu sim rừng Phú Quốc:</strong> Thức uống lên men tự nhiên mang hương vị ngọt thanh nhẹ nhàng rất tốt cho tiêu hóa.</li>
                </ul>
            </div>
        )
    },
    {
        slug: 'da-nang-hoi-an',
        badge: '🌟 ĐIỂM ĐẾN YÊU THÍCH',
        category: 'Cẩm nang Điểm Đến',
        categorySlug: 'destinations',
        title: 'Bí Kíp Du Lịch Đà Nẵng - Hội An: Check-in Cầu Vàng & Phố Cổ Lung Linh',
        subtitle: 'Hành trình kết hợp tuyệt mỹ giữa vẻ hiện đại năng động và trầm tích lịch sử hàng trăm năm.',
        readTime: '5 phút đọc',
        updated: 'Cập nhật: Tháng 10/2026',
        author: 'Nguyễn Văn Hùng',
        authorRole: 'Hướng Dẫn Viên Trưởng Miền Trung',
        heroImage: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200',
        featured: false,
        summary: 'Lịch trình kết hợp hoàn hảo giữa thành phố biển đáng sống nhất Việt Nam và nét cổ kính trầm mặc của di sản văn hóa thế giới Hội An, Bà Nà Hills và Bán đảo Sơn Trà.',
        tourLink: '/tours?search=Đà Nẵng',
        tourBtnText: 'Xem các Tour Đà Nẵng trọn gói',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Được mệnh danh là <em>"Thành phố đáng sống nhất Việt Nam"</em>, <strong>Đà Nẵng</strong> luôn khiến du khách phải trầm trồ trước sự thân thiện của con người, cảnh quan thiên nhiên trác tuyệt cùng những cây cầu biểu tượng độc nhất vô nhị. Khi kết hợp cùng <strong>Phố cổ Hội An</strong> (Quảng Nam) chỉ cách 30km, chuyến đi của bạn sẽ trở thành bản giao hưởng trọn vẹn của cả hiện đại và cổ xưa.
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '28px', marginBottom: '14px' }}>
                    1. Những Trải Nghiệm "Không Thể Bỏ Lỡ"
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#0284c7', fontSize: '16px', fontWeight: '800' }}>🌉 Xem Cầu Rồng phun lửa & nước</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>Diễn ra vào lúc 21h00 các tối thứ 7, Chủ Nhật hàng tuần và các ngày lễ lớn.</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#0284c7', fontSize: '16px', fontWeight: '800' }}>🤲 Check-in Cầu Vàng Bà Nà Hills</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>Được vinh danh là một trong những kỳ quan nhân tạo ấn tượng nhất thế giới.</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#0284c7', fontSize: '16px', fontWeight: '800' }}>🏮 Thả đèn hoa đăng sông Hoài</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>Đi thuyền gỗ ngắm ánh sáng huyền ảo của hàng ngàn chiếc đèn lồng phố Hội.</p>
                    </div>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '28px', marginBottom: '14px' }}>
                    2. Thiên Đường Ẩm Thực Miền Trung Đậm Đà
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Đến Đà Nẵng - Hội An, bạn nhất định phải thử qua: <strong>Mì Quảng ếch / tôm thịt</strong>, <strong>Bánh tráng cuốn thịt heo hai đầu da</strong>, <strong>Cơm gà bà Buội Hội An</strong>, <strong>Bánh mì Phượng</strong> và <strong>Cao lầu phố cổ</strong>. Giá cả ẩm thực tại đây cực kỳ phải chăng và người dân luôn giữ thái độ niềm nở, mến khách.
                </p>
            </div>
        )
    },
    {
        slug: 'sapa-fansipan',
        badge: '🏔️ PHIÊU LƯU',
        category: 'Cẩm nang Điểm Đến',
        categorySlug: 'destinations',
        title: 'Chinh Phục Đỉnh Fansipan 3.143m & Săn Mây Sapa Mùa Thu - Đông',
        subtitle: 'Kinh nghiệm khám phá Nóc Nhà Đông Dương và tận hưởng không khí châu Âu thu nhỏ giữa lòng Tây Bắc.',
        readTime: '7 phút đọc',
        updated: 'Cập nhật: Tháng 10/2026',
        author: 'Trần Mai Anh',
        authorRole: 'Chuyên gia Tuyến Tây Bắc',
        heroImage: 'https://images.unsplash.com/photo-1542314831-c6a4d14d8373?q=80&w=1200',
        featured: false,
        summary: 'Hướng dẫn đi cáp treo Sun World Fansipan Legend, khám phá bản Cát Cát, thưởng thức lẩu cá tầm và bí kíp giữ ấm khi lên đỉnh núi cao nhất Đông Dương.',
        tourLink: '/tours?search=Sapa',
        tourBtnText: 'Xem các Tour Sapa trọn gói',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Nằm ở độ cao 1.600m so với mực nước biển, <strong>thị xã Sapa (Lào Cai)</strong> được thiên nhiên ưu đãi khí hậu mát mẻ quanh năm cùng cảnh sắc thiên nhiên hùng vĩ với những thửa ruộng bậc thang kỳ vĩ, bản làng mộc mạc và đỉnh <strong>Fansipan (3.143m)</strong> huyền thoại.
                </p>

                <div style={{ background: '#ecfdf5', borderRadius: '16px', padding: '20px', borderLeft: '4px solid #10b981', margin: '24px 0' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#047857', fontSize: '16.5px', fontWeight: '800' }}>🌤️ Kinh nghiệm săn mây đỉnh Fansipan</h4>
                    <p style={{ margin: 0, color: '#334155', fontSize: '14px', lineHeight: '1.6' }}>
                        Thời điểm săn mây đẹp nhất là vào buổi sáng từ <strong>8h30 đến 10h30</strong> vào những ngày trời nắng ráo sau một đêm se lạnh. Biển mây bồng bềnh cuồn cuộn dưới chân tượng Phật A Di Đà bằng đồng lớn nhất Việt Nam sẽ tạo nên khung cảnh tráng lệ khó quên.
                    </p>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '28px', marginBottom: '14px' }}>
                    1. Lưu Ý Quan Trọng Khi Lên Đỉnh Fansipan
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>
                    <li><strong>Trang phục giữ ấm:</strong> Nhiệt độ trên đỉnh thường thấp hơn thị trấn từ 8-12 độ C, hãy mang áo khoác cản gió, khăn quàng cổ và găng tay.</li>
                    <li><strong>Thể lực & Thở đều:</strong> Ở độ cao trên 3.000m không khí loãng hơn, du khách nên bước đi thong thả, hít thở sâu và tránh vận động quá sức.</li>
                    <li><strong>Tàu hỏa leo núi Mường Hoa:</strong> Nên mua vé trọn gói kết hợp tàu hỏa leo núi ngắm thung lũng Mường Hoa tuyệt đẹp từ trên cao.</li>
                </ul>
            </div>
        )
    },
    {
        slug: 'ha-long-cruise',
        badge: '⚓ SANG TRỌNG',
        category: 'Cẩm nang Điểm Đến',
        categorySlug: 'destinations',
        title: 'Trải Nghiệm Du Thuyền 5 Sao Vịnh Hạ Long: Ngủ Đêm Giữa Kỳ Quan Thiên Nhiên',
        subtitle: 'Review chi tiết hành trình thượng lưu thưởng ngoạn Di sản Thiên nhiên Thế giới UNESCO.',
        readTime: '5 phút đọc',
        updated: 'Cập nhật: Tháng 09/2026',
        author: 'Lê Quốc Bảo',
        authorRole: 'Quản lý Vận hành Tour Biển',
        heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200',
        featured: false,
        summary: 'Review chi tiết hành trình ngắm hoàng hôn trên Vịnh Hạ Long, chèo thuyền kayak qua hang Luồn, tiệc trà chiều thượng lưu và câu mực đêm trên boong tàu 5 sao.',
        tourLink: '/tours?search=Hạ Long',
        tourBtnText: 'Xem các Tour Hạ Long trọn gói',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    <strong>Vịnh Hạ Long (Quảng Ninh)</strong> — Di sản Thiên nhiên Thế giới 3 lần được UNESCO công nhận luôn nằm trong danh sách mơ ước của du khách toàn cầu. Trải nghiệm ngủ đêm trên du thuyền 5 sao đẳng cấp quốc tế chính là phương thức hoàn hảo nhất để thưởng thức trọn vẹn vẻ đẹp kỳ vĩ của hàng ngàn hòn đảo đá vôi nhô lên giữa mặt nước xanh ngắt.
                </p>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '28px', marginBottom: '14px' }}>
                    Các Hoạt Động Đặc Sắc Trên Du Thuyền
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>
                    <li><strong>Chèo thuyền Kayak / Thuyền nan:</strong> Tự tay khua mái chèo len lỏi qua Hang Luồn, Hang Sáng Tối chiêm ngưỡng thảm thực vật kỳ thú.</li>
                    <li><strong>Tiệc Sunset Party trên Sundeck:</strong> Thưởng thức cocktail, rượu vang nhẹ và hoa quả tươi dưới ánh chiều tà rực rỡ buông xuống vịnh.</li>
                    <li><strong>Lớp học nấu ăn & Câu mực đêm:</strong> Học làm nem rán truyền thống cùng Bếp trưởng và thử tài câu mực đêm thư giãn cùng thủy thủ đoàn.</li>
                    <li><strong>Tập dưỡng sinh Thái Cực Quyền (Tai Chi):</strong> Đón bình minh trong lành trên boong tàu với bài tập rèn luyện sức khỏe tĩnh tại.</li>
                </ul>
            </div>
        )
    },
    {
        slug: 'travel-tips-packing',
        badge: '💡 MẸO HAY',
        category: 'Mẹo & Kinh nghiệm',
        categorySlug: 'tips',
        title: 'Checklist 12 Món Đồ Không Thể Thiếu Trong Vali Du Lịch & Mẹo Xếp Đồ Gọn Nhẹ',
        subtitle: 'Bí quyết sắp xếp hành lý thông minh giúp vali nhẹ hơn 30% và không bao giờ quên đồ dùng quan trọng.',
        readTime: '4 phút đọc',
        updated: 'Cập nhật: Tháng 10/2026',
        author: 'Ban Chăm Sóc Khách Hàng',
        authorRole: 'Tư Vấn Trải Nghiệm Khách Hàng',
        heroImage: 'https://images.unsplash.com/photo-1506059612708-99d6c258160e?q=80&w=1200',
        featured: false,
        summary: 'Bí quyết gói ghém hành lý thông minh giúp vali nhẹ hơn 30%, chống nhăn quần áo và các loại giấy tờ tùy thân, thuốc men y tế cần thiết khi đi xa.',
        tourLink: '/tours',
        tourBtnText: 'Khám phá tất cả các Tour',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Một chuyến đi thành công bắt đầu từ chiếc vali được chuẩn bị chu đáo. Dưới đây là bảng checklist vàng đã được đúc kết từ hàng nghìn chuyến đi của VietTravel ERP:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', margin: '24px 0' }}>
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#dc2626', fontSize: '16px', fontWeight: '800' }}>📄 1. Giấy Tờ Tùy Thân</h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                            <li>CCCD gắn chip / Hộ chiếu còn hạn trên 6 tháng.</li>
                            <li>Giấy khai sinh bản sao trích lục cho trẻ em dưới 14 tuổi.</li>
                            <li>Bằng lái xe (nếu có ý định thuê xe tự lái).</li>
                        </ul>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#0284c7', fontSize: '16px', fontWeight: '800' }}>💊 2. Túi Y Tế Cá Nhân</h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                            <li>Thuốc cảm cúm, hạ sốt, men tiêu hóa, thuốc say xe.</li>
                            <li>Băng cá nhân Urgo, dầu gió, xịt chống muỗi côn trùng.</li>
                            <li>Kem chống nắng SPF 50+ và thuốc dị ứng cơ địa.</li>
                        </ul>
                    </div>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '28px', marginBottom: '14px' }}>
                    Kỹ Thuật Cuộn Quần Áo "Roll-Packing" Tiết Kiệm Không Gian
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Thay vì gấp phẳng thông thường, hãy cuộn tròn chặt tay từng chiếc áo thun, quần jean. Phương pháp này giúp giảm nếp nhăn vải tối đa, đồng thời giúp bạn tận dụng các khe hở quanh viền vali để nhét thêm phụ kiện như tất, sạc pin hoặc ô dù gấp gọn.
                </p>
            </div>
        )
    },
    {
        slug: 'smart-tour-booking',
        badge: '⚡ CÔNG NGHỆ ERP',
        category: 'Mẹo & Kinh nghiệm',
        categorySlug: 'tips',
        title: 'Hướng Dẫn Tự Thiết Kế Tour Cá Nhân Thông Minh Trên VietTravel ERP',
        subtitle: 'Tự do tùy chọn khách sạn, điểm đến, dòng xe theo ngân sách riêng — Tiết kiệm đến 25% chi phí.',
        readTime: '5 phút đọc',
        updated: 'Cập nhật: Tháng 10/2026',
        author: 'Phòng Công Nghệ VietTravel',
        authorRole: 'Kỹ Sư Hệ Thống ERP',
        heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200',
        featured: false,
        summary: 'Tự do lựa chọn dòng xe yêu thích, chọn khách sạn chuẩn gu và tùy biến các điểm vui chơi theo lịch rảnh của gia đình với công cụ tạo tour cá nhân đột phá.',
        tourLink: '/build-tour',
        tourBtnText: 'Trải nghiệm Tự Thiết Kế Tour Ngay',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Không còn bị gò bó bởi các lịch trình tour đóng khung cố định, hệ thống <strong>VietTravel ERP</strong> mang đến tính năng độc quyền: <strong>Tự Thiết Kế Tour Cá Nhân</strong>. Giờ đây, chỉ với vài cú nhấp chuột, bạn đã có ngay một chương trình du lịch theo đúng sở thích và khả năng tài chính của mình.
                </p>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '28px', marginBottom: '14px' }}>
                    3 Bước Tự Thiết Kế Tour Đơn Giản
                </h3>
                <ol style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>
                    <li><strong>Bước 1: Chọn Điểm Đến & Số Lượng Khách:</strong> Chọn tỉnh thành muốn đến (Đà Nẵng, Phú Quốc, Sapa...), ngày đi, ngày về và số lượng thành viên đoàn.</li>
                    <li><strong>Bước 2: Lựa Chọn Dịch Vụ Lưu Trú & Phương Tiện:</strong> Tùy chọn xe du lịch 7 chỗ, 16 chỗ, 29 chỗ hay Limousine VIP; lựa chọn khách sạn 3 sao, 4 sao hoặc resort 5 sao.</li>
                    <li><strong>Bước 3: Nhận Báo Giá Realtime & Gửi Duyệt:</strong> Hệ thống tự động tính toán chi phí minh bạch không phát sinh. Nhân viên chuyên trách sẽ liên hệ hỗ trợ hoàn thiện hợp đồng chỉ sau 15 phút.</li>
                </ol>
            </div>
        )
    },
    {
        slug: 'mientay-cuisine',
        badge: '🍜 ẨM THỰC VIỆT',
        category: 'Ẩm thực & Văn hóa',
        categorySlug: 'culture',
        title: 'Ẩm Thực Miền Tây Sông Nước: Top 10 Món Ăn Dân Dã Đậm Đà Hương Vị Phù Sa',
        subtitle: 'Hành trình khám phá văn hóa ẩm thực Nam Bộ hào sảng qua từng món ngon đậm đà bản sắc.',
        readTime: '6 phút đọc',
        updated: 'Cập nhật: Tháng 09/2026',
        author: 'Thanh Trúc',
        authorRole: 'Blogger Ẩm Thực Du Lịch',
        heroImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200',
        featured: false,
        summary: 'Lẩu mắm cá linh bông điên điển, cá lóc nướng trui, bánh xèo củ hủ dừa, bún nước lèo Sóc Trăng... Bản đồ ẩm thực miền Tây khiến ai đi cũng say đắm.',
        tourLink: '/tours?search=Miền Tây',
        tourBtnText: 'Xem các Tour Miền Tây trọn gói',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Miền Tây Nam Bộ không chỉ thu hút bởi những con kênh xanh mát rượi và vườn trái cây trĩu quả mà còn nổi danh bởi nền văn hóa ẩm thực phóng khoáng, đậm đà hương vị đồng nội phù sa màu mỡ.
                </p>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '28px', marginBottom: '14px' }}>
                    Những Món Ăn Nhất Định Phải Nếm Thử Khi Về Miền Tây
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>
                    <li><strong>Lẩu mắm miền Tây:</strong> Nấu từ mắm cá sặc hoặc cá linh thơm nồng, ăn kèm hơn 20 loại rau đồng nội như bông điên điển, bông so đũa, rau nhút, bắp chuối...</li>
                    <li><strong>Cá lóc nướng trui rơm:</strong> Cá vừa đánh bắt từ mương nướng bằng rơm rạ tự nhiên, thịt ngọt lịm cuộn bánh tráng và rau rừng.</li>
                    <li><strong>Bánh xèo củ hủ dừa:</strong> Vỏ bánh giòn rụm màu vàng nghệ, nhân tôm thịt kết hợp củ hủ dừa ngọt giòn thanh khiết.</li>
                    <li><strong>Bún nước lèo Sóc Trăng / Trà Vinh:</strong> Nước dùng nấu từ ngải bún và mắm bò hóc thơm dịu, ăn cùng thịt heo quay giòn bì.</li>
                </ul>
            </div>
        )
    },
    {
        slug: 'about',
        badge: '🏢 DOANH NGHIỆP',
        category: 'Về VietTravel ERP',
        categorySlug: 'company',
        title: 'Giới Thiệu Hệ Thống Quản Trị Du Lịch VietTravel ERP',
        subtitle: 'Thương hiệu tiên phong chuyển đổi số và nâng tầm trải nghiệm du lịch cá nhân hóa tại Việt Nam.',
        readTime: '4 phút đọc',
        updated: 'Cập nhật: Năm 2026',
        author: 'Ban Giám Đốc',
        authorRole: 'VietTravel ERP Board',
        heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200',
        featured: false,
        summary: 'Thương hiệu tiên phong chuyển đổi số và nâng tầm trải nghiệm du lịch cá nhân hóa tại Việt Nam với hệ sinh thái quản trị hiện đại, minh bạch.',
        tourLink: '/tours',
        tourBtnText: 'Khám phá Dịch vụ của Chúng tôi',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    <strong>VietTravel ERP System</strong> là hệ thống quản trị du lịch & lữ hành thông minh hàng đầu Việt Nam. Chúng tôi kết hợp giữa nền tảng quản trị nguồn lực doanh nghiệp hiện đại và hệ sinh thái dịch vụ khách hàng đột phá — đưa du khách tới những hành trình kỷ niệm vô giá trên khắp mọi miền đất nước.
                </p>

                <div style={{ background: '#f0f9ff', borderRadius: '16px', padding: '20px 24px', borderLeft: '4px solid #0194f3', margin: '28px 0' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0369a1', fontSize: '17px', fontWeight: '800' }}>💡 Sứ mệnh của chúng tôi</h4>
                    <p style={{ margin: 0, color: '#334155', fontSize: '14.5px', lineHeight: '1.6' }}>
                        Mang đến sự đơn giản, minh bạch và cá nhân hóa tuyệt đối trong từng hành trình. Cho dù bạn muốn đặt một chuyến tour trọn gói cao cấp, trải nghiệm du thuyền 5★ hay tự thiết kế lịch trình riêng theo ngân sách cá nhân, VietTravel ERP luôn đồng hành trọn vẹn.
                    </p>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    Ba Trụ Cột Giá Trị Cốt Lõi
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                    <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>💎</div>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>Chuyên Nghiệp</h4>
                        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>Đội ngũ nhân sự tận tâm, sẵn sàng phục vụ 24/7 với tác phong chu đáo nhất.</p>
                    </div>
                    <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>Minh Bạch</h4>
                        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>Báo giá chi tiết từng dịch vụ, cam kết tuyệt đối không phát sinh chi phí ẩn.</p>
                    </div>
                    <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>Công Nghệ Phá Cách</h4>
                        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>Công cụ Tự Thiết Kế Tour thông minh linh hoạt chọn khách sạn, phương tiện, điểm đến.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        slug: 'guides',
        badge: '🚩 ĐỘI NGŨ HDV',
        category: 'Về VietTravel ERP',
        categorySlug: 'company',
        title: 'Đội Ngũ Hướng Dẫn Viên Chuyên Nghiệp VietTravel ERP',
        subtitle: 'Sự tận tâm, tri thức văn hóa sâu sắc và lòng nhiệt thành trên từng hành trình.',
        readTime: '4 phút đọc',
        updated: 'Cập nhật: Năm 2026',
        author: 'Khối Vận Hành Tour',
        authorRole: 'Điều Phối Viên Tour',
        heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200',
        featured: false,
        summary: 'Sự tận tâm, tri thức văn hóa sâu sắc và lòng nhiệt thành của đội ngũ hướng dẫn viên được đào tạo bài bản trên từng hành trình.',
        tourLink: '/tours',
        tourBtnText: 'Đặt Tour Đồng Hành Cùng HDV',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Tại <strong>VietTravel ERP</strong>, chúng tôi tin rằng Hướng dẫn viên (HDV) chính là đại sứ kết nối du khách với tâm hồn của từng vùng đất. Họ không chỉ là người dẫn đường mà còn là người kể chuyện văn hóa, người bạn đồng hành chu đáo trong suốt kỳ nghỉ.
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    Tiêu Chuẩn Tuyển Chọn & Đào Tạo Khắt Khe
                </h3>
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '14.5px' }}>
                        <li><strong>Bằng cấp & Chứng chỉ:</strong> 100% HDV có thẻ hành nghề Quốc tế hoặc Nội địa do Cục Du Lịch Việt Nam cấp.</li>
                        <li><strong>Thâm niên thực địa:</strong> Tối thiểu 3-5 năm kinh nghiệm dẫn các đoàn du lịch nội địa và quốc tế.</li>
                        <li><strong>Trình độ ngoại ngữ:</strong> Thành thạo Tiếng Anh, Tiếng Trung, Tiếng Hàn hoặc Tiếng Nhật.</li>
                        <li><strong>Kỹ năng an toàn:</strong> Được huấn luyện định kỳ kỹ năng sơ cấp cứu y tế, an toàn đường thủy và quản lý rủi ro đoàn.</li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        slug: 'privacy',
        badge: '🔒 BẢO MẬT',
        category: 'Về VietTravel ERP',
        categorySlug: 'company',
        title: 'Chính Sách Bảo Mật Thông Tin Khách Hàng',
        subtitle: 'Cam kết bảo vệ tuyệt đối dữ liệu cá nhân và an toàn thông tin giao dịch của Quý khách.',
        readTime: '3 phút đọc',
        updated: 'Hiệu lực: Từ ngày 01/01/2026',
        author: 'Phòng Pháp Chế',
        authorRole: 'Bộ Phận An Ninh Dữ Liệu',
        heroImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200',
        featured: false,
        summary: 'Cam kết bảo vệ tuyệt đối dữ liệu cá nhân và an toàn thông tin giao dịch của Quý khách theo tiêu chuẩn ISO/IEC 27001 và chứng chỉ SSL 256-bit.',
        tourLink: '/home',
        tourBtnText: 'Về Trang Chủ',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Chính sách bảo mật này giải thích cách thức <strong>VietTravel ERP System</strong> thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của Quý khách khi truy cập website hoặc đặt dịch vụ du lịch của chúng tôi.
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    1. Phạm Vi Thu Thập Thông Tin
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Chúng tôi chỉ thu thập các thông tin cần thiết nhằm phục vụ công tác xác nhận đơn hàng, phát hành vé máy bay, hợp đồng bảo hiểm và liên hệ hỗ trợ: Họ tên, Số điện thoại, Địa chỉ Email, Thông tin đặt cọc.
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    2. Cam Kết Bảo Mật Chuẩn SSL/TLS 256-bit
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Toàn bộ dữ liệu truyền tải giữa thiết bị của bạn và hệ thống máy chủ VietTravel ERP đều được mã hóa bằng chứng chỉ bảo mật SSL/TLS 256-bit cao cấp nhất.
                </p>
            </div>
        )
    },
    {
        slug: 'terms',
        badge: '📜 QUY ĐỊNH',
        category: 'Về VietTravel ERP',
        categorySlug: 'company',
        title: 'Điều Khoản & Quy Định Sử Dụng Dịch Vụ',
        subtitle: 'Quy định minh bạch về đặt dịch vụ, thanh toán, hoàn hủy tour và trách nhiệm hai bên.',
        readTime: '4 phút đọc',
        updated: 'Hiệu lực: Từ ngày 01/01/2026',
        author: 'Phòng Pháp Chế',
        authorRole: 'Tư Vấn Pháp Lý Doanh Nghiệp',
        heroImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200',
        featured: false,
        summary: 'Quy định minh bạch về đặt dịch vụ, đặt cọc, thanh toán và biểu phí hoàn hủy tour rõ ràng, bảo vệ tối đa quyền lợi khách hàng.',
        tourLink: '/home',
        tourBtnText: 'Về Trang Chủ',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Chào mừng Quý khách đến với <strong>VietTravel ERP System</strong>. Việc Quý khách đăng ký đặt tour hoặc sử dụng dịch vụ trên hệ thống đồng nghĩa với việc Quý khách chấp thuận các điều khoản và quy định dưới đây:
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    Quy Định Thanh Toán & Đặt Cọc
                </h3>
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '14.5px' }}>
                        <li><strong>Đặt cọc lần 1:</strong> Thanh toán 50% tổng giá trị tour ngay sau khi nhận xác nhận booking/báo giá.</li>
                        <li><strong>Thanh toán lần 2:</strong> Hoàn tất 50% chi phí còn lại trước ngày khởi hành từ 3-5 ngày làm việc.</li>
                        <li><strong>Hình thức thanh toán:</strong> Chuyển khoản ngân hàng, Quét mã VietQR hoặc thanh toán trực tiếp tại văn phòng.</li>
                    </ul>
                </div>
            </div>
        )
    }
];

export const articlesMap = articlesList.reduce((acc, item) => {
    acc[item.slug] = item;
    return acc;
}, {});
