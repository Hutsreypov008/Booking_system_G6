const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Database connection pool
const db = mysql.createPool({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'room_booking_db',
    waitForConnections: true,
    connectionLimit: 10
});

const promiseDb = db.promise();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Room Booking System API is running',
        timestamp: new Date().toISOString(),
        database: 'connected',
        tables: ['users', 'rooms', 'bookings', 'favorites', 'room_images', 'refresh_tokens']
    });
});

// ==================== AUTH ENDPOINTS ====================
// Register
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, role = 'USER' } = req.body;
        
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }
        
        // Check if user exists
        const [existing] = await promiseDb.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        const id = crypto.randomUUID();
        const hashedPassword = `hash_${password}`; // In production use bcrypt
        
        await promiseDb.query(
            'INSERT INTO users (id, name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, email, hashedPassword, phone, role]
        );
        
        console.log(`✅ New user registered: ${email}`);
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: { id, name, email, role },
                accessToken: `token_${id}`
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
});

// Login
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        const [users] = await promiseDb.query(
            'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const user = users[0];
        const expectedHash = `hash_${password}`;
        
        if (user.password_hash !== expectedHash) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        console.log(`✅ User logged in: ${email}`);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                accessToken: `token_${user.id}`,
                refreshToken: `refresh_${user.id}`
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// ==================== ROOM ENDPOINTS ====================
// Get all rooms with filters
app.get('/api/v1/rooms', async (req, res) => {
    try {
        const { location, type, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
        
        let query = `
            SELECT r.*, u.name as owner_name, u.email as owner_email
            FROM rooms r 
            JOIN users u ON r.owner_id = u.id 
            WHERE r.is_available = 1
        `;
        const params = [];
        
        if (location) {
            query += ' AND r.location LIKE ?';
            params.push(`%${location}%`);
        }
        
        if (type) {
            query += ' AND r.type = ?';
            params.push(type);
        }
        
        if (minPrice) {
            query += ' AND r.price >= ?';
            params.push(parseFloat(minPrice));
        }
        
        if (maxPrice) {
            query += ' AND r.price <= ?';
            params.push(parseFloat(maxPrice));
        }
        
        query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
        
        const [rooms] = await promiseDb.query(query, params);
        
        const [countResult] = await promiseDb.query(
            'SELECT COUNT(*) as total FROM rooms WHERE is_available = 1'
        );
        
        res.json({
            success: true,
            message: 'Rooms fetched successfully',
            data: rooms,
            meta: {
                totalItems: countResult[0].total,
                itemsPerPage: parseInt(limit),
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
    }
});

// Get room by ID
app.get('/api/v1/rooms/:id', async (req, res) => {
    try {
        const [rooms] = await promiseDb.query(
            `SELECT r.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
             FROM rooms r 
             JOIN users u ON r.owner_id = u.id 
             WHERE r.id = ?`,
            [req.params.id]
        );
        
        if (rooms.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        
        res.json({
            success: true,
            message: 'Room details fetched successfully',
            data: rooms[0]
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch room details' });
    }
});

// Create room (Owner only)
app.post('/api/v1/rooms', async (req, res) => {
    try {
        const { owner_id, title, description, location, type, price } = req.body;
        
        // Validate required fields
        if (!owner_id || !title || !description || !location || !type || !price) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: owner_id, title, description, location, type, price'
            });
        }
        
        const id = crypto.randomUUID();
        
        await promiseDb.query(
            'INSERT INTO rooms (id, owner_id, title, description, location, type, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, owner_id, title, description, location, type, price]
        );
        
        console.log(`✅ New room created: ${title} by ${owner_id}`);
        
        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: { id, title, location, price }
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, message: 'Failed to create room' });
    }
});

// ==================== BOOKING ENDPOINTS ====================
// Create booking
app.post('/api/v1/bookings', async (req, res) => {
    try {
        const { user_id, room_id, check_in_date, check_out_date } = req.body;
        
        // Validate required fields
        if (!user_id || !room_id || !check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: user_id, room_id, check_in_date, check_out_date'
            });
        }
        
        // Check for conflicting bookings
        const [conflicts] = await promiseDb.query(
            `SELECT id FROM bookings 
             WHERE room_id = ? 
             AND status IN ('PENDING', 'APPROVED')
             AND ((check_in_date < ? AND check_out_date > ?) 
               OR (check_in_date < ? AND check_out_date > ?))`,
            [room_id, check_out_date, check_in_date, check_out_date, check_in_date]
        );
        
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Room is not available for selected dates'
            });
        }
        
        // Get room price
        const [rooms] = await promiseDb.query(
            'SELECT price FROM rooms WHERE id = ?',
            [room_id]
        );
        
        if (rooms.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        
        const price = rooms[0].price;
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const total_price = price * nights;
        const id = crypto.randomUUID();
        
        await promiseDb.query(
            'INSERT INTO bookings (id, user_id, room_id, check_in_date, check_out_date, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, user_id, room_id, check_in_date, check_out_date, total_price, 'PENDING']
        );
        
        console.log(`✅ New booking created: ${id} for room ${room_id}`);
        
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { id, total_price, status: 'PENDING', nights, price_per_night: price }
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
});

// Get user's bookings
app.get('/api/v1/bookings/user/:userId', async (req, res) => {
    try {
        const [bookings] = await promiseDb.query(
            `SELECT b.*, r.title as room_title, r.location, r.price, r.type
             FROM bookings b 
             JOIN rooms r ON b.room_id = r.id 
             WHERE b.user_id = ? 
             ORDER BY b.created_at DESC`,
            [req.params.userId]
        );
        
        res.json({
            success: true,
            message: 'Bookings fetched successfully',
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
});

// Get owner's bookings (incoming requests)
app.get('/api/v1/bookings/owner/:ownerId', async (req, res) => {
    try {
        const [bookings] = await promiseDb.query(
            `SELECT b.*, r.title as room_title, u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM bookings b 
             JOIN rooms r ON b.room_id = r.id 
             JOIN users u ON b.user_id = u.id
             WHERE r.owner_id = ? 
             ORDER BY b.created_at DESC`,
            [req.params.ownerId]
        );
        
        res.json({
            success: true,
            message: 'Incoming bookings fetched successfully',
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching owner bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
});

// Update booking status (Approve/Reject/Cancel)
app.patch('/api/v1/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['APPROVED', 'REJECTED', 'CANCELLED'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Allowed: APPROVED, REJECTED, CANCELLED' 
            });
        }
        
        await promiseDb.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        console.log(`✅ Booking ${req.params.id} status updated to ${status}`);
        
        res.json({
            success: true,
            message: `Booking ${status.toLowerCase()} successfully`
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Failed to update booking' });
    }
});

// Get ALL bookings (Complete list)
app.get('/api/v1/bookings/all', async (req, res) => {
    try {
        const [bookings] = await promiseDb.query(
            `SELECT 
                b.*,
                r.title as room_title,
                r.location,
                r.price as room_price,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                owner.name as owner_name
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.id 
            JOIN users u ON b.user_id = u.id
            JOIN users owner ON r.owner_id = owner.id
            ORDER BY b.created_at DESC`
        );
        
        res.json({
            success: true,
            message: 'All bookings fetched successfully',
            total: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch bookings',
            error: error.message 
        });
    }
});

// ==================== BOOKING ENDPOINTS ====================

// Get ALL bookings (Complete list)
app.get('/api/v1/bookings/all', async (req, res) => {
    try {
        const [bookings] = await promiseDb.query(
            `SELECT 
                b.*,
                r.title as room_title,
                r.location,
                r.price as room_price,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.id 
            JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC`
        );
        
        res.json({
            success: true,
            message: 'All bookings fetched successfully',
            total: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch bookings' 
        });
    }
});

// Create booking
app.post('/api/v1/bookings', async (req, res) => {
    try {
        const { user_id, room_id, check_in_date, check_out_date } = req.body;
        
        if (!user_id || !room_id || !check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: user_id, room_id, check_in_date, check_out_date'
            });
        }
        
        // Check for conflicting bookings
        const [conflicts] = await promiseDb.query(
            `SELECT id FROM bookings 
             WHERE room_id = ? 
             AND status IN ('PENDING', 'APPROVED')
             AND ((check_in_date < ? AND check_out_date > ?) 
               OR (check_in_date < ? AND check_out_date > ?))`,
            [room_id, check_out_date, check_in_date, check_out_date, check_in_date]
        );
        
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Room is not available for selected dates'
            });
        }
        
        // Get room price
        const [rooms] = await promiseDb.query(
            'SELECT price FROM rooms WHERE id = ?',
            [room_id]
        );
        
        if (rooms.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        
        const price = rooms[0].price;
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const total_price = price * nights;
        const id = crypto.randomUUID();
        
        await promiseDb.query(
            'INSERT INTO bookings (id, user_id, room_id, check_in_date, check_out_date, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, user_id, room_id, check_in_date, check_out_date, total_price, 'PENDING']
        );
        
        console.log(`✅ New booking created: ${id}`);
        
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { id, total_price, status: 'PENDING', nights, price_per_night: price }
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
});

// Get user's bookings
app.get('/api/v1/bookings/user/:userId', async (req, res) => {
    try {
        const [bookings] = await promiseDb.query(
            `SELECT b.*, r.title as room_title, r.location, r.price
             FROM bookings b 
             JOIN rooms r ON b.room_id = r.id 
             WHERE b.user_id = ? 
             ORDER BY b.created_at DESC`,
            [req.params.userId]
        );
        
        res.json({
            success: true,
            message: 'Bookings fetched successfully',
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
});

// Get owner's bookings (incoming requests)
app.get('/api/v1/bookings/owner/:ownerId', async (req, res) => {
    try {
        const [bookings] = await promiseDb.query(
            `SELECT b.*, r.title as room_title, u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM bookings b 
             JOIN rooms r ON b.room_id = r.id 
             JOIN users u ON b.user_id = u.id
             WHERE r.owner_id = ? 
             ORDER BY b.created_at DESC`,
            [req.params.ownerId]
        );
        
        res.json({
            success: true,
            message: 'Incoming bookings fetched successfully',
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching owner bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
});

// Update booking status (Approve/Reject/Cancel)
app.patch('/api/v1/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['APPROVED', 'REJECTED', 'CANCELLED'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Allowed: APPROVED, REJECTED, CANCELLED' 
            });
        }
        
        await promiseDb.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        console.log(`✅ Booking ${req.params.id} status updated to ${status}`);
        
        res.json({
            success: true,
            message: `Booking ${status.toLowerCase()} successfully`
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Failed to update booking' });
    }
});
// Delete a booking
app.delete('/api/v1/bookings/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        
        // Check if booking exists
        const [bookings] = await promiseDb.query(
            'SELECT id, status FROM bookings WHERE id = ?',
            [bookingId]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        // Delete the booking
        await promiseDb.query(
            'DELETE FROM bookings WHERE id = ?',
            [bookingId]
        );
        
        console.log(`✅ Booking deleted: ${bookingId}`);
        
        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete booking'
        });
    }
});

// Delete ALL bookings (Admin/Cleanup)
app.delete('/api/v1/bookings/all', async (req, res) => {
    try {
        const [result] = await promiseDb.query('DELETE FROM bookings');
        
        res.json({
            success: true,
            message: `Deleted ${result.affectedRows} bookings successfully`
        });
    } catch (error) {
        console.error('Error deleting all bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bookings'
        });
    }
});

// Delete bookings by status (e.g., delete all CANCELLED bookings)
app.delete('/api/v1/bookings/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        
        const [result] = await promiseDb.query(
            'DELETE FROM bookings WHERE status = ?',
            [status]
        );
        
        res.json({
            success: true,
            message: `Deleted ${result.affectedRows} ${status} bookings successfully`
        });
    } catch (error) {
        console.error('Error deleting bookings by status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bookings'
        });
    }
});
// ==================== UPDATE BOOKING ENDPOINTS ====================

// Update booking dates
app.put('/api/v1/bookings/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { check_in_date, check_out_date } = req.body;
        
        // Check if booking exists
        const [bookings] = await promiseDb.query(
            'SELECT b.*, r.price, r.id as room_id FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?',
            [bookingId]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        const booking = bookings[0];
        
        // Check if booking can be edited (only PENDING status)
        if (booking.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Cannot edit booking with status: ${booking.status}. Only PENDING bookings can be edited.`
            });
        }
        
        // Check for date conflicts with other bookings
        const [conflicts] = await promiseDb.query(
            `SELECT id FROM bookings 
             WHERE room_id = ? 
             AND id != ?
             AND status IN ('PENDING', 'APPROVED')
             AND ((check_in_date < ? AND check_out_date > ?) 
               OR (check_in_date < ? AND check_out_date > ?))`,
            [booking.room_id, bookingId, check_out_date, check_in_date, check_out_date, check_in_date]
        );
        
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'New dates conflict with existing booking'
            });
        }
        
        // Calculate new total price
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const total_price = booking.price * nights;
        
        // Update booking
        await promiseDb.query(
            'UPDATE bookings SET check_in_date = ?, check_out_date = ?, total_price = ? WHERE id = ?',
            [check_in_date, check_out_date, total_price, bookingId]
        );
        
        console.log(`✅ Booking updated: ${bookingId}`);
        
        res.json({
            success: true,
            message: 'Booking updated successfully',
            data: {
                id: bookingId,
                check_in_date: check_in_date,
                check_out_date: check_out_date,
                nights: nights,
                total_price: total_price
            }
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking'
        });
    }
});

// Update booking status (Approve/Reject/Cancel)
app.patch('/api/v1/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Allowed: PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED' 
            });
        }
        
        // Check if booking exists
        const [bookings] = await promiseDb.query(
            'SELECT id, status FROM bookings WHERE id = ?',
            [req.params.id]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        await promiseDb.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        console.log(`✅ Booking ${req.params.id} status updated to ${status}`);
        
        res.json({
            success: true,
            message: `Booking status updated to ${status} successfully`
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update booking status' 
        });
    }
});

// Update booking details (full update)
app.patch('/api/v1/bookings/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { check_in_date, check_out_date, status } = req.body;
        
        // Build update query dynamically
        let updateFields = [];
        let updateValues = [];
        
        if (check_in_date) {
            updateFields.push('check_in_date = ?');
            updateValues.push(check_in_date);
        }
        
        if (check_out_date) {
            updateFields.push('check_out_date = ?');
            updateValues.push(check_out_date);
            
            // If dates are updated, recalculate total price
            if (check_in_date) {
                const [rooms] = await promiseDb.query(
                    'SELECT r.price FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?',
                    [bookingId]
                );
                
                if (rooms.length > 0) {
                    const nights = Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24));
                    const total_price = rooms[0].price * nights;
                    updateFields.push('total_price = ?');
                    updateValues.push(total_price);
                }
            }
        }
        
        if (status) {
            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        updateValues.push(bookingId);
        
        await promiseDb.query(
            `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        // Get updated booking
        const [updatedBooking] = await promiseDb.query(
            'SELECT * FROM bookings WHERE id = ?',
            [bookingId]
        );
        
        res.json({
            success: true,
            message: 'Booking updated successfully',
            data: updatedBooking[0]
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking'
        });
    }
});
// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
    });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`
    ═══════════════════════════════════════════════════════
    🏨 ROOM BOOKING SYSTEM API - RUNNING SUCCESSFULLY
    ═══════════════════════════════════════════════════════
    📡 Port: ${PORT}
    🌐 URL: http://localhost:${PORT}
    🏥 Health: http://localhost:${PORT}/health
    ═══════════════════════════════════════════════════════
    
    📝 Available Endpoints:
    
    🔐 AUTH:
    POST   /api/v1/auth/register     - Register new user
    POST   /api/v1/auth/login        - Login user
    
    🏠 ROOMS:
    GET    /api/v1/rooms             - Get all rooms (with filters)
    GET    /api/v1/rooms/:id         - Get room details
    POST   /api/v1/rooms             - Create room (Owner)
    
    📅 BOOKINGS:
    POST   /api/v1/bookings          - Create booking
    GET    /api/v1/bookings/user/:userId - Get user bookings
    GET    /api/v1/bookings/owner/:ownerId - Get owner bookings
    PATCH  /api/v1/bookings/:id/status - Update booking status
    
    👤 USERS:
    GET    /api/v1/users             - Get all users
    GET    /api/v1/users/:id         - Get user profile
    
    ═══════════════════════════════════════════════════════
    `);
});