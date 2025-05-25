const express = require('express');
const http = require('http'); // Untuk membuat server HTTP
const { Server } = require('socket.io'); // Import Socket.IO
const { startMqttClient } = require('./Mqtt/MqttClient'); // Import MQTT client
const cors = require('cors');
const bodyParser = require('body-parser');
const locationController = require('./controllers/location.controllers');
const jwt = require('jsonwebtoken');
const db = require('./connection/db');
const { setIoInstance } = require('./utils/socket'); // Import socket utility
const axios = require('axios'); // Added for pinging Flask service

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Tambahkan middleware untuk handling error parsing JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parse error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

const server = http.createServer(app); // Integrasi Express dengan server HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // Ganti dengan domain frontend kamu jika diperlukan
    methods: ['GET', 'POST', '*'],
  },
});

// Set Socket.IO instance in utility
setIoInstance(io);

// Tambahkan middleware untuk menyertakan io di request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import routes
const mqttRoutes = require('./routes/MqttRoutes')(io); // Kirim instance io
const sensorsRoutes = require('./routes/sensors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const klasifikasiRoutes = require('./routes/klasifikasi.routes');

// Gunakan routes
app.use(mqttRoutes);
app.use(sensorsRoutes);
app.use(authRoutes);
app.use(userRoutes); // Add user management routes
app.use('/klasifikasi', klasifikasiRoutes); // Add klasifikasi routes

// Setup routes dengan controller yang sudah dimodifikasi
app.post('/locations', locationController.createLocation);
app.put('/locations/:id', locationController.updateLocation);
app.delete('/locations/:id', locationController.deleteLocation);

// Health check endpoint for preventing Render from spinning down
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the server water sensors');
});

// Function to ping Flask service to keep it awake
const FLASK_URL = process.env.FLASK_URL || 'https://pw-brin-ml.onrender.com';
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function pingFlaskService() {
  try {
    console.log(
      `[${new Date().toISOString()}] Pinging Flask service at ${FLASK_URL}...`
    );
    const response = await axios.get(FLASK_URL);
    console.log(
      `[${new Date().toISOString()}] Flask service response status: ${
        response.status
      }`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error pinging Flask service:`,
      error.message
    );
  }
}

// Integrasikan MQTT dengan Socket.IO
startMqttClient(io);

// Socket.IO authentication middleware - non-blocking untuk MQTT
io.use((socket, next) => {
  try {
    // Handle guest access
    if (socket.handshake.auth && socket.handshake.auth.token === 'guest') {
      socket.user = { role: 'guest' };
      return next();
    }

    // Validasi token jika ada
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Tetap biarkan koneksi tanpa autentikasi untuk mqtt
      socket.user = { role: 'unauthenticated' };
      return next();
    }

    // Verifikasi token secara async tetapi jangan block connection
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        // Token invalid tapi tetap lanjutkan koneksi
        socket.user = { role: 'unauthenticated' };
        return next();
      }

      try {
        // Cek user di database
        const [user] = await db.execute(
          'SELECT * FROM data_user WHERE id = ?',
          [decoded.id]
        );

        if (user[0]) {
          // Attach user data ke socket
          socket.user = {
            id: user[0].id,
            role: user[0].role,
          };
        } else {
          socket.user = { role: 'unauthenticated' };
        }
      } catch (dbError) {
        console.error('DB Error:', dbError);
        socket.user = { role: 'unauthenticated' };
      }

      next();
    });
  } catch (error) {
    console.error('Auth Error:', error.message);
    // Tetap biarkan koneksi meskipun terjadi error
    socket.user = { role: 'unauthenticated' };
    next();
  }
});

// Koneksi WebSocket
io.on('connection', (socket) => {
  console.log(
    `Client connected: ${socket.id}, Role: ${socket.user?.role || 'unknown'}`
  );

  // Join public room untuk semua koneksi
  socket.join('public');

  // Kirim pesan saat client terhubung
  socket.emit('message', 'Welcome to the real-time MQTT server!');

  // Tangani disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  // Start pinging Flask service immediately and then periodically
  console.log('Starting Flask service ping to keep it awake');
  pingFlaskService();
  setInterval(pingFlaskService, PING_INTERVAL);
});
