import React, { useState } from 'react';
import { Mail, MapPin, Phone, Clock, Send, CheckCircle } from 'lucide-react';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Giả lập gửi form
        setTimeout(() => {
            setIsSubmitted(true);
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            setTimeout(() => setIsSubmitted(false), 5000);
        }, 800);
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <CustomerNavbar activeTab="contact" />

            {/* HERO SECTION */}
            <div style={{ 
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
                color: '#fff', 
                padding: '60px 20px', 
                textAlign: 'center' 
            }}>
                <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
                    Liên Hệ Với TravelVN
                </h1>
                <p style={{ fontSize: '16px', color: '#bfdbfe', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                    Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại thông tin hoặc liên hệ trực tiếp với chúng tôi qua các kênh dưới đây.
                </p>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ maxWidth: '1200px', margin: '-40px auto 60px auto', padding: '0 20px', width: '100%', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    
                    {/* LEFT: INFO CARD */}
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            Thông tin liên hệ
                        </h2>
                        
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '50%', color: '#2563eb', flexShrink: 0 }}>
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>Trụ sở chính</h4>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14.5px', lineHeight: '1.5' }}>190 Pasteur, Phường Xuân Hòa,<br/>Quận 1, TP. Hồ Chí Minh</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '50%', color: '#ef4444', flexShrink: 0 }}>
                                <Phone size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>Hotline Tư Vấn</h4>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14.5px', fontWeight: '700' }}>1800 646 888</p>
                                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Miễn phí 24/7</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '50%', color: '#22c55e', flexShrink: 0 }}>
                                <Mail size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>Email</h4>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14.5px' }}>info@travelvn.com</p>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14.5px' }}>cskh@travelvn.com</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ background: '#fefce8', padding: '12px', borderRadius: '50%', color: '#eab308', flexShrink: 0 }}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>Giờ làm việc</h4>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14.5px' }}>Thứ 2 - Thứ 6: 08:00 - 17:30</p>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14.5px' }}>Thứ 7: 08:00 - 12:00</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: CONTACT FORM */}
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 24px 0' }}>
                            Gửi tin nhắn cho chúng tôi
                        </h2>

                        {isSubmitted ? (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '30px', borderRadius: '16px', textAlign: 'center', color: '#15803d' }}>
                                <CheckCircle size={48} style={{ margin: '0 auto 16px auto' }} />
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Cảm ơn bạn đã liên hệ!</h3>
                                <p style={{ margin: 0, fontSize: '14px' }}>Chúng tôi đã nhận được thông tin và sẽ phản hồi bạn trong thời gian sớm nhất.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Họ và tên *</label>
                                        <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Nhập họ tên của bạn" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '14px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Số điện thoại *</label>
                                        <input required name="phone" value={formData.phone} onChange={handleChange} type="text" placeholder="Nhập số điện thoại" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '14px' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Email</label>
                                    <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="Nhập địa chỉ email" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '14px' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Chủ đề *</label>
                                    <input required name="subject" value={formData.subject} onChange={handleChange} type="text" placeholder="Bạn cần hỗ trợ về vấn đề gì?" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '14px' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Nội dung *</label>
                                    <textarea required name="message" value={formData.message} onChange={handleChange} rows="4" placeholder="Nhập nội dung chi tiết..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '14px', resize: 'vertical' }}></textarea>
                                </div>

                                <button type="submit" style={{ 
                                    background: '#0194f3', color: '#fff', padding: '14px', borderRadius: '12px', border: 'none', 
                                    fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' 
                                }}>
                                    <Send size={18} /> Gửi Yêu Cầu
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* GOOGLE MAPS */}
                <div style={{ marginTop: '40px', background: '#fff', padding: '10px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4673891460395!2d106.6910609146224!3d10.775466892321528!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3bf89f1311%3A0xc3f8e5f22e8642a8!2sDinh%20%C4%90%E1%BB%99c%20L%E1%BA%ADp!5e0!3m2!1svi!2s!4v1689753765123!5m2!1svi!2s" 
                        width="100%" 
                        height="400" 
                        style={{ border: 0, borderRadius: '12px' }} 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Bản đồ đường đi"
                    ></iframe>
                </div>
            </div>

            <CustomerFooter />
        </div>
    );
};

export default ContactPage;
