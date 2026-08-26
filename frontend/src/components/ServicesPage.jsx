import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import ServiceBookingModal from './ServiceBookingModal';
import '../index.css';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [selectedVehicleType, setSelectedVehicleType] = useState('Tất cả');
    const [selectedVehicleClass, setSelectedVehicleClass] = useState('Tất cả'); // Phân loại Cao cấp/Phổ thông
    const [selectedLocation, setSelectedLocation] = useState('Tất cả'); // Thêm state location
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
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/services');
            if (res.data.success) {
                setServices(res.data.data.filter(s => s.status === 'Active'));
            }
        } catch (error) {
            console.error('Lỗi khi tải dịch vụ:', error);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1542314831-c6a4d14d8373?q=80&w=2000';
        if (url.startsWith('http')) return url;
        return `http://localhost:5000/uploads/${url.replace('uploads/', '')}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getSeatCount = (s) => {
        const match = s.service_name.match(/(\d+)\s*[Cc]hỗ/i);
        if (match) return match[1];
        if (s.capacity && s.capacity > 0) return s.capacity.toString();
        return null;
    };

    const getVehicleClass = (s) => {
        const name = s.service_name.toLowerCase();
        if (name.includes('limousine') || name.includes('vip')) return 'Cao cấp';
        return 'Phổ thông';
    };

    // Lấy danh sách địa điểm độc nhất từ dữ liệu dịch vụ
    const locations = ['Tất cả', ...new Set(services.map(s => s.destination_name).filter(Boolean))];

    // Lấy danh sách số chỗ độc nhất
    const seatCounts = new Set();
    services.forEach(s => {
        if (s.service_type === 'Transport' || s.service_type === 'Xe vận chuyển' || s.service_type === 'Xe du lịch') {
            const seats = getSeatCount(s);
            if (seats) seatCounts.add(seats);
        }
    });
    const vehicleTypes = ['Tất cả', ...Array.from(seatCounts).sort((a, b) => parseInt(a) - parseInt(b)).map(num => `${num} chỗ`)];
    const vehicleClasses = ['Tất cả', 'Cao cấp', 'Phổ thông'];

    const filteredServices = services.filter(s => {
        let isTransport = s.service_type === 'Transport' || s.service_type === 'Xe vận chuyển' || s.service_type === 'Xe du lịch';
        if (!isTransport) return false;

        let matchLocation = selectedLocation === 'Tất cả' || s.destination_name === selectedLocation;
        
        let matchVehicleType = true;
        if (selectedVehicleType !== 'Tất cả') {
            const seats = getSeatCount(s);
            if (!seats || `${seats} chỗ` !== selectedVehicleType) {
                matchVehicleType = false;
            }
        }

        let matchVehicleClass = selectedVehicleClass === 'Tất cả' || getVehicleClass(s) === selectedVehicleClass;

        return matchLocation && matchVehicleType && matchVehicleClass;
    });

    const handleBookClick = (service) => {
        if (!user) {
            alert('Vui lòng đăng nhập để đặt dịch vụ!');
            navigate('/login');
            return;
        }
        setSelectedService(service);
    };

    return (
        <div className="homepage-container">
            <CustomerNavbar activeTab="services" />
            
            <div className="custom-tour-banner" style={{ margin: '30px 8%', height: '300px', backgroundImage: 'url(https://images.unsplash.com/photo-1454391304352-2bf4678b195a?q=80&w=2000)' }}>
                <div className="banner-overlay-dark" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2>Dịch Vụ Đặt Xe</h2>
                    <p>Thuê xe du lịch, xe di chuyển tiện lợi, chất lượng và uy tín.</p>
                </div>
            </div>

            <section className="section-container">
                {/* THANH CÔNG CỤ LỌC: ĐỊA ĐIỂM, LOẠI XE, PHÂN HẠNG */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '14px', color: '#475569' }}>⭐ Phân hạng:</strong>
                        <select 
                            value={selectedVehicleClass}
                            onChange={(e) => setSelectedVehicleClass(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '14px', minWidth: '150px' }}
                        >
                            {vehicleClasses.map(vc => (
                                <option key={vc} value={vc}>{vc}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '14px', color: '#475569' }}>🚌 Loại xe:</strong>
                        <select 
                            value={selectedVehicleType}
                            onChange={(e) => setSelectedVehicleType(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '14px', minWidth: '150px' }}
                        >
                            {vehicleTypes.map(vt => (
                                <option key={vt} value={vt}>{vt}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '14px', color: '#475569' }}>📍 Tỉnh/Thành phố:</strong>
                        <select 
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '14px', minWidth: '200px' }}
                        >
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="tour-grid">
                    {filteredServices.map(service => (
                        <div className="tour-card" key={service.service_id}>
                            <div className="tour-img-wrapper">
                                <div className="tour-img" style={{ backgroundImage: `url(${getImageUrl(service.image_url)})` }}></div>
                                <span className="tour-badge" style={{ background: '#10b981' }}>{service.service_type}</span>
                            </div>
                            <div className="tour-info">
                                {/* Hiển thị kèm địa điểm */}
                                <div style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 'bold', marginBottom: '4px' }}>
                                    📍 {service.destination_name || 'Đang cập nhật'}
                                </div>
                                <h3 className="tour-title">{service.service_name}</h3>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {service.description || 'Dịch vụ chất lượng cao, đối tác uy tín.'}
                                </p>
                                
                                <div className="tour-price-row">
                                    <div className="price-block">
                                        <span className="price-label">Giá từ ({service.unit})</span>
                                        <span className="new-price">{formatCurrency(service.selling_price)}</span>
                                    </div>
                                    <button className="btn-book" onClick={() => handleBookClick(service)}>
                                        Đặt ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

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
