const fs = require('fs');

const manualMealPath = 'C:/Users/ASUS/.gemini/antigravity/brain/2fa6572d-6fa5-4f11-9fcf-46de7aa3e2b3/scratch/manual_meal_counts.js';
let c = fs.readFileSync(manualMealPath, 'utf8');

const badRegex = `/<div>\\s*<label.*?Bữa sáng \\(\\{countBreakfast\\} bữa\\)<\\/label>\\s*<input.*?breakfast: e\\.target\\.value.*?<\\/div>\\s*<div>\\s*<label.*?Bữa trưa \\(\\{countLunch\\} bữa\\)<\\/label>\\s*<input.*?lunch: e\\.target\\.value.*?<\\/div>\\s*<div>\\s*<label.*?Bữa tối \\(\\{countDinner\\} bữa\\)<\\/label>\\s*<input.*?dinner: e\\.target\\.value.*?<\\/div>/s`;

const goodRegex = `/<div>\\s*<label[^>]*>Bữa sáng \\(\\{countBreakfast\\} bữa\\)<\\/label>\\s*<input[^>]*breakfast: e\\.target\\.value[^>]*>\\s*<\\/div>\\s*<div>\\s*<label[^>]*>Bữa trưa \\(\\{countLunch\\} bữa\\)<\\/label>\\s*<input[^>]*lunch: e\\.target\\.value[^>]*>\\s*<\\/div>\\s*<div>\\s*<label[^>]*>Bữa tối \\(\\{countDinner\\} bữa\\)<\\/label>\\s*<input[^>]*dinner: e\\.target\\.value[^>]*>\\s*<\\/div>/s`;

c = c.replace(badRegex, goodRegex);
fs.writeFileSync(manualMealPath, c, 'utf8');
console.log('Fixed manual_meal_counts.js');
