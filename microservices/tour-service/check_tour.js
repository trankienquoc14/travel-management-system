const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('travel_management', 'root', '', { host: 'localhost', dialect: 'mysql' });
async function test() {
    const [tours] = await sequelize.query('SELECT design_data FROM tours WHERE tour_name = "Khám phá Đà Lạt - Nha Trang"');
    if (tours.length > 0) {
        console.log(JSON.stringify(JSON.parse(tours[0].design_data), null, 2));
    } else {
        console.log("Tour not found");
    }
    await sequelize.close();
}
test();
