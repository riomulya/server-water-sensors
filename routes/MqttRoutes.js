const express = require('express');
const router = express.Router();
const { getCurrentData } = require('../Mqtt/MqttClient'); // Import fungsi untuk mendapatkan data dari MQTT
const {
  createAccelXEntry,
  createAccelYEntry,
  createAccelZEntry,
  createPHEntry,
  createTemperatureEntry,
  createTurbidityEntry,
} = require('../controllers/allSensors.controller');
const db = require('../connection/db');
const AppState = require('../state/AppState'); // Tambahkan import AppState

module.exports = (io) => {
  // Handle update location dari client
  io.on('connection', (socket) => {
    socket.on('updateLocation', (newLocation) => {
      AppState.updateLocation(newLocation); // Gunakan AppState untuk update
      console.log('[DEBUG] Updated location:', AppState.getLocation());
    });

    socket.on('clearLocation', () => {
      AppState.clearLocation(); // Gunakan method clear dari AppState
    });
  });

  // Endpoint untuk mendapatkan data MQTT terbaru
  router.get('/getCurrentData', (req, res) => {
    const currentData = getCurrentData();
    res.json({
      success: true,
      data: {
        ...currentData,
        id_lokasi: AppState.getLocation().id_lokasi, // Ambil dari AppState
        isStart: AppState.getLocation().id_lokasi !== null,
      },
    });
  });

  return router;
};
