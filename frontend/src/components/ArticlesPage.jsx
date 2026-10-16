import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, BookOpen, Clock, Calendar, ChevronRight, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import { articlesList, articleCategories } from '../data/articlesData';

const ArticlesPage = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectedCategory]);

    // Lọc bài viết theo danh mục và từ khóa
    const filteredArticles = useMemo(() => {
        return articlesList.filter(art => {
            const matchCategory = selectedCategory === 'all' || art.categorySlug === selectedCategory;
            const matchSearch = searchTerm.trim() === '' || 
                art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                art.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                art.summary.toLowerCase().includes(searchTerm.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [selectedCategory, searchTerm]);

    const featuredArticle = articlesList.find(a => a.featured) || articlesList[0];

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <CustomerNavbar activeTab="articles" />

            {/* HERO BANNER */}
            <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
                color: '#ffffff',
                padding: '70px 20px 60px 20px',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                {/* Decorative background glow */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '800px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(0, 0, 0, 0) 70%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: '880px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(10px)',
                        padding: '6px 18px',
                        borderRadius: '30px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#38bdf8',
                        marginBottom: '18px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <Sparkles size={16} /> CẨM NANG & KINH NGHIỆM DU LỊCH 2026
                    </div>
                    <h1 style={{ fontSize: '38px', fontWeight: '900', margin: '0 0 16px 0', lineHeight: '1.25', letterSpacing: '-0.5px' }}>
                        Khám Phá Việt Nam Qua Từng Trang Viết
                    </h1>
                    <p style={{ fontSize: '16.5px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 32px 0' }}>
                        Tổng hợp bí kíp du lịch thực tế, lịch trình gợi ý từ chuyên gia, văn hóa ẩm thực đặc sắc và những mẹo hữu ích để bạn có kỳ nghỉ hoàn hảo nhất.
                    </p>

                    {/* SEARCH BOX */}
                    <div style={{
                        maxWidth: '620px',
                        margin: '0 auto',
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '6px 8px 6px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <Search size={20} style={{ color: '#0284c7', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm cẩm nang (VD: Phú Quốc, Đà Nẵng, Sapa, hành lý...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                flex: 1,
                                padding: '10px 14px',
                                fontSize: '15px',
                                color: '#1e293b'
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '6px 10px',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            >
                                Xóa
                            </button>
                        )}
                    </div>

                    {/* QUICK DESTINATIONS TAGS */}
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> Điểm đến hot:</span>
                        {['Phú Quốc', 'Đà Nẵng', 'Sapa', 'Hạ Long', 'Miền Tây'].map((tag, idx) => (
                            <span 
                                key={idx}
                                onClick={() => setSearchTerm(tag)}
                                style={{
                                    cursor: 'pointer',
                                    color: '#f8fafc',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <main style={{ maxWidth: '1320px', width: '100%', margin: '0 auto', padding: '40px 24px 60px 24px', flex: 1 }}>

                {/* CATEGORIES PILL BAR */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    paddingBottom: '12px',
                    marginBottom: '36px',
                    scrollbarWidth: 'none'
                }}>
                    {articleCategories.map(cat => {
                        const isActive = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => { setSelectedCategory(cat.id); setSearchTerm(''); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    borderRadius: '30px',
                                    border: isActive ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                                    background: isActive ? '#0284c7' : '#ffffff',
                                    color: isActive ? '#ffffff' : '#475569',
                                    fontSize: '14.5px',
                                    fontWeight: isActive ? '700' : '600',
                                    cursor: 'pointer',
                                    boxShadow: isActive ? '0 8px 16px rgba(2, 132, 199, 0.25)' : '0 2px 4px rgba(0,0,0,0.02)',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span>{cat.icon}</span>
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {/* FEATURED ARTICLE (chỉ hiện khi ở tab Tất cả và không search) */}
                {selectedCategory === 'all' && !searchTerm && featuredArticle && (
                    <div 
                        onClick={() => navigate(`/article/${featuredArticle.slug}`)}
                        style={{
                            background: '#ffffff',
                            borderRadius: '24px',
                            border: '1.5px solid #e2e8f0',
                            overflow: 'hidden',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
                            marginBottom: '48px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    >
                        <div style={{ height: '360px', overflow: 'hidden', position: 'relative' }}>
                            <img 
                                src={featuredArticle.heroImage} 
                                alt={featuredArticle.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <span style={{
                                position: 'absolute',
                                top: '16px',
                                left: '16px',
                                background: '#ef4444',
                                color: '#ffffff',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '800',
                                boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)'
                            }}>
                                {featuredArticle.badge}
                            </span>
                        </div>
                        <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '13px', color: '#64748b' }}>
                                <span style={{ color: '#0284c7', fontWeight: '700' }}>{featuredArticle.category}</span>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {featuredArticle.readTime}</span>
                                <span>•</span>
                                <span>{featuredArticle.updated}</span>
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', lineHeight: '1.35' }}>
                                {featuredArticle.title}
                            </h2>
                            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.65', margin: '0 0 24px 0' }}>
                                {featuredArticle.summary}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                                <div>
                                    <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block' }}>{featuredArticle.author}</strong>
                                    <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>{featuredArticle.authorRole}</span>
                                </div>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#0284c7',
                                    fontWeight: '700',
                                    fontSize: '14.5px'
                                }}>
                                    Đọc cẩm nang <ArrowRight size={16} />
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECTION HEADING */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={22} style={{ color: '#0284c7' }} />
                        {selectedCategory === 'all' ? 'Tất Cả Cẩm Nang & Bài Viết' : articleCategories.find(c => c.id === selectedCategory)?.name}
                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>({filteredArticles.length} bài viết)</span>
                    </h3>
                </div>

                {/* ARTICLES GRID */}
                {filteredArticles.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '28px'
                    }}>
                        {filteredArticles.map(art => (
                            <div
                                key={art.slug}
                                onClick={() => navigate(`/article/${art.slug}`)}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '20px',
                                    border: '1.5px solid #e2e8f0',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                                    transition: 'all 0.25s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                    e.currentTarget.style.boxShadow = '0 16px 30px rgba(15, 23, 42, 0.08)';
                                    e.currentTarget.style.borderColor = '#93c5fd';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.03)';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                {/* Thumbnail */}
                                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                                    <img 
                                        src={art.heroImage} 
                                        alt={art.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        background: 'rgba(15, 23, 42, 0.75)',
                                        backdropFilter: 'blur(6px)',
                                        color: '#ffffff',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '11.5px',
                                        fontWeight: '700'
                                    }}>
                                        {art.badge}
                                    </span>
                                </div>

                                {/* Body */}
                                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px', color: '#64748b' }}>
                                        <span style={{ color: '#0284c7', fontWeight: '700' }}>{art.category}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {art.readTime}</span>
                                    </div>

                                    <h4 style={{
                                        fontSize: '17px',
                                        fontWeight: '800',
                                        color: '#0f172a',
                                        margin: '0 0 10px 0',
                                        lineHeight: '1.4',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {art.title}
                                    </h4>

                                    <p style={{
                                        fontSize: '13.5px',
                                        color: '#64748b',
                                        lineHeight: '1.6',
                                        margin: '0 0 18px 0',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        flex: 1
                                    }}>
                                        {art.summary}
                                    </p>

                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>{art.updated}</span>
                                        <span style={{ color: '#0284c7', fontSize: '13.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Xem chi tiết <ChevronRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#ffffff',
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                        <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
                            Không tìm thấy bài viết nào phù hợp
                        </h4>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
                            Thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để xem lại tất cả bài viết.
                        </p>
                        <button
                            onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
                            style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Xem Tất Cả Bài Viết
                        </button>
                    </div>
                )}

                {/* BOTTOM CALL-TO-ACTION BANNER */}
                <div style={{
                    marginTop: '60px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    borderRadius: '24px',
                    padding: '40px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '24px',
                    boxShadow: '0 16px 36px rgba(2, 132, 199, 0.25)'
                }}>
                    <div style={{ maxWidth: '650px' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 10px 0' }}>
                            Bạn Đã Sẵn Sàng Cho Chuyến Đi Tiếp Theo?
                        </h3>
                        <p style={{ margin: 0, fontSize: '15px', color: '#e0f2fe', lineHeight: '1.6' }}>
                            Khám phá hàng chục Tour du lịch trọn gói chất lượng cao hoặc tự tay thiết kế tour cá nhân theo ngân sách của bạn cùng VietTravel ERP.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/tours')}
                            style={{
                                background: '#ffffff',
                                color: '#0369a1',
                                border: 'none',
                                padding: '12px 26px',
                                borderRadius: '14px',
                                fontWeight: '800',
                                fontSize: '15px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        >
                            🌟 Xem Tour Trọn Gói
                        </button>
                        <button
                            onClick={() => navigate('/build-tour')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.4)',
                                padding: '12px 26px',
                                borderRadius: '14px',
                                fontWeight: '800',
                                fontSize: '15px',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            ⚡ Tự Thiết Kế Tour
                        </button>
                    </div>
                </div>

            </main>

            <CustomerFooter />
        </div>
    );
};

export default ArticlesPage;
