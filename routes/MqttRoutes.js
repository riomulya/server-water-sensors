const express = require('express');
const router = express.Router();
const { getCurrentData } = require('../Mqtt/MqttClient'); // Import fungsi untuk mendapatkan data dari MQTT

module.exports = (io) => {
  // Endpoint untuk mendapatkan data MQTT terbaru
  router.get('/getCurrentData', (req, res) => {
    const currentData = getCurrentData(); // Dapatkan data dari MQTT

    if (currentData.message) {
      // Emit data ke semua client melalui Socket.IO
      io.emit('mqttData', currentData);

      res.json({
        success: true,
        id_lokasi:null,
        lat:null,
        lon:null,
        isStart:false,
        data: currentData,
      });
      console.log('Data MQTT dikirim ke client:', currentData);
    } else {
      res.json({
        success: false,
        id_lokasi:null,
        lat:null,
        lon:null,
        isStart:false,
        message: 'No data received yet from MQTT broker',
      });
    }
  });

  return router;
};
