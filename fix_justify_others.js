const fs = require('fs');
['frontend/src/components/DriverWorkspace.jsx', 'frontend/src/components/GuideWorkspace.jsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/justify: 'space-between'/g, "justifyContent: 'space-between'");
    fs.writeFileSync(file, content);
});
console.log('Fixed driver and guide workspaces');
