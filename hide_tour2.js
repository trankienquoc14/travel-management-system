const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/CustomerNavbar.jsx', 'utf8');

const regexLi = /({\/\*\s*4\.\s*Tự thiết kế Tour\s*\*\/}\s*)<li\s+className=\{activeTab === 'build-tour' \? 'active' : ''\}([\s\S]*?)✨ Tự thiết kế Tour\s*<\/li>/;

code = code.replace(regexLi, (match, p1, p2) => {
    return p1 + "{user && (\n                    <li className={activeTab === 'build-tour' ? 'active' : ''}" + p2 + "✨ Tự thiết kế Tour\n                    </li>\n                    )}";
});

fs.writeFileSync('frontend/src/components/CustomerNavbar.jsx', code, 'utf8');
console.log('Done rewriting');
