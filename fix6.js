const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

const searchBlock = `              {(isTourManager || isAdmin) && (
                <>
                  <li 
                    onClick={() => setIsRequestGroupOpen(!isRequestGroupOpen)}
                    style={{ 
                      cursor: 'pointer', `;

const replaceBlock = `              {(isTourManager || isAdmin) && (
                <>
                  <li 
                    onClick={() => setIsServiceRequestGroupOpen(!isServiceRequestGroupOpen)}
                    style={{ 
                      cursor: 'pointer', `;

if (content.includes(searchBlock)) {
    content = content.replace(searchBlock, replaceBlock);
    fs.writeFileSync('frontend/src/components/Dashboard.jsx', content);
    console.log('Fixed onClick');
} else {
    console.log('Not found');
}
