const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Revert the previous dynamic_itinerary if it ran (it didn't run yet)

// 2. Add remoteDays and loadingRemote states to MyBookings
const stateTarget = `const [itineraryModalBooking, setItineraryModalBooking] = useState(null); // Modal Itinerary`;
const stateNew = `const [itineraryModalBooking, setItineraryModalBooking] = useState(null); // Modal Itinerary
    const [remoteDays, setRemoteDays] = useState(null);
    const [loadingRemote, setLoadingRemote] = useState(false);
    
    useEffect(() => {
        const fetchRemote = async () => {
            if (!itineraryModalBooking) return;
            
            // First check if it's already locally available in design_data or requirements
            let localDays = [];
            try {
                if (itineraryModalBooking.design_data) {
                    const parsed = typeof itineraryModalBooking.design_data === 'string' ? JSON.parse(itineraryModalBooking.design_data) : itineraryModalBooking.design_data;
                    if (parsed.itineraryDays) localDays = parsed.itineraryDays;
                } else if (itineraryModalBooking.requirements) {
                    const reqs = typeof itineraryModalBooking.requirements === 'string' ? JSON.parse(itineraryModalBooking.requirements) : itineraryModalBooking.requirements;
                    if (reqs.itinerary) localDays = reqs.itinerary;
                }
            } catch(e) {}
            
            if (localDays && localDays.length > 0) {
                setRemoteDays(localDays);
                setLoadingRemote(false);
                return;
            }
            
            // Fetch remotely
            setLoadingRemote(true);
            setRemoteDays(null);
            try {
                let tId = itineraryModalBooking.tour_id;
                if (!tId) {
                    const res1 = await axios.get(\`\${GATEWAY_URL}/api/tours\`);
                    const matched = res1.data.data.find(t => t.tour_name === itineraryModalBooking.tour_name);
                    if (matched) tId = matched.tour_id;
                }
                if (tId) {
                    const res2 = await axios.get(\`\${GATEWAY_URL}/api/tours/\${tId}\`);
                    if (res2.data.success && res2.data.data.itineraries) {
                        const fetched = res2.data.data.itineraries.map(it => ({
                            day: it.day_number,
                            title: it.title,
                            description: it.description,
                            activities: it.activities ? (typeof it.activities === 'string' ? JSON.parse(it.activities) : it.activities) : [],
                            meals: it.meals ? (typeof it.meals === 'string' ? JSON.parse(it.meals) : it.meals) : [],
                            accommodation: it.accommodation
                        }));
                        setRemoteDays(fetched);
                    } else {
                        setRemoteDays([]);
                    }
                } else {
                    setRemoteDays([]);
                }
            } catch(e) {
                setRemoteDays([]);
            } finally {
                setLoadingRemote(false);
            }
        };
        fetchRemote();
    }, [itineraryModalBooking]);`;

code = code.replace(stateTarget, stateNew);

// 3. Update the modal render logic to just use remoteDays and loadingRemote
const modalContentOld = `{(() => {
                                let days = [];
                                try {
                                    if (itineraryModalBooking.design_data) {
                                        const parsed = typeof itineraryModalBooking.design_data === 'string' ? JSON.parse(itineraryModalBooking.design_data) : itineraryModalBooking.design_data;
                                        if (parsed.itineraryDays) days = parsed.itineraryDays;
                                    } else if (itineraryModalBooking.requirements) {
                                        const reqs = typeof itineraryModalBooking.requirements === 'string' ? JSON.parse(itineraryModalBooking.requirements) : itineraryModalBooking.requirements;
                                        if (reqs.itinerary) days = reqs.itinerary;
                                    }
                                } catch(e) {}
                                
                                if (!days || days.length === 0) {
                                    return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình. (Bạn vui lòng xem trong file PDF hoặc liên hệ tư vấn viên).</div>;
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {days.map((day, idx) => (`;

const modalContentNew = `{(() => {
                                if (loadingRemote || remoteDays === null) return <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải dữ liệu lịch trình...</div>;
                                
                                const days = remoteDays;
                                if (!days || days.length === 0) {
                                    return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình. (Bạn vui lòng xem trong file PDF hoặc liên hệ tư vấn viên).</div>;
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {days.map((day, idx) => (`;

code = code.replace(modalContentOld, modalContentNew);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed hook placement');
