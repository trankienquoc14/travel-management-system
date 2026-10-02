const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

const searchBlock = `                      borderLeft: '4px solid #f59e0b'
                    }}
                    <span>📦 QUẢN LÝ YÊU CẦU</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen ? '▲' : '▼'}</span>
                    <span>{isRequestGroupOpen ? '▼' : '▲'}</span>
                  </li>`;

const searchBlock2 = `                      borderLeft: '4px solid #f59e0b'
                    }}
                    <span>📦 QUẢN LÝ YÊU CẦU</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen ? '▲' : '▼'}</span>
                    <span>{isRequestGroupOpen ? '▼' : '▲'}</span>
                  </li>`;
                  
const replaceBlock = `                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <span>📦 QUẢN LÝ YÊU CẦU</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen ? '▲' : '▼'}</span>
                  </li>`;

// If spaces are not matching, I will use regex
content = content.replace(/borderLeft: '4px solid #f59e0b'\s*}}\s*<span>📦 QUẢN LÝ YÊU CẦU<\/span>\s*<span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen \? '▲' : '▼'}<\/span>\s*<span>{isRequestGroupOpen \? '▼' : '▲'}<\/span>\s*<\/li>/g, 
`borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <span>📦 QUẢN LÝ YÊU CẦU</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen ? '▲' : '▼'}</span>
                  </li>`);

fs.writeFileSync('frontend/src/components/Dashboard.jsx', content);
console.log('Fixed block with regex');
