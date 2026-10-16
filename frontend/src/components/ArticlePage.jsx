import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Calendar, ArrowLeft, ChevronRight, Share2, Phone, Sparkles } from 'lucide-react';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import { articlesMap, articlesList } from '../data/articlesData';

const ArticlePage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const currentKey = slug || 'about';
    const article = articlesMap[currentKey] || articlesMap['about'] || articlesList[0];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [slug]);

    // Các bài viết gợi ý khác
    const relatedArticles = articlesList.filter(a => a.slug !== currentKey).slice(0, 4);

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <CustomerNavbar activeTab="articles" />

            {/* HERO ARTICLE BANNER */}
            <div style={{
                position: 'relative',
                height: '360px',
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
                    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.65) 0%, rgba(15, 23, 42, 0.88) 100%)'
                }} />
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '860px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <span style={{
                            background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)',
                            color: '#ffffff', fontSize: '12px', fontWeight: '800', padding: '6px 16px',
                            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)',
                            letterSpacing: '0.5px'
                        }}>
                            {article.badge}
                        </span>
                        <span style={{
                            background: '#0284c7',
                            color: '#ffffff', fontSize: '12px', fontWeight: '700', padding: '6px 14px',
                            borderRadius: '20px'
                        }}>
                            {article.category}
                        </span>
                    </div>

                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 12px 0', lineHeight: '1.3' }}>
                        {article.title}
                    </h1>
                    <p style={{ fontSize: '15.5px', color: '#e2e8f0', margin: '0 0 16px 0', fontWeight: '500', lineHeight: '1.5' }}>
                        {article.subtitle}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '13px', color: '#cbd5e1' }}>
                        <span>✍️ {article.author}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {article.readTime}</span>
                        <span>•</span>
                        <span>📅 {article.updated}</span>
                    </div>
                </div>
            </div>

            {/* BREADCRUMB / ACTION BAR */}
            <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 5%' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#64748b' }}>
                        <span onClick={() => navigate('/home')} style={{ cursor: 'pointer', color: '#0284c7', fontWeight: '600' }}>Trang chủ</span>
                        <span>/</span>
                        <span onClick={() => navigate('/articles')} style={{ cursor: 'pointer', color: '#0284c7', fontWeight: '600' }}>Cẩm nang & Bài viết</span>
                        <span>/</span>
                        <span style={{ color: '#0f172a', fontWeight: '700' }}>{article.title.slice(0, 35)}...</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => navigate('/articles')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#f0f9ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            <BookOpen size={14} /> Tất cả Cẩm nang
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            <ArrowLeft size={14} /> Trang chủ
                        </button>
                    </div>
                </div>
            </div>

            {/* ARTICLE CONTENT BODY WITH SIDEBAR NAVIGATION */}
            <main style={{ maxWidth: '1320px', width: '100%', margin: '36px auto', padding: '0 24px', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 300px) 1fr', gap: '36px', alignItems: 'start' }}>
                    
                    {/* LEFT ARTICLE NAVIGATION SIDEBAR */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '90px' }}>
                        
                        {/* MENU BÀI VIẾT CẨM NANG */}
                        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📖 Cẩm Nang Du Lịch Hot
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {articlesList.filter(a => a.categorySlug !== 'company').slice(0, 5).map(art => {
                                    const isCurrent = art.slug === currentKey;
                                    return (
                                        <div 
                                            key={art.slug}
                                            onClick={() => navigate(`/article/${art.slug}`)}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                fontSize: '13.5px',
                                                fontWeight: isCurrent ? '700' : '500',
                                                background: isCurrent ? '#f0f9ff' : 'transparent',
                                                color: isCurrent ? '#0284c7' : '#475569',
                                                borderLeft: isCurrent ? '3px solid #0284c7' : '3px solid transparent',
                                                transition: 'all 0.2s ease',
                                                lineHeight: '1.4'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isCurrent) {
                                                    e.currentTarget.style.background = '#f8fafc';
                                                    e.currentTarget.style.color = '#0284c7';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isCurrent) {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = '#475569';
                                                }
                                            }}
                                        >
                                            {art.title}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                <span 
                                    onClick={() => navigate('/articles')}
                                    style={{
                                        color: '#0284c7',
                                        fontSize: '13.5px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    Xem thêm cẩm nang <ChevronRight size={14} />
                                </span>
                            </div>
                        </div>

                        {/* MENU DOANH NGHIỆP & CHÍNH SÁCH */}
                        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}>
                            <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0' }}>
                                🏢 Về VietTravel ERP
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {[
                                    { slug: 'about', label: 'Về chúng tôi', icon: '🏢' },
                                    { slug: 'guides', label: 'Đội ngũ Hướng dẫn viên', icon: '🚩' },
                                    { slug: 'privacy', label: 'Chính sách bảo mật', icon: '🔒' },
                                    { slug: 'terms', label: 'Điều khoản & Quy định', icon: '📜' }
                                ].map(item => {
                                    const isCurrent = currentKey === item.slug;
                                    return (
                                        <div
                                            key={item.slug}
                                            onClick={() => navigate(`/article/${item.slug}`)}
                                            style={{
                                                padding: '9px 12px',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '13.5px',
                                                fontWeight: isCurrent ? '700' : '500',
                                                background: isCurrent ? '#f0f9ff' : 'transparent',
                                                color: isCurrent ? '#0284c7' : '#64748b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <span>{item.icon}</span> {item.label}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* HOTLINE ASSISTANCE CARD */}
                        <div style={{ padding: '24px 20px', background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', boxShadow: '0 6px 12px rgba(2, 132, 199, 0.3)' }}>
                                <Phone size={18} style={{ color: '#fff' }} />
                            </div>
                            <strong style={{ fontSize: '13.5px', color: '#334155', display: 'block', fontWeight: '800' }}>Hotline Tư Vấn Du Lịch</strong>
                            <div style={{ fontSize: '22px', color: '#0369a1', fontWeight: '900', marginTop: '4px' }}>1800 646 888</div>
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '6px' }}>Hỗ trợ 24/7 (Miễn phí cước)</span>
                        </div>

                    </aside>

                    {/* MAIN ARTICLE DETAIL DISPLAY */}
                    <div>
                        <article style={{ background: '#ffffff', borderRadius: '24px', padding: '36px', border: '1.5px solid #e2e8f0', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.03)', marginBottom: '32px' }}>
                            {article.content}

                            {/* BANNER ĐẶT TOUR LIÊN QUAN */}
                            {article.tourLink && (
                                <div style={{
                                    marginTop: '36px',
                                    padding: '24px 28px',
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    borderRadius: '18px',
                                    border: '1.5px solid #bae6fd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '16px'
                                }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Sparkles size={18} /> Bạn muốn trải nghiệm điểm đến này?
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                                            Khám phá các tour trọn gói hấp dẫn hoặc đặt dịch vụ xe, khách sạn giá ưu đãi.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate(article.tourLink)}
                                        style={{
                                            background: '#0284c7',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '11px 22px',
                                            borderRadius: '12px',
                                            fontSize: '14px',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                                        }}
                                    >
                                        {article.tourBtnText || 'Khám phá Ngay'} →
                                    </button>
                                </div>
                            )}
                        </article>

                        {/* RELATED ARTICLES SECTION */}
                        <div style={{ background: '#ffffff', borderRadius: '24px', padding: '30px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📑 Cẩm Nang & Bài Viết Đọc Thêm
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                {relatedArticles.map(rel => (
                                    <div
                                        key={rel.slug}
                                        onClick={() => navigate(`/article/${rel.slug}`)}
                                        style={{
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.borderColor = '#93c5fd';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}
                                    >
                                        <img src={rel.heroImage} alt={rel.title} style={{ height: '130px', width: '100%', objectFit: 'cover' }} />
                                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '700', marginBottom: '6px' }}>{rel.category}</span>
                                            <h5 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', lineHeight: '1.4' }}>{rel.title}</h5>
                                            <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: 'auto' }}>{rel.readTime} • {rel.updated}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <CustomerFooter />
        </div>
    );
};

export default ArticlePage;
