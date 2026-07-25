const axios = require('axios');
(async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/custom-tours/requests/customer/8');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.log(e.response ? e.response.data : e.message);
    }
})();
