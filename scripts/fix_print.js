const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{ticketBooking && \(\s*<div className="no-print"/;

if (code.match(regex)) {
    code = code.replace(regex, '{ticketBooking && (\n                <div className="ticket-modal-wrapper"');
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed outer wrapper className');
} else {
    console.log('Regex did not match');
}
