const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx',('utf8');
code = code.replace(/import HomePage from '\\.\\/components\\/HomePage';/, \"import HomePage from './components/HomePage';\nimport TourListPage from './components/TourListPage';\");
code = code.replace(/,Route path=\"\\/home\" element={<HomePage \\/>} \\/>/, \"<Route path=\"/home\" element={<HomePage />} />\n        <Route path=\"/tours\" element={<TourListPage />} />\");
fs.writeFileSync('frontend/src/App.jsx', code);
