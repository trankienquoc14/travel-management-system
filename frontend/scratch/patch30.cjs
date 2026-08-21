const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

const startStr = "<div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>";
const endStr = "</div>\n                </div>\n            </div>\n\n            {/* Pricing Footer */}";

const startIdx = c.indexOf(startStr);
const endIdx = c.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const block = c.substring(startIdx, endIdx);
    
    // Remove the block from its current position
    c = c.substring(0, startIdx) + c.substring(endIdx);
    
    // Now find Pricing Footer and inject it right before
    const footerIdx = c.indexOf('{/* Pricing Footer */}');
    
    c = c.substring(0, footerIdx) + block + '\n            ' + c.substring(footerIdx);
    
    // Let's also restore the outer grid to repeat(3, 1fr) so it spans 3 columns horizontally because now it has the full width!
    c = c.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' \}\}>/, "<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>");
    
    // Revert the inner grid back to flexDirection: column so they stack vertically inside the card
    c = c.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', alignItems: 'end' \}\}>/g, "<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>");
    
    // Fix the Giá bán back to horizontal layout
    c = c.replace(/<div style=\{\{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%', paddingBottom: '5px' \}\}>/g, "<div style={{ marginTop: '5px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>");
    
    c = c.replace(/<span style=\{\{ fontSize: '12px', color: '#64748b', marginBottom: '4px' \}\}>Giá bán:<\/span>/g, "<span style={{ fontSize: '12px', color: '#64748b' }}>Giá bán:</span>");
    c = c.replace(/<strong style=\{\{ fontSize: '16px', color: '#0ea5e9' \}\}>\{formatMoneyLocal\(calPrice\)\} đ<\/strong>/g, "<strong style={{ fontSize: '14px', color: '#0ea5e9' }}>{formatMoneyLocal(calPrice)} đ</strong>");

    // Let's also remove `gridColumn: '1 / -1'` from the container style as it's not needed
    c = c.replace("boxShadow: '0 2px 4px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}", "boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}");

    fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
    console.log('Moved block and restored layout.');
} else {
    console.log('Markers not found.');
}
