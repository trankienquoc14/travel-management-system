const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

// 1. Fix justify
content = content.replace(/justify: 'space-between'/g, "justifyContent: 'space-between'");

// 2. Add isServiceRequestGroupOpen state if missing
if (!content.includes('const [isServiceRequestGroupOpen, setIsServiceRequestGroupOpen]')) {
    content = content.replace(
        "const [isRequestGroupOpen, setIsRequestGroupOpen] = useState(false);",
        "const [isRequestGroupOpen, setIsRequestGroupOpen] = useState(false);\n  const [isServiceRequestGroupOpen, setIsServiceRequestGroupOpen] = useState(false);"
    );
}

// 3. Fix the SECOND "QUẢN LÝ YÊU CẦU" block (around line 495)
// Find the index of the second occurrence of "QUẢN LÝ YÊU CẦU"
const parts = content.split('📦 QUẢN LÝ YÊU CẦU');
if (parts.length > 2) {
    // The second occurrence is between parts[1] and parts[2]
    // Let's just use string replace on a specific substring that identifies the second one.
    
    // The second one is inside `QUẢN LÝ YÊU CẦU DỊCH VỤ`
    let serviceBlockStart = content.indexOf('QUẢN LÝ YÊU CẦU DỊCH VỤ');
    if (serviceBlockStart !== -1) {
        let blockToModify = content.substring(serviceBlockStart);
        
        // Fix the onClick
        blockToModify = blockToModify.replace(
            /onClick=\{\(\) => setIsRequestGroupOpen\(!isRequestGroupOpen\)\}/,
            "onClick={() => setIsServiceRequestGroupOpen(!isServiceRequestGroupOpen)}"
        );
        
        // Fix the wrapper and arrow logic
        // Original: 
        // 📦 QUẢN LÝ YÊU CẦU
        // <span>{isRequestGroupOpen ? '▼' : '▲'}</span>
        blockToModify = blockToModify.replace(
            /📦 QUẢN LÝ YÊU CẦU\s*<span>\{isRequestGroupOpen \? '▼' : '▲'\}<\/span>/,
            "<span>📦 QUẢN LÝ YÊU CẦU</span>\n                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen ? '▲' : '▼'}</span>"
        );
        
        // Fix the condition to show children
        // Original: {isRequestGroupOpen && (
        blockToModify = blockToModify.replace(
            /\{isRequestGroupOpen && \(/,
            "{isServiceRequestGroupOpen && ("
        );
        
        content = content.substring(0, serviceBlockStart) + blockToModify;
    }
}

fs.writeFileSync('frontend/src/components/Dashboard.jsx', content);
console.log('Fixed everything safely');
