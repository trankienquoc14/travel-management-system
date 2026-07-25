const mysql = require('mysql2/promise');

async function run() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root', // assuming root
        password: '',
        database: 'travel_management'
    });

    try {
        console.log("Updating custom_tour_requests...");
        await connection.query(`
            ALTER TABLE custom_tour_requests 
            MODIFY COLUMN status ENUM(
                'Pending', 
                'Initial_Quoted', 
                'Designing', 
                'Pending_Manager_Approval', 
                'Manager_Rejected', 
                'Manager_Approved', 
                'Sent_To_Customer', 
                'Customer_Revision', 
                'Customer_Accepted', 
                'Completed', 
                'Canceled'
            ) DEFAULT 'Pending'
        `);

        console.log("Updating custom_tour_quotes...");
        await connection.query(`
            ALTER TABLE custom_tour_quotes 
            MODIFY COLUMN approval_status ENUM(
                'Pending',
                'Initial_Quoted',
                'Designing',
                'Pending_Approval',
                'Approved',
                'Rejected',
                'Quote_Sent',
                'Customer_Revision',
                'Customer_Accepted'
            ) DEFAULT 'Pending'
        `);
        
        console.log("Success!");
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

run();
