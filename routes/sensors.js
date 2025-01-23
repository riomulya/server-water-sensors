const express = require('express');
const router = express.Router();
const sensorAccelXController = require('../controllers/accelX.controllers');
const sensorAccelYController = require('../controllers/accelY.controllers');
const sensorAccelZController = require('../controllers/accelZ.controllers');
const sensorTurbidityController = require('../controllers/turbidity.controllers');
const sensorPHController = require('../controllers/ph.controllers');
const sensorTemperatureController = require('../controllers/temperature.controllers');

// Route untuk data_accel_x
router.get('/data_accel_x', sensorAccelXController.getDataAccelX);
router.post('/data_accel_x', sensorAccelXController.createDataAccelX);
router.put('/data_accel_x/:id', sensorAccelXController.updateDataAccelX);
router.delete('/data_accel_x/:id', sensorAccelXController.deleteDataAccelX);

// Route untuk data_accel_y
router.get('/data_accel_y', sensorAccelYController.getDataAccelY);
router.post('/data_accel_y', sensorAccelYController.createDataAccelY);
router.put('/data_accel_y/:id', sensorAccelYController.updateDataAccelY);
router.delete('/data_accel_y/:id', sensorAccelYController.deleteDataAccelY);

// Route untuk data_accel_z
router.get('/data_accel_z', sensorAccelZController.getDataAccelZ);
router.post('/data_accel_z', sensorAccelZController.createDataAccelZ);
router.put('/data_accel_z/:id', sensorAccelZController.updateDataAccelZ);
router.delete('/data_accel_z/:id', sensorAccelZController.deleteDataAccelZ);

// Route untuk data_turbidity
router.get('/data_turbidity', sensorTurbidityController.getDataTurbidity);
router.post('/data_turbidity', sensorTurbidityController.createDataTurbidity);
router.put(
  '/data_turbidity/:id',
  sensorTurbidityController.updateDataTurbidity
);
router.delete(
  '/data_turbidity/:id',
  sensorTurbidityController.deleteDataTurbidity
);

// Route untuk data_ph
router.get('/data_ph', sensorPHController.getDataPH);
router.post('/data_ph', sensorPHController.createDataPH);
router.put('/data_ph/:id', sensorPHController.updateDataPH);
router.delete('/data_ph/:id', sensorPHController.deleteDataPH);

// Route untuk data_temperature
router.get('/data_temperature', sensorTemperatureController.getDataTemperature);
router.post(
  '/data_temperature',
  sensorTemperatureController.createDataTemperature
);
router.put(
  '/data_temperature/:id',
  sensorTemperatureController.updateDataTemperature
);
router.delete(
  '/data_temperature/:id',
  sensorTemperatureController.deleteDataTemperature
);

module.exports = router;
