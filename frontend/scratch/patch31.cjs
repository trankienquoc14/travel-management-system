const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

const targetStr = `                        </div>
                    </div>

                    </div>
                </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>`;

const replaceStr = `                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>`;

c = c.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
console.log('Fixed div');
