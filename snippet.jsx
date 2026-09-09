            {/* 6. ƯU ĐÃI ĐẶC BIỆT (PROMOTIONS SLIDER) */}
            <section style={{ padding: '0 5%', marginBottom: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', margin: 0 }}>
                            💯 Ưu Đãi Đặc Biệt
                        </h2>
                        <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                            Các chuyến đi đang được giảm giá tốt nhất
                        </p>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => scrollSlider(discountSliderRef, 'left')}
                        style={{
                            position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button 
                        onClick={() => scrollSlider(discountSliderRef, 'right')}
                        style={{
                            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div 
                        ref={discountSliderRef}
                        style={{
                            display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                            gap: '20px', paddingBottom: '20px'
                        }}
                        className="hide-scrollbar"
                    >
                        {loadingTours ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} style={{ minWidth: '300px', background: '#ffffff', borderRadius: '20px', height: '320px', border: '1px solid #e2e8f0', padding: '16px', flex: '0 0 auto' }} />
                            ))
                        ) : promoTours.map(tour => {
                            let img = null;
                            try {
                                img = tour.images ? JSON.parse(tour.images)[0] : null;
                            } catch (e) {
                                img = tour.images;
                            }
                            const oldPrice = Number(tour.base_price || 0) * 1.25; // fake 20% discount
                            return (
                                <div 
                                    key={tour.tour_id}
                                    onClick={() => {
                                        trackBehavior('CLICK_TOUR', tour.tour_id, { tour_name: tour.tour_name });
                                        navigate(`/tour/${tour.tour_id}`);
                                    }}
                                    style={{
                                        minWidth: '280px', maxWidth: '320px', flex: '1 0 auto', scrollSnapAlign: 'start',
                                        background: '#fff0f2', borderRadius: '20px', border: '1.5px solid #fecdd3',
                                        overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 25px rgba(225, 29, 72, 0.05)',
                                        transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column'
                                    }}
                                    className="tour-card-modern"
                                >
                                    <div style={{ position: 'relative', height: '170px' }}>
                                        <div style={{ backgroundImage: `url(${getImageUrl(tour.image_url || img)})`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }} />
                                        <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: '900', padding: '6px 10px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)' }}>
                                            -20%
                                        </span>
                                        <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px' }}>
                                            ⏱️ {tour.duration_days} Ngày
                                        </span>
                                    </div>

                                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                            <span style={{ color: '#0284c7', fontWeight: '700' }}>📍 {tour.destination}</span>
                                            <span style={{ fontWeight: '700', color: '#f59e0b' }}>⭐ 4.9 (128)</span>
                                        </div>

                                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4', margin: '0 0 14px 0', height: '42px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {tour.tour_name}
                                        </h3>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fecdd3', paddingTop: '12px', marginTop: 'auto' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', display: 'block' }}>
                                                    {formatCurrency(oldPrice)}
                                                </span>
                                                <strong style={{ fontSize: '16px', color: '#ef4444' }}>{formatCurrency(tour.base_price)}</strong>
                                            </div>
                                            <button style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                                                Mua Ngay ➔
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* 7. MAIN CONTENT: TOUR TRỌN GÓI */}
            <section ref={showcaseRef} style={{ padding: '0 5%', marginBottom: '80px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            🌍 Tour Trọn Gói
                        </h2>
                        <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                            Các chuyến đi trọn gói tốt nhất hiện nay
                        </p>
                    </div>

                    {/* FILTER TABS */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        
                        {/* REGION FILTER */}
                        <div style={{ display: 'flex', gap: '6px', background: '#e0f2fe', padding: '4px', borderRadius: '14px' }}>
                            {['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Tây Nguyên'].map(region => (
                                <button 
                                    key={region}
                                    onClick={() => setSelectedRegion(region)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                                        background: selectedRegion === region ? '#0284c7' : 'transparent',
                                        color: selectedRegion === region ? '#ffffff' : '#0369a1',
                                        fontWeight: selectedRegion === region ? '800' : '600', fontSize: '13px',
                                        cursor: 'pointer', boxShadow: selectedRegion === region ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>

                        {/* TAB SORTING */}
                        <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '14px' }}>
                            {['Tất cả', 'Ưu đãi đặc quyền', 'Bán chạy', 'Giá tốt'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setTrendingTab(tab)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                                        background: trendingTab === tab ? '#ffffff' : 'transparent',
                                        color: trendingTab === tab ? (tab === 'Ưu đãi đặc quyền' ? '#0284c7' : '#0f172a') : '#64748b',
                                        fontWeight: trendingTab === tab ? '800' : '600', fontSize: '13px',
                                        cursor: 'pointer', boxShadow: trendingTab === tab ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TOUR SLIDER CONTAINER */}
                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => scrollSlider(tourSliderRef, 'left')}
                        style={{
                            position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button 
                        onClick={() => scrollSlider(tourSliderRef, 'right')}
                        style={{
                            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div 
                        ref={tourSliderRef}
                        style={{
                            display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                            gap: '20px', paddingBottom: '20px'
                        }}
                        className="hide-scrollbar"
                    >
                        {loadingTours ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} style={{ minWidth: '300px', background: '#ffffff', borderRadius: '20px', height: '320px', border: '1px solid #e2e8f0', padding: '16px', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                                    <div style={{ background: '#e2e8f0', height: '160px', borderRadius: '14px', marginBottom: '14px' }} />
                                    <div style={{ background: '#e2e8f0', height: '18px', width: '60%', borderRadius: '6px', marginBottom: '8px' }} />
                                    <div style={{ background: '#e2e8f0', height: '24px', width: '90%', borderRadius: '6px' }} />
                                </div>
                            ))
                        ) : filteredTours.length === 0 ? (
                            <div style={{ minWidth: '100%', background: '#ffffff', borderRadius: '24px', padding: '50px 20px', textAlign: 'center', border: '1.5px solid #e2e8f0', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                                <div style={{ fontSize: '50px', marginBottom: '12px' }}>🔍</div>
                                <h3 style={{ fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>Không tìm thấy tour phù hợp</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '500px', margin: '8px auto 20px auto' }}>
                                    Không có chuyến đi nào thỏa mãn toàn bộ tiêu chí lọc hiện tại.
                                </p>
                            </div>
                        ) : (
                            filteredTours.map(tour => {
                                let img = null;
                                try {
                                    img = tour.images ? JSON.parse(tour.images)[0] : null;
                                } catch (e) {
                                    img = tour.images;
                                }
                                return (
                                    <div 
                                        key={tour.tour_id}
                                        onClick={() => {
                                            trackBehavior('CLICK_TOUR', tour.tour_id, { tour_name: tour.tour_name });
                                            navigate(`/tour/${tour.tour_id}`);
                                        }}
                                        style={{
                                            minWidth: '280px', maxWidth: '320px', flex: '1 0 auto', scrollSnapAlign: 'start',
                                            background: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0',
                                            overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
                                            transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column'
                                        }}
                                        className="tour-card-modern"
                                    >
                                        <div style={{ position: 'relative', height: '170px' }}>
                                            <div style={{ backgroundImage: `url(${getImageUrl(tour.image_url || img)})`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }} />
                                            {Number(tour.base_price || 0) <= 4000000 && (
                                                <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px' }}>
                                                    🔥 Giá Cực Tốt
                                                </span>
                                            )}
                                            <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px' }}>
                                                ⏱️ {tour.duration_days} Ngày
                                            </span>
                                        </div>

                                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                                <span style={{ color: '#0284c7', fontWeight: '700' }}>📍 {tour.destination}</span>
                                                <span style={{ fontWeight: '700', color: '#f59e0b' }}>⭐ 4.9 (128)</span>
                                            </div>

                                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4', margin: '0 0 14px 0', height: '42px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {tour.tour_name}
                                            </h3>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Giá từ</span>
                                                    <strong style={{ fontSize: '16px', color: '#ef4444' }}>{formatCurrency(tour.base_price)}</strong>
                                                </div>
                                                <button style={{ padding: '8px 16px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                                                    Khám phá ➔
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>