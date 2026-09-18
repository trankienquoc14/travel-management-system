const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Remove duplicate timelines
// There is `{/* Timeline */}` twice before `{/* Visual Timeline */}`
const visualTimelineIdx = code.indexOf('{/* Visual Timeline */}');
if (visualTimelineIdx !== -1) {
    // Find the first `{/* Timeline */}`
    const firstTimelineIdx = code.indexOf('{/* Timeline */}');
    if (firstTimelineIdx !== -1 && firstTimelineIdx < visualTimelineIdx) {
        // Cut out everything from firstTimelineIdx up to visualTimelineIdx
        code = code.substring(0, firstTimelineIdx) + code.substring(visualTimelineIdx);
    }
}

// 2. Remove dark mode
// Change background: '#222' to background: '#ffffff', color: '#f8fafc' to color: '#0f172a'
// I will just do a global replace for the dark mode container styles.

// Container:
// <div style={{ background: '#222', color: '#f8fafc', borderRadius: '12px', padding: '20px', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', width: '100%', letterSpacing: '0.5px' }}>
// replace with:
// <div style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', width: '100%', letterSpacing: '0.5px' }}>
code = code.replace(
    /background: '#222', color: '#f8fafc'/g,
    `background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0'`
);

// <strong style={{ color: '#fff' }}> -> <strong style={{ color: '#0f172a' }}>
code = code.replace(/<strong style=\{\{ color: '#fff' \}\}>/g, `<strong style={{ color: '#0f172a' }}>`);

// <span style={{ fontWeight: 'bold', color: '#fff' }}> -> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>
code = code.replace(/<span style=\{\{ fontWeight: 'bold', color: '#fff' \}\}>/g, `<span style={{ fontWeight: 'bold', color: '#0f172a' }}>`);

// <span style={{ color: '#fff' }}> -> <span style={{ color: '#0f172a' }}>
code = code.replace(/<span style=\{\{ color: '#fff' \}\}>/g, `<span style={{ color: '#0f172a' }}>`);

// <div style={{ borderTop: '1px dashed #4a4a4a' -> borderTop: '1px dashed #cbd5e1'
code = code.replace(/borderTop: '1px dashed #4a4a4a'/g, `borderTop: '1px dashed #cbd5e1'`);

// <div style={{ borderTop: '1px solid #4a4a4a' -> borderTop: '1px dashed #cbd5e1'
code = code.replace(/borderTop: '1px solid #4a4a4a'/g, `borderTop: '1px dashed #cbd5e1'`);

// <div style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right', color: '#fff' }}> -> color: '#059669' (for TOTAL)
code = code.replace(/<div style=\{\{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right', color: '#fff' \}\}>/g, `<div style={{ fontSize: '20px', fontWeight: '900', whiteSpace: 'nowrap', textAlign: 'right', color: '#059669' }}>`);

// Just in case it was without color: '#fff':
code = code.replace(/<div style=\{\{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right' \}\}>/g, `<div style={{ fontSize: '20px', fontWeight: '900', whiteSpace: 'nowrap', textAlign: 'right', color: '#059669' }}>`);


// Fix the `{/* THIS WAS {pmText} but in JS I need it to be defined */}` or whatever I had
// Wait, I fixed it using `(() => {})()` so it's correct.

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Successfully applied final UI fixes');
