const fs = require('fs');
let c = fs.readFileSync('src/components/BookingForm.jsx', 'utf8');

const importDestinations = `    const [destinations, setDestinations] = useState([]);
    
    useEffect(() => {
        axios.get('http://localhost:5000/api/destinations')
            .then(res => setDestinations(res.data))
            .catch(err => console.log(err));
    }, []);`;

// Insert after expandedSections state
c = c.replace(/const \[expandedSections, setExpandedSections\] = useState\(.*?\}\);/s, 
  "const [expandedSections, setExpandedSections] = useState({ transport: true, price: true });\n" + importDestinations);


const calcLogic = `
    const parsedDesign = tour?.design_data ? (typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : tour.design_data) : null;
    
    let depDateStr = 'Đang cập nhật';
    let retDateStr = 'Đang cập nhật';
    if (tour?.departures && bookingData.departureId) {
        const dep = tour.departures.find(d => d.departure_id === bookingData.departureId);
        if (dep) {
            const d = new Date(dep.departure_date);
            depDateStr = d.toLocaleDateString('vi-VN');
            const durationCount = parsedDesign?.days?.length || parsedDesign?.itineraryDays?.length || tour?.itineraries?.length || 0;
            if (durationCount > 0) {
                const r = new Date(d);
                r.setDate(r.getDate() + durationCount - 1);
                retDateStr = r.toLocaleDateString('vi-VN');
            }
        }
    } else if (isCustom && quote) {
        depDateStr = quote.start_date ? new Date(quote.start_date).toLocaleDateString('vi-VN') : 'Đang cập nhật';
        retDateStr = quote.end_date ? new Date(quote.end_date).toLocaleDateString('vi-VN') : 'Đang cập nhật';
    }

    const transportType = parsedDesign?.costConfig?.selectedTransport?.service_type;
    const isFlight = transportType === 'Vé máy bay';
    const transportIcon = isFlight ? '✈️' : '🚌';
    const transportName = isFlight ? (parsedDesign?.costConfig?.selectedTransport?.provider_name || 'Máy bay') : 'Xe khách';

    const startLocD = destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.start_destination_id))?.destination_name || 'Điểm đi';
    const endLocD = destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.end_destination_id))?.destination_name || 'Điểm đến';
    const startLocR = destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[parsedDesign.days.length - 1]?.start_destination_id))?.destination_name || 'Điểm đi';
    const endLocR = destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[parsedDesign.days.length - 1]?.end_destination_id))?.destination_name || 'Điểm đến';

    const timeStartD = parsedDesign?.costConfig?.transportTimes?.startD || '05:00';
    const timeEndD = parsedDesign?.costConfig?.transportTimes?.endD || '07:00';
    const timeStartR = parsedDesign?.costConfig?.transportTimes?.startR || '07:00';
    const timeEndR = parsedDesign?.costConfig?.transportTimes?.endR || '05:00';
`;

c = c.replace(/    const title = isCustom \? `✨ Tour thiết kế riêng/, calcLogic + '\n    const title = isCustom ? `✨ Tour thiết kế riêng');

const transportJSX = `
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Ngày đi: <strong style={{color: '#0f172a'}}>{depDateStr}</strong></span>
                                        <span style={{ color: '#ea580c', fontWeight: '600' }}>{transportIcon} {transportName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '16px' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>{timeStartD}</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{startLocD}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block' }}>{timeEndD}</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{endLocD}</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px dotted #e2e8f0', margin: '12px 0' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Ngày về: <strong style={{color: '#0f172a'}}>{retDateStr}</strong></span>
                                        <span style={{ color: '#ea580c', fontWeight: '600' }}>{transportIcon} {transportName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>{timeStartR}</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{startLocR}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block' }}>{timeEndR}</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{endLocR}</span>
                                        </div>
                                    </div>
                                </div>`;

const searchStr = `                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Ngày đi: <strong style={{color: '#0f172a'}}>10/09/2026</strong></span>
                                        <span style={{ color: '#ea580c', fontWeight: '600' }}>🚌 Xe khách</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '16px' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>05:00</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>TP. Hồ Chí Minh</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block' }}>07:00</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>Điểm đến</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px dotted #e2e8f0', margin: '12px 0' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Ngày về: <strong style={{color: '#0f172a'}}>13/09/2026</strong></span>
                                        <span style={{ color: '#ea580c', fontWeight: '600' }}>🚌 Xe khách</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>07:00</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>Điểm đến</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block' }}>05:00</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>TP. Hồ Chí Minh</span>
                                        </div>
                                    </div>
                                </div>`;

if (c.indexOf(searchStr) === -1) {
    console.log("Could not find transport hardcode! Index: ", c.indexOf("Ngày đi: <strong"));
} else {
    c = c.replace(searchStr, transportJSX);
}

fs.writeFileSync('src/components/BookingForm.jsx', c);
console.log('Fixed transport');
