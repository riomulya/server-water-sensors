const express = require('express');
const router = express.Router();
const sensorAccelXController = require('../controllers/accelX.controllers');
const sensorAccelYController = require('../controllers/accelY.controllers');
const sensorAccelZController = require('../controllers/accelZ.controllers');
const sensorTurbidityController = require('../controllers/turbidity.controllers');
const sensorPHController = require('../controllers/ph.controllers');
const sensorTemperatureController = require('../controllers/temperature.controllers');
const sensorCombinedController = require('../controllers/sensor.controllers');
const sensorLocationConroller = require('../controllers/location.controllers');

// Route untuk data_combined
router.get('/data_combined', sensorCombinedController.getCombinedData);
router.get(
  '/data_combined/:id_lokasi',
  sensorCombinedController.getCombinedDataById
);
router.get(
  '/data_combined/export/:id_lokasi',
  sensorCombinedController.exportDataToExcel
);

// Route untuk data_combined dengan pagination
router.get(
  '/data_combined/paginated/:id_lokasi',
  sensorCombinedController.getCombinedDataWithPagination
);

// Route untuk data_accel_x
router.get('/data_accel_x', sensorAccelXController.getDataAccelX);
router.get(
  '/data_accel_x/:id_lokasi',
  sensorAccelXController.getDataAccelXByIdLokasi
);
// http://localhost:3000/data_accel_x/2678652?id_lokasi=2678652&range=30d
router.post('/data_accel_x', sensorAccelXController.createDataAccelX);
router.put('/data_accel_x/:id', sensorAccelXController.updateDataAccelX);
router.delete('/data_accel_x/:id', sensorAccelXController.deleteDataAccelX);

// Route untuk data_accel_y
router.get('/data_accel_y', sensorAccelYController.getDataAccelY);
router.get(
  '/data_accel_y/:id_lokasi',
  sensorAccelYController.getDataAccelYByIdLokasi
);
router.post('/data_accel_y', sensorAccelYController.createDataAccelY);
router.put('/data_accel_y/:id', sensorAccelYController.updateDataAccelY);
router.delete('/data_accel_y/:id', sensorAccelYController.deleteDataAccelY);

// Route untuk data_accel_z
router.get('/data_accel_z', sensorAccelZController.getDataAccelZ);
router.get(
  '/data_accel_z/:id_lokasi',
  sensorAccelZController.getDataAccelZByIdLokasi
);
router.post('/data_accel_z', sensorAccelZController.createDataAccelZ);
router.put('/data_accel_z/:id', sensorAccelZController.updateDataAccelZ);
router.delete('/data_accel_z/:id', sensorAccelZController.deleteDataAccelZ);

// Route untuk data_turbidity
router.get('/data_turbidity', sensorTurbidityController.getDataTurbidity);
router.get(
  '/data_turbidity/:id_lokasi',
  sensorTurbidityController.getDataTurbidityByIdLokasi
);
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
router.get('/data_ph/:id_lokasi', sensorPHController.getDataPHByIdLokasi);
router.post('/data_ph', sensorPHController.createDataPH);
router.put('/data_ph/:id', sensorPHController.updateDataPH);
router.delete('/data_ph/:id', sensorPHController.deleteDataPH);

// Route untuk data_temperature
router.get('/data_temperature', sensorTemperatureController.getDataTemperature);
router.get(
  '/data_temperature/:id_lokasi',
  sensorTemperatureController.getDataTemperatureByIdLokasi
);
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

// route untuk
router.post('/data_lokasi', sensorLocationConroller.createLocation);
router.get('/data_lokasi', sensorLocationConroller.getLocations);
router.get('/data_lokasi/:id', sensorLocationConroller.getLocationById);
router.put('/data_lokasi/:id', sensorLocationConroller.updateLocation);
router.delete('/data_lokasi/:id', sensorLocationConroller.deleteLocation);

module.exports = router;
