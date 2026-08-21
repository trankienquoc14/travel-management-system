const fs = require('fs');
const fPath = 'server.js';
let content = fs.readFileSync(fPath, 'utf8');
if (!content.includes('express.static')) {
    content = content.replace(
        'app.use(express.json());',
        "app.use(express.json());\napp.use('/uploads', express.static(path.join(__dirname, '../../shared-uploads')));"
    );
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Added static files middleware!');
} else {
    console.log('Already serves static files');
}
