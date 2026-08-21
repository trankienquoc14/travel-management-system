const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

const replacements = [
    {
        old: `<input type="number" value={costConfig.fixed.transport} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, transport: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />`,
        new: `<div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.transport || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, transport: e.target.value.replace(/\\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>`
    },
    {
        old: `<input type="number" value={costConfig.fixed.guidePerDay} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, guidePerDay: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />`,
        new: `<div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.guidePerDay || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, guidePerDay: e.target.value.replace(/\\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>`
    },
    {
        old: `<input type="number" value={costConfig.variable.insurance} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, insurance: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />`,
        new: `<div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.insurance || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, insurance: e.target.value.replace(/\\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>`
    },
    {
        old: `<input type="number" value={costConfig.variable.singleSupplement} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, singleSupplement: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />`,
        new: `<div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.singleSupplement || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, singleSupplement: e.target.value.replace(/\\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>`
    }
];

replacements.forEach(r => {
    c = c.replace(r.old, r.new);
});

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
