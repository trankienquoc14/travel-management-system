const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

// Replace handleApplyFloatingSearch
code = code.replace(
    /const handleApplyFloatingSearch = \(\) => \{[\s\S]*?\}\)\);/,
    `const handleApplyFloatingSearch = () => {
        setPreferences(prev => ({
            ...prev,
            searchTerm: searchLocation,
            departureDate: searchDate,
            budgetRange: searchBudget
        }));`
);

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
console.log('Replaced logic');
