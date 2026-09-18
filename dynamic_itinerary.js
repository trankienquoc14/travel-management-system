const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = `return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình. (Bạn vui lòng xem trong file PDF hoặc liên hệ tư vấn viên).</div>;`;

const newStr = `                                    const [remoteDays, setRemoteDays] = useState(null);
                                    const [loadingRemote, setLoadingRemote] = useState(false);
                                    
                                    useEffect(() => {
                                        const fetchRemote = async () => {
                                            if (remoteDays !== null || loadingRemote) return;
                                            setLoadingRemote(true);
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
                                            }
                                        };
                                        fetchRemote();
                                    }, []);
                                    
                                    if (remoteDays === null) return <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải dữ liệu lịch trình...</div>;
                                    if (remoteDays.length > 0) days = remoteDays;
                                    else return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình. (Bạn vui lòng xem trong file PDF hoặc liên hệ tư vấn viên).</div>;`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Dynamic fetch added');
