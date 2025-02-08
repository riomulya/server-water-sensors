const mqtt = require('mqtt');

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
    console.log('Connected to MQTT broker');

    // Subscribe ke topik tertentu
    client.subscribe('water/sensors', (err) => {
      if (!err) {
        console.log('Subscribed to water/sensors');
      } else {
        console.error('Failed to subscribe:', err);
      }
    });
  });

  // Event ketika menerima pesan
  client.on('message', (topic, message) => {
    try {
      const messageData = JSON.parse(message.toString());
      currentData = {
        topic: topic,
        message: messageData.msg,
        timestamp: new Date(),
      };
      console.log('Data received from MQTT:', currentData);

      // Emit data ke semua klien yang terhubung melalui Socket.IO
      io.emit('mqttData', currentData);
    } catch (err) {
      console.error('Error parsing MQTT message:', err);
    }
  });
};

// Fungsi getter untuk currentData
const getCurrentData = () => currentData;

// Export fungsi untuk memulai MQTT client dan getter
module.exports = { startMqttClient, getCurrentData };
