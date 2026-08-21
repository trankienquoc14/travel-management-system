const fs = require('fs');

const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let c = fs.readFileSync(fPath, 'utf8');

c = c.replace(
    'const [transportServices, setTransportServices] = useState([]);',
    'const [transportServices, setTransportServices] = useState([]);\n    const [allServices, setAllServices] = useState([]);'
);

c = c.replace(
    'const transports = res.data.data.filter(s => s.service_type === \'Phương tiện\' || (s.service_name && s.service_name.toLowerCase().includes(\'xe\')));',
    'setAllServices(res.data.data);\n                const transports = res.data.data.filter(s => s.service_type === \'Phương tiện\' || (s.service_name && s.service_name.toLowerCase().includes(\'xe\')));'
);

c = c.replace(
    '<TimelineBuilder \n                    days={days} \n                    setDays={setDays} \n                    destinations={destinations} \n                />',
    '<TimelineBuilder \n                    days={days} \n                    setDays={setDays} \n                    destinations={destinations} \n                    allServices={allServices}\n                />'
);

// wait, the TimelineBuilder component usage doesn't have newlines like that. Let's do a more robust replace for TimelineBuilder
c = c.replace(
    /destinations=\{destinations\}\s*\/>/g,
    'destinations={destinations}\n                    allServices={allServices}\n                />'
);

fs.writeFileSync(fPath, c, 'utf8');
console.log('Fixed allServices in StaffFixedTourDesigner.jsx');
