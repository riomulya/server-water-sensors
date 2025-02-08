const express = require('express');
const http = require('http'); // Untuk membuat server HTTP
const { Server } = require('socket.io'); // Import Socket.IO
const { startMqttClient } = require('./Mqtt/MqttClient'); // Import MQTT client
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app); // Integrasi Express dengan server HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // Ganti dengan domain frontend kamu jika diperlukan
    methods: ['GET', 'POST'],
  },
});

// Import routes
const mqttRoutes = require('./routes/MqttRoutes')(io); // Kirim instance io
const sensorsRoutes = require('./routes/sensors');

// Gunakan routes
app.use(mqttRoutes);
app.use(sensorsRoutes);

// Integrasikan MQTT dengan Socket.IO
startMqttClient(io);

// Koneksi WebSocket
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Kirim pesan saat client terhubung
  socket.emit('message', 'Welcome to the real-time MQTT server!');

  // Tangani disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Jalankan server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
