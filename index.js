const express = require('express');
const http = require('http'); // Untuk membuat server HTTP
const { Server } = require('socket.io'); // Import Socket.IO
const { startMqttClient } = require('./Mqtt/MqttClient'); // Import MQTT client
const cors = require('cors');
const bodyParser = require('body-parser');
const locationController = require('./controllers/location.controllers');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const server = http.createServer(app); // Integrasi Express dengan server HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // Ganti dengan domain frontend kamu jika diperlukan
    methods: ['GET', 'POST', '*'],
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

// Gunakan routes
app.use(mqttRoutes);
app.use(sensorsRoutes);

// Setup routes dengan controller yang sudah dimodifikasi
app.post('/locations', locationController.createLocation);
app.put('/locations/:id', locationController.updateLocation);
app.delete('/locations/:id', locationController.deleteLocation);

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

app.get('/', (req, res) => {
  res.send('Welcome to the server water sensors');
});

// Jalankan server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
