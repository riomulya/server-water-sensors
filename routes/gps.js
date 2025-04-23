const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const gpsController = require('../controllers/gps.controller');

// Untuk guest
router.post(
  '/locations/guest',
  authenticate(['guest']),
  gpsController.submitLocation
);

// Untuk pengamat/admin
router.post(
  '/locations',
  authenticate(['pengamat', 'admin']),
  gpsController.submitLocation
);

module.exports = router;
