const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'StaffFixedTourDesigner.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Change formatMoneyLocal definition
content = content.replace(
    /export const formatMoneyLocal = \(amount\) => \{\s*if \(isNaN\(amount\) \|\| amount === null \|\| amount === undefined\) return '0';\s*return Number\(amount\)\.toLocaleString\('vi-VN'\);\s*\};/g,
    `export const formatMoneyLocal = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
};`
);

// Remove hardcoded ' đ' and 'đ' after formatMoneyLocal
content = content.replace(/\{formatMoneyLocal\(([^)]+)\)\}\s*đ/g, '{formatMoneyLocal($1)}');
content = content.replace(/\{formatMoneyLocal\(([^)]+)\)\}đ/g, '{formatMoneyLocal($1)}');

// Also remove them when used like formatMoneyLocal(...) + ' đ'
content = content.replace(/formatMoneyLocal\(([^)]+)\)\s*\+\s*' đ'/g, 'formatMoneyLocal($1)');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Done formatMoneyLocal update in StaffFixedTourDesigner.jsx');
