const fs = require('fs');
let c = fs.readFileSync('src/components/BookingForm.jsx', 'utf8');

c = c.replace(/import \{ ChevronRight, User, Phone, Tag, ChevronDown, Check \} from 'lucide-react';/g, 
  "import { ChevronRight, User, Phone, Tag, ChevronDown, Check } from 'lucide-react';\nimport CustomerNavbar from './CustomerNavbar';\nimport CustomerFooter from './CustomerFooter';");

const headerStart = c.indexOf('{/* Navbar / Header */}');
const headerEnd = c.indexOf('{/* Cột trái: Form nhập liệu */}');
if(headerStart > -1 && headerEnd > -1) {
    const oldHeader = c.substring(headerStart - 20, headerEnd);
    c = c.replace(oldHeader, '<CustomerNavbar />\n\n            <div style={{ maxWidth: \'1200px\', margin: \'0 auto\', padding: \'32px 24px\', display: \'flex\', gap: \'32px\', alignItems: \'flex-start\' }}>\n                \n                {/* Cột trái: Form nhập liệu */}');
}

const footerEnd = c.lastIndexOf('</div>\n        </div>\n    );');
if (footerEnd > -1) {
    c = c.substring(0, footerEnd) + '</div>\n            </div>\n            <CustomerFooter />\n        </div>\n    );';
}

fs.writeFileSync('src/components/BookingForm.jsx', c);
console.log('Replaced header and footer');
