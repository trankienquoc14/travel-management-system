const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/StaffVehicleManagement.jsx', 'utf8');

const start = c.indexOf('<div style={styles.grid}>');
const end = c.indexOf('{/* Modal Cập Nhật Trạng Thái */}');
const target = c.substring(start, end);

const replacement = `<div style={styles.grid}>
              {filteredVehicles.filter(v => v.vehicle_type === cat).map(v => (
                <div key={v.vehicle_id} style={styles.card}>
                  <div style={{ height: '180px', overflow: 'hidden' }}>
                    <img 
                      src={getImageUrl(v.image_url) || fallbackImg} 
                      alt={v.license_plate}
                      onError={(e) => { e.target.src = fallbackImg; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                    />
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                        Mã: {v.vehicle_code || 'N/A'}
                      </span>
                      <span style={styles.badge(v.status)}>
                        {v.status === 'AVAILABLE' ? 'Sẵn sàng' : v.status === 'IN_TOUR' ? 'Đang đi Tour' : v.status === 'MAINTENANCE' ? 'Bảo dưỡng' : v.status === 'REPAIR' ? 'Sửa chữa' : 'Tạm ngưng'}
                      </span>
                    </div>
                    
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
                      Biển số: <span style={{ color: '#0194f3' }}>{v.license_plate}</span>
                    </h3>

                    <div style={{ marginBottom: '8px', fontSize: '13px', color: '#334155' }}>
                      <div style={{ color: '#64748b', marginBottom: '2px', fontSize: '12px' }}>Dòng/Đời xe:</div>
                      <div style={{ fontWeight: '600' }}>{v.brand_model || 'N/A'}</div>
                    </div>

                    <div style={{ marginBottom: '12px', fontSize: '13px', color: '#334155' }}>
                      <div style={{ color: '#64748b', marginBottom: '2px', fontSize: '12px' }}>Màu xe & Số chỗ:</div>
                      <div style={{ fontWeight: '600' }}>{v.color || 'N/A'} - {v.seat_capacity} chỗ</div>
                    </div>

                    {v.notes && (
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '16px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                        {v.notes}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                      <button 
                        onClick={() => openStatusModal(v)} 
                        style={v.status === 'IN_TOUR' ? {...styles.btnSecondary, width: '100%', opacity: 0.5, cursor: 'not-allowed'} : {...styles.btnPrimary, width: '100%'}}
                        disabled={v.status === 'IN_TOUR'}
                      >
                        Cập nhật trạng thái
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      `;

c = c.replace(target, replacement);

c = c.replace(
  "grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },",
  "grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },"
);

c = c.replace(
  "card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },",
  "card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' },"
);

fs.writeFileSync('frontend/src/components/StaffVehicleManagement.jsx', c);
console.log('Cards updated');
