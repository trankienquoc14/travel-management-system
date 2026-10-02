const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes("['adults', 'children', 'toddlers']")) {
                results.push(file);
            }
        }
    });
    return results;
}
console.log(walk('frontend/src'));
