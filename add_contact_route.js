const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Add import
const importToAdd = "import ContactPage from './components/ContactPage';\n";
code = code.replace("import ArticlePage from './components/ArticlePage'; // Trang B", importToAdd + "import ArticlePage from './components/ArticlePage'; // Trang B");

// Add route
const routeToAdd = '<Route path="/contact" element={<ContactPage />} />\n        ';
code = code.replace('<Route path="/services" element={<ServicesPage />} />', '<Route path="/services" element={<ServicesPage />} />\n        ' + routeToAdd);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
console.log('Added ContactPage route to App.jsx');
