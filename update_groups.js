const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

// Add states
code = code.replace(
  'const [isSalesGroupOpen, setIsSalesGroupOpen] = useState(true);',
  `const [isRequestGroupOpen, setIsRequestGroupOpen] = useState(true);
  const [isTourGroupOpen, setIsTourGroupOpen] = useState(true);
  const [isBookingGroupOpen, setIsBookingGroupOpen] = useState(true);`
);

// Replace the UI block
const regex = /\{\/\*\s*2\.\s*KINH DOANH & ĐẶT TOUR[\s\S]*?<\/ul>\s*\)\}/;

// Wait, the block we want to replace ends with `</>\n                  )}\n                </>\n              )}` right before `VẬN HÀNH & NGUỒN LỰC TOUR`.
// Let's use string manipulation based on known markers.
