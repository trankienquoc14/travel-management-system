                    <!-- FILTER TABS -->
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        
                        <!-- REGION FILTER -->
                        <div style={{ display: 'flex', gap: '6px', background: '#e0f2fe', padding: '4px', borderRadius: '14px' }}>
                            {['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Tây Nguyån'].map(region => (
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

                        <!-- TAB SORTING -->
                        <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '14px' }}>
                            {['Tất cả', 'Âu đãi đặc quyền', 'Bán chạy', 'Giá tốt'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setTrendingTab(tab)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                                        background: trendingTab === tab ? '#ffffff' : 'transparent',
                                        color: trendingTab === tab ? (tab === 'Âu đãi đặc quyền' ? '#0284c7' : '#0f172a') : '#64748b',
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