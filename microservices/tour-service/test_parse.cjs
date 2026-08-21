let req = {
    body: {
        design_data: JSON.stringify({ days: [], costConfig: {} }),
        existing_day_images: JSON.stringify({ '1': '/uploads/test.jpg' })
    },
    files: [
        { fieldname: 'dayImage_2', filename: 'new.jpg' }
    ]
};

let design_data = req.body.design_data;
let dayImages = {};
try {
    if (req.body.existing_day_images) {
        dayImages = JSON.parse(req.body.existing_day_images);
    }
} catch(e){}

if (req.files && Array.isArray(req.files)) {
    req.files.forEach(f => {
        if (f.fieldname.startsWith('dayImage_')) {
            const dayIdx = f.fieldname.split('_')[1];
            dayImages[dayIdx] = `/uploads/${f.filename}`;
        }
    });
}

if (design_data) {
    try {
        let parsed = typeof design_data === 'string' ? JSON.parse(design_data) : design_data;
        parsed.dayImages = dayImages;
        design_data = JSON.stringify(parsed);
    } catch(e) {}
}

console.log(design_data);
