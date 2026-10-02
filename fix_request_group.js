const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

// 1. Add state variable
if (!content.includes('const [isServiceRequestGroupOpen, setIsServiceRequestGroupOpen]')) {
    content = content.replace(
        "const [isRequestGroupOpen, setIsRequestGroupOpen] = useState(false);",
        "const [isRequestGroupOpen, setIsRequestGroupOpen] = useState(false);\n  const [isServiceRequestGroupOpen, setIsServiceRequestGroupOpen] = useState(false);"
    );
}

// 2. Fix the second block
const oldBlock = `                  <li 
                    onClick={() => setIsRequestGroupOpen(!isRequestGroupOpen)}
                    style={{ 
                      cursor: 'pointer', 
                      background: '#f8fafc', 
                      padding: '10px 14px', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      color: '#1e293b', 
                      textTransform: 'uppercase', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderRadius: '8px',
                      marginTop: '12px',
                      marginBottom: '4px',
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    📦 QUẢN LÝ YÊU CẦU
                    <span>{isRequestGroupOpen ? '▼' : '▲'}</span>
                  </li>
                  {isRequestGroupOpen && (
                    <>
                      <li className={activeTab === 'service_requests_list' ? 'active' : ''} onClick={() => setActiveTab('service_requests_list')}>`;

const newBlock = `                  <li 
                    onClick={() => setIsServiceRequestGroupOpen(!isServiceRequestGroupOpen)}
                    style={{ 
                      cursor: 'pointer', 
                      background: '#f8fafc', 
                      padding: '10px 14px', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      color: '#1e293b', 
                      textTransform: 'uppercase', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderRadius: '8px',
                      marginTop: '12px',
                      marginBottom: '4px',
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <span>📦 QUẢN LÝ YÊU CẦU</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen ? '▲' : '▼'}</span>
                  </li>
                  {isServiceRequestGroupOpen && (
                    <>
                      <li className={activeTab === 'service_requests_list' ? 'active' : ''} onClick={() => setActiveTab('service_requests_list')}>`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
} else {
    // If it was already modified or something is different, just do string replacements
    // specifically for that area.
}

fs.writeFileSync('frontend/src/components/Dashboard.jsx', content);
console.log('Fixed second Request Group');
