require('dotenv').config();
const express = require('express');
const http = require('http'); // Untuk membuat server HTTP
const { Server } = require('socket.io'); // Import Socket.IO
const { startMqttClient } = require('./Mqtt/MqttClient'); // Import MQTT client
const cors = require('cors');
const bodyParser = require('body-parser');
const locationController = require('./controllers/location.controllers');
const jwt = require('jsonwebtoken');
const db = require('./connection/db');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Tambahkan middleware untuk handling error parsing JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parse error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// Tambahkan middleware untuk log semua incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const server = http.createServer(app); // Integrasi Express dengan server HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // Ganti dengan domain frontend kamu jika diperlukan
    methods: ['*'],
  },
});

// Tambahkan middleware untuk menyertakan io di request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import routes
const mqttRoutes = require('./routes/MqttRoutes')(io); // Kirim instance io
const sensorsRoutes = require('./routes/sensors');
const authRoutes = require('./routes/auth');

// Gunakan routes
app.use(mqttRoutes);
app.use(sensorsRoutes);
app.use(authRoutes);

// Setup routes dengan controller yang sudah dimodifikasi
app.post('/locations', locationController.createLocation);
app.put('/locations/:id', locationController.updateLocation);
app.delete('/locations/:id', locationController.deleteLocation);

// Integrasikan MQTT dengan Socket.IO
startMqttClient(io);

// Koneksi WebSocket
io.on('connection', async (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Kirim pesan saat client terhubung
  socket.emit('message', 'Welcome to the real-time MQTT server!');

  // Tangani disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  try {
    if (socket.handshake.auth.token === 'guest') {
      socket.user = { role: 'guest', organization_id: 'public' };
      return socket.join('public');
    }

    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await db.execute('SELECT * FROM data_user WHERE id = ?', [
      decoded.id,
    ]);

    socket.user = user[0];
    socket.join(user[0].organization_id);
  } catch (error) {
    console.error('Autentikasi gagal', error);
    socket.emit('error', 'Autentikasi gagal');
    socket.disconnect();
  }
});

io.use(async (socket, next) => {
  try {
    // Handle guest access
    if (socket.handshake.auth.token === 'guest') {
      socket.user = { role: 'guest', organization_id: 'public' };
      return next();
    }

    // Validasi token
    const token = socket.handshake.auth?.token;
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek user di database
    const [user] = await db.execute('SELECT * FROM data_user WHERE id = ?', [
      decoded.id,
    ]);

    if (!user[0]) {
      throw new Error('User tidak ditemukan');
    }

    // Attach user data ke socket
    socket.user = {
      id: user[0].id,
      role: user[0].role,
      organization_id: user[0].organization_id,
    };

    // Join room organization
    socket.join(user[0].organization_id);
    next();
  } catch (error) {
    console.error('Error auth:', error.message);
    next(new Error('Autentikasi gagal: ' + error.message));
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the server water sensors');
});

// Jalankan server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
