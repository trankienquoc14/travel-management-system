import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';

const articleData = {
    about: {
        slug: 'about',
        badge: '🌟 VỀ CHÚNG TÔI',
        title: 'Giới Thiệu Hệ Thống Quản Trị Du Lịch VietTravel ERP',
        subtitle: 'Thương hiệu tiên phong chuyển đổi số và nâng tầm trải nghiệm du lịch cá nhân hóa tại Việt Nam.',
        updated: 'Cập nhật chính thức: Năm 2026',
        heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2000',
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
                    1. Ba Trụ Cột Giá Trị Cốt Lõi
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

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    2. Cam Kết Chất Lượng Đỉnh Cao
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>
                    <li><strong>Xe vận chuyển:</strong> 100% dòng xe du lịch đời mới từ 16 đến 45 chỗ trang bị wifi, điều hòa âm trần.</li>
                    <li><strong>Lưu trú cao cấp:</strong> Hệ thống đối tác khách sạn 3★ - 5★ quốc tế hàng đầu tại Đà Nẵng, Phú Quốc, Sapa, Hạ Long...</li>
                    <li><strong>Ẩm thực phong phú:</strong> Thực đơn được chọn lọc kỹ lưỡng, kết hợp ẩm thực đặc sản địa phương và buffet phong phú.</li>
                    <li><strong>Bảo hiểm du lịch:</strong> Mọi du khách tham gia tour đều được bảo vệ với gói bảo hiểm du lịch trọn gói lên tới 100.000.000 VNĐ/vụ.</li>
                </ul>
            </div>
        )
    },
    guides: {
        slug: 'guides',
        badge: '🚩 ĐỘI NGŨ NHÂN SỰ',
        title: 'Đội Ngũ Hướng Dẫn Viên Chuyên Nghiệp VietTravel ERP',
        subtitle: 'Sự tận tâm, tri thức văn hóa sâu sắc và lòng nhiệt thành trên từng hành trình.',
        updated: 'Cập nhật chính thức: Năm 2026',
        heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Tại <strong>VietTravel ERP</strong>, chúng tôi tin rằng Hướng dẫn viên (HDV) chính là đại sứ kết nối du khách với tâm hồn của từng vùng đất. Họ không chỉ là người dẫn đường mà còn là người kể chuyện văn hóa, người bạn đồng hành chu đáo trong suốt kỳ nghỉ.
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    1. Tiêu Chuẩn Tuyển Chọn & Đào Tạo Khắt Khe
                </h3>
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '14.5px' }}>
                        <li><strong>Bằng cấp & Chứng chỉ:</strong> 100% HDV có thẻ hành nghề Quốc tế hoặc Nội địa do Cục Du Lịch Việt Nam cấp.</li>
                        <li><strong>Thâm niên thực địa:</strong> Tối thiểu 3-5 năm kinh nghiệm dẫn các đoàn du lịch nội địa và quốc tế.</li>
                        <li><strong>Trình độ ngoại ngữ:</strong> Thành thạo Tiếng Anh, Tiếng Trung, Tiếng Hàn hoặc Tiếng Nhật.</li>
                        <li><strong>Kỹ năng an toàn:</strong> Được huấn luyện định kỳ kỹ năng sơ cấp cứu y tế, an toàn đường thủy và quản lý rủi ro đoàn.</li>
                    </ul>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    2. Mạng Lưới Hướng Dẫn Viên Bản Địa Độc Đáo
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Để mang lại cái nhìn chân thực nhất, VietTravel ERP hợp tác cùng đội ngũ HDV bản địa tại các tuyến điểm đặc thù như Đông Tây Bắc (Sapa, Hà Giang, Cao Bằng), Tây Nguyên (Đà Lạt, Buôn Ma Thuột) và Đồng bằng Sông Cửu Long. Du khách sẽ được lắng nghe những câu chuyện huyền thoại, thưởng thức làn điệu dân ca và giao lưu văn hóa chân thực nhất.
                </p>

                <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '20px 24px', borderLeft: '4px solid #22c55e', margin: '28px 0' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '16.5px', fontWeight: '800' }}>❤️ Phản hồi từ du khách</h4>
                    <p style={{ margin: 0, color: '#334155', fontSize: '14px', italic: 'true', lineHeight: '1.6' }}>
                        "Chuyến đi Hà Giang 4N3Đ vừa qua thật sự tuyệt vời nhờ sự nhiệt tình của HDV VietTravel. Anh am hiểu từng khúc cua Mã Pí Lèng, chụp ảnh siêu đẹp và chăm sóc đoàn từng bữa ăn!" — <em>Gia đình anh Minh Hoàng (TP.HCM)</em>
                    </p>
                </div>
            </div>
        )
    },
    privacy: {
        slug: 'privacy',
        badge: '🔒 AN TOÀN & BẢO MẬT',
        title: 'Chính Sách Bảo Mật Thông Tin Khách Hàng',
        subtitle: 'Cam kết bảo vệ tuyệt đối dữ liệu cá nhân và an toàn thông tin giao dịch của Quý khách.',
        updated: 'Hiệu lực chính thức: Từ ngày 01/01/2026',
        heroImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2000',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Chính sách bảo mật này giải thích cách thức <strong>VietTravel ERP System</strong> thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của Quý khách khi truy cập website hoặc đặt dịch vụ du lịch của chúng tôi.
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    1. Phạm Vi Thu Thập Thông Tin
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Chúng tôi chỉ thu thập các thông tin cần thiết nhằm phục vụ công tác xác nhận đơn hàng, phát hành vé máy bay, hợp đồng bảo hiểm và liên hệ hỗ trợ:
                </p>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '14.5px' }}>
                    <li>Thông tin liên hệ: Họ tên, Số điện thoại, Địa chỉ Email, Địa chỉ liên lạc.</li>
                    <li>Thông tin hành trình: Ngày khởi hành, số lượng khách, các yêu cầu đặc biệt về ăn uống/lưu trú.</li>
                    <li>Thông tin thanh toán: Mã giao dịch ngân hàng (chúng tôi không lưu trữ mật khẩu hoặc số CVV thẻ tín dụng của bạn).</li>
                </ul>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    2. Cam Kết Bảo Mật Chuẩn SSL/TLS 256-bit
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Toàn bộ dữ liệu truyền tải giữa thiết bị của bạn và hệ thống máy chủ VietTravel ERP đều được mã hóa bằng chứng chỉ bảo mật SSL/TLS 256-bit cao cấp nhất. Cơ sở dữ liệu được bảo vệ trong môi trường tường lửa đa lớp đạt tiêu chuẩn an toàn thông tin ISO/IEC 27001.
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    3. Quyền Của Khách Hàng Đối Với Dữ Liệu
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Quý khách có toàn quyền truy cập, cập nhật, điều chỉnh hoặc yêu cầu xóa bỏ thông tin cá nhân trên hệ thống bất kỳ lúc nào. Vui lòng gửi yêu cầu về Email <strong>cskh@viettravel-erp.vn</strong> hoặc gọi hotline <strong>1900 1234</strong>.
                </p>
            </div>
        )
    },
    terms: {
        slug: 'terms',
        badge: '📜 QUY ĐỊNH & ĐIỀU KHOẢN',
        title: 'Điều Khoản & Quy Định Sử Dụng Dịch Vụ',
        subtitle: 'Quy định minh bạch về đặt dịch vụ, thanh toán, hoàn hủy tour và trách nhiệm hai bên.',
        updated: 'Hiệu lực chính thức: Từ ngày 01/01/2026',
        heroImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2000',
        content: (
            <div>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>
                    Chào mừng Quý khách đến với <strong>VietTravel ERP System</strong>. Việc Quý khách đăng ký đặt tour hoặc sử dụng dịch vụ trên hệ thống đồng nghĩa với việc Quý khách chấp thuận các điều khoản và quy định dưới đây:
                </p>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    1. Quy Định Thanh Toán & Đặt Cọc
                </h3>
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#334155', fontSize: '14.5px' }}>
                        <li><strong>Đặt cọc lần 1:</strong> Thanh toán 50% tổng giá trị tour ngay sau khi nhận xác nhận booking/báo giá.</li>
                        <li><strong>Thanh toán lần 2:</strong> Hoàn tất 50% chi phí còn lại trước ngày khởi hành từ 3-5 ngày làm việc.</li>
                        <li><strong>Hình thức thanh toán:</strong> Chuyển khoản ngân hàng, Quét mã VietQR hoặc thanh toán trực tiếp tại văn phòng.</li>
                    </ul>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    2. Chính Sách Hoàn Hủy Tour Minh Bạch
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', color: '#0f172a', textAlign: 'left' }}>
                            <th style={{ padding: '12px 16px', border: '1px solid #cbd5e1' }}>Thời điểm hủy Tour</th>
                            <th style={{ padding: '12px 16px', border: '1px solid #cbd5e1' }}>Mức phí hủy áp dụng</th>
                            <th style={{ padding: '12px 16px', border: '1px solid #cbd5e1' }}>Ghi chú chính sách</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Trước 7 ngày khởi hành</td>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', color: '#16a34a', fontWeight: '800' }}>Miễn phí 100%</td>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Hoàn lại 100% tiền cọc hoặc bảo lưu sang tour khác.</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Từ 3 đến 6 ngày trước khởi hành</td>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', color: '#d97706', fontWeight: '800' }}>30% tổng chi phí</td>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Đền bù chi phí giữ chỗ vé & phòng khách sạn.</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Trong vòng 24-48h trước khởi hành</td>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0', color: '#dc2626', fontWeight: '800' }}>50% tổng chi phí</td>
                            <td style={{ padding: '12px 16px', border: '1px solid #e2e8f0' }}>Do các dịch vụ vận chuyển & nhà hàng đã chốt cố định.</td>
                        </tr>
                    </tbody>
                </table>

                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '32px', marginBottom: '14px' }}>
                    3. Trách Nhiệm Của VietTravel ERP
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                    Chúng tôi có trách nhiệm cung cấp chính xác các dịch vụ đã ghi rõ trong chương trình tour, đảm bảo phương tiện xe cộ an toàn, hướng dẫn viên chuyên nghiệp và bảo vệ quyền lợi du khách trong mọi tình huống bất khả kháng.
                </p>
            </div>
        )
    }
};

const ArticlePage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const currentKey = slug || 'about';
    const article = articleData[currentKey] || articleData.about;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [slug]);

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <CustomerNavbar activeTab="" />

            {/* HERO ARTICLE BANNER */}
            <div style={{
                position: 'relative',
                height: '320px',
                backgroundImage: `url("${article.heroImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                textAlign: 'center',
                padding: '0 20px'
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)'
                }} />
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px' }}>
                    <span style={{
                        background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)',
                        color: '#ffffff', fontSize: '12px', fontWeight: '800', padding: '6px 16px',
                        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)',
                        display: 'inline-block', marginBottom: '14px', letterSpacing: '0.5px'
                    }}>
                        {article.badge}
                    </span>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 10px 0', lineHeight: '1.3' }}>
                        {article.title}
                    </h1>
                    <p style={{ fontSize: '15px', color: '#e2e8f0', margin: 0, fontWeight: '500' }}>
                        {article.subtitle}
                    </p>
                </div>
            </div>

            {/* ARTICLE CONTENT BODY WITH SIDEBAR NAVIGATION */}
            <main style={{ maxWidth: '1200px', width: '100%', margin: '40px auto', padding: '0 5%', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '36px', alignItems: 'start' }}>
                    
                    {/* LEFT ARTICLE NAVIGATION SIDEBAR */}
                    <aside style={{ background: '#ffffff', borderRadius: '20px', padding: '20px', border: '1.5px solid #e2e8f0', position: 'sticky', top: '90px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            📚 Danh Mục Bài Viết
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div 
                                onClick={() => navigate('/article/about')}
                                style={{
                                    padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: currentKey === 'about' ? '800' : '600',
                                    background: currentKey === 'about' ? '#f0f9ff' : 'transparent',
                                    color: currentKey === 'about' ? '#0284c7' : '#475569',
                                    border: currentKey === 'about' ? '1px solid #bae6fd' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📄 Giới thiệu thương hiệu
                            </div>
                            <div 
                                onClick={() => navigate('/article/guides')}
                                style={{
                                    padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: currentKey === 'guides' ? '800' : '600',
                                    background: currentKey === 'guides' ? '#f0f9ff' : 'transparent',
                                    color: currentKey === 'guides' ? '#0284c7' : '#475569',
                                    border: currentKey === 'guides' ? '1px solid #bae6fd' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🚩 Đội ngũ Hướng dẫn viên
                            </div>
                            <div 
                                onClick={() => navigate('/article/privacy')}
                                style={{
                                    padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: currentKey === 'privacy' ? '800' : '600',
                                    background: currentKey === 'privacy' ? '#f0f9ff' : 'transparent',
                                    color: currentKey === 'privacy' ? '#0284c7' : '#475569',
                                    border: currentKey === 'privacy' ? '1px solid #bae6fd' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🔒 Chính sách bảo mật
                            </div>
                            <div 
                                onClick={() => navigate('/article/terms')}
                                style={{
                                    padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: currentKey === 'terms' ? '800' : '600',
                                    background: currentKey === 'terms' ? '#f0f9ff' : 'transparent',
                                    color: currentKey === 'terms' ? '#0284c7' : '#475569',
                                    border: currentKey === 'terms' ? '1px solid #bae6fd' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📜 Điều khoản & Quy định
                            </div>
                        </div>

                        {/* HOTLINE ASSISTANCE CARD */}
                        <div style={{ marginTop: '24px', padding: '16px', background: '#eff6ff', borderRadius: '14px', border: '1px solid #dbeafe', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📞</div>
                            <strong style={{ fontSize: '13px', color: '#1e3a8a', display: 'block' }}>Cần hỗ trợ tư vấn?</strong>
                            <div style={{ fontSize: '16px', color: '#0194f3', fontWeight: '900', marginTop: '4px' }}>1900 1234</div>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Phục vụ 24/7 (Cước 1.000đ/phút)</span>
                        </div>
                    </aside>

                    {/* MAIN ARTICLE DETAIL DISPLAY */}
                    <article style={{ background: '#ffffff', borderRadius: '24px', padding: '36px', border: '1.5px solid #e2e8f0', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600' }}>
                                📅 {article.updated}
                            </span>
                            <button
                                onClick={() => navigate('/home')}
                                style={{ background: '#f1f5f9', border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                            >
                                ⬅️ Về trang chủ
                            </button>
                        </div>

                        {article.content}
                    </article>

                </div>
            </main>

            <CustomerFooter />
        </div>
    );
};

export default ArticlePage;
