const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'StaffFixedTourDesigner.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Insert FormattedNumberInput component
const formattedInputComponent = `
const FormattedNumberInput = ({ value, onChange, placeholder, style, title, readOnly }) => {
    const displayValue = (value !== undefined && value !== null && value !== '') 
        ? Number(value).toLocaleString('vi-VN') 
        : '';

    const handleChange = (e) => {
        let rawValue = e.target.value.replace(/\\D/g, '');
        onChange({ target: { value: rawValue } });
    };

    return (
        <input 
            type="text" 
            value={displayValue} 
            onChange={handleChange} 
            placeholder={placeholder}
            style={style}
            title={title}
            readOnly={readOnly}
        />
    );
};

`;

if (!content.includes('FormattedNumberInput')) {
    content = content.replace('export const formatMoneyLocal', formattedInputComponent + 'export const formatMoneyLocal');
}

// Replace <input type="number" ... /> with <FormattedNumberInput ... />
// We use a regex that matches <input type="number" ... >
content = content.replace(/<input\s+type="number"([^>]+)>/g, (match, p1) => {
    // Exclude margin and minimumPax
    if (p1.includes('value={costConfig.margin}') || p1.includes('value={costConfig.minimumPax}')) {
        return match;
    }
    // Replace <input type="number" with <FormattedNumberInput
    return `<FormattedNumberInput${p1}>`;
});

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Done replacing input numbers in StaffFixedTourDesigner.jsx');
