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

      // Broadcast location update to all other clients
      socket.broadcast.emit('updateLocation', newLocation);
    });

    socket.on('clearLocation', () => {
      AppState.clearLocation(); // Gunakan method clear dari AppState

      // Broadcast location clear to all other clients
      socket.broadcast.emit('clearLocation', null);
    });
  });

  // Endpoint untuk mendapatkan data MQTT terbaru
  router.get('/getCurrentData', (req, res) => {
    const currentData = getCurrentData();
    res.json({
      success: true,
      data: {
        ...currentData,
        id_lokasi: AppState.getLocation().id_lokasi,
        nama_sungai: AppState.getLocation().nama_sungai,
        alamat: AppState.getLocation().alamat,
        isStart: AppState.getLocation().id_lokasi !== null,
        latitude: AppState.getLocation().latitude,
        longitude: AppState.getLocation().longitude,
      },
    });
  });

  return router;
};
