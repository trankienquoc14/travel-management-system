const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/BookingForm.jsx', 'utf8');

// 1. Fix the array iteration in submit
// Original: ['adults', 'children', 'toddlers'].forEach(type => {
content = content.replace(
    /\['adults', 'children', 'toddlers'\]\.forEach/g,
    "['adults', 'children', 'toddlers', 'infants'].forEach"
);

// 2. Fix the passType assignment mapping for infants
// Currently it has:
// if (type === 'children') passType = 'CHILD';
// if (type === 'toddlers') passType = 'TODDLER';
// I will just let it be, I added `if (type === 'infants') passType = 'INFANT';` previously but let's check if it exists.
if (!content.includes("if (type === 'infants') passType = 'INFANT';")) {
    content = content.replace(
        "if (type === 'toddlers') passType = 'TODDLER';",
        "if (type === 'toddlers') passType = 'TODDLER';\n                    if (type === 'infants') passType = 'INFANT';"
    );
}

// 3. Fix the array iteration in rendering
// Original: {['adults', 'children', 'toddlers'].map(type => {
// Then: const typeName = type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : 'Trẻ nhỏ';
// Then: const typeDesc = type === 'adults' ? 'Từ 12 tuổi trở lên' : type === 'children' ? 'Từ 5 - 11 tuổi' : 'Từ 2 - 4 tuổi';

const renderSearch = `{['adults', 'children', 'toddlers'].map(type => {
                            if (pax[type] === 0) return null;
                            const typeName = type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : 'Trẻ nhỏ';
                            const typeDesc = type === 'adults' ? 'Từ 12 tuổi trở lên' : type === 'children' ? 'Từ 5 - 11 tuổi' : 'Từ 2 - 4 tuổi';`;
                            
const renderReplace = `{['adults', 'children', 'toddlers', 'infants'].map(type => {
                            if (pax[type] === 0) return null;
                            const typeName = type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : type === 'toddlers' ? 'Trẻ nhỏ' : 'Em bé';
                            const typeDesc = type === 'adults' ? 'Từ 12 tuổi trở lên' : type === 'children' ? 'Từ 5 - 11 tuổi' : type === 'toddlers' ? 'Từ 2 - 4 tuổi' : 'Dưới 2 tuổi';`;

if (content.includes(renderSearch)) {
    content = content.replace(renderSearch, renderReplace);
    console.log('Fixed rendering logic');
} else {
    console.log('Rendering block not found, trying regex');
    // Regex replacement for rendering
    content = content.replace(/\{(\['adults', 'children', 'toddlers'\])\.map\(type => \{/g, "{['adults', 'children', 'toddlers', 'infants'].map(type => {");
    
    // For typeName
    content = content.replace(
        /const typeName = type === 'adults' \? 'Người lớn' : type === 'children' \? 'Trẻ em' : 'Trẻ nhỏ';/,
        "const typeName = type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : type === 'toddlers' ? 'Trẻ nhỏ' : 'Em bé';"
    );
    
    // For typeDesc
    content = content.replace(
        /const typeDesc = type === 'adults' \? 'Từ 12 tuổi trở lên' : type === 'children' \? 'Từ 5 - 11 tuổi' : 'Từ 2 - 4 tuổi';/,
        "const typeDesc = type === 'adults' ? 'Từ 12 tuổi trở lên' : type === 'children' ? 'Từ 5 - 11 tuổi' : type === 'toddlers' ? 'Từ 2 - 4 tuổi' : 'Dưới 2 tuổi';"
    );
}

fs.writeFileSync('frontend/src/components/BookingForm.jsx', content);
console.log('BookingForm fixed');
