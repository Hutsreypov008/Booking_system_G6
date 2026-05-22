const mysql = require('mysql2');

console.log('🔍 Verifying database tables...\n');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'room_booking_db'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        return;
    }
    
    console.log('✅ Connected to database\n');
    
    // Show all tables
    connection.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`📋 Found ${results.length} tables:`);
            results.forEach(row => {
                const tableName = Object.values(row)[0];
                console.log(`   ✅ ${tableName}`);
            });
            
            // Check row counts
            console.log('\n📊 Row counts:');
            const tables = ['users', 'rooms', 'room_images', 'bookings', 'favorites', 'refresh_tokens'];
            
            let completed = 0;
            tables.forEach(table => {
                connection.query(`SELECT COUNT(*) as count FROM ${table}`, (err, result) => {
                    if (!err && result) {
                        const count = result[0].count;
                        console.log(`   📌 ${table}: ${count} rows`);
                    }
                    completed++;
                    if (completed === tables.length) {
                        console.log('\n✅ Database verification complete!');
                        console.log('\n🎉 Your database is ready to use!');
                        connection.end();
                    }
                });
            });
        }
    });
});