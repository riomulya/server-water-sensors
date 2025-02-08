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

  // Mengirim data setiap 1 detik
  setInterval(() => {
    const data = {
      msg: {
        accel_x: Math.floor(Math.random() * 21), // Random antara 0-20
        accel_y: Math.floor(Math.random() * 21), // Random antara 0-20
        accel_z: Math.floor(Math.random() * 21), // Random antara 0-20
        ph: (Math.random() * 14).toFixed(2), // Random antara 0-14
        turbidity: Math.floor(Math.random() * 101), // Random antara 0-100
        temperature: Math.floor(Math.random() * 1001), // Random antara 0-1000
      },
    };

    // Kirim data ke topik 'sensor/data'
    client.publish('water/sensors', JSON.stringify(data));
    console.log('Data sent:', JSON.stringify(data));
  }, 1000); // Setiap 1 detik
});
