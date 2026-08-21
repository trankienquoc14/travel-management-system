const fs = require('fs');
const fPath = 'src/components/ManagerTourApproval.jsx';
let content = fs.readFileSync(fPath, 'utf8');

const targetStr1 = `                        {selectedFixedTour.image_url && (
                            <div style={{ marginBottom: '16px' }}>
                                <img src={selectedFixedTour.image_url.startsWith('/') ? 'http://localhost:5002' + selectedFixedTour.image_url : selectedFixedTour.image_url} alt="Cover" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            </div>
                        )}
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>`;

const newStr1 = `                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
                            {selectedFixedTour.image_url && (
                                <div style={{ marginBottom: '16px' }}>
                                    <img src={selectedFixedTour.image_url.startsWith('/') ? 'http://localhost:5002' + selectedFixedTour.image_url : selectedFixedTour.image_url} alt="Cover" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                </div>
                            )}`;

if (content.includes(targetStr1)) {
    // Replace all occurrences because there are two Modals (one for Pending, one for Approved/Rejected)
    content = content.replaceAll(targetStr1, newStr1);
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Fixed ManagerTourApproval image position!');
} else {
    console.log('Target string not found in ManagerTourApproval.');
}
