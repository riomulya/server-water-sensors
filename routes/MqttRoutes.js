const express = require('express');
const router = express.Router();
const { getCurrentData } = require('../Mqtt/MqttClient'); // Import fungsi getter

// Endpoint untuk mendapatkan data MQTT terbaru
router.get('/getCurrentData', (req, res) => {
  const currentData = getCurrentData();
  if (currentData.message) {
    res.json({
      success: true,
      data: currentData,
    });
  } else {
    res.json({
      success: false,
      message: 'No data received yet from MQTT broker',
    });
  }
});

module.exports = router;
