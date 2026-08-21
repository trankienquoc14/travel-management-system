const fs = require('fs');
const path = require('path');

const transportBlock = `
                                                                {/* Block Phương tiện CHI TIẾT */}
                                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                                    <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '12px' }}>🚗 Phương tiện di chuyển chính: {costConfig.selectedTransport ? costConfig.selectedTransport.name : 'Chưa chọn'}</strong>
                                                                    
                                                                    {costConfig.transportTimes && (
                                                                        <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến đi (Ngày đầu)</div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                    <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                                                                                    <span>Điểm xuất phát</span>
                                                                                    <span>Điểm đến</span>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div style={{ width: '1px', background: '#e2e8f0' }}></div>

                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến về (Ngày {computed.totalDays})</div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startR || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                    <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endR || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                                                                                    <span>Điểm kết thúc</span>
                                                                                    <span>Điểm về</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
`;

function processFile(filename, varName) {
    const fPath = path.join(__dirname, 'src', 'components', filename);
    let content = fs.readFileSync(fPath, 'utf8');

    // 1. Change maxWidth to 1200px
    content = content.replace(/maxWidth:\s*'700px'/g, "maxWidth: '1200px'");

    // 2. Add main tour image
    const imageCode = `
                        {${varName}.image_url && (
                            <div style={{ marginBottom: '16px' }}>
                                <img src={${varName}.image_url.startsWith('/') ? 'http://localhost:5002' + ${varName}.image_url : ${varName}.image_url} alt="Cover" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            </div>
                        )}
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>`;
    
    content = content.replace(/<div style=\{\{\s*overflowY:\s*'auto',\s*paddingRight:\s*'8px',\s*flex:\s*1\s*\}\}>/g, imageCode);

    // 3. Replace old transport block with new one
    const oldTransportRegex = /<div style=\{\{\s*background:\s*'#f8fafc',\s*padding:\s*'16px',\s*borderRadius:\s*'12px',\s*border:\s*'1px solid #e2e8f0'\s*\}\}>\s*<strong style=\{\{\s*fontSize:\s*'13px',\s*color:\s*'#64748b',\s*display:\s*'block',\s*marginBottom:\s*'8px',\s*textTransform:\s*'uppercase'\s*\}\}>🚗 Phương tiện di chuyển<\/strong>[\s\S]*?<\/div>/m;
    
    content = content.replace(oldTransportRegex, transportBlock);

    fs.writeFileSync(fPath, content, 'utf8');
    console.log("Updated UI tweaks in " + filename);
}

processFile('StaffPendingTours.jsx', 'viewingFixedTour');
processFile('ManagerTourApproval.jsx', 'selectedFixedTour');
