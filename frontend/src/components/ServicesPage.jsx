import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import ServiceBookingModal from './ServiceBookingModal';
import '../index.css';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [selectedLocation, setSelectedLocation] = useState('Tất cả'); // Thêm state location
    const [selectedService, setSelectedService] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        
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

    // Lấy danh sách địa điểm độc nhất từ dữ liệu dịch vụ
    const locations = ['Tất cả', ...new Set(services.map(s => s.destination_name).filter(Boolean))];

    const filteredServices = services.filter(s => {
        let matchCategory = false;
        if (selectedCategory === 'Tất cả') matchCategory = true;
        else if (selectedCategory === 'Khách sạn') matchCategory = s.service_type === 'Hotel' || s.service_type === 'Khách sạn';
        else if (selectedCategory === 'Xe du lịch') matchCategory = s.service_type === 'Transport' || s.service_type === 'Xe vận chuyển';
        else if (selectedCategory === 'Vé máy bay') matchCategory = s.service_type === 'Flight' || s.service_type === 'Vé máy bay';

        let matchLocation = selectedLocation === 'Tất cả' || s.destination_name === selectedLocation;

        return matchCategory && matchLocation;
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
                    <h2>Dịch Vụ Độc Lập</h2>
                    <p>Đặt riêng phòng Khách sạn, Thuê xe hoặc Vé máy bay dễ dàng.</p>
                </div>
            </div>

            <section className="section-container">
                {/* THANH CÔNG CỤ LỌC KÉP: DANH MỤC & ĐỊA ĐIỂM */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#f8fafc', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div className="category-tabs" style={{ margin: 0 }}>
                        {['Tất cả', 'Khách sạn', 'Xe du lịch', 'Vé máy bay'].map(cat => (
                            <button 
                                key={cat}
                                className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                                style={{ padding: '8px 16px', fontSize: '14px' }}
                            >
                                {cat}
                            </button>
                        ))}
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
        </div>
    );
};

export default ServicesPage;
