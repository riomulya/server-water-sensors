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
        latitude: (-6.3350728 + (Math.random() * 0.001 - 0.0005)).toFixed(7),
        longitude: (106.4845121 + (Math.random() * 0.001 - 0.0005)).toFixed(7),
        accel_x: (0.1 + Math.random() * 0.4).toFixed(2),
        accel_y: (0.1 + Math.random() * 0.4).toFixed(2),
        accel_z: (0.1 + Math.random() * 0.4).toFixed(2),
        ph: (12.5 + Math.random() * 1.5).toFixed(2),
        turbidity: (500 + Math.random() * 45).toFixed(1),
        temperature: (45 + Math.random() * 15).toFixed(1),
        speed: (0.1 + Math.random() * 2.4).toFixed(2),
      },
    };

    // Kirim data ke topik 'sensor/data'
    client.publish('water/sensors', JSON.stringify(data));
    console.log('Data sent:', JSON.stringify(data));
  }, 10000); // Setiap 10 detik
});
