const fs = require('fs');
let c = fs.readFileSync('src/components/BookingForm.jsx', 'utf8');

// 1. Imports
c = c.replace(/import \{ ChevronRight, User, Phone, Tag, ChevronDown, Check \} from 'lucide-react';/, 
  "import { ChevronRight, User, Phone, Tag, ChevronDown, Check, X, Calendar } from 'lucide-react';");

// 2. States & Destinations Fetch
c = c.replace(/const \[expandedSections, setExpandedSections\] = useState\(\{ transport: true, price: true \}\);/, 
  \`const [showPassengerModal, setShowPassengerModal] = useState(false);
    const [passengerDetails, setPassengerDetails] = useState({});
    const [expandedSections, setExpandedSections] = useState({ transport: true, price: true });
    
    const [destinations, setDestinations] = useState([]);
    useEffect(() => {
        axios.get('http://localhost:5000/api/destinations')
            .then(res => setDestinations(res.data?.data || []))
            .catch(err => console.log(err));
    }, []);\`);

// 3. Update Passenger Logic
const updatePassengerLogic = \`
    const updatePassenger = (type, idx, field, value) => {
        const key = \\\`\\\${type}_\\\${idx}\\\`;
        setPassengerDetails(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };
    
    // Calculate single rooms from passengerDetails
    let singleRoomsCount = 0;
    if (pax.adults > 0) {
        for (let i = 0; i < pax.adults; i++) {
            if (passengerDetails[\\\`adults_\\\${i}\\\`]?.singleRoom) {
                singleRoomsCount++;
            }
        }
    }
\`;

c = c.replace(/const totalPax = pax\.adults \+ pax\.children \+ pax\.toddlers \+ pax\.infants;/, updatePassengerLogic + '\n    const totalPax = pax.adults + pax.children + pax.toddlers + pax.infants;');

// 4. Transport & Price Logic
const calcLogic = \`
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

    const daysArr = parsedDesign?.days || parsedDesign?.itineraryDays || tour?.itineraries || [];
    const firstDay = daysArr[0];
    const lastDay = daysArr[daysArr.length - 1];

    const safeDestinations = Array.isArray(destinations) ? destinations : [];
    const startLocD = safeDestinations.find(x => String(x.destination_id) === String(firstDay?.start_destination_id))?.destination_name || 'Điểm đi';
    const endLocD = safeDestinations.find(x => String(x.destination_id) === String(firstDay?.end_destination_id))?.destination_name || 'Điểm đến';
    const startLocR = safeDestinations.find(x => String(x.destination_id) === String(lastDay?.start_destination_id))?.destination_name || 'Điểm đi';
    const endLocR = safeDestinations.find(x => String(x.destination_id) === String(lastDay?.end_destination_id))?.destination_name || 'Điểm đến';

    const timeStartD = parsedDesign?.costConfig?.transportTimes?.startD || '05:00';
    const timeEndD = parsedDesign?.costConfig?.transportTimes?.endD || '07:00';
    const timeStartR = parsedDesign?.costConfig?.transportTimes?.startR || '07:00';
    const timeEndR = parsedDesign?.costConfig?.transportTimes?.endR || '05:00';

    const title = isCustom ? \\\`✨ Tour thiết kế riêng: \\\${quote?.destination || ''}\\\` : tour?.tour_name;
    const basePrice = isCustom ? (quote?.quoted_price || quote?.quote_price) : tour?.base_price;
    
    let finalImageUrl = 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=500';
    if (tour?.image_url) {
        if (tour.image_url.startsWith('http')) {
            finalImageUrl = tour.image_url;
        } else {
            let imagePath = tour.image_url.startsWith('/') ? tour.image_url.substring(1) : tour.image_url;
            if (!imagePath.startsWith('uploads/')) {
                imagePath = \\\`uploads/\\\${imagePath}\\\`;
            }
            finalImageUrl = \\\`http://localhost:5000/\\\${imagePath}\\\`;
        }
    }
    const bgImage = isCustom
        ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600'
        : finalImageUrl;

    // Calculate Prices
    const adultPrice = basePrice || 0;
    let childPrice = isCustom ? adultPrice : adultPrice * 0.75;
    let toddlerPrice = isCustom ? adultPrice : adultPrice * 0.5;
    let infantPrice = 0;
    let singleSupp = 0;

    if (!isCustom && parsedDesign) {
        const ageMult = parsedDesign?.costConfig?.ageMultiplier || {};
        const getPrice = (type) => {
            const s = ageMult[type];
            if (!s) return adultPrice * (type === 'child' ? 0.75 : type === 'toddler' ? 0.5 : 0);
            return (adultPrice * (s.percent / 100)) + Number(s.fixed_surcharge || 0);
        };
        childPrice = getPrice('child');
        toddlerPrice = getPrice('toddler');
        infantPrice = getPrice('infant');
        singleSupp = parsedDesign?.costConfig?.variable?.singleSupplement || 0;
    }
\`;

c = c.replace(/    const title = isCustom \? \`✨ Tour thiết kế riêng/, calcLogic + '\n    const title = isCustom ? \`✨ Tour thiết kế riêng');

c = c.replace(/const totalAmount = \(pax\.adults \* adultPrice\) \+ \(pax\.children \* childPrice\) \+ \(pax\.toddlers \* toddlerPrice\) \+ \(pax\.infants \* infantPrice\);/, 'const totalAmount = (pax.adults * adultPrice) + (pax.children * childPrice) + (pax.toddlers * toddlerPrice) + (pax.infants * infantPrice) + (singleRoomsCount * singleSupp);');

// 5. Validation Logic
const validLogic = \`
    const isFormValid = privacyConsent && contactInfo.fullName.trim() !== '' && contactInfo.email.trim() !== '' && contactInfo.phone.trim() !== '';

    const submitBooking = async (e) => {
        e.preventDefault();
        if (!isFormValid) {
            alert('Vui lòng nhập đầy đủ thông tin liên hệ và đồng ý với chính sách!');
            return;
        }
\`;

c = c.replace(/    const submitBooking = async \(e\) => \{\s+e\.preventDefault\(\);\s+if \(!privacyConsent\) \{\s+alert\('Vui lòng đồng ý với chính sách bảo vệ dữ liệu cá nhân!'\);\s+return;\s+\}/, validLogic);

c = c.replace(/disabled=\{!privacyConsent \|\| isSubmitting\}/, 'disabled={!isFormValid || isSubmitting}');
c = c.replace(/background: privacyConsent \? '#dc2626' : '#f1f5f9'/, "background: isFormValid ? '#dc2626' : '#f1f5f9'");
c = c.replace(/color: privacyConsent \? '#fff' : '#94a3b8'/, "color: isFormValid ? '#fff' : '#94a3b8'");
c = c.replace(/cursor: privacyConsent \? 'pointer' : 'not-allowed'/, "cursor: isFormValid ? 'pointer' : 'not-allowed'");
c = c.replace(/\{isSubmitting \? 'Đang xử lý\.\.\.' : \(privacyConsent \? 'Xác Nhận Đặt Tour' : 'Chưa nhập đủ thông tin'\)\}/, "{isSubmitting ? 'Đang xử lý...' : (isFormValid ? 'Xác Nhận Đặt Tour' : 'Chưa nhập đủ thông tin')}");


// 6. Nhập thông tin onClick & Transport Sidebar replace & SingleSupp text
c = c.replace(/<div style=\{\{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '24px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' \}\}>/g, 
  "<div onClick={() => setShowPassengerModal(true)} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '24px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>");

c = c.replace(/<span>Phụ thu phòng đơn<\/span>\s*<span>0đ<\/span>/, '<span>Phụ thu phòng đơn</span><span>{singleRoomsCount > 0 ? \`\${singleRoomsCount} x \${formatCurrency(singleSupp)}\` : formatCurrency(singleSupp) + " / phòng"}</span>');

const searchStr = \`                                <div>
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
                                </div>\`;

const transportJSX = \`
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
                                </div>\`;

c = c.replace(searchStr, transportJSX);

// 7. Inject Modal
const modalJSX = \`
            {/* Passenger Info Modal */}
            {showPassengerModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
                    <div style={{ background: '#f8fafc', width: '100%', maxWidth: '800px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: '20px', marginBottom: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        
                        {/* Modal Header */}
                        <div style={{ background: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                            <h2 style={{ fontSize: '20px', color: '#0f172a', margin: 0 }}>Thông tin hành khách</h2>
                            <button onClick={() => setShowPassengerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px' }}>
                            <div style={{ background: '#eff6ff', color: '#1e40af', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' }}>
                                Phòng đơn dành cho khách hàng từ 12 tuổi trở lên, giá phòng đơn là: <strong style={{color: '#3b82f6'}}>{formatCurrency(singleSupp)} / phòng</strong>
                            </div>

                            {['adults', 'children', 'toddlers', 'infants'].map(type => {
                                if (pax[type] === 0) return null;
                                const typeName = type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : type === 'toddlers' ? 'Trẻ nhỏ' : 'Em bé';
                                const typeDesc = type === 'adults' ? 'Người lớn sinh trước ngày 04/09/2014' : type === 'children' ? 'Trẻ em sinh từ 05/09/2014 đến 04/09/2021' : type === 'toddlers' ? 'Trẻ nhỏ sinh từ 05/09/2021 đến 04/09/2024' : 'Em bé sinh từ 05/09/2024';
                                
                                return (
                                    <div key={type} style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                            <User size={18} color="#3b82f6" />
                                            <strong style={{ fontSize: '16px', color: '#2563eb' }}>{typeName} <span style={{fontSize: '13px', fontWeight: 'normal', color: '#64748b'}}>({typeDesc})</span></strong>
                                        </div>

                                        {Array.from({ length: pax[type] }).map((_, idx) => {
                                            const pKey = \\\`\\\${type}_\\\${idx}\\\`;
                                            const pData = passengerDetails[pKey] || {};
                                            const daysList = Array.from({length: 31}, (_, i) => i + 1);
                                            const monthsList = Array.from({length: 12}, (_, i) => i + 1);
                                            const currentYear = new Date().getFullYear();
                                            const yearsList = Array.from({length: 100}, (_, i) => currentYear - i);

                                            return (
                                            <div key={idx} style={{ display: 'flex', gap: '16px', marginBottom: '24px', paddingBottom: idx !== pax[type]-1 ? '24px' : '0', borderBottom: idx !== pax[type]-1 ? '1px dashed #e2e8f0' : 'none' }}>
                                                <strong style={{ fontSize: '16px', color: '#0f172a', paddingTop: '8px' }}>#{idx + 1}</strong>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Họ tên <span style={{color: '#dc2626'}}>*</span></label>
                                                        <input type="text" value={pData.name || ''} onChange={e => updatePassenger(type, idx, 'name', e.target.value)} placeholder="VD: Nguyễn Văn A" style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: 'none', background: '#f8fafc', fontSize: '15px', outline: 'none' }} />
                                                    </div>
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Ngày sinh <span style={{color: '#dc2626'}}>*</span></label>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                                <select value={pData.dobDay || ''} onChange={e => updatePassenger(type, idx, 'dobDay', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', appearance: 'none' }}>
                                                                    <option value="">Ngày</option>
                                                                    {daysList.map(d => <option key={d} value={d}>{d}</option>)}
                                                                </select>
                                                                <select value={pData.dobMonth || ''} onChange={e => updatePassenger(type, idx, 'dobMonth', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', appearance: 'none' }}>
                                                                    <option value="">Tháng</option>
                                                                    {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                                                                </select>
                                                                <select value={pData.dobYear || ''} onChange={e => updatePassenger(type, idx, 'dobYear', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', appearance: 'none' }}>
                                                                    <option value="">Năm</option>
                                                                    {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Giới tính <span style={{color: '#dc2626'}}>*</span></label>
                                                            <select value={pData.gender || 'Nam'} onChange={e => updatePassenger(type, idx, 'gender', e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: 'none', background: '#f8fafc', fontSize: '15px', outline: 'none', appearance: 'none' }}>
                                                                <option value="Nam">Nam</option>
                                                                <option value="Nữ">Nữ</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {type === 'adults' && (
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Số điện thoại</label>
                                                                <input type="tel" value={pData.phone || ''} onChange={e => updatePassenger(type, idx, 'phone', e.target.value)} placeholder="Ví dụ: 0901234567" style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: 'none', background: '#f8fafc', fontSize: '15px', outline: 'none' }} />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
                                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Phòng đơn</label>
                                                                <div onClick={() => updatePassenger(type, idx, 'singleRoom', !pData.singleRoom)} style={{ width: '44px', height: '24px', background: pData.singleRoom ? '#3b82f6' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                                                                    <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: pData.singleRoom ? '22px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', transition: 'left 0.2s' }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ background: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: '16px', borderTop: '1px solid #e2e8f0' }}>
                            <button onClick={() => setShowPassengerModal(false)} style={{ padding: '12px 32px', borderRadius: '24px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', minWidth: '160px' }}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
\`;

c = c.replace('            <CustomerFooter />\\n        </div>', modalJSX + '\\n            <CustomerFooter />\\n        </div>');

// Add ErrorBoundary
const eb = \`
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#b91c1c' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.info && this.state.info.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
\`;

c = c.replace('const BookingForm = () => {', eb + '\\nconst BookingFormInner = () => {');
c = c.replace('export default BookingForm;', 'const BookingForm = () => <ErrorBoundary><BookingFormInner /></ErrorBoundary>;\\nexport default BookingForm;');

fs.writeFileSync('src/components/BookingForm.jsx', c);
console.log('Restored fully');
