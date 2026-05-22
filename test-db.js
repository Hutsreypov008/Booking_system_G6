const mysql = require('mysql2');

console.log('🔍 Testing database connection...\n');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '', // Leave empty if no password
    database: 'room_booking_db'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed!');
        console.error('Error:', err.message);
        console.log('\n💡 If database doesn\'t exist, create it in phpMyAdmin first');
        return;
    }
    
    console.log('✅ Connected to MySQL database!\n');
    
    // Check tables
    connection.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('Error checking tables:', err.message);
        } else {
            console.log('📋 Tables in database:');
            if (results.length === 0) {
                console.log('   (No tables found. Please create tables using phpMyAdmin)');
                console.log('\n📝 Copy the SQL from previous message into phpMyAdmin');
            } else {
                results.forEach(row => {
                    console.log(`   - ${Object.values(row)[0]}`);
                });
                console.log('\n✅ Database is ready!');
            }
        }
        
        connection.end();
    });
});