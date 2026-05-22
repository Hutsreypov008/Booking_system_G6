const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3307,
            user: 'root',
            password: 'your_password_here', // Replace with your actual password
            database: 'room_booking_db'
        });
        
        console.log('✅ Database connected successfully!');
        
        // Test query
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('📋 Tables in database:', rows);
        
        await connection.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}

testConnection();