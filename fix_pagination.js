const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const oldMap = `{Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => (
                                <div key={idx} className={\`print-modal \${idx > 0 && idx % 2 === 0 ? 'html2pdf__page-break' : ''}\`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', width: '100%', marginBottom: '24px' }}>`;

const newMap = `{Array.from({ length: ticketBooking.num_people || 1 }).reduce((result, _, idx, array) => {
                                if (idx % 2 === 0) result.push(array.slice(idx, idx + 2));
                                return result;
                            }, []).map((pair, pageIndex, allPages) => (
                                <div key={pageIndex} className={pageIndex < allPages.length - 1 ? 'html2pdf__page-break' : ''} style={{ width: '100%', pageBreakAfter: pageIndex < allPages.length - 1 ? 'always' : 'auto' }}>
                                    {pair.map((_, i) => {
                                        const idx = pageIndex * 2 + i;
                                        return (
                                            <div key={idx} className="print-modal" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', width: '100%', marginBottom: '24px' }}>`;

code = code.replace(oldMap, newMap);

// The problem is we need to close the `</div>` for the pair map AND the pair wrapper.
// So let's look at the end of the ticket map.
const oldEndMap = `                            </div>
                            ))}
                        </div>`;

const newEndMap = `                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>`;

code = code.replace(oldEndMap, newEndMap);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed pagination wrapper');
