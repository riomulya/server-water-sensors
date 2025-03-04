const mqtt = require('mqtt');
const { saveSensorData } = require('../controllers/allSensors.controller');
const AppState = require('../state/AppState');

// Variabel untuk menyimpan data terbaru
let currentData = {};

// Konfigurasi MQTT
const MqttxOptions = {
  host: 'wss://3a6152cff8674790bcad3c3c23ee9a34.s1.eu.hivemq.cloud/mqtt',
  port: 8884,
  clientId: 'mqttx_' + Math.random().toString(16).substr(2, 8),
  username: 'admin',
  password: 'Water123456',
  protocol: 'wss',
  path: '/mqtt',
};

// Tambahkan fungsi untuk update lokasi dari socket.io
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('updateLocation', (newLocation) => {
      AppState.updateLocation(newLocation);
      console.log('[MQTT] Location updated:', AppState.getLocation());
    });

    socket.on('clearLocation', () => {
      AppState.clearLocation();
    });
  });
};

// Fungsi untuk memulai koneksi MQTT dengan integrasi Socket.IO
const startMqttClient = (io) => {
  const client = mqtt.connect(MqttxOptions.host, {
    port: MqttxOptions.port,
    clientId: MqttxOptions.clientId,
    username: MqttxOptions.username,
    password: MqttxOptions.password,
    protocol: 'wss',
    path: '/mqtt',
  });

  // Event ketika koneksi berhasil
  client.on('connect', () => {
    // console.log('Connected to MQTT broker');

    // Subscribe ke topik tertentu
    client.subscribe('water/sensors', (err) => {
      if (!err) {
        // console.log('Subscribed to water/sensors');
      } else {
        // console.error('Failed to subscribe:', err);
      }
    });
  });

  // Event ketika menerima pesan
  client.on('message', async (topic, message) => {
    const currentLocation = AppState.getLocation();
    console.log('[MQTT] Current location:', currentLocation);

    try {
      const messageData = JSON.parse(message.toString());
      const sensorData = messageData.msg;
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

      console.log('[DEBUG] Raw MQTT Data:', {
        topic,
        sensorData,
        timestamp,
      });

      if (
        currentLocation.id_lokasi &&
        currentLocation.latitude &&
        currentLocation.longitude &&
        sensorData.accel_x !== undefined &&
        sensorData.accel_y !== undefined &&
        sensorData.accel_z !== undefined &&
        sensorData.ph !== undefined &&
        sensorData.temperature !== undefined &&
        sensorData.turbidity !== undefined
      ) {
        console.log('[DEBUG] All conditions met. Attempting to save...');

        try {
          await saveSensorData({
            ...currentLocation,
            ...sensorData,
            timestamp,
          });
          console.log('[DEBUG] Data saved successfully');
        } catch (saveError) {
          console.error('[DEBUG] Save failed:', saveError);
        }
      } else {
        console.log('[DEBUG] Missing required data:', {
          hasLocation: !!currentLocation.id_lokasi,
          hasCoords: !!currentLocation.latitude && !!currentLocation.longitude,
          sensors: {
            accel_x: sensorData.accel_x !== undefined,
            accel_y: sensorData.accel_y !== undefined,
            accel_z: sensorData.accel_z !== undefined,
            ph: sensorData.ph !== undefined,
            temperature: sensorData.temperature !== undefined,
            turbidity: sensorData.turbidity !== undefined,
          },
        });
      }

      currentData = { topic, message: sensorData, timestamp };
      io.emit('mqttData', currentData);
    } catch (err) {
      console.error('[MQTT] Error processing message:', err);
    }
  });
};

// Fungsi getter untuk currentData
const getCurrentData = () => currentData;

// Export fungsi untuk memulai MQTT client dan getter
module.exports = { startMqttClient, getCurrentData, setupSocketHandlers };
