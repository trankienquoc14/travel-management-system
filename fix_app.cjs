const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// fix double import
code = code.replace(/import ErrorBoundary from '\.\/components\/ErrorBoundary';\nimport ErrorBoundary from '\.\/components\/ErrorBoundary';/g, "import ErrorBoundary from './components/ErrorBoundary';");

// check if there are 3 imports
code = code.replace(/import ErrorBoundary from '\.\/components\/ErrorBoundary';\nimport ErrorBoundary from '\.\/components\/ErrorBoundary';/g, "import ErrorBoundary from './components/ErrorBoundary';");

fs.writeFileSync('frontend/src/App.jsx', code);
