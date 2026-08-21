const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

// 1. Initial State
c = c.replace(
    /image_url: ''\s*\}\);/,
    "image_url: '', categories: [], highlights: '' });"
);

// 2. Reset Button State
c = c.replace(
    /setFormData\(\{ tour_id: null, tour_name: '', description: '', image: null, image_url: '' \}\);/,
    "setFormData({ tour_id: null, tour_name: '', description: '', image: null, image_url: '', categories: [], highlights: '' });"
);

// 3. handleEditTour
c = c.replace(
    /image_url: tourData\.image_url\s*\}\);/,
    "image_url: tourData.image_url, categories: [], highlights: '' });"
);

c = c.replace(
    /if \(parsed\.days\) \{/,
    "if (parsed.categories) setFormData(prev => ({...prev, categories: parsed.categories}));\n                        if (parsed.highlights) setFormData(prev => ({...prev, highlights: parsed.highlights}));\n                        if (parsed.days) {"
);

// 4. handleSave
c = c.replace(
    /computed: \{ netCost, sellingPrice, totalDays, totalNights, totalMeals: \{ breakfast: countBreakfast, lunch: countLunch, dinner: countDinner \}, autoTicketsCost \} \}\);/,
    "computed: { netCost, sellingPrice, totalDays, totalNights, totalMeals: { breakfast: countBreakfast, lunch: countLunch, dinner: countDinner }, autoTicketsCost }, categories: formData.categories, highlights: formData.highlights });"
);

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
