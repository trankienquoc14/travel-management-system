const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Move id="ticket-content-to-pdf" to a new wrapper and loop
const regexTicket = /<div id="ticket-content-to-pdf" className="print-modal" style=\{\{ position: 'relative'([\s\S]*?)<!-- \/Ticket -->\s*<\/div>/;

const replacementTicket = `<div id="ticket-content-to-pdf" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center' }}>
                            {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => (
                                <div key={idx} className="print-modal" style={{ position: 'relative'$1
                                
                                {/* Passenger Name override */}
                                {(() => {
                                    // We need to inject the passenger name dynamically in the JSX, but we are doing regex replace.
                                    // So we'll replace the customer_name inside the map below.
                                    return null;
                                })()}
                                </div>
                            ))}
                        </div>`;
// Wait, I can't just regex replace like this if I want to change inner variables.
// Let's do it carefully.
