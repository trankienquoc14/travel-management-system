const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');

async function testSave() {
    const token = jwt.sign({ id: 1, user_id: 1, role_id: 3 }, 'travel_management_secret_key_2026', { expiresIn: '1d' });

    const form = new FormData();
    form.append('tour_name', 'Tour Test Save Error');
    form.append('description', 'Mô tả test');
    form.append('destination', 'Đà Lạt');
    form.append('duration_days', 3);
    form.append('base_cost', 2500000);
    form.append('base_price', 3000000);
    form.append('markup_percent', 20);
    form.append('design_data', JSON.stringify({
        days: [{ dayIndex: 1, route_title: 'TP.HCM - Đà Lạt' }],
        costConfig: { minimumPax: 15, margin: 20 }
    }));
    form.append('is_custom', 0);

    try {
        const res = await axios.post('http://localhost:5000/api/tours/staff/tours', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        console.log('SUCCESS:', res.data);
    } catch (e) {
        console.error('FAILED WITH STATUS:', e.response?.status);
        console.error('RESPONSE DATA:', e.response?.data);
        if (e.response?.data?.message) {
            console.error('ERROR MESSAGE:', e.response.data.message);
        }
    }
}

testSave();
