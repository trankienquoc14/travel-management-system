const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const stateStr = `const [maintData, setMaintData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });`;
  
const stateInject = `const [maintData, setMaintData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async (vid) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(\`\${GATEWAY_URL}/api/tours/fleet/staff/vehicles/\${vid}/history\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.data && res.data.success) {
        setVehicleHistory(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };`;

// Replace the multiline state definition
const idx = c.indexOf('const [maintData, setMaintData] = useState({');
if (idx !== -1) {
    const endIdx = c.indexOf('});', idx) + 3;
    const target = c.substring(idx, endIdx);
    c = c.replace(target, stateInject);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Successfully injected fetchHistory");
} else {
    console.log("Could not find setMaintData");
}
