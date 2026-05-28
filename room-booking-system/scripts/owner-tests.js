const axios = require('axios');

const BASE = process.env.BASE_URL || 'http://localhost:3000/api';

async function register(name, email, password, role) {
  const res = await axios.post(`${BASE}/auth/register`, { name, email, password, role });
  return res.data.data; // { accessToken, refreshToken, user }
}

async function createRoom(token, room) {
  const res = await axios.post(`${BASE}/rooms`, room, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.data;
}

async function createBooking(token, booking) {
  const res = await axios.post(`${BASE}/bookings`, booking, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.data;
}

async function getOwnerBookings(token) {
  const res = await axios.get(`${BASE}/bookings/owner`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.data;
}

async function approveBooking(token, bookingId) {
  const res = await axios.patch(`${BASE}/bookings/${bookingId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.data;
}

async function getBooking(token, bookingId) {
  const res = await axios.get(`${BASE}/bookings/${bookingId}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data.data;
}

(async () => {
  try {
    console.log('Starting OWNER test flow against', BASE);

    // 1. Register owner
    const ownerEmail = `owner+${Date.now()}@example.com`;
    const owner = await register('Owner', ownerEmail, 'pass123', 'OWNER');
    const ownerToken = owner.accessToken;
    console.log('Owner created:', owner.user.id);

    // 2. Register two users
    const userA = await register('User A', `usera+${Date.now()}@example.com`, 'pass123', 'USER');
    const userB = await register('User B', `userb+${Date.now()}@example.com`, 'pass123', 'USER');
    const tokenA = userA.accessToken;
    const tokenB = userB.accessToken;
    console.log('Users created:', userA.user.id, userB.user.id);

    // 3. Owner creates a room
    const room = await createRoom(ownerToken, {
      title: 'Test Room',
      description: 'Room for integration test',
      location: 'Test City',
      type: 'HOTEL',
      price: 100
    });
    console.log('Room created:', room.id);

    // 4. Prepare overlapping dates
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);

    const payload = {
      roomId: room.id,
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString()
    };

    // 5. Create 3 bookings (userA, userB, and another by userA)
    const b1 = await createBooking(tokenA, payload);
    console.log('Booking 1 created:', b1.id, 'status:', b1.status);
    const b2 = await createBooking(tokenB, payload);
    console.log('Booking 2 created:', b2.id, 'status:', b2.status);
    const b3 = await createBooking(tokenA, payload);
    console.log('Booking 3 created:', b3.id, 'status:', b3.status);

    // 6. Owner lists incoming
    const incoming = await getOwnerBookings(ownerToken);
    console.log('Incoming bookings count for owner:', incoming.bookings.length);

    // 7. Approve booking 1
    const approved = await approveBooking(ownerToken, b1.id);
    console.log('Approved booking:', approved.id, 'status:', approved.status);

    // 8. Fetch all bookings to verify statuses
    const all = [b1.id, b2.id, b3.id];
    for (const id of all) {
      const detail = await getBooking(ownerToken, id);
      console.log(`Booking ${id} => status:`, detail.status);
    }

    console.log('OWNER test flow complete. Expect b1 APPROVED, b2/b3 REJECTED.');
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status, err.response.data);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
})();
