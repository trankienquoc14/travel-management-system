node -e "
const fs = require('fs');
const logs = fs.readFileSync('C:\\\\Users\\\\ASUS\\\\.gemini\\\\antigravity\\\\brain\\\\2fa6572d-6fa5-4f11-9fcf-46de7aa3e2b3\\\\.system_generated\\\\logs\\\\transcript_full.jsonl', 'utf8');

let lastIdx = -1;
let currentIdx = logs.indexOf('const BookingForm = () => {');
while (currentIdx !== -1) {
    lastIdx = currentIdx;
    currentIdx = logs.indexOf('const BookingForm = () => {', currentIdx + 1);
}

if (lastIdx !== -1) {
    const lineStart = logs.lastIndexOf('\n', lastIdx);
    const lineEnd = logs.indexOf('\n', lastIdx);
    const line = logs.substring(lineStart + 1, lineEnd > -1 ? lineEnd : undefined);
    
    fs.writeFileSync('scratch/dump.json', line);
    console.log('Saved dump.json');
}
"