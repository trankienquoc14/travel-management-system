import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import ServiceBookingModal from './ServiceBookingModal';
import '../index.css';

const ServicesPage = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicleType, setSelectedVehicleType] = useState('Tất cả');
    const [selectedService, setSelectedService] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Lỗi parse user:", e);
                }
            }
        };
        checkUser();
        fetchVehicles();
    }, []);

    // Lấy dữ liệu xe từ bảng vehicles (loại trừ xe bảo dưỡng)
    const fetchVehicles = async () => {
        setLoading(true);
        try {
            // Ưu tiên gọi API lấy danh sách xe từ bảng vehicles
            const res = await axios.get('http://localhost:5000/api/tours/fleet/public-vehicles');
            if (res.data.success && Array.isArray(res.data.data)) {
                // Tuyệt đối không hiển thị xe bảo dưỡng cho khách hàng
                const activeVehicles = res.data.data.filter(v => 
                    v.status !== 'MAINTENANCE' && 
                    v.status !== 'Bảo dưỡng' && 
                    !v.current_maintenance
                );
                setVehicles(activeVehicles);
            } else {
                // Fallback nếu cần
                const fallbackRes = await axios.get('http://localhost:5000/api/services');
                if (fallbackRes.data.success) {
                    setVehicles(fallbackRes.data.data.filter(s => 
                        (s.service_type === 'Transport' || s.service_type === 'Xe vận chuyển') &&
                        s.status !== 'MAINTENANCE'
                    ));
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu bảng xe:', error);
            try {
                const fallbackRes = await axios.get('http://localhost:5000/api/services');
                if (fallbackRes.data.success) {
                    setVehicles(fallbackRes.data.data.filter(s => 
                        (s.service_type === 'Transport' || s.service_type === 'Xe vận chuyển') &&
                        s.status !== 'MAINTENANCE'
                    ));
                }
            } catch (fbErr) {
                console.error('Lỗi fallback xe:', fbErr);
            }
        } finally {
            setLoading(false);
        }
    };

    // Xác định khu vực / trạm xe theo biển số thực tế
    const getRegionName = (licensePlate, notes = '') => {
        if (!licensePlate) return 'Việt Nam';
        const lp = licensePlate.trim().toUpperCase();
        if (lp.startsWith('51') || lp.startsWith('50') || lp.startsWith('59')) return 'TP. Hồ Chí Minh';
        if (lp.startsWith('29') || lp.startsWith('30') || lp.startsWith('31')) return 'Hà Nội';
        if (lp.startsWith('43')) return 'Đà Nẵng';
        if (lp.startsWith('79')) return 'Nha Trang (Khánh Hòa)';
        if (lp.startsWith('49')) return 'Đà Lạt (Lâm Đồng)';
        if (lp.startsWith('65')) return 'Cần Thơ';
        if (lp.startsWith('72')) return 'Vũng Tàu';
        if (notes.includes('Hà Nội')) return 'Hà Nội';
        if (notes.includes('Đà Lạt')) return 'Đà Lạt (Lâm Đồng)';
        if (notes.includes('Nha Trang')) return 'Nha Trang (Khánh Hòa)';
        if (notes.includes('TP.HCM')) return 'TP. Hồ Chí Minh';
        return 'TP. Hồ Chí Minh';
    };

    // Chuẩn hóa đường dẫn ảnh
    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200';
        if (url.startsWith('http')) return url;
        const clean = url.replace(/^\/?uploads\//, '');
        return `http://localhost:5000/uploads/${clean}`;
    };

    const formatCurrency = (amount) => {
        const num = Number(amount) || 0;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    };

    // Danh sách các danh mục loại xe
    const vehicleTypeOptions = [
        'Tất cả',
        'Xe 4 chỗ',
        'Xe 7 chỗ',
        'Xe Limousine VIP (9 - 11 chỗ)',
        'Xe 16 chỗ',
        'Xe 29 chỗ',
        'Xe 45 chỗ'
    ];

    // Lọc dữ liệu xe (tuyệt đối không hiển thị xe bảo dưỡng cho khách hàng)
    const filteredVehicles = vehicles.filter(v => {
        // Loại trừ xe bảo dưỡng
        if (v.status === 'MAINTENANCE' || v.status === 'Bảo dưỡng' || v.current_maintenance) {
            return false;
        }

        // Lọc theo loại xe / số chỗ
        if (selectedVehicleType !== 'Tất cả') {
            const cap = Number(v.seat_capacity);
            const typeStr = (v.vehicle_type || '').toLowerCase();

            if (selectedVehicleType === 'Xe 4 chỗ' && cap !== 4) return false;
            if (selectedVehicleType === 'Xe 7 chỗ' && cap !== 7) return false;
            if (selectedVehicleType === 'Xe Limousine VIP (9 - 11 chỗ)') {
                if (!(cap === 9 || cap === 11 || typeStr.includes('limousine'))) return false;
            }
            if (selectedVehicleType === 'Xe 16 chỗ' && cap !== 16) return false;
            if (selectedVehicleType === 'Xe 29 chỗ' && cap !== 29) return false;
            if (selectedVehicleType === 'Xe 45 chỗ' && cap !== 45) return false;
        }

        return true;
    });

    // Mặc định sắp xếp xe theo số chỗ ngồi tăng dần (4 -> 45 chỗ), sau đó theo giá thuê
    const sortedVehicles = [...filteredVehicles].sort((a, b) => {
        const capA = Number(a.seat_capacity) || 0;
        const capB = Number(b.seat_capacity) || 0;
        const priceA = Number(a.selling_price) || 0;
        const priceB = Number(b.selling_price) || 0;

        if (capA !== capB) return capA - capB;
        return priceA - priceB;
    });

    // Mở modal đặt xe
    const handleBookClick = (vehicle) => {
        if (!user) {
            alert('Vui lòng đăng nhập để đặt dịch vụ thuê xe!');
            navigate('/login');
            return;
        }

        // Đóng gói thông tin xe cho ServiceBookingModal
        const serviceData = {
            ...vehicle,
            service_id: vehicle.service_id || 466,
            service_name: `Thuê xe ${vehicle.brand_model || vehicle.vehicle_type}`,
            selling_price: Number(vehicle.selling_price) || 850000,
            unit: vehicle.service_unit || 'Xe/Ngày',
            image_url: vehicle.image_url
        };

        setSelectedService(serviceData);
    };

    return (
        <div className="homepage-container">
            <CustomerNavbar activeTab="services" />
            
            {/* BANNER DỊCH VỤ ĐẶT XE */}
            <div className="custom-tour-banner" style={{ margin: '30px 8%', height: '300px', backgroundImage: 'url(https://images.unsplash.com/photo-1454391304352-2bf4678b195a?q=80&w=2000)' }}>
                <div className="banner-overlay-dark" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2>Dịch Vụ Đặt Xe Du Lịch</h2>
                    <p>Đội xe đời mới từ 4 đến 45 chỗ & Limousine VIP - Tiện lợi, an toàn, chất lượng hàng đầu.</p>
                </div>
            </div>

            <section className="section-container" style={{ padding: '0 8% 60px' }}>
                {/* THANH CÔNG CỤ BỘ LỌC LOẠI XE */}
                <div 
                    style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: '16px', 
                        marginBottom: '26px', 
                        background: '#ffffff', 
                        padding: '16px 24px', 
                        borderRadius: '16px', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    {/* BỘ LỌC LOẠI XE */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🚎</span>
                        <strong style={{ fontSize: '14.5px', color: '#1e293b' }}>Loại xe:</strong>
                        <select 
                            value={selectedVehicleType}
                            onChange={(e) => setSelectedVehicleType(e.target.value)}
                            style={{ 
                                padding: '10px 16px', 
                                borderRadius: '10px', 
                                border: '1.5px solid #cbd5e1', 
                                outline: 'none', 
                                cursor: 'pointer', 
                                fontSize: '14px', 
                                background: '#f8fafc',
                                fontWeight: '600',
                                color: '#0f172a',
                                minWidth: '220px' 
                            }}
                        >
                            {vehicleTypeOptions.map(vt => (
                                <option key={vt} value={vt}>{vt}</option>
                            ))}
                        </select>
                    </div>

                    {/* SỐ LƯỢNG XE & THAO TÁC XÓA BỘ LỌC */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>
                            Hiển thị <strong>{sortedVehicles.length}</strong> / <strong>{vehicles.length}</strong> xe trong hệ thống đội xe VietTravel
                        </span>
                        {selectedVehicleType !== 'Tất cả' && (
                            <button
                                onClick={() => setSelectedVehicleType('Tất cả')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0284c7',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    textDecoration: 'underline'
                                }}
                            >
                                Xem tất cả
                            </button>
                        )}
                    </div>
                </div>

                {/* DANH SÁCH THẺ XE (GRID) */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '15px' }}>
                        Đang tải danh sách đội xe...
                    </div>
                ) : sortedVehicles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚗</div>
                        <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '8px' }}>Không tìm thấy xe phù hợp</h3>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Vui lòng chọn tiêu chí loại xe khác.</p>
                    </div>
                ) : (
                    <div className="tour-grid">
                        {sortedVehicles.map(vehicle => {
                            const isAvailable = vehicle.status === 'AVAILABLE';
                            const isInTour = vehicle.status === 'IN_TOUR';
                            const region = getRegionName(vehicle.license_plate, vehicle.notes);

                            return (
                                <div 
                                    className="tour-card" 
                                    key={vehicle.vehicle_id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* ẢNH XE & BADGES */}
                                    <div className="tour-img-wrapper" style={{ position: 'relative', height: '220px' }}>
                                        <div 
                                            className="tour-img" 
                                            style={{ 
                                                backgroundImage: `url(${getImageUrl(vehicle.image_url)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                height: '100%',
                                                transition: 'transform 0.4s ease'
                                            }}
                                        />
                                        
                                        {/* BADGE LOẠI XE */}
                                        <span 
                                            className="tour-badge" 
                                            style={{ 
                                                position: 'absolute', 
                                                top: '12px', 
                                                left: '12px', 
                                                background: '#0284c7', 
                                                color: '#fff',
                                                fontWeight: '700',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            {vehicle.vehicle_type || `${vehicle.seat_capacity} chỗ`}
                                        </span>

                                        {/* BADGE TRẠNG THÁI HOẠT ĐỘNG */}
                                        <span 
                                            style={{ 
                                                position: 'absolute', 
                                                top: '12px', 
                                                right: '12px', 
                                                background: isAvailable ? '#10b981' : '#f59e0b', 
                                                color: '#ffffff',
                                                fontWeight: '800',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {isAvailable ? '🟢 Sẵn sàng' : '🟡 Đang đi tour'}
                                        </span>
                                    </div>

                                    {/* THÔNG TIN CHI TIẾT CỦA XE */}
                                    <div className="tour-info" style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        {/* TRẠM XE / ĐỊA ĐIỂM */}
                                        <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>📍 Trạm {region}</span>
                                        </div>

                                        {/* TÊN DÒNG XE / BRAND MODEL */}
                                        <h3 
                                            className="tour-title" 
                                            style={{ 
                                                fontSize: '16px', 
                                                fontWeight: '700', 
                                                color: '#0f172a', 
                                                marginBottom: '8px',
                                                lineHeight: '1.4'
                                            }}
                                        >
                                            {vehicle.brand_model || vehicle.service_name || `Xe du lịch ${vehicle.seat_capacity} chỗ`}
                                        </h3>

                                        {/* THÔNG SỐ XE: MÀU SẮC, SỐ CHỖ (ĐÃ BỎ BIỂN SỐ THEO YÊU CẦU) */}
                                        <div 
                                            style={{ 
                                                display: 'flex', 
                                                flexWrap: 'wrap', 
                                                gap: '6px', 
                                                marginBottom: '10px' 
                                            }}
                                        >
                                            {vehicle.color && (
                                                <span style={{ background: '#f8fafc', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #e2e8f0', fontWeight: '500' }}>
                                                    🎨 {vehicle.color}
                                                </span>
                                            )}
                                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                                👥 {vehicle.seat_capacity} chỗ ngồi
                                            </span>
                                        </div>

                                        {/* MÔ TẢ TIỆN NGHI CỦA XE */}
                                        <p 
                                            style={{ 
                                                fontSize: '13px', 
                                                color: '#64748b', 
                                                marginBottom: '16px', 
                                                lineHeight: '1.5',
                                                display: '-webkit-box', 
                                                WebkitLineClamp: 2, 
                                                WebkitBoxOrient: 'vertical', 
                                                overflow: 'hidden',
                                                flex: 1
                                            }}
                                            title={vehicle.notes}
                                        >
                                            {vehicle.notes || 'Xe đời mới tiện nghi cao cấp, điều hòa mát sâu, lái xe kinh nghiệm.'}
                                        </p>
                                        
                                        {/* HÀNG GIÁ VÀ NÚT ĐẶT */}
                                        <div className="tour-price-row" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div className="price-block">
                                                <span className="price-label" style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                                                    Giá thuê ({vehicle.service_unit || 'Xe/Ngày'})
                                                </span>
                                                <span className="new-price" style={{ fontSize: '17px', fontWeight: '800', color: '#ea580c' }}>
                                                    {formatCurrency(vehicle.selling_price || 850000)}
                                                </span>
                                            </div>

                                            {isAvailable ? (
                                                <button 
                                                    className="btn-book" 
                                                    onClick={() => handleBookClick(vehicle)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        padding: '10px 18px',
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 3px 8px rgba(2, 132, 199, 0.3)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    Đặt ngay
                                                </button>
                                            ) : (
                                                <button 
                                                    style={{ 
                                                        backgroundColor: '#fde68a', 
                                                        color: '#92400e', 
                                                        border: 'none', 
                                                        borderRadius: '10px', 
                                                        padding: '10px 14px', 
                                                        fontSize: '12px', 
                                                        fontWeight: '700', 
                                                        cursor: 'not-allowed' 
                                                    }} 
                                                    disabled
                                                    title="Xe đang phục vụ đoàn tour khác"
                                                >
                                                    Đang đi tour
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* MODAL ĐẶT DỊCH VỤ THUÊ XE */}
            {selectedService && (
                <ServiceBookingModal 
                    service={selectedService} 
                    user={user} 
                    onClose={() => setSelectedService(null)} 
                />
            )}
            
            <CustomerFooter />
        </div>
    );
};

export default ServicesPage;
