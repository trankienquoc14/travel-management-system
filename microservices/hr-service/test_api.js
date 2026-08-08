const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('http://localhost:5000/api/services');
        console.log("Success. Total services:", res.data.data.length);
        console.log("First 3 services:", res.data.data.slice(0, 3));
    } catch(e) {
        console.error("API Error:", e.message);
        if(e.response) console.error(e.response.data);
    }
}
run();