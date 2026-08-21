const fs = require('fs');

// 1. Fix ActivityItem.jsx
const actPath = 'src/components/TourBuilder/ActivityItem.jsx';
let actCode = fs.readFileSync(actPath, 'utf8');

actCode = actCode.replace(
    /const ActivityItem = \(\{ places, activities, disabled, onAdd \}\) => \{/,
    `const ActivityItem = ({ places, activities, disabled, onAdd, startPlaces, endPlaces, startDestName, endDestName }) => {`
);

fs.writeFileSync(actPath, actCode, 'utf8');
console.log('Fixed ActivityItem.jsx props');

// 2. Fix DayCard.jsx
const dayPath = 'src/components/TourBuilder/DayCard.jsx';
let dayCode = fs.readFileSync(dayPath, 'utf8');

const actTagRegex = /<ActivityItem[\s\S]*?\/>/;
const actTagReplacement = `<ActivityItem 
                    places={places} 
                    activities={days.flatMap(d => d.activities || [])}
                    disabled={!day.end_destination_id && !day.start_destination_id}
                    onAdd={(act) => addActivity(act)}
                    startPlaces={places.filter(p => String(p.destination_id) === String(day.start_destination_id))}
                    endPlaces={places.filter(p => String(p.destination_id) === String(day.end_destination_id))}
                    startDestName={destinations.find(d => String(d.destination_id) === String(day.start_destination_id))?.destination_name}
                    endDestName={destinations.find(d => String(d.destination_id) === String(day.end_destination_id))?.destination_name}
                />`;

dayCode = dayCode.replace(actTagRegex, actTagReplacement);

fs.writeFileSync(dayPath, dayCode, 'utf8');
console.log('Fixed DayCard.jsx usage');
