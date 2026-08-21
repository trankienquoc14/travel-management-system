const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

const target1 = `onChange={(e) => {
                                    const newSellingPrice = Number(e.target.value.replace(/\\D/g, ''));
                                    if (netCost > 0) {
                                        const newMargin = ((newSellingPrice / netCost) - 1) * 100;
                                        setCostConfig({...costConfig, margin: newMargin});
                                    }
                                }}`;

const replacement1 = `onChange={(e) => {
                                    const input = e.target;
                                    const oldCursor = input.selectionStart;
                                    const oldLen = input.value.length;
                                    
                                    const newSellingPrice = Number(input.value.replace(/\\D/g, ''));
                                    if (netCost > 0) {
                                        const newMargin = ((newSellingPrice / netCost) - 1) * 100;
                                        setCostConfig({...costConfig, margin: newMargin});
                                    }
                                    
                                    requestAnimationFrame(() => {
                                        const newLen = input.value.length;
                                        const newCursor = Math.max(0, oldCursor + (newLen - oldLen));
                                        input.setSelectionRange(newCursor, newCursor);
                                    });
                                }}`;

if (c.includes(target1)) {
    c = c.replace(target1, replacement1);
    console.log("Replaced target1");
} else {
    console.log("Could not find target1");
}

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
