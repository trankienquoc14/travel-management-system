const sequelize = require('./config/database');
async function test() {
    try {
        const res = await sequelize.query("INSERT INTO destinations (destination_name, description) VALUES ('test_dest2', 'test')");
        console.log("res:", res);
        console.log("res[0]:", res[0]);
        console.log("res[1]:", res[1]);
    } catch(e) {
        console.error(e);
    } finally {
        sequelize.close();
    }
}
test();