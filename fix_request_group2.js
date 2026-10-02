const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');
content = content.replace("<span>{isRequestGroupOpen ? '▼' : '▲'}</span>", "<span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen ? '▲' : '▼'}</span>");
content = content.replace("📦 QUẢN LÝ YÊU CẦU", "<span>📦 QUẢN LÝ YÊU CẦU</span>");
content = content.replace("onClick={() => setIsRequestGroupOpen(!isRequestGroupOpen)}", "onClick={() => setIsServiceRequestGroupOpen(!isServiceRequestGroupOpen)}");
content = content.replace("{isRequestGroupOpen && (", "{isServiceRequestGroupOpen && (");

// But wait, "onClick={() => setIsRequestGroupOpen(!isRequestGroupOpen)}" is also on the other group, we only want to replace the second one!
