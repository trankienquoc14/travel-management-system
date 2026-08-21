const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'TourBuilder', 'DayCard.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

const oldLogic = `                {day.activities && day.activities.map((act, aIndex) => (
                    <div key={aIndex} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                        <select 
                            value={act.type || 'Tham quan'} `;

const newLogic = `                {day.activities && day.activities.map((act, aIndex) => (
                    <div 
                        key={aIndex} 
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', aIndex);
                            e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            if (draggedIndex === aIndex || isNaN(draggedIndex)) return;
                            
                            const newDays = [...days];
                            const activities = [...newDays[dIndex].activities];
                            const draggedItem = activities.splice(draggedIndex, 1)[0];
                            activities.splice(aIndex, 0, draggedItem);
                            newDays[dIndex].activities = activities;
                            setDays(newDays);
                        }}
                        style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px', cursor: 'grab' }}
                    >
                        <div style={{ color: '#94a3b8', cursor: 'grab', padding: '0 5px' }}>☰</div>
                        <select 
                            value={act.type || 'Tham quan'} `;

content = content.replace(oldLogic, newLogic);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Updated DayCard with drag and drop');
