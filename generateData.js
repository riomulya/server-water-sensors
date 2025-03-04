const mqtt = require('mqtt');

const MqttxOptions = {
  host: 'wss://3a6152cff8674790bcad3c3c23ee9a34.s1.eu.hivemq.cloud/mqtt',
  port: 8884,
  clientId: 'mqttx_' + Math.random().toString(16).substr(2, 8),
  username: 'admin',
  password: 'Water123456',
  protocol: 'wss',
  path: '/mqtt',
};

// Konfigurasi koneksi ke broker MQTT
const client = mqtt.connect(MqttxOptions.host, {
  port: MqttxOptions.port,
  clientId: MqttxOptions.clientId,
  username: MqttxOptions.username,
  password: MqttxOptions.password,
  protocol: 'wss',
  path: '/mqtt',
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  // Mengirim data setiap 5 detik
  setInterval(() => {
    const data = {
      msg: {
        latitude: (-6.3550728 + (Math.random() * 0.001 - 0.0005)).toFixed(7), // Variasi ±0.0005 derajat (~50 meter)
        longitude: (106.6645121 + (Math.random() * 0.001 - 0.0005)).toFixed(7), // Variasi ±0.0005 derajat (~50 meter)
        accel_x: Math.floor(Math.random() * 2), // Random antara 0-2 (pergerakan kecil)
        accel_y: Math.floor(Math.random() * 2), // Random antara 0-2
        accel_z: Math.floor(Math.random() * 2), // Random antara 0-2
        ph: (6.5 + Math.random() * 1).toFixed(2), // pH 6.5-7.5 (lebih realistis untuk air)
        turbidity: 20 + Math.floor(Math.random() * 20), // Kekeruhan 20-40 NTU
        temperature: 25 + Math.floor(Math.random() * 10), // Suhu 25-35°C
      },
    };

    // Kirim data ke topik 'sensor/data'
    client.publish('water/sensors', JSON.stringify(data));
    console.log('Data sent:', JSON.stringify(data));
  }, 5000); // Setiap 5 detik
});
