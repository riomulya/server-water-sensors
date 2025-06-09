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
const sensorSpeedController = require('../controllers/speed.controller');

// Route untuk data_combined
router.get('/data_combined', sensorCombinedController.getCombinedData);
router.get(
  '/data_combined/:id_lokasi',
  sensorCombinedController.getCombinedDataById
);

// Route untuk export semua data (letakkan sebelum route dengan parameter)
router.get(
  '/data_combined_export/all',
  sensorCombinedController.exportAllDataToExcel
);

// Route untuk export data berdasarkan lokasi
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
// ? ini untuk filter range berdasarkan waktu
// ? d untuk days, h untuk hours, m untuk months, y untuk years
// ? contoh: http://localhost:3000/data_accel_y?range=3m

router.get('/data_accel_x', sensorAccelXController.getDataAccelX);
router.get(
  '/data_accel_x/id/:id_accel_x',
  sensorAccelXController.getDataAccelXById
);
router.get(
  '/data_accel_x/:id_lokasi',
  sensorAccelXController.getDataAccelXByIdLokasi
);
router.post('/data_accel_x', sensorAccelXController.createDataAccelX);
router.put('/data_accel_x/:id', sensorAccelXController.updateDataAccelX);
router.delete('/data_accel_x/:id', sensorAccelXController.deleteDataAccelX);

// Route untuk data_accel_y
router.get('/data_accel_y', sensorAccelYController.getDataAccelY);
router.get(
  '/data_accel_y/id/:id_accel_y',
  sensorAccelYController.getDataAccelYById
);
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
  '/data_accel_z/id/:id_accel_z',
  sensorAccelZController.getDataAccelZById
);
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
  '/data_turbidity/id/:id_turbidity',
  sensorTurbidityController.getDataTurbidityById
);
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
router.get('/data_ph/id/:id_ph', sensorPHController.getDataPHById);
router.get('/data_ph/:id_lokasi', sensorPHController.getDataPHByIdLokasi);
router.post('/data_ph', sensorPHController.createDataPH);
router.put('/data_ph/:id', sensorPHController.updateDataPH);
router.delete('/data_ph/:id', sensorPHController.deleteDataPH);

// Route untuk data_temperature
router.get('/data_temperature', sensorTemperatureController.getDataTemperature);
router.get(
  '/data_temperature/id/:id_temperature',
  sensorTemperatureController.getDataTemperatureById
);
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

// route untuk lokasi
router.post('/data_lokasi', sensorLocationConroller.createLocation);
router.get('/data_lokasi', sensorLocationConroller.getLocations);
router.get('/data_lokasi/:id', sensorLocationConroller.getLocationById);
router.put('/data_lokasi/:id', sensorLocationConroller.updateLocation);
router.delete('/data_lokasi/:id', sensorLocationConroller.deleteLocation);

// route untuk speed
router.get('/data_speed', sensorSpeedController.getDataSpeed);
router.get('/data_speed/id/:id_speed', sensorSpeedController.getDataSpeedById);
router.get(
  '/data_speed/:id_lokasi',
  sensorSpeedController.getDataSpeedByIdLokasi
);
router.post('/data_speed', sensorSpeedController.createDataSpeed);
router.put('/data_speed/:id', sensorSpeedController.updateDataSpeed);
router.delete('/data_speed/:id', sensorSpeedController.deleteDataSpeed);

// route untuk water quality
// router.post('/water_quality', waterQualityController.trainModel);
// router.post(
//   '/water_quality/predict',
//   waterQualityController.predictWaterQuality
// );
// router.get('/water-quality/predict/:id_lokasi', predictWaterQuality);

module.exports = router;
