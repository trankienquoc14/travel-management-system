const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

const target1 = `                            // 1. Gom nhóm ngày khởi hành theo tháng
                            const grouped = {};
                            const deps = tour.departures || [];
                            deps.forEach(dep => {
                                const d = new Date(dep.departure_date);
                                const mKey = \`Tháng \${d.getMonth() + 1} \${d.getFullYear()}\`;
                                if (!grouped[mKey]) grouped[mKey] = [];
                                grouped[mKey].push(dep);
                            });
                            const monthKeys = Object.keys(grouped);
                            
                            // Nếu chưa có tab nào thì set default
                            if (monthKeys.length > 0 && !selectedMonthTab) {
                                setTimeout(() => setSelectedMonthTab(monthKeys[0]), 0);
                            }
                            
                            if (deps.length === 0) {
                                return <div style={{ color: '#64748b' }}>Đang cập nhật lịch khởi hành...</div>;
                            }

                            const activeDeps = grouped[selectedMonthTab] || [];`;

const replace1 = `                            // 1. Tạo 6 tháng tới
                            const monthKeys = [];
                            const now = new Date();
                            for (let i = 0; i < 6; i++) {
                                const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                                monthKeys.push({
                                    key: \`Tháng \${d.getMonth() + 1}_\${d.getFullYear()}\`,
                                    labelMonth: \`Tháng \${d.getMonth() + 1}\`,
                                    labelYear: \`\${d.getFullYear()}\`
                                });
                            }
                            
                            const grouped = {};
                            const deps = tour.departures || [];
                            deps.forEach(dep => {
                                const d = new Date(dep.departure_date);
                                const k = \`Tháng \${d.getMonth() + 1}_\${d.getFullYear()}\`;
                                if (!grouped[k]) grouped[k] = [];
                                grouped[k].push(dep);
                            });
                            
                            // Nếu chưa có tab nào thì set default
                            if (!selectedMonthTab) {
                                setTimeout(() => setSelectedMonthTab(monthKeys[0].key), 0);
                            }

                            const activeDeps = grouped[selectedMonthTab] || [];`;


const target2 = `                                    {/* Tabs Tháng */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {monthKeys.map(m => {
                                            const isActive = m === selectedMonthTab;
                                            return (
                                                <button
                                                    key={m}
                                                    onClick={() => setSelectedMonthTab(m)}
                                                    style={{
                                                        padding: '12px 24px',
                                                        borderRadius: '12px',
                                                        border: isActive ? 'none' : '1px solid #cbd5e1',
                                                        background: isActive ? '#1d4ed8' : '#fff',
                                                        color: isActive ? '#fff' : '#64748b',
                                                        fontWeight: '600',
                                                        fontSize: '15px',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {m}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Danh sách ngày */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {activeDeps.map(dep => {`;

const replace2 = `                                    {/* Tabs Tháng */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {monthKeys.map(mObj => {
                                            const isActive = mObj.key === selectedMonthTab;
                                            return (
                                                <button
                                                    key={mObj.key}
                                                    onClick={() => setSelectedMonthTab(mObj.key)}
                                                    style={{
                                                        padding: '12px 24px',
                                                        borderRadius: '16px',
                                                        border: isActive ? 'none' : '1px solid #cbd5e1',
                                                        background: isActive ? '#1d4ed8' : '#fff',
                                                        color: isActive ? '#fff' : '#64748b',
                                                        fontWeight: '600',
                                                        fontSize: '15px',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        minWidth: '100px'
                                                    }}
                                                >
                                                    <span>{mObj.labelMonth}</span>
                                                    <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500' }}>{mObj.labelYear}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Danh sách ngày */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {activeDeps.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                                                Hiện chưa có lịch khởi hành nào trong {selectedMonthTab ? selectedMonthTab.replace('_', ' năm ') : 'tháng này'}.
                                            </div>
                                        ) : activeDeps.map(dep => {`;

c = c.replace(target1, replace1);
c = c.replace(target2, replace2);

fs.writeFileSync('src/components/TourDetail.jsx', c);
console.log('Fixed tabs');
