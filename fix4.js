const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

// I will just find the block and replace it.
const searchBlock = `                      borderLeft: '4px solid #f59e0b'
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

if (content.includes(searchBlock)) {
    content = content.replace(searchBlock, replaceBlock);
    fs.writeFileSync('frontend/src/components/Dashboard.jsx', content);
    console.log('Fixed block');
} else {
    console.log('Block not found');
}
